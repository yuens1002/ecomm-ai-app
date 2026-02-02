import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  normalizeCheckoutSession,
  normalizeSubscription,
  storeShippingInStripeMetadata,
} from "@/lib/payments/stripe/adapter";
import { createOrdersFromCheckout, linkSubscriptionToOrder } from "@/lib/orders";
import {
  saveUserAddress,
  updateUserContactInfo,
} from "@/lib/orders/address-utils";
import { getStoreName } from "@/lib/email";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import { sendMerchantNotification } from "@/lib/email/send-merchant-notification";
import { ensureSubscription } from "@/lib/services/subscription";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";
import type { OrderItemWithDetails } from "@/lib/types";

export async function handleCheckoutSessionCompleted(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  let session = context.event.data.object as Stripe.Checkout.Session;

  console.log("📥 Processing checkout.session.completed event:", session.id);

  // Retrieve full session with shipping and customer details
  try {
    session = await context.stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "customer_details"],
    });
  } catch (retrieveError) {
    console.error("Failed to retrieve session:", retrieveError);
    throw retrieveError;
  }

  console.log("✅ Checkout completed:", session.id);

  // Normalize checkout session to common format
  const normalizedCheckout = await normalizeCheckoutSession(session);

  // Find user by email
  let userId: string | null = null;
  let existingUser: { id: string; name: string | null; phone: string | null } | null = null;

  if (normalizedCheckout.customer.email) {
    const user = await prisma.user.findUnique({
      where: { email: normalizedCheckout.customer.email },
      select: { id: true, name: true, phone: true },
    });
    existingUser = user;
    userId = user?.id || null;

    // Update user contact info if needed
    if (userId && existingUser) {
      await updateUserContactInfo(
        userId,
        normalizedCheckout.shippingName,
        normalizedCheckout.customer.phone,
        existingUser
      );
    }

    // Save address for logged-in users
    if (normalizedCheckout.shippingAddress && userId) {
      await saveUserAddress(userId, normalizedCheckout.shippingAddress);
    }
  }

  // Create orders using normalized data
  const result = await createOrdersFromCheckout({
    sessionId: normalizedCheckout.sessionId,
    subscriptionId: normalizedCheckout.subscriptionId,
    customerId: normalizedCheckout.customer.processorCustomerId,
    customerEmail: normalizedCheckout.customer.email,
    customerPhone: normalizedCheckout.customer.phone,
    userId,
    items: normalizedCheckout.items,
    deliveryMethod: normalizedCheckout.deliveryMethod,
    shippingAddress: normalizedCheckout.shippingAddress,
    shippingName: normalizedCheckout.shippingName,
    paymentInfo: normalizedCheckout.paymentInfo,
    sessionAmountTotal: normalizedCheckout.totalInCents,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const createdOrders = result.orders;

  // Send emails
  if (createdOrders.length > 0) {
    const storeName = await getStoreName();

    // Send customer confirmation
    await sendOrderConfirmation({ orders: createdOrders, storeName });

    // Send merchant notifications for each order
    for (const order of createdOrders) {
      // Get delivery schedule for subscription items
      const subscriptionItem = order.items.find(
        (item: OrderItemWithDetails) => item.purchaseOption.type === "SUBSCRIPTION"
      );
      const deliverySchedule = subscriptionItem?.purchaseOption.billingInterval
        ? `Every ${subscriptionItem.purchaseOption.intervalCount || 1} ${subscriptionItem.purchaseOption.billingInterval}`
        : null;

      await sendMerchantNotification({
        order,
        isRecurringOrder: false,
        deliverySchedule,
      });
    }
  }

  // Handle subscription creation
  if (session.mode === "subscription" && session.subscription && userId) {
    console.log("\n🔄 Processing subscription from checkout session...");
    console.log("Session payment_status:", session.payment_status);

    if (session.payment_status !== "paid") {
      console.log(
        "⏭️ Skipping subscription creation - payment not confirmed yet"
      );
      console.log("   Will be created via invoice.payment_succeeded event");
      return { success: true, message: "Orders created, subscription pending" };
    }

    try {
      const stripeSubscription = await context.stripe.subscriptions.retrieve(
        session.subscription as string,
        { expand: ["latest_invoice", "default_payment_method"] }
      );

      console.log("📋 Subscription retrieved:", stripeSubscription.id);
      console.log("Status:", stripeSubscription.status);

      if (
        stripeSubscription.status !== "active" &&
        stripeSubscription.status !== "trialing"
      ) {
        console.log(
          `⏭️ Subscription status is ${stripeSubscription.status}, will handle via invoice.payment_succeeded`
        );
        return { success: true, message: "Orders created, subscription pending" };
      }

      // Normalize subscription and create record
      const normalizedSub = await normalizeSubscription(
        stripeSubscription,
        normalizedCheckout.shippingAddress,
        normalizedCheckout.shippingName,
        normalizedCheckout.customer.phone
      );

      await ensureSubscription({
        subscription: normalizedSub,
        userId,
      });

      console.log("✅ Subscription record created/updated");

      // Store shipping in Stripe metadata for renewal orders
      if (normalizedCheckout.shippingAddress) {
        await storeShippingInStripeMetadata(
          stripeSubscription.id,
          normalizedCheckout.shippingAddress,
          normalizedCheckout.shippingName,
          normalizedCheckout.deliveryMethod
        );
      }

      // Link subscription to order
      const subscriptionOrder = createdOrders.find((order) =>
        order.items.some(
          (item: OrderItemWithDetails) =>
            item.purchaseOption.type === "SUBSCRIPTION"
        )
      );

      if (subscriptionOrder) {
        console.log(
          `🔗 Linking subscription ${stripeSubscription.id} to order ${subscriptionOrder.id}`
        );
        await linkSubscriptionToOrder(stripeSubscription.id, subscriptionOrder.id);
        console.log("✅ Order linked to subscription");
      }
    } catch (subError) {
      console.error("Failed to create subscription record:", subError);
      // Don't fail webhook - order is already created
    }
  }

  return {
    success: true,
    message: `Created ${createdOrders.length} order(s)`,
  };
}

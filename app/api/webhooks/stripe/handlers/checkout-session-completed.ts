import type Stripe from "stripe";
import { logger } from "@/lib/logger";
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

  logger.debug("📥 Processing checkout.session.completed event:", session.id);

  // Retrieve full session with shipping and customer details
  try {
    session = await context.stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "customer_details"],
    });
  } catch (retrieveError) {
    logger.error("Failed to retrieve session:", retrieveError);
    throw retrieveError;
  }

  logger.debug("✅ Checkout completed:", session.id);

  // Normalize checkout session to common format
  const normalizedCheckout = await normalizeCheckoutSession(session);

  // Find user by email (case-insensitive to handle Stripe Link email variations)
  let userId: string | null = null;
  let existingUser: { id: string; name: string | null; phone: string | null } | null = null;

  if (normalizedCheckout.customer.email) {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedCheckout.customer.email,
          mode: "insensitive"
        }
      },
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
    discountAmountInCents: normalizedCheckout.discountAmountInCents,
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
    logger.debug("\n🔄 Processing subscription from checkout session...");
    logger.debug("Session payment_status:", session.payment_status);

    if (session.payment_status !== "paid") {
      logger.debug(
        "⏭️ Skipping subscription creation - payment not confirmed yet"
      );
      logger.debug("   Will be created via invoice.payment_succeeded event");
      return { success: true, message: "Orders created, subscription pending" };
    }

    try {
      const stripeSubscription = await context.stripe.subscriptions.retrieve(
        session.subscription as string,
        { expand: ["latest_invoice", "default_payment_method"] }
      );

      logger.debug("📋 Subscription retrieved:", stripeSubscription.id);
      logger.debug("Status:", stripeSubscription.status);

      if (
        stripeSubscription.status !== "active" &&
        stripeSubscription.status !== "trialing"
      ) {
        logger.debug(
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

      logger.debug("✅ Subscription record created/updated");

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
        logger.debug(
          `🔗 Linking subscription ${stripeSubscription.id} to order ${subscriptionOrder.id}`
        );
        await linkSubscriptionToOrder(stripeSubscription.id, subscriptionOrder.id);
        logger.debug("✅ Order linked to subscription");
      }
    } catch (subError) {
      logger.error("Failed to create subscription record:", subError);
      // Don't fail webhook - order is already created
    }
  }

  return {
    success: true,
    message: `Created ${createdOrders.length} order(s)`,
  };
}

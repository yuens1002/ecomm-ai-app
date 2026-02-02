import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import {
  normalizeInvoicePayment,
  normalizeSubscription,
  extractSubscriptionId,
  getStripeCustomerEmail,
} from "@/lib/payments/stripe/adapter";
import { getCardInfoFromCharge } from "@/lib/payments/stripe/stripe-helpers";
import type { InvoiceWithSubscriptionDetails } from "@/lib/payments/stripe/types";
import {
  createRenewalOrder,
  updateOrderPaymentIds,
} from "@/lib/orders/create-order";
import { sendMerchantNotification } from "@/lib/email/send-merchant-notification";
import {
  findUserByProcessorCustomerId,
  findUserByEmail,
  ensureSubscription,
} from "@/lib/services/subscription";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handleInvoicePaymentSucceeded(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  const invoiceFromEvent = context.event.data
    .object as InvoiceWithSubscriptionDetails;

  logger.debug("\n=== INVOICE PAYMENT SUCCEEDED ===");
  logger.debug("Invoice ID:", invoiceFromEvent.id);
  logger.debug("Customer ID:", invoiceFromEvent.customer);

  // Normalize invoice payment event
  const normalizedInvoice = await normalizeInvoicePayment(
    invoiceFromEvent as Stripe.Invoice
  );

  logger.debug("Payment Intent ID from invoice.payments:", normalizedInvoice.paymentInfo.transactionId);

  // Extract subscription ID
  const subscriptionId = extractSubscriptionId(invoiceFromEvent);

  if (!subscriptionId) {
    logger.debug("⏭️ Skipping non-subscription invoice");
    return { success: true, message: "Non-subscription invoice skipped" };
  }

  logger.debug("✅ Found subscription ID:", subscriptionId);
  logger.debug("Billing Reason:", normalizedInvoice.billingReason);
  logger.debug("Is Renewal:", normalizedInvoice.isRenewal);

  // Fetch full subscription from Stripe
  const stripeSubscription = await context.stripe.subscriptions.retrieve(
    subscriptionId,
    { expand: ["items.data"] }
  );

  logger.debug("Processing subscription:", stripeSubscription.id);
  logger.debug("Subscription Status:", stripeSubscription.status);

  // Find user
  let user = await findUserByProcessorCustomerId(
    stripeSubscription.customer as string
  );

  // Fallback: get email from Stripe customer
  if (!user) {
    logger.debug("⚠️ User not found via orders, fetching from Stripe customer...");
    const customerEmail = await getStripeCustomerEmail(
      stripeSubscription.customer as string
    );
    if (customerEmail) {
      user = await findUserByEmail(customerEmail);
      logger.debug("🔍 Looked up user by email:", customerEmail);
    }
  }

  if (!user) {
    logger.debug("⚠️ User not found for subscription:", stripeSubscription.id);
    logger.debug("Searched for customer ID:", stripeSubscription.customer);
    return { success: false, error: "User not found" };
  }

  logger.debug("✅ Found user:", user.email, "(ID:", user.id, ")");

  // Normalize subscription
  const normalizedSub = await normalizeSubscription(stripeSubscription);

  logger.debug(
    "📊 Mapped Status:",
    stripeSubscription.status,
    "->",
    normalizedSub.status,
    "cancel_at_period_end=",
    normalizedSub.cancelAtPeriodEnd
  );

  if (!normalizedInvoice.isRenewal) {
    // INITIAL SUBSCRIPTION CREATION
    logger.debug("🆕 Processing initial subscription creation...");

    await ensureSubscription({
      subscription: normalizedSub,
      userId: user.id,
    });

    logger.debug("✅ Subscription created/updated in database:", stripeSubscription.id);
    logger.debug("Database Record:", {
      stripeSubscriptionId: stripeSubscription.id,
      userId: user.id,
      status: normalizedSub.status,
      productNames: normalizedSub.items.map((i) => i.productName),
      priceInCents: normalizedSub.totalPriceInCents,
    });

    // Update order with payment IDs
    const updatedCount = await updateOrderPaymentIds({
      subscriptionId: stripeSubscription.id,
      customerId: stripeSubscription.customer as string,
      paymentIntentId: normalizedInvoice.paymentInfo.transactionId,
      chargeId: normalizedInvoice.paymentInfo.chargeId,
      invoiceId: invoiceFromEvent.id,
    });

    if (updatedCount > 0) {
      logger.debug(
        `💳 Updated ${updatedCount} order(s) with payment IDs: PI=${normalizedInvoice.paymentInfo.transactionId}, Charge=${normalizedInvoice.paymentInfo.chargeId}, Invoice=${invoiceFromEvent.id}`
      );
    } else {
      logger.debug(
        `ℹ️ No orders needed payment ID update (likely already populated by checkout.session.completed)`
      );
    }
  } else {
    // SUBSCRIPTION RENEWAL
    logger.debug("🔄 Processing subscription renewal - creating recurring order...");

    // Get payment card info
    let cardLast4 = normalizedInvoice.paymentInfo.cardLast4;
    if (!cardLast4 && normalizedInvoice.paymentInfo.chargeId) {
      cardLast4 = await getCardInfoFromCharge(
        context.stripe,
        normalizedInvoice.paymentInfo.chargeId
      );
    }

    // Get delivery method from subscription metadata
    const storedDeliveryMethod = stripeSubscription.metadata?.deliveryMethod as
      | "DELIVERY"
      | "PICKUP"
      | undefined;
    const renewalDeliveryMethod =
      storedDeliveryMethod || (normalizedSub.shippingAddress ? "DELIVERY" : "PICKUP");

    // Calculate shipping cost
    const shippingCost = normalizedInvoice.totalInCents - normalizedInvoice.subtotalInCents;

    // Create renewal order
    const order = await createRenewalOrder({
      subscriptionId: stripeSubscription.id,
      customerId: stripeSubscription.customer as string,
      userId: user.id,
      userEmail: user.email,
      userPhone: user.phone,
      userName: user.name,
      productNames: normalizedSub.items.map((i) => i.productName),
      quantities: normalizedSub.items.map((i) => i.quantity),
      totalPriceInCents: normalizedSub.totalPriceInCents,
      shippingCost,
      shippingAddress: normalizedSub.shippingAddress,
      deliveryMethod: renewalDeliveryMethod,
      deliverySchedule: normalizedSub.deliverySchedule,
      paymentInfo: {
        ...normalizedInvoice.paymentInfo,
        cardLast4,
      },
    });

    if (!order) {
      logger.debug("Skipping order creation but subscription is still active");
      return {
        success: true,
        message: "No matching purchase options for renewal",
      };
    }

    // Skip customer email for recurring orders - send with tracking when shipped
    logger.debug(
      "⏭️ Skipping customer email - will send with tracking when order ships"
    );

    // Send merchant notification
    await sendMerchantNotification({
      order,
      isRecurringOrder: true,
      deliverySchedule: normalizedSub.deliverySchedule,
    });

    logger.debug("✅ Recurring order processed successfully");
  }

  logger.debug("=======================\n");
  return {
    success: true,
    message: normalizedInvoice.isRenewal
      ? "Renewal order created"
      : "Initial subscription processed",
  };
}

import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  normalizeCustomerUpdate,
  updateStripeSubscriptionShipping,
} from "@/lib/payments/stripe/adapter";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handleCustomerUpdated(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  const customer = context.event.data.object as Stripe.Customer;

  logger.debug("\n=== CUSTOMER UPDATED ===");
  logger.debug("Customer ID:", customer.id);
  logger.debug("Email:", customer.email);
  logger.debug("Phone:", customer.phone);

  // Normalize customer update event
  const normalizedUpdate = normalizeCustomerUpdate(customer);

  if (!normalizedUpdate.shippingAddress && !normalizedUpdate.phone) {
    logger.debug("⏭️ No shipping address or phone on customer, skipping");
    return { success: true, message: "No address or phone to update" };
  }

  if (normalizedUpdate.shippingAddress) {
    logger.debug("📍 Shipping address:", normalizedUpdate.shippingName);
    logger.debug("   ", normalizedUpdate.shippingAddress.line1);
    logger.debug(
      "   ",
      normalizedUpdate.shippingAddress.city,
      normalizedUpdate.shippingAddress.state,
      normalizedUpdate.shippingAddress.postalCode
    );
  }
  if (normalizedUpdate.phone) {
    logger.debug("📞 Phone:", normalizedUpdate.phone);
  }

  // Find all subscriptions for this customer
  const subscriptions = await prisma.subscription.findMany({
    where: { stripeCustomerId: customer.id },
    select: {
      id: true,
      stripeSubscriptionId: true,
      status: true,
    },
  });

  if (subscriptions.length === 0) {
    logger.debug("⏭️ No subscriptions found for this customer");
    return { success: true, message: "No subscriptions to update" };
  }

  logger.debug(`📦 Found ${subscriptions.length} subscription(s) to update`);

  // Update each subscription
  for (const sub of subscriptions) {
    // Build update data dynamically
    const subscriptionUpdateData: {
      recipientName?: string | null;
      recipientPhone?: string | null;
      shippingStreet?: string | null;
      shippingCity?: string | null;
      shippingState?: string | null;
      shippingPostalCode?: string | null;
      shippingCountry?: string | null;
    } = {};

    if (normalizedUpdate.shippingAddress) {
      subscriptionUpdateData.recipientName = normalizedUpdate.shippingName;
      subscriptionUpdateData.shippingStreet = normalizedUpdate.shippingAddress.line1;
      subscriptionUpdateData.shippingCity = normalizedUpdate.shippingAddress.city;
      subscriptionUpdateData.shippingState = normalizedUpdate.shippingAddress.state;
      subscriptionUpdateData.shippingPostalCode = normalizedUpdate.shippingAddress.postalCode;
      subscriptionUpdateData.shippingCountry = normalizedUpdate.shippingAddress.country;
    }
    if (normalizedUpdate.phone) {
      subscriptionUpdateData.recipientPhone = normalizedUpdate.phone;
    }

    // Update local database
    await prisma.subscription.update({
      where: { id: sub.id },
      data: subscriptionUpdateData,
    });
    logger.debug(
      `  ✅ Updated subscription ${sub.stripeSubscriptionId.slice(-8)}`
    );

    // Update Stripe subscription metadata for renewals
    if (normalizedUpdate.shippingAddress) {
      await updateStripeSubscriptionShipping(
        sub.stripeSubscriptionId,
        normalizedUpdate.shippingAddress
      );
    }

    // Update pending orders for this subscription
    const pendingOrders = await prisma.order.findMany({
      where: {
        stripeSubscriptionId: sub.stripeSubscriptionId,
        status: "PENDING",
      },
    });

    if (pendingOrders.length > 0) {
      logger.debug(`  📦 Updating ${pendingOrders.length} pending order(s)`);

      const orderUpdateData: {
        recipientName?: string | null;
        customerPhone?: string | null;
        shippingStreet?: string | null;
        shippingCity?: string | null;
        shippingState?: string | null;
        shippingPostalCode?: string | null;
        shippingCountry?: string | null;
      } = {};

      if (normalizedUpdate.shippingAddress) {
        orderUpdateData.recipientName = normalizedUpdate.shippingName;
        orderUpdateData.shippingStreet = normalizedUpdate.shippingAddress.line1;
        orderUpdateData.shippingCity = normalizedUpdate.shippingAddress.city;
        orderUpdateData.shippingState = normalizedUpdate.shippingAddress.state;
        orderUpdateData.shippingPostalCode = normalizedUpdate.shippingAddress.postalCode;
        orderUpdateData.shippingCountry = normalizedUpdate.shippingAddress.country;
      }
      if (normalizedUpdate.phone) {
        orderUpdateData.customerPhone = normalizedUpdate.phone;
      }

      await prisma.order.updateMany({
        where: {
          stripeSubscriptionId: sub.stripeSubscriptionId,
          status: "PENDING",
        },
        data: orderUpdateData,
      });
      logger.debug(`  ✅ Updated pending orders`);
    }
  }

  // Update non-subscription pending orders for this customer
  const oneTimeOrderUpdateData: {
    recipientName?: string | null;
    customerPhone?: string | null;
    shippingStreet?: string | null;
    shippingCity?: string | null;
    shippingState?: string | null;
    shippingPostalCode?: string | null;
    shippingCountry?: string | null;
  } = {};

  if (normalizedUpdate.shippingAddress) {
    oneTimeOrderUpdateData.recipientName = normalizedUpdate.shippingName;
    oneTimeOrderUpdateData.shippingStreet = normalizedUpdate.shippingAddress.line1;
    oneTimeOrderUpdateData.shippingCity = normalizedUpdate.shippingAddress.city;
    oneTimeOrderUpdateData.shippingState = normalizedUpdate.shippingAddress.state;
    oneTimeOrderUpdateData.shippingPostalCode = normalizedUpdate.shippingAddress.postalCode;
    oneTimeOrderUpdateData.shippingCountry = normalizedUpdate.shippingAddress.country;
  }
  if (normalizedUpdate.phone) {
    oneTimeOrderUpdateData.customerPhone = normalizedUpdate.phone;
  }

  const customerPendingOrders = await prisma.order.updateMany({
    where: {
      stripeCustomerId: customer.id,
      status: "PENDING",
      stripeSubscriptionId: null,
    },
    data: oneTimeOrderUpdateData,
  });

  if (customerPendingOrders.count > 0) {
    logger.debug(
      `✅ Updated ${customerPendingOrders.count} pending one-time order(s)`
    );
  }

  logger.debug("✅ Customer address/phone sync complete");
  logger.debug("=======================\n");

  return { success: true, message: "Customer info synced" };
}

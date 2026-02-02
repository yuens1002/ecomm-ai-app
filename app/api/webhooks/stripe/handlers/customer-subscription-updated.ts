import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeSubscription } from "@/lib/payments/stripe/adapter";
import { restoreInventory } from "@/lib/orders/inventory";
import {
  getSubscriptionByProcessorId,
  updateSubscription,
} from "@/lib/services/subscription";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handleCustomerSubscriptionUpdated(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  console.log("\n=== SUBSCRIPTION UPDATED ===");
  console.log("Event Type:", context.event.type);

  const stripeSubscription = context.event.data.object as Stripe.Subscription;

  console.log("Subscription ID:", stripeSubscription.id);
  console.log("Customer ID:", stripeSubscription.customer);
  console.log("Status:", stripeSubscription.status);

  // Get existing subscription to check for status changes
  const existingSub = await getSubscriptionByProcessorId(stripeSubscription.id);

  if (!existingSub) {
    console.log(
      "⏭️ Skipping update - subscription not yet created (waiting for payment)"
    );
    return { success: true, message: "Subscription not yet created" };
  }

  // Normalize subscription
  const normalizedSub = await normalizeSubscription(stripeSubscription);

  // Check if subscription is being canceled at period end
  const willCancel = normalizedSub.cancelAtPeriodEnd;
  const wasNotCanceling = !existingSub.cancelAtPeriodEnd;

  if (willCancel && wasNotCanceling) {
    console.log(
      "🔄 Subscription marked for cancellation - checking for PENDING orders..."
    );

    const pendingOrders = await prisma.order.findMany({
      where: {
        stripeSubscriptionId: stripeSubscription.id,
        status: "PENDING",
      },
    });

    if (pendingOrders.length > 0) {
      console.log(
        `📦 Found ${pendingOrders.length} PENDING order(s) - canceling immediately...`
      );

      for (const order of pendingOrders) {
        try {
          // Process refund if payment intent exists
          if (order.stripePaymentIntentId) {
            await context.stripe.refunds.create({
              payment_intent: order.stripePaymentIntentId,
              reason: "requested_by_customer",
            });
            console.log(`💰 Refund processed for order ${order.id}`);
          }

          // Cancel the order
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
          console.log(`✅ Order ${order.id} canceled`);

          // Restore inventory
          await restoreInventory(order.id);
        } catch (orderCancelError) {
          console.error(
            `❌ Failed to cancel order ${order.id}:`,
            orderCancelError
          );
        }
      }

      // Cancel subscription immediately in Stripe
      console.log("🔄 Canceling subscription immediately in Stripe...");
      await context.stripe.subscriptions.cancel(stripeSubscription.id);
      console.log("✅ Subscription canceled immediately");
    }
  }

  // Update subscription in database
  await updateSubscription(normalizedSub);

  console.log("✅ Subscription updated in database:", stripeSubscription.id);
  console.log("=======================\n");

  return { success: true, message: "Subscription updated" };
}

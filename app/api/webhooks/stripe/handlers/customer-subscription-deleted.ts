import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { cancelSubscription } from "@/lib/services/subscription";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handleCustomerSubscriptionDeleted(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  const subscription = context.event.data.object as Stripe.Subscription;

  logger.debug("\n=== SUBSCRIPTION DELETED ===");
  logger.debug("Subscription ID:", subscription.id);
  logger.debug("Customer ID:", subscription.customer);

  await cancelSubscription(subscription.id);

  logger.debug("=======================\n");

  return { success: true, message: "Subscription canceled" };
}

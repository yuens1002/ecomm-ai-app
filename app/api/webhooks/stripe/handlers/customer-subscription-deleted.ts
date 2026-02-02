import type Stripe from "stripe";
import { cancelSubscription } from "@/lib/services/subscription";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handleCustomerSubscriptionDeleted(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  const subscription = context.event.data.object as Stripe.Subscription;

  console.log("\n=== SUBSCRIPTION DELETED ===");
  console.log("Subscription ID:", subscription.id);
  console.log("Customer ID:", subscription.customer);

  await cancelSubscription(subscription.id);

  console.log("=======================\n");

  return { success: true, message: "Subscription canceled" };
}

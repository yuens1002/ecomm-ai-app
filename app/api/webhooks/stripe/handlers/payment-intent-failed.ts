import type Stripe from "stripe";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handlePaymentIntentFailed(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  const paymentIntent = context.event.data.object as Stripe.PaymentIntent;
  console.log("❌ Payment failed:", paymentIntent.id);
  // TODO: Notify customer of failed payment
  return { success: true, message: "Payment failure logged" };
}

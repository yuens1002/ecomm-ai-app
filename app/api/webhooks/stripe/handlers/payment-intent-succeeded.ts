import type Stripe from "stripe";
import type { WebhookHandlerContext, WebhookHandlerResult } from "./types";

export async function handlePaymentIntentSucceeded(
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  const paymentIntent = context.event.data.object as Stripe.PaymentIntent;
  console.log("✅ Payment succeeded:", paymentIntent.id);
  return { success: true, message: "Payment succeeded" };
}

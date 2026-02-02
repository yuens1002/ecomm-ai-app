import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/error-utils";
import type { VerifyWebhookResult, VerifyWebhookParams } from "./types";

/**
 * Verifies Stripe webhook signature and returns parsed event
 */
export function verifyWebhook({
  body,
  signature,
  secret,
  stripe,
}: VerifyWebhookParams): VerifyWebhookResult {
  if (!signature) {
    return {
      success: false,
      error: "Missing stripe-signature header",
      statusCode: 400,
    };
  }

  if (!secret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not set");
    return {
      success: false,
      error: "Webhook secret not configured",
      statusCode: 500,
    };
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return { success: true, event };
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err, "Webhook verification failed");
    logger.error("Webhook signature verification failed:", errorMessage);
    return {
      success: false,
      error: `Webhook Error: ${errorMessage}`,
      statusCode: 400,
    };
  }
}

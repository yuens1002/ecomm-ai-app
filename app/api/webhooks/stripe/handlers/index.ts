import { logger } from "@/lib/logger";
import type {
  WebhookHandler,
  WebhookHandlerContext,
  WebhookHandlerResult,
  SupportedEventType,
} from "./types";
import { isSupportedEvent } from "./types";
import { handleCheckoutSessionCompleted } from "./checkout-session-completed";
import { handleInvoicePaymentSucceeded } from "./invoice-payment-succeeded";
import { handleCustomerSubscriptionUpdated } from "./customer-subscription-updated";
import { handleCustomerSubscriptionDeleted } from "./customer-subscription-deleted";
import { handleCustomerUpdated } from "./customer-updated";
import { handlePaymentIntentSucceeded } from "./payment-intent-succeeded";
import { handlePaymentIntentFailed } from "./payment-intent-failed";

/**
 * Registry of event handlers by event type
 */
const eventHandlers: Record<SupportedEventType, WebhookHandler> = {
  "checkout.session.completed": handleCheckoutSessionCompleted,
  "invoice.payment_succeeded": handleInvoicePaymentSucceeded,
  "customer.subscription.updated": handleCustomerSubscriptionUpdated,
  "customer.subscription.deleted": handleCustomerSubscriptionDeleted,
  "customer.updated": handleCustomerUpdated,
  "payment_intent.succeeded": handlePaymentIntentSucceeded,
  "payment_intent.payment_failed": handlePaymentIntentFailed,
};

/**
 * Dispatches a webhook event to the appropriate handler
 */
export async function dispatchEvent(
  type: string,
  context: WebhookHandlerContext
): Promise<WebhookHandlerResult> {
  if (!isSupportedEvent(type)) {
    logger.debug(`Unhandled event type: ${type}`);
    return { success: true, message: "Event type not handled" };
  }

  const handler = eventHandlers[type];
  return handler(context);
}

// Re-export types
export type { WebhookHandler, WebhookHandlerContext, WebhookHandlerResult };
export { isSupportedEvent };

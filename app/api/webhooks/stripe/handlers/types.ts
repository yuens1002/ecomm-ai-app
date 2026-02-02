import type Stripe from "stripe";

/**
 * Context passed to webhook handlers
 */
export interface WebhookHandlerContext {
  event: Stripe.Event;
  stripe: Stripe;
}

/**
 * Result returned from webhook handlers
 */
export interface WebhookHandlerResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Webhook handler function signature
 */
export type WebhookHandler = (
  context: WebhookHandlerContext
) => Promise<WebhookHandlerResult>;

/**
 * Supported event types
 */
export const SUPPORTED_EVENT_TYPES = [
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.updated",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
] as const;

export type SupportedEventType = (typeof SUPPORTED_EVENT_TYPES)[number];

/**
 * Type guard to check if event type is supported
 */
export function isSupportedEvent(type: string): type is SupportedEventType {
  return SUPPORTED_EVENT_TYPES.includes(type as SupportedEventType);
}

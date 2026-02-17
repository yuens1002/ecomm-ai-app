import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import type {
  WebhookCartItem,
  ShippingAddressData,
} from "./types";

/**
 * Parses cart items from Stripe checkout session metadata
 */
export function parseCartMetadata(
  session: Stripe.Checkout.Session
): WebhookCartItem[] {
  if (!session.metadata?.cartItems) {
    return [];
  }

  try {
    const parsed = JSON.parse(session.metadata.cartItems);
    return parsed.map((item: { po: string; qty: number }) => ({
      purchaseOptionId: item.po,
      quantity: item.qty,
    }));
  } catch {
    logger.error("Failed to parse cart metadata");
    return [];
  }
}

/**
 * Extracts shipping address from checkout session.
 *
 * Stripe API >=2025-03-31 moved shipping to collected_information.shipping_details.
 * We check that first, then fall back to the legacy session.shipping field.
 * customer_details.address is NOT used — that's the billing/Link address.
 */
export function parseShippingFromSession(
  session: Stripe.Checkout.Session
): { address: ShippingAddressData | null; name: string | null } {
  // 1. Current API: collected_information.shipping_details
  const collected = session.collected_information?.shipping_details;
  if (collected?.address) {
    logger.debug("📍 Shipping from collected_information.shipping_details");
    return {
      address: {
        name: collected.name || null,
        line1: collected.address.line1 || null,
        line2: collected.address.line2 || null,
        city: collected.address.city || null,
        state: collected.address.state || null,
        postal_code: collected.address.postal_code || null,
        country: collected.address.country || null,
      },
      name: collected.name || null,
    };
  }

  // 2. No shipping collected (pickup orders)
  logger.debug("📍 No shipping address found on session");
  return { address: null, name: session.customer_details?.name || null };
}

/**
 * Parses shipping address from subscription metadata
 */
export function parseShippingFromSubscription(
  subscription: Stripe.Subscription
): ShippingAddressData | null {
  const metadataJson = subscription.metadata?.shipping_address;
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson);
    return {
      name: parsed.name || null,
      line1: parsed.line1 || null,
      line2: parsed.line2 || null,
      city: parsed.city || null,
      state: parsed.state || null,
      postal_code: parsed.postal_code || null,
      country: parsed.country || null,
    };
  } catch {
    logger.error("Failed to parse subscription shipping metadata");
    return null;
  }
}

/**
 * Extracts subscription ID from invoice (handles API version differences)
 */
export function extractSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice & {
    subscription?: string | { id: string };
    parent?: { subscription_details?: { subscription: string } };
  }
): string | undefined {
  // Try invoice.subscription directly
  if (typeof invoice.subscription === "string") {
    return invoice.subscription;
  }
  if (typeof invoice.subscription === "object" && invoice.subscription?.id) {
    return invoice.subscription.id;
  }

  // Try newer parent.subscription_details structure
  if (invoice.parent?.subscription_details?.subscription) {
    return invoice.parent.subscription_details.subscription;
  }

  return undefined;
}

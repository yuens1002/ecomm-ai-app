import type Stripe from "stripe";
import type {
  WebhookCartItem,
  ShippingAddressData,
  SessionWithShipping,
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
    console.error("Failed to parse cart metadata");
    return [];
  }
}

/**
 * Extracts shipping address from checkout session
 * Stripe can populate address in different places depending on checkout mode
 */
export function parseShippingFromSession(
  session: Stripe.Checkout.Session
): { address: ShippingAddressData | null; name: string | null } {
  const sessionWithShipping = session as SessionWithShipping;

  // Try to get shipping info from explicit shipping field first,
  // then fall back to customer_details
  const address =
    sessionWithShipping.shipping?.address || session.customer_details?.address;
  const name =
    sessionWithShipping.shipping?.name || session.customer_details?.name;

  if (!address) {
    return { address: null, name: name || null };
  }

  return {
    address: {
      name: name || null,
      line1: address.line1 || null,
      line2: address.line2 || null,
      city: address.city || null,
      state: address.state || null,
      postal_code: address.postal_code || null,
      country: address.country || null,
    },
    name: name || null,
  };
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
    console.error("Failed to parse subscription shipping metadata");
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

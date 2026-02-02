import Stripe from "stripe";

/**
 * Cart item from Stripe metadata
 */
export interface WebhookCartItem {
  purchaseOptionId: string;
  quantity: number;
}

/**
 * Shipping address data from Stripe
 */
export interface ShippingAddressData {
  name: string | null;
  line1: string | null;
  line2?: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

/**
 * Payment information extracted from Stripe
 */
export interface PaymentInfo {
  paymentIntentId: string | null;
  chargeId: string | null;
  invoiceId: string | null;
  cardLast4: string | null;
}

/**
 * Result of webhook verification
 */
export type VerifyWebhookResult =
  | { success: true; event: Stripe.Event }
  | { success: false; error: string; statusCode: number };

/**
 * Parameters for verifying webhook
 */
export interface VerifyWebhookParams {
  body: string;
  signature: string | null;
  secret: string | undefined;
  stripe: Stripe;
}

/**
 * Invoice with payments expanded (newer Stripe API structure)
 */
export type InvoiceWithPayments = Stripe.Invoice & {
  payments?: {
    data: Array<{
      payment?: {
        type: string;
        payment_intent?: string | Stripe.PaymentIntent;
      };
    }>;
  };
};

/**
 * Checkout session with optional shipping info
 */
export type SessionWithShipping = Stripe.Checkout.Session & {
  shipping?: {
    address?: Stripe.Address;
    name?: string;
  };
};

/**
 * Invoice with subscription details (newer Stripe API)
 */
export type InvoiceWithSubscriptionDetails = Stripe.Invoice & {
  subscription?: string | { id: string };
  parent?: {
    subscription_details?: {
      subscription: string;
    };
  };
};

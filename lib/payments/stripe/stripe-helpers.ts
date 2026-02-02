import type Stripe from "stripe";
import type { PaymentInfo, InvoiceWithPayments } from "./types";

/**
 * Retrieves payment details from a payment intent
 */
export async function getPaymentDetailsFromIntent(
  stripe: Stripe,
  paymentIntentId: string
): Promise<PaymentInfo> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method", "latest_charge"],
    });

    let cardLast4: string | null = null;
    const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod | null;
    if (paymentMethod?.card?.last4) {
      const brand =
        paymentMethod.card.brand.charAt(0).toUpperCase() +
        paymentMethod.card.brand.slice(1);
      cardLast4 = `${brand} ****${paymentMethod.card.last4}`;
    }

    let chargeId: string | null = null;
    if (paymentIntent.latest_charge) {
      chargeId =
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id;
    }

    return {
      paymentIntentId,
      chargeId,
      invoiceId: null,
      cardLast4,
    };
  } catch (error) {
    console.error("Failed to retrieve payment details:", error);
    return {
      paymentIntentId,
      chargeId: null,
      invoiceId: null,
      cardLast4: null,
    };
  }
}

/**
 * Retrieves payment details from a subscription's latest invoice
 * Uses newer Stripe API structure (invoice.payments.data[].payment)
 */
export async function getPaymentDetailsFromSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<PaymentInfo> {
  const result: PaymentInfo = {
    paymentIntentId: null,
    chargeId: null,
    invoiceId: null,
    cardLast4: null,
  };

  try {
    // Step 1: Get subscription with latest_invoice expanded
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice"],
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    if (!latestInvoice) {
      return result;
    }

    result.invoiceId = latestInvoice.id;
    console.log(`📄 Subscription invoice: ${result.invoiceId}`);

    // Step 2: Retrieve invoice with payments expanded (separate call to avoid expansion depth limit)
    const invoiceWithPayments = (await stripe.invoices.retrieve(
      latestInvoice.id,
      { expand: ["payments.data.payment.payment_intent"] }
    )) as InvoiceWithPayments;

    // Get payment_intent from payments array (newer API structure)
    const firstPayment = invoiceWithPayments.payments?.data?.[0]?.payment;
    if (firstPayment?.type === "payment_intent" && firstPayment.payment_intent) {
      result.paymentIntentId =
        typeof firstPayment.payment_intent === "string"
          ? firstPayment.payment_intent
          : firstPayment.payment_intent.id;
      console.log(`💳 Payment Intent from invoice.payments: ${result.paymentIntentId}`);
    }

    // Step 3: Get charge ID and card info from payment intent
    if (result.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        result.paymentIntentId,
        { expand: ["latest_charge", "payment_method"] }
      );

      if (paymentIntent.latest_charge) {
        result.chargeId =
          typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge as Stripe.Charge).id;
        console.log(`💵 Charge ID from PaymentIntent: ${result.chargeId}`);
      }

      if (
        paymentIntent.payment_method &&
        typeof paymentIntent.payment_method === "object"
      ) {
        const pm = paymentIntent.payment_method as Stripe.PaymentMethod;
        if (pm?.card?.last4) {
          const brand =
            pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1);
          result.cardLast4 = `${brand} ****${pm.card.last4}`;
        }
      }
    } else {
      console.log(
        `⚠️ No payment_intent in invoice.payments yet - will be captured via invoice.payment_succeeded`
      );
    }

    return result;
  } catch (error) {
    console.error("Failed to retrieve subscription invoice:", error);
    return result;
  }
}

/**
 * Retrieves payment details from an invoice (for invoice.payment_succeeded handler)
 */
export async function getPaymentDetailsFromInvoice(
  stripe: Stripe,
  invoiceId: string
): Promise<PaymentInfo> {
  const result: PaymentInfo = {
    paymentIntentId: null,
    chargeId: null,
    invoiceId,
    cardLast4: null,
  };

  try {
    const invoice = (await stripe.invoices.retrieve(invoiceId, {
      expand: ["payments.data.payment.payment_intent"],
    })) as InvoiceWithPayments;

    // Get payment_intent from payments array
    const firstPayment = invoice.payments?.data?.[0]?.payment;
    if (firstPayment?.type === "payment_intent" && firstPayment.payment_intent) {
      result.paymentIntentId =
        typeof firstPayment.payment_intent === "string"
          ? firstPayment.payment_intent
          : firstPayment.payment_intent.id;
    }

    // Get charge ID from payment intent
    if (result.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        result.paymentIntentId
      );
      result.chargeId =
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : (paymentIntent.latest_charge as Stripe.Charge | null)?.id || null;
    }

    return result;
  } catch (error) {
    console.error("Failed to retrieve invoice payment details:", error);
    return result;
  }
}

/**
 * Gets payment card info from a charge
 */
export async function getCardInfoFromCharge(
  stripe: Stripe,
  chargeId: string
): Promise<string | null> {
  try {
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ["payment_method"],
    });
    if (charge.payment_method && typeof charge.payment_method === "object") {
      const paymentMethod = charge.payment_method as Stripe.PaymentMethod;
      if (paymentMethod.card?.last4) {
        const brand =
          paymentMethod.card.brand.charAt(0).toUpperCase() +
          paymentMethod.card.brand.slice(1);
        return `${brand} ****${paymentMethod.card.last4}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve card info:", error);
    return null;
  }
}

# Stripe Integration Setup Guide

## Phase 2: Stripe Checkout

This guide will help you set up Stripe checkout for the Artisan Roast e-commerce application.

## Prerequisites

- A Stripe account ([sign up here](https://dashboard.stripe.com/register))
- Node.js and npm installed
- Application deployed or running locally

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

For Vercel deployment, add these in:

- **Settings** → **Environment Variables**

### 3. Set Up Webhook (Production Only)

Webhooks handle post-payment events like order fulfillment.

#### Local Testing with Stripe CLI

```text

# Install Stripe CLI
# https://stripe.com/docs/stripe-cli#install

# Login to Stripe
stripe login

# Forward webhook events to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (starts with whsec_)
# Add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Production Setup

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to your production environment variables:

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_production_secret_here

```

### 4. Test the Integration

1. Start your development server:

   ```bash
   npm run dev
```

1. Add items to cart

2. Click "Proceed to Checkout"

3. Use Stripe test card:

   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. Complete checkout and verify:
   - Redirected to success page
   - Cart cleared
   - Webhook received (check terminal logs)

## Features Implemented

✅ **Checkout Flow**

- Create Stripe Checkout Session with cart items
- Support for one-time purchases
- Support for subscriptions
- Product images in checkout
- Automatic cart clearing on success

✅ **Success/Cancel Pages**

- Success page with order confirmation
- Cancel page with cart preservation
- Clear user feedback

✅ **Webhook Handler**

- Signature verification
- Payment success handling
- Subscription lifecycle events
- Order metadata storage (ready for database)

## API Endpoints

### POST `/api/checkout`

Creates a Stripe Checkout Session from cart items.

**Request:**

```json

{
  "items": [
    {
      "productId": "...",
      "productName": "Ethiopian Yirgacheffe",
      "variantName": "12oz",
      "priceInCents": 1899,
      "quantity": 1,
      "purchaseType": "ONE_TIME",
      "imageUrl": "..."
    }
  ]
}
```

**Response:**

```json

{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/webhooks/stripe`

Receives Stripe webhook events for order processing.

**Headers:**

- `stripe-signature`: Webhook signature for verification

**Events Handled:**

- `checkout.session.completed` - Order confirmed
- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.*` - Subscription events

## Next Steps (Phase 3)

When Auth.js is implemented:

- [ ] Link orders to user accounts
- [ ] Store orders in database
- [ ] Send confirmation emails
- [ ] Add order history page
- [ ] Implement inventory management
- [ ] Add customer portal for subscription management

## Troubleshooting

### Webhook not receiving events?

- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check webhook endpoint is publicly accessible
- Ensure webhook events are selected in Stripe Dashboard
- Check application logs for errors

### Checkout button not working?

- Verify `STRIPE_SECRET_KEY` is set
- Check browser console for errors
- Ensure cart has items
- Check Network tab for API response

### Test cards not working?

- Use Stripe test mode keys (start with `sk_test_` and `pk_test_`)
- Never use real card numbers in test mode
- See [Stripe test cards](https://stripe.com/docs/testing) for more options

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

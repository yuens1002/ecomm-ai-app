# Stripe Link Sandbox Issue

## Issue Description
During testing in Stripe's **test/sandbox mode**, we discovered that Stripe Link may send incorrect shipping addresses to webhooks even when customers select or enter a different address during checkout.

### Observed Behavior
- When a customer has multiple saved addresses in Stripe Link
- And they select or enter a NEW address during checkout
- The webhook `checkout.session.completed` event sometimes receives a DIFFERENT saved address in `customer_details.address`
- This could cause orders to be shipped to the wrong address

### Example
1. User has saved addresses: 
   - Address A: "30 N Gould St, Sheridan, WY"
   - Address B: "1234 Massachusetts Ave NW, Washington, DC"
2. User selects Address B in Stripe Link dropdown
3. Webhook receives Address A in `customer_details.address`

## Test vs Production
This behavior was observed in **Stripe test mode only**. It's unclear if this is:
- A known sandbox limitation
- A bug in test mode that doesn't affect production
- An issue with our specific Stripe API version (2025-10-29.clover)

**Important:** This issue may NOT occur in production. Many merchants use Link successfully.

## Workaround (If Needed)
If this issue persists in production, you can disable Link by:

```typescript
// In app/api/checkout/route.ts
const session = await stripe.checkout.sessions.create({
  // ... other config
  // Don't pass customer_email to prevent Link activation
  // ...(customerEmail && { customer_email: customerEmail }),
});
```

This forces users to enter their email manually but prevents saved address confusion.

## Current Implementation
As of v0.11.0, we **trust Link to work correctly** and pass `customer_email` to enable it. This provides the best user experience with auto-filled emails and payment methods.

## Monitoring Recommendation
When launching to production:
1. Closely monitor the first 10-20 orders
2. Verify shipping addresses match what customers selected
3. If issues occur, enable detailed webhook logging temporarily
4. Contact Stripe support with production evidence if the problem persists

## Related Code
- **Checkout API**: `app/api/checkout/route.ts`
- **Webhook Handler**: `app/api/webhooks/stripe/route.ts`
- **Address Extraction**: Line ~90 in webhook handler

## Date Discovered
November 15, 2025

## Status
✅ Resolved by trusting production behavior
⚠️ Monitor in production environment

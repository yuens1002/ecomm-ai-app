# Testing Recurring Orders

This guide explains how to test subscription recurring orders locally without waiting for actual billing cycles.

## Overview

When a subscription renews, Stripe sends an `invoice.payment_succeeded` webhook event. Our webhook handler:

1. ✅ Creates a new Order in the database
2. ✅ Decrements product inventory
3. ✅ Sends confirmation email to customer
4. ✅ Sends notification email to merchant
5. ✅ Updates subscription billing period

## Testing Methods

### Method 1: Trigger Test Webhook Events (Recommended)

Use Stripe CLI to manually trigger webhook events without waiting for billing cycles.

#### Setup

Make sure Stripe CLI is running and forwarding webhooks:

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Trigger a Renewal

1. **Find your test subscription ID** from Stripe Dashboard or logs
2. **Trigger the invoice payment webhook**:

```powershell
stripe trigger invoice.payment_succeeded --override subscription=sub_1XXXXX
```

Replace `sub_1XXXXX` with your actual test subscription ID.

This immediately fires an `invoice.payment_succeeded` event, creating a recurring order.

### Method 2: Use Stripe Test Clocks (Advanced)

Test clocks let you fast-forward time for subscriptions.

#### Create a Test Clock

```powershell
# Create a test clock starting now
stripe test_clocks create

# Note the test clock ID returned (e.g., clock_1XXXXX)
```

#### Create Subscription with Test Clock

When creating a checkout session, add the test clock:

```powershell
# In your checkout API, add:
# test_clock: 'clock_1XXXXX'
```

#### Fast-Forward Time

```powershell
# Advance clock by 1 week (604800 seconds)
stripe test_clocks advance clock_1XXXXX --frozen-time $(date -u +%s --date="+1 week")

# Or advance by 1 month
stripe test_clocks advance clock_1XXXXX --frozen-time $(date -u +%s --date="+1 month")
```

When the clock reaches the next billing cycle, Stripe automatically:

- Creates an invoice
- Charges the customer
- Sends `invoice.payment_succeeded` webhook
- Creates recurring order in your system

## Verification Steps

After triggering a recurring order, verify:

### 1. Check Logs

Look for these console logs in your terminal:

```
📦 Creating recurring order for subscription renewal...
📦 Recurring order created: [order-id]
📉 Decremented stock for [product-name]
📧 Customer confirmation email sent
📧 Merchant notification email sent
✅ Recurring order processed successfully
```

### 2. Check Database

```sql
-- View latest orders
SELECT id, "totalInCents", status, "deliveryMethod", "createdAt"
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 5;

-- View order items
SELECT o.id as order_id, oi.quantity, oi."priceInCents", po.type
FROM "Order" o
JOIN "OrderItem" oi ON oi."orderId" = o.id
JOIN "PurchaseOption" po ON po.id = oi."purchaseOptionId"
WHERE o."createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY o."createdAt" DESC;
```

### 3. Check Admin Dashboard

Visit `/admin/orders` to see the new recurring order with PENDING status.

### 4. Check Emails

- Customer should receive "Subscription Order" confirmation
- Merchant should receive "New Subscription Order" notification

### 5. Check Inventory

Verify that product stock was decremented:

```sql
SELECT p.name, pv.name as variant, pv."stockQuantity"
FROM "ProductVariant" pv
JOIN "Product" p ON p.id = pv."productId"
WHERE p.name LIKE '%[your-product-name]%';
```

## Testing Scenarios

### Scenario 1: Weekly Subscription

1. Create subscription with "Every week" billing
2. Use test clock or trigger webhook after 7 days
3. Verify new order created with same product/quantity

### Scenario 2: Multiple Item Subscription

1. Create subscription with quantity > 1
2. Trigger renewal webhook
3. Verify order quantity matches subscription quantity

### Scenario 3: Delivery vs Pickup

1. Create subscription with DELIVERY method and shipping address
2. Trigger renewal
3. Verify recurring order has shipping address populated

### Scenario 4: Stock Depletion

1. Set product stock to 2
2. Trigger 3 renewals (quantity 1 each)
3. Verify stock reaches -1 (allows backorders)

### Scenario 5: Failed Payment

```powershell
# Trigger payment failure
stripe trigger invoice.payment_failed --override subscription=sub_1XXXXX
```

Verify that:

- No order is created (only on successful payment)
- Subscription status updates to PAST_DUE

## Troubleshooting

### Order Not Created

**Check webhook logs for errors:**

- Missing purchase option in database
- Product name mismatch between Stripe and database
- Database connection issues

**Solution:** Ensure product exists and matches Stripe product name.

### Inventory Not Decremented

**Check logs for:** `Failed to update inventory`

**Solution:** Verify ProductVariant exists for the subscription product.

### Emails Not Sent

**Check environment variables:**

- `RESEND_API_KEY` set correctly
- `RESEND_FROM_EMAIL` configured
- `MERCHANT_EMAIL` configured

**Check logs for:** `Failed to send customer email`

### Duplicate Orders

If you see multiple orders for one renewal:

- Check if webhook is being delivered multiple times
- Stripe retries failed webhooks (200 response prevents duplicates)
- Ensure webhook handler returns 200 quickly

## Common Stripe CLI Commands

```powershell
# List recent events
stripe events list --limit 10

# View specific event
stripe events retrieve evt_1XXXXX

# List subscriptions
stripe subscriptions list --limit 10

# View subscription details
stripe subscriptions retrieve sub_1XXXXX

# List invoices for subscription
stripe invoices list --subscription sub_1XXXXX

# Manually create invoice (triggers immediate charge)
stripe invoices create --customer cus_1XXXXX --subscription sub_1XXXXX --auto-advance true
```

## Production Testing

Before going live, test with:

1. **Stripe Test Mode**: Always test in test mode first
2. **Real Payment Flow**: Complete actual checkout with test cards
3. **Wait for Real Cycle**: Create a daily subscription and wait 24 hours
4. **Monitor Webhooks**: Use Stripe Dashboard → Webhooks to verify delivery

## Expected Behavior

### First Payment (Checkout)

- Creates Subscription record
- Creates initial Order
- Sends confirmation email

### Recurring Payments (Renewals)

- Updates Subscription billing period
- Creates new Order for each renewal
- Decrements inventory
- Sends confirmation emails
- Marks as PENDING for merchant to fulfill

## Notes

- Recurring orders are created as separate Order records
- Each renewal decrements inventory like a new purchase
- Subscription remains ACTIVE even if order fulfillment fails
- Merchants can track all orders (initial + renewals) in admin dashboard
- Customers see all orders in their order history

# Product Backlog

## High Priority

### Failed Order Handling System
**Status**: Planned  
**Description**: Implement comprehensive failed order handling to notify customers and track fulfillment issues.

**Tasks**:
- [ ] Add `FAILED` status to `OrderStatus` enum in Prisma schema
- [ ] Create migration: `add_failed_order_status`
- [ ] Create `FailedOrderNotification.tsx` email template
  - Include order details, reason for failure, support contact
  - Match existing email template styling
- [ ] Update order history UI to display FAILED status
  - Add red badge/styling for failed orders
  - Show failure reason/message to customer
- [ ] Create admin endpoint to mark orders as FAILED
  - POST `/api/admin/orders/[id]/fail`
  - Accept failure reason in request body
  - Trigger customer notification email
  - Update order status in database
- [ ] Add failure reason field to Order model (optional)
  - `failureReason String?` to track why order failed

**Acceptance Criteria**:
- Merchants can mark orders as FAILED with reason
- Customers receive email notification when order fails
- Failed orders visible in customer order history
- Failed orders trackable in admin dashboard

---

## Medium Priority

### Split Mixed Cart into Separate Orders
**Status**: Planned  
**Priority**: High  
**Description**: Separate one-time and subscription items into distinct orders for clearer fulfillment and cancellation workflows.

**Business Logic:**
- **Checkout with mixed cart** → Creates TWO orders:
  - Order #1: One-time items only (normal order flow)
  - Order #2: Subscription items only (linked to Subscription record)
- **Order cancellation** (before shipment):
  - One-time order: Cancel order, refund customer
  - Subscription order: Opens "Manage Subscription" portal (same as subscription tab)
- **Subscription management** (from subscription tab):
  - Renew/cancel: Updates subscription status AND linked order status
  - If order SHIPPED: Subscription managed independently (can't cancel shipped order)
  - If order PENDING: Canceling subscription also cancels the order
- **Order fulfillment**:
  - Once subscription order ships → Subscription managed only from Subscription tab
  - Clear separation between initial order and recurring deliveries

**Tasks:**
- [ ] Add database relationships
  - `subscriptionId String? @unique` on Order model
  - `initialOrderId String? @unique` on Subscription model
  - Create migration for bidirectional relationship
- [ ] Update `checkout.session.completed` webhook
  - Detect mixed cart (one-time + subscription items)
  - Create Order #1 for one-time items
  - Create Order #2 for subscription items (with subscriptionId link)
  - Ensure inventory decremented correctly for both
  - Send separate email notifications (or combined with clear sections)
- [ ] Update order history UI
  - Badge subscription orders: "Subscription Order" or "Initial Subscription"
  - Add "Manage Subscription" button on subscription orders (if not shipped)
  - Link to related subscription from order details
  - Show subscription status alongside order status
- [ ] Update subscription tab UI
  - Link to initial order from subscription details
  - Show if initial order was shipped/pending/canceled
- [ ] Update order cancellation logic
  - Check if order has `subscriptionId`
  - If yes and not shipped: Redirect to Stripe portal for subscription cancellation
  - If no: Normal order cancellation flow
- [ ] Update subscription webhook handlers
  - When subscription canceled: Update linked order status if not shipped
  - When subscription status changes: Reflect in order history if pending

**Edge Cases:**
- Cart with ONLY subscription items → Create single order (linked to subscription)
- Cart with ONLY one-time items → Create single order (no subscription link)
- Mixed cart checkout → Split into two orders with clear order numbers
- Subscription reactivated → Order already shipped, no order status change needed

**Acceptance Criteria:**
- Mixed carts automatically split into separate orders
- Subscription orders clearly identified in order history
- Canceling pending subscription order cancels the subscription
- Canceling subscription cancels pending order (if not shipped)
- Once order ships, subscription managed independently
- Clear UI indicators showing order ↔ subscription relationship

---

### Subscription Renewal Order Creation
**Status**: Planned  
**Description**: Automatically create Order records for each subscription billing cycle.

**Tasks**:
- [ ] Enhance `invoice.payment_succeeded` webhook to create Order for subscription renewals
- [ ] Link renewal orders to Subscription records
- [ ] Handle inventory decrement for recurring orders
- [ ] Manage shipping address for subscription deliveries
- [ ] Create merchant notification for subscription renewals

**Acceptance Criteria**:
- Each billing cycle creates a new Order record
- Inventory properly decremented for renewals
- Merchant receives notification for fulfillment
- Customer can see renewal orders in order history

---

### Subscription Cancellation Feedback Tracking
**Status**: Backlog  
**Description**: Capture and analyze subscription cancellation feedback from Stripe Customer Portal.

**Tasks**:
- [ ] Add cancellation feedback fields to Subscription model
  - `cancellationReason String?` (e.g., "too_expensive", "customer_service", "low_quality")
  - `cancellationComment String?` for additional feedback text
- [ ] Update `customer.subscription.deleted` webhook to capture `cancellation_details`
  - Extract `reason`, `feedback`, and `comment` from Stripe event
  - Store in database for analytics
- [ ] Create admin dashboard view for cancellation insights
  - Chart showing cancellation reasons distribution
  - List of recent cancellations with feedback
  - Filter by date range and reason
- [ ] Optional: Send merchant notification email on cancellation
  - Include customer feedback for follow-up
  - Suggest re-engagement strategies

**Acceptance Criteria**:
- Cancellation feedback stored in database from Stripe portal
- Admin can view cancellation analytics
- Data helps inform product/pricing improvements

**Notes**:
- Stripe captures feedback via portal survey: reason (alternative, no longer needed, too expensive, other) + optional comment
- Available in `subscription.cancellation_details` object from webhook events

---

## Low Priority

### Merchant Order Notification Enhancements
**Status**: Backlog  
**Description**: Improve merchant notifications with actionable insights.

**Tasks**:
- [ ] Add quick action buttons (Mark Shipped, Mark Failed)
- [ ] Include customer notes/preferences
- [ ] Add priority indicators for same-day pickup orders
- [ ] Group notifications by fulfillment method

---

### Customer Order Tracking
**Status**: Backlog  
**Description**: Provide real-time order tracking for customers.

**Tasks**:
- [ ] Integrate shipping carrier APIs (USPS, FedEx, UPS)
- [ ] Create order tracking page with timeline
- [ ] Send shipment notifications with tracking links
- [ ] Add estimated delivery date display

---

## Completed

### ✅ Subscription Webhook Refactor (v0.11.5)
- Hybrid approach using `checkout.session.completed` and `invoice.payment_succeeded`
- Exclude CANCELED subscriptions from duplicate check
- Enhanced order confirmation emails with purchase type and delivery schedule

### ✅ Subscription Management System (v0.11.4)
- Full subscription lifecycle management
- Stripe Customer Portal integration
- Subscriptions tab in account settings

### ✅ Mixed Billing Interval Validation (v0.11.5)
- Prevent checkout with different billing intervals
- Client and server-side validation

---

*Last Updated: November 17, 2025*

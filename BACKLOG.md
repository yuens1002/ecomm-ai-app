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

### Subscription Cancellation Flow Review
**Status**: Planned  
**Description**: Review and test subscription cancellation workflow.

**Tasks**:
- [ ] Test `customer.subscription.deleted` webhook handler
- [ ] Test `cancel_at_period_end` flag handling
- [ ] Verify Stripe Customer Portal cancellation workflow
- [ ] Test immediate vs end-of-period cancellation
- [ ] Update UI to show cancellation pending status

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

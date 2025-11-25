# Product Backlog

## High Priority

---

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

---

### Admin UI for Category Purchase Options Toggle

**Status**: Backlog  
**Priority**: Medium  
**Description**: Add admin UI to control per-category `showPurchaseOptions` setting, allowing merchants to show/hide prices and purchase buttons on category pages.

**Current State**:

- `showPurchaseOptions` field exists on Category model (defaults to `true`)
- Database migration applied: `20251123122634_add_show_purchase_options_to_category`
- Feature is functional end-to-end: Category → CategoryClientPage → ProductCard
- No UI exists for admins to toggle this setting

**Proposed Changes**:

- Add toggle control to category management interface
- Allow merchants to control display behavior per category
- Use cases: gallery view for "Origins" (hide prices), e-commerce view for "Blends" (show prices)

**Tasks**:

- [ ] Locate or create category management admin UI
  - Check if `app/admin/categories/CategoryManagementClient.tsx` exists
  - If not, create new admin section for category management
- [ ] Add "Show Purchase Options" toggle to category edit form
  - Checkbox or switch control
  - Label: "Show prices and purchase buttons on category page"
  - Default checked (matches database default)
- [ ] Create/update API endpoint for category updates
  - POST `/api/admin/categories/[id]` or similar
  - Accept `showPurchaseOptions` boolean in request body
  - Validate admin permissions
  - Update category record in database
- [ ] Add toggle to category list/grid view (optional)
  - Quick toggle without opening full edit form
  - Visual indicator of current state
- [ ] Test toggle functionality
  - Toggle ON: prices and buy buttons appear on category page
  - Toggle OFF: gallery view with no purchase options
  - Changes persist across page reloads
  - Works for all categories independently

**Technical Considerations**:

- Field already exists in schema with migration applied
- No database changes needed
- Only requires UI and API endpoint
- Consider batch operations if managing multiple categories

**Acceptance Criteria**:

- Admins can toggle `showPurchaseOptions` for any category
- Changes reflect immediately on category pages (after refresh)
- Toggle state persists in database
- Visual feedback confirms toggle action
- Works independently for each category

**Benefits**:

- Flexibility to create gallery-style category pages (Origins, Regions)
- E-commerce view for purchasable categories (Blends, Subscriptions)
- No code changes needed for different category display modes

---

### Consolidate Admin Pages into Dashboard Tabs

**Status**: Backlog  
**Priority**: Medium  
**Description**: Move existing admin management pages into the tabbed admin dashboard for better navigation and consistency.

**Current State**:

- Admin dashboard exists with tabs (Overview, Users, Orders, Products, Profile)
- Users tab links to `/admin/users` (separate page)
- Orders tab links to `/admin/orders` (separate page)
- Products tab is placeholder

**Proposed Changes**:

- Move user management content directly into Users tab (remove separate page)
- Move order management content directly into Orders tab (remove separate page)
- Implement products management in Products tab
- Keep all admin functionality in single dashboard with tab navigation
- Improve UX by eliminating page transitions

**Tasks**:

- [ ] Refactor `/app/admin/users/page.tsx` content into `AdminDashboardClient.tsx` Users tab
- [ ] Refactor `/app/admin/orders/page.tsx` content into `AdminDashboardClient.tsx` Orders tab
- [ ] Update tab navigation to use tab switching instead of links
- [ ] Remove separate admin pages (`/app/admin/users/`, `/app/admin/orders/`)
- [ ] Test user management functionality within tab
- [ ] Test order management functionality within tab
- [ ] Ensure API routes remain unchanged

**Benefits**:

- Single page experience for all admin functions
- Consistent with account settings UX pattern
- Faster navigation (no page reloads)
- Easier to maintain single dashboard component

**Acceptance Criteria**:

- All admin management functions accessible via dashboard tabs
- No separate page navigation required
- Tab switching is instant without page reload
- All existing functionality preserved

---

### Admin Profile Management

**Status**: Backlog  
**Priority**: Medium  
**Description**: Allow admins to update their own profile information (name, email) from the admin dashboard.

**Current State**:

- Admin Profile tab exists but only displays read-only information
- No way for admins to update their own details
- Profile changes require direct database edits

**Proposed Changes**:

- Add edit mode to Profile tab with form fields
- Allow updating name (safe, no side effects)
- Allow updating email with proper validation and session handling
- Add password change functionality
- Update session after email change to prevent logout

**Tasks**:

- [ ] Create edit mode UI in Profile tab
  - Toggle between view/edit modes
  - Form fields for name, email
  - "Change Password" section with current/new password fields
- [ ] Create API endpoint: `POST /api/admin/profile`
  - Validate email format and uniqueness
  - Check for OAuth accounts (can't change email if OAuth-only)
  - Hash password if changed
  - Update user record in database
- [ ] Handle email change session implications
  - Update session with new email after database update
  - Prevent forced logout after email change
  - Show confirmation toast
- [ ] Add security validations
  - Require current password for email changes
  - Require current password for password changes
  - Rate limiting on profile updates
- [ ] Update OAuth account handling
  - Show message for OAuth-only accounts (email tied to provider)
  - Allow name changes for OAuth accounts
  - Consider adding "Link Email/Password" for OAuth users

**Technical Considerations**:

- **Email Changes**: May affect Auth.js session; need to refresh session token
- **OAuth Accounts**: Users signed in via Google/GitHub may not have password in DB
- **Credentials Accounts**: Can freely update email/password
- **Mixed Accounts**: OAuth + Credentials - need careful handling

**Acceptance Criteria**:

- Admins can update their name successfully
- Admins can update email with current password verification
- Admins can change password with current password verification
- OAuth-only accounts show appropriate messaging
- Session remains valid after updates
- Email uniqueness validated before update
- All changes reflected immediately in UI

**Security Notes**:

- Require current password for sensitive changes (email, password)
- Validate email format and check for duplicates
- Rate limit profile update requests
- Log profile changes for audit trail

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

### Add Store Name to Settings Model

**Status**: Backlog  
**Priority**: Low  
**Description**: Add a configurable store name field to the Settings model to allow branding customization throughout the application.

**Current State**:

- Store name is hardcoded as "Artisan Roast" throughout the application
- Email templates, navigation, and branding use hardcoded values
- SiteSettings model exists with key-value structure for configuration

**Proposed Changes**:

- Add `storeName` key to SiteSettings model
- Default value: "Artisan Roast"
- Admin UI in Settings tab to configure store name
- Update email templates to use dynamic store name
- Update site header/footer to use configured name

**Tasks**:

- [ ] Add storeName to seed.ts with default "Artisan Roast"
- [ ] Add store name field to admin settings UI
- [ ] Update email templates to fetch and use store name from settings
- [ ] Update navigation components to use dynamic store name
- [ ] Update metadata/SEO tags to use configured store name
- [ ] Test store name changes reflect across all touchpoints

**Acceptance Criteria**:

- Admins can configure store name from settings panel
- Store name updates across all email templates
- Store name updates in navigation and branding
- Changes persist and apply immediately
- Default "Artisan Roast" used if not configured

---

### Recurring Orders Should Not Show Cancel Button

**Status**: Known Bug  
**Priority**: Low  
**Description**: Recurring orders (created at subscription renewal) currently show cancel buttons in order history. Customers should manage subscriptions at the subscription level, not cancel individual recurring deliveries.

**Current Behavior**:

- Recurring orders created with `status: "PENDING"` when subscription renews
- Cancel button condition `{order.status === "PENDING" &&` matches recurring orders
- Customers can cancel individual recurring orders from order history

**Expected Behavior**:

- Initial subscription order: Should show cancel button (customer just purchased)
- Recurring orders: Should NOT show cancel button (part of ongoing subscription contract)
- Customers should manage entire subscription via subscription tab, not individual deliveries

**Possible Solutions**:

1. Add `isRecurringOrder` boolean field to Order model to distinguish initial vs recurring orders
2. Create recurring orders with different status (e.g., "PROCESSING" instead of "PENDING")
3. Check if order has a prior order with same `stripeSubscriptionId` (if yes, it's recurring)

**Impact**:  
Customers can currently cancel individual recurring orders, which may create confusion about subscription management vs order cancellation.

**Next Steps**:  
Requires separate feature branch for proper design, implementation, and testing.

---

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

### ✅ Split Orders for Mixed Carts (v0.11.7)

**Completed**: November 18, 2025  
**Description**: Implemented order splitting for mixed carts with architectural pivot based on Stripe's subscription model.

**Key Implementation:**

- **Order Structure**: Mixed carts create separate orders:
  - One order for all one-time items
  - ONE order for ALL subscription items (architectural decision based on Stripe's model)
- **Stripe Discovery**: Stripe creates one subscription with multiple line items, not separate subscriptions per product
- **Array-Based Subscription Model**: Changed from single values to arrays to support multiple products:
  - `productNames String[]` - snapshot of product names at purchase time
  - `stripeProductIds String[]` - Stripe product IDs for all items
  - `stripePriceIds String[]` - Stripe price IDs for all items
  - `quantities Int[]` - quantities for each item
- **Architectural Decision**: Snapshot approach (store product names) vs relational (foreign keys)
  - **Why**: Historical accuracy, fulfillment simplicity, UI simplicity
  - **Tradeoff**: Recurring orders lookup by name (fuzzy match risk if product renamed)
- **Webhook Updates**: Both `checkout.session.completed` and `invoice.payment_succeeded` refactored to handle arrays
- **Duplicate Prevention**: Updated to check all products across productNames arrays
- **Recurring Order Creation**: Loops through all subscription items to create order items
- **UI Enhancements**: Subscription tab displays all products with quantities, subscription ID without prefix

**Migrations:**

- `20251118024917_add_subscription_id_to_order` - Added Order.stripeSubscriptionId
- `20251118054840_change_subscription_to_arrays` - Changed Subscription to array fields

**Testing:**

- ✅ Mixed cart with 2 different subscription products (Death Valley 2lb + Guatemalan 12oz)
- ✅ Single subscription record created with both products in arrays
- ✅ Single order created containing all subscription items
- ✅ UI displays all products correctly
- ✅ Checkout validation prevents duplicate subscriptions

**Files Changed**: 13 files (976 insertions, 395 deletions)

**Notes**: This feature represents a significant architectural evolution from the initial design, pivoting based on real-world Stripe API behavior. The array-based approach provides flexibility for future multi-product subscription scenarios while maintaining data integrity and simplifying fulfillment workflows.

---

### ✅ Recurring Order Creation (v0.11.6)

**Completed**: November 17, 2025  
**Description**: Automatically create Order records for each subscription billing cycle to enable fulfillment tracking.

**Implementation:**

- Enhanced `invoice.payment_succeeded` webhook to detect renewal vs initial payment
- Create Order records for each subscription renewal cycle
- Link orders to Subscription via `stripeSubscriptionId` field
- Decrement inventory for each renewal delivery
- Send merchant notification emails for fulfillment
- Handle edge cases: failed payments, paused subscriptions, address updates

**Acceptance Criteria Met:**

- ✅ Each successful billing cycle creates new Order record
- ✅ Renewal orders visible in admin dashboard
- ✅ Inventory properly decremented for renewals
- ✅ Merchant receives email notifications
- ✅ Customer can view renewal orders in order history
- ✅ Failed renewals don't create orders

---

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

_Last Updated: November 18, 2025_

# Changelog

## 0.15.0 - 2025-11-20

- **AI Barista Chat MVP**: Text-based conversational interface with comprehensive error handling and brewing knowledge ([6560e73](https://github.com/yuens1002/ecomm-ai-app/commit/6560e730f3fe67fe86c5e11512388d90048ccefa))
  - Modal-based chat UI with fixed height, scrollable messages, and always-visible input
  - Gemini AI integration with user context (order history, favorites, addresses)
  - Retry mechanism for service errors with spinning state and right-aligned button
  - Comprehensive brewing method guide in system prompt (drip vs espresso distinction)
  - Bilingual support with auto-detection (English/Spanish)
  - Error handling for rate limits, service unavailable, and empty responses

- **Voice Barista UI Foundation**: Session-based hero section with voice chat interface for authenticated users ([2519901](https://github.com/yuens1002/ecomm-ai-app/commit/2519901328b456f853c1df27bdca19d036468bd6))
  - VoiceBarista component replaces hero for authenticated users with "Start Voice Chat" and "Get AI Recommendation" options
  - Voice AI platform research complete - selected VAPI for multilingual support and function calling
  - Conversation flow designed with 6 backend functions and bilingual templates (English/Spanish)

## 0.14.0 - 2025-11-20

- **AI Recommendation Buy Now**: Complete checkout flow integration with AI recommendations
  - **Buy Now Functionality**: Direct checkout from AI modal creates Stripe Checkout session and redirects to hosted payment page
  - **Add to Cart Integration**: Adds recommended product to cart and closes modal for continued shopping
  - **Smart Variant Selection**: Automatically selects cheapest variant with one-time purchase option (never subscriptions)
  - **Product Linking**: Product name displays as clickable button link to product detail page
  - **Smart Product Matching**: API fetches full product data (variants, images, purchase options) based on AI recommendation
  - **Featured Product Fallback**: If AI doesn't match specific product, automatically suggests first featured product
  - **Improved Button Layout**: When product found - "Add to Cart" (outline), "Buy Now" (primary); When no product - "Start Over" only
  - **Loading States**: Buy Now button shows spinner during Stripe session creation
  - **Image URL Fix**: Converts relative image URLs to absolute URLs for Stripe API validation
  - **Error Handling**: Concise red error message ("Something went wrong. Please try again.") displays above buttons without losing recommendation
  - **Error Recovery**: Users can retry Buy Now without restarting the recommendation flow

## 0.13.2 - 2025-11-20

- **AI Recommendation Modal Improvements**: Enhanced user experience and functionality
  - **Product Linking**: "View Product" button now appears when AI recommends a specific coffee, linking directly to the product page
  - **Better Flow**: "Start Over" button resets to step 1 instead of closing modal, allowing users to get multiple recommendations
  - **Conditional Badge**: Personalization badge only shows when user has actual purchase history (>0 orders)
  - **Visual Polish**: Improved badge styling with CheckCircle2 icon from lucide-react, subtle green background (green-500/10) with better visibility in both light/dark modes
  - **Cleaner Layout**: Removed unnecessary whitespace between title and content in result step
  - **Increased Token Limit**: Raised Gemini maxOutputTokens from 1000 to 2000 to prevent response cutoff
  - **Graceful Error Handling**: Added friendly fallback message when MAX_TOKENS is reached instead of showing error
  - **API Enhancement**: Recommendation endpoint now returns product slug for direct linking

## 0.13.1 - 2025-11-20

- **AI-Generated Product Images**: All 30 coffee products now have custom branded images
  - Generated using Grok AI (xAI) with consistent "Artisan Roast" branding
  - Minimalist white packaging with product name in colored label
  - Images saved as 1024x1024 WebP format for optimal web performance
  - Cost: ~$2.10 for all 30 images
- **Product Card Redesign**: Updated ProductCard component for better image display
  - Square aspect ratio (aspect-square) with 200px max height
  - Bordered layout with rounded corners on bottom
  - Text overflow handling with ellipsis for long product names
  - Improved spacing and visual hierarchy
- **Image Generation Infrastructure**: Added dependencies and scripts
  - Dependencies: `sharp` (image processing), `form-data`, `node-fetch@2`
  - Scripts for Grok API integration and batch image generation
  - Updated `.env.example` with GROK_API_KEY documentation

## 0.13.0 - 2025-11-19

- **Real-Time Activity Tracking**: Session-based tracking for PRODUCT_VIEW, ADD_TO_CART, REMOVE_FROM_CART
  - Client-side `useActivityTracking` hook with automatic session ID generation
  - Silent failure design to not disrupt user experience
  - Integrated into ProductClientPage and ShoppingCart components
  - POST `/api/track-activity` endpoint with validation
  - Visible in admin analytics dashboard immediately
- **Unit Tests**: Jest and React Testing Library setup
  - 7 passing tests for `useActivityTracking` hook
  - Tests cover authenticated/anonymous users, error handling, session persistence
  - Excluded API route tests (Next.js edge runtime complexity) and data tests (require live database)
  - Scripts: `npm test` (watch mode), `npm run test:ci` (CI mode)

## 0.12.0 - 2025-11-18

- **AI-Powered Product Recommendations**: Behavioral recommendation system with personalized shopping experience
  - **Product Catalog Expansion**: 30 specialty coffees (from 11) with detailed tasting notes, origins, and roast levels
  - **User Activity Tracking**: New UserActivity model tracking PAGE_VIEW, PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART events
    - Session-based tracking supports both anonymous and authenticated users
    - Indexed for query performance
  - **Behavioral Analytics Functions**: Added 5 data functions in `lib/data.ts`
    - Purchase history, recent views, search history aggregation
    - User preference analysis (roast level, tasting notes)
    - Trending products for anonymous users
  - **Personalized AI Assistant**: Enhanced Gemini modal with user context injection
    - Includes purchase history, views, searches, and preferences in prompt
    - Displays personalization badge with user stats
    - Graceful fallback for anonymous users
  - **Homepage Recommendations**: "Recommended For You" section with behavioral scoring
    - Algorithm: +10 roast match, +5 per tasting note, +3 viewed, -20 recent purchase
    - Shows personalized subtitle with preferences
    - Falls back to trending products for anonymous users
  - **Product Search**: Full-text search across name, description, origin, and tasting notes
    - Search dialog in header (desktop) and mobile menu
    - Automatic search activity tracking
    - Real-time results with loading states
  - **Admin Analytics Dashboard**: New `/admin/analytics` page
    - Trending products and top search queries
    - Conversion metrics (view→cart→order rates)
    - Activity breakdown and daily trend visualization
    - Period selection (7/30 days)
- **Database Migration**: `20251119034105_add_user_activity_tracking`
- **API Endpoints**:
  - `/api/recommendations` - Behavioral scoring algorithm
  - `/api/admin/analytics` - Admin analytics data
  - `/api/search` - Product search with tracking
- **Seed Scripts**: Synthetic user data generation for testing and demo purposes

## 0.11.9 - 2025-11-18

- **Admin Owner Assignment**: Complete admin management and bootstrap system
  - **Initial Setup Flow**: First-time admin account creation for new deployments
    - `/setup` page with full name, email, and password form
    - Password validation with real-time UI feedback (min 8 chars, uppercase, lowercase, number, special char)
    - Confirm password field with match validation
    - Auto-verifies email for initial admin account
    - Only accessible when no admin exists in the system (checked via HEAD /api/admin/setup)
    - Shows "Setup Already Complete" message if admin exists
    - Redirects to sign-in after successful creation
  - **Admin Dashboard**: Tabbed interface at `/admin` with overview and quick actions
    - **Overview Tab**: Dashboard stats (total users, orders, products, admin count)
    - **Users Tab**: Link to user management page
    - **Orders Tab**: Link to orders page
    - **Products Tab**: Placeholder for future product management
    - **Profile Tab**: Admin account information display
    - Quick action cards for common tasks
  - **User Management UI**: `/admin/users` page for managing user privileges
    - Lists all users with admin status, order counts, and subscription counts
    - Toggle admin privileges with safety checks (cannot revoke last admin)
    - Real-time status updates using optimistic UI patterns
    - Table and Badge components added from shadcn/ui
  - **API Endpoints**:
    - `HEAD /api/admin/setup` - checks if admin exists (200 = no admin, 403 = admin exists)
    - `POST /api/admin/setup` - creates first admin account with validation
    - `GET /api/admin/users` - fetches all users with order/subscription counts
    - `POST /api/admin/users/[id]/toggle-admin` - grants or revokes admin privileges with last-admin protection
  - **Admin Layout**: Shared layout with setup redirect and admin authorization
  - **Helper Functions**: Added `hasAnyAdmin()` to `lib/admin.ts` for initial setup detection
  - **Security Features**:
    - Strong password requirements with real-time validation
    - Prevents revoking last admin (maintains at least one admin)
    - Admin-only access to all admin endpoints
    - Auto-email verification for bootstrap account
  - **UI Components**: Added `components/ui/table.tsx` and `components/ui/badge.tsx` for data display
- **Testing Notes**: Complete flow tested locally (initial setup → admin dashboard → user management → privilege toggling)

## 0.11.7 - 2025-11-18

- **Split Orders for Mixed Carts**: Implemented order splitting for mixed carts with architectural pivot based on Stripe's subscription model
  - **Order Structure**: Mixed carts now create separate orders:
    - One order for all one-time items
    - ONE order for ALL subscription items (architectural decision based on Stripe creating one subscription with multiple line items)
  - **Array-Based Subscription Model**: Refactored Subscription model to support multiple products using arrays:
    - `productNames String[]` - snapshot of product names at purchase time for historical accuracy
    - `stripeProductIds String[]` - Stripe product IDs for all subscription items
    - `stripePriceIds String[]` - Stripe price IDs for all subscription items
    - `quantities Int[]` - quantities for each subscription item
  - **Architectural Decision - Snapshot Approach**: Store product names as strings instead of foreign key relations
    - **Why**: Historical accuracy (if product renamed/deleted, subscription shows original name), fulfillment simplicity (merchant only needs name to ship), UI simplicity (no complex joins)
    - **Tradeoff**: Recurring orders must lookup PurchaseOption by name using fuzzy match - risk if product name changes significantly
    - Documented directly in Prisma schema for future maintainability
  - **Webhook Refactoring**: Complete overhaul of both subscription webhooks to handle multiple products:
    - `checkout.session.completed`: Loops through `subscription.items.data` to extract all products into arrays, creates single order with all subscription items
    - `invoice.payment_succeeded`: Handles both initial subscription and renewals with array support, loops through productNames to find PurchaseOptions for recurring orders
  - **Duplicate Subscription Prevention**: Updated checkout validation to check all products across productNames arrays (uses `flatMap` and `includes()` to detect duplicates)
  - **Order Cancellation**: Added admin endpoint `/api/admin/orders/[orderId]/cancel` for manually canceling orders
  - **UI Enhancements**:
    - Subscription tab now displays subscription ID without "sub\_" prefix for cleaner look
    - Lists all products in subscription with quantities (e.g., "Death Valley Espresso - 2lb Bag × 2")
    - Removed product description field for cleaner UI
    - Kept billing period display for subscription transparency
  - **Helper Scripts**: Created `scripts/cancel-active-subscriptions.ts` for bulk subscription cancellation during testing
- **Database Migrations**:
  - `20251118024917_add_subscription_id_to_order` - Added `stripeSubscriptionId` to Order model for linking orders to subscriptions
  - `20251118054840_change_subscription_to_arrays` - Changed Subscription from single values to arrays (productName → productNames[], etc.)
- **Testing Results**:
  - ✅ Mixed cart with 2 different subscription products (Death Valley 2lb + Guatemalan 12oz weekly)
  - ✅ Single subscription record created with both products in arrays
  - ✅ Single order created containing all subscription items
  - ✅ UI correctly displays all products with quantities
  - ✅ Checkout validation prevents duplicate subscriptions across all products
  - ✅ Both webhooks handle arrays correctly
  - ✅ TypeScript compilation passing (fixed 13 errors across 4 files)
- **Architecture Notes**: This feature represents a significant pivot from the initial design (separate order per subscription item) after discovering Stripe creates one subscription with multiple line items, not separate subscriptions per product. The array-based approach provides flexibility for multi-product subscriptions while maintaining data integrity and simplifying fulfillment workflows.

## 0.11.6 - 2025-11-17

- **Recurring Order Creation**: Automatic order creation for subscription renewals
  - Enhanced `invoice.payment_succeeded` webhook to differentiate between initial subscription payments and renewals using `billing_reason` field
  - Initial subscriptions (`billing_reason: "subscription_create"`): Update Subscription record in database
  - Renewal payments (`billing_reason: "subscription_cycle"`): Create new Order record with PENDING status
  - Subscription ID extraction with fallback: checks `invoice.subscription` and `invoice.parent.subscription_details.subscription`
  - Automatic inventory decrementation when recurring orders are created
  - Fuzzy product matching: maps Stripe product names to PurchaseOptions by splitting on " - " separator
- **Subscription-Aware Email Notifications**: Enhanced all email templates with subscription context
  - **OrderConfirmationEmail**: Shows "Your Subscription Order is Being Prepared! 📦" heading with green banner displaying subscription cadence (e.g., "☕ Every week delivery")
  - **MerchantOrderNotification**: Shows "🔄 Subscription Renewal Order" heading with blue banner (e.g., "Every week • Auto-renewal")
  - **ShipmentConfirmationEmail**: Shows "📦 Your Subscription Order Has Shipped!" with subscription cadence in preview and body text
  - All templates accept `isRecurringOrder?: boolean` and `deliverySchedule?: string` props for conditional rendering
- **Smart Email Strategy**: Optimized notification flow to reduce email fatigue
  - Recurring order creation: Only merchant receives notification, customer email skipped
  - Order shipment: Customer receives single email combining order confirmation + tracking + subscription context
  - Reduces customer emails from 2 to 1 per subscription renewal cycle
  - Logs clearly indicate: "⏭️ Skipping customer email - will send with tracking when order ships"
- **Comprehensive Testing Documentation**: Created `docs/testing-recurring-orders.md` (~300 lines)
  - Multiple testing methods: Stripe CLI webhook triggers, test clocks, event replay
  - Verification steps: webhook logs, database queries, admin dashboard checks, email delivery, inventory tracking
  - Test scenarios: weekly/monthly subscriptions, multiple items, delivery/pickup, stock depletion edge cases
  - Troubleshooting guide: missing purchase options, inventory errors, email failures
  - Stripe CLI command reference for local development
  - Production testing checklist

## 0.11.5 - 2025-11-17

- **Webhook Event Refactor**: Hybrid approach for subscription creation using both `checkout.session.completed` and `invoice.payment_succeeded`
  - **Immediate payment methods (cards)**: Subscription created in `checkout.session.completed` when `payment_status === "paid"` and `subscription.status` is `"active"` or `"trialing"` - provides instant UX feedback
  - **Async payment methods (ACH, SEPA, etc.)**: Subscription created in `invoice.payment_succeeded` when payment confirms later - ensures data integrity
  - Renewal payments: Handled by `invoice.payment_succeeded` for all billing cycles
  - Status changes: Handled by `customer.subscription.updated` event
  - Prevents orphaned subscription records from failed or incomplete payments
  - **Bug Fix**: Exclude CANCELED subscriptions from duplicate check to allow re-subscription to previously canceled products
  - **Bug Fix**: Extract billing period from `subscription.items` instead of top-level subscription object
  - **Bug Fix**: Check both `cancel_at_period_end` and `cancel_at` fields for scheduled cancellations (Stripe uses `cancel_at` for portal cancellations)
  - Safety checks: Verify `payment_status === "paid"` and valid subscription status before creating records
  - **Known Limitation**: Mixed orders (one-time + subscription items) create single order; canceling order doesn't cancel subscription. See backlog for planned split-order implementation.
- **Subscription Schema Refactor**: Removed `variantName` field from Subscription model since `productName` already contains the full product+variant combination (e.g., "Death Valley Espresso - 12oz Bag")
  - Simplified webhook handler to only use `productName` from Stripe
  - Updated all UI components (AccountPageClient, SubscriptionsTab) to display `productName` only
  - Database migration: `20251117061523_remove_variant_name_from_subscription`
- **Mixed Billing Interval Validation**: Added comprehensive validation to prevent checkout with subscriptions of different billing intervals (Stripe limitation)
  - Client-side validation in cart store with custom event error handling
  - Server-side validation in checkout API with specific error code (`MIXED_BILLING_INTERVALS`)
  - Toast notifications for all validation errors
- **Duplicate Subscription Prevention**: Fixed duplicate subscription check to be per-variant instead of per-product
  - Changed uniqueness logic from `productName` to `productName::variantName` combination
  - Updated checkout route to check by `stripeProductId` or exact productName match
  - Users can now have multiple subscriptions for different variants of the same product
- **Subscription Purchase Option Schema Cleanup**: Removed deprecated `deliverySchedule` string field from PurchaseOption model
  - All subscription scheduling now uses structured `billingInterval` (enum) and `billingIntervalCount` (number)
  - Database migration: `20251117031833_remove_delivery_schedule_from_purchase_option`
  - Updated seed data to use structured interval fields consistently
- **Cart Store Refactor**: Replaced deprecated `deliverySchedule` with `billingInterval` and `billingIntervalCount` fields
  - Added `formatBillingInterval()` utility for consistent schedule display across app
  - Cart items now show subscription cadence labels (e.g., "Subscription - Every week")
- **Enhanced Subscription UX**:
  - Hide "Subscribe & Save" option when variant already has subscription in cart
  - Auto-switch to one-time purchase after adding subscription to cart
  - Dynamic delivery schedule dropdown generated from available subscription options
  - Checkout requires authentication for subscription purchases with helpful redirect notice
  - Improved duplicate subscription error messages with proper singular/plural grammar and bullet-point lists
- **Order Confirmation Emails**: Enhanced to distinguish between one-time and subscription items
  - Display purchase type inline with product name (e.g., "• One-time" or "• Subscription - Every week")
  - Shows delivery schedule for subscription items using `formatBillingInterval()` utility
  - Applied to both customer and merchant order notification emails
- **Toast Notification System**: Replaced browser alerts with styled toast notifications
  - Custom inverted theme colors (`bg-foreground`, `text-background`)
  - Positioned in upper right corner
  - Visible close button with proper contrast
  - User-friendly error messages for cart/checkout issues

## 0.11.4 - 2025-11-16

- **Subscription Management System**: Complete subscription lifecycle management with Stripe integration
  - Added `Subscription` model to Prisma schema with fields: `stripeSubscriptionId`, `stripeCustomerId`, `status`, product details, billing cycle, shipping address
  - Added `SubscriptionStatus` enum: ACTIVE, PAUSED, CANCELED, PAST_DUE
  - Webhook handlers for subscription lifecycle:
    - `customer.subscription.created`: Create subscription record when customer subscribes
    - `customer.subscription.updated`: Sync subscription status, billing period, and details
    - `customer.subscription.deleted`: Mark subscription as canceled in database
  - Subscription webhooks automatically find user from Stripe customer ID and upsert subscription data
  - Parse subscription item details including product name, variant, quantity, price, and delivery schedule
  - Store shipping address from subscription metadata for fulfillment
- **Stripe Customer Portal Integration**:
  - Created `/api/customer-portal` endpoint to generate Stripe Billing Portal sessions
  - Portal allows customers to: update payment method, view invoices, manage subscriptions, cancel subscriptions
  - Protected with authentication - only logged-in users can access portal
  - Automatic redirect back to account page after portal session
- **Subscriptions Tab in Account Settings**:
  - New "Subscriptions" tab in `/account` page showing all customer subscriptions
  - Display subscription status with color-coded badges: Active (green), Paused (yellow), Canceled (gray), Past Due (red)
  - Show product details: name, variant, quantity, price per billing cycle
  - Display delivery schedule (e.g., "Every 2 weeks", "Monthly")
  - Current billing period dates with calendar icon
  - Shipping address display for delivery subscriptions
  - "Manage Subscription" button opens Stripe Customer Portal in new window
  - Cancel notice for subscriptions scheduled to end at period end
  - Empty state with call-to-action to browse products
  - Loading states with spinner during portal session creation
- **Database Migration**:
  - Created migration `20251116061845_add_subscription_model` with Subscription table and SubscriptionStatus enum
  - Added `subscriptions` relation to User model
  - Indexed fields: `userId`, `stripeSubscriptionId`, `stripeCustomerId` for efficient queries
- **UI/UX Enhancements**:
  - Updated account page tab grid from 5 to 6 columns to accommodate Subscriptions tab
  - Toast notifications for subscription portal errors
  - Responsive subscription cards with proper spacing
  - Format dates with `date-fns` (e.g., "Nov 16, 2025")
  - Format prices with proper currency symbol and cents
  - Package icon for empty subscriptions state
  - External link icon on "Manage Subscription" button
- **Dependencies**:
  - Leveraged existing `resend` and `@react-email/components` packages (added in 0.11.3 hotfix)
  - Stripe API version `2024-12-18.acacia` for subscription management

## 0.11.3 - 2025-11-16

- **Admin Order Fulfillment Interface**: Complete admin dashboard for order management
  - Added `isAdmin` boolean field to User model with database migration
  - Created admin authentication helpers (`lib/admin.ts`) with `isAdmin()` and `requireAdmin()` functions
  - Built `/admin/orders` page with comprehensive table layout showing order #, date, customer, items, shipping address, total, status, and actions
  - Order filtering: All, Pending, Completed (shipped or picked up), Canceled (US spelling)
  - Mark as shipped workflow: dialog with carrier selection (USPS, UPS, FedEx, DHL) and tracking number input
  - Mark as pickup ready workflow: confirmation dialog for store pickup orders
  - Track button for shipped orders: generates carrier-specific tracking URLs
  - Copy-to-clipboard feature for tracking numbers to save horizontal space
  - Real-time toast notifications for success/error feedback using @radix-ui/react-toast
  - Admin navigation: "Admin: Manage Orders" link in user menu (visible only to admin users)
- **Email Notifications**:
  - Shipment confirmation email: sent automatically when order marked as shipped, includes tracking info, carrier, estimated delivery, and tracking URL
  - Pickup ready email: sent automatically when order ready for pickup, includes store address, hours, and ID reminder
  - Updated order confirmation email to use `orderId` instead of `orderNumber` for correct URL generation
  - Updated merchant notification email to link to admin orders dashboard instead of non-existent order detail page
  - Fixed email template styling: added `box-sizing: border-box` to prevent content overflow in email clients
- **API Routes**:
  - `GET /api/admin/orders` - Fetch all orders with filtering by status
  - `PATCH /api/admin/orders/[orderId]/ship` - Mark order as shipped with tracking info
  - `PATCH /api/admin/orders/[orderId]/pickup` - Mark order as picked up / ready for pickup
  - All routes protected with `requireAdmin()` middleware
- **Database Updates**:
  - Added proper null checks for `customerEmail` field in order API routes
  - Fixed TypeScript errors with proper type narrowing for nullable fields
  - Ensured all tracking and fulfillment fields properly handled
- **UI/UX Improvements**:
  - Status badges with color coding: Pending (yellow), Shipped (green), Picked Up (purple), Canceled (red)
  - Applied US spelling "Canceled" consistently across customer and admin interfaces
  - Shipping address display in admin table: full address for delivery orders, "Store Pickup" label for pickup orders
  - Responsive table design with proper spacing and hover states
  - Toast notifications positioned at bottom-right on desktop, top on mobile
- **Bug Fixes**:
  - Fixed order number handling: use `order.id.slice(-8)` since `orderNumber` field doesn't exist in schema
  - Added `await` for `render()` calls in email generation (returns Promise)
  - Fixed tracking URL TypeScript errors by storing result in variable for proper type narrowing
  - Resolved naming conflict between `trackingNumber` prop and style object in ShipmentConfirmationEmail
  - Fixed email link 404 errors by using `orderId` parameter instead of `orderNumber`
- Dependencies: Added `@radix-ui/react-toast` for toast notifications
- Scripts: Added `scripts/set-admin.ts` and `scripts/make-admin.ts` for admin user management
- Note: Temporary `/api/make-me-admin` route exists for development (should be removed before production)

## 0.11.2 - 2025-11-15

- **Email Notifications & Order Management (Phase 6 - Partial)**:
  - Integrated Resend for transactional email delivery (free tier: 3,000 emails/month)
  - Created React Email templates: OrderConfirmationEmail (customer) and MerchantOrderNotification (admin)
  - Automatic order confirmation emails sent to customers with order details, items, shipping info
  - Merchant notification emails sent to admin for new orders requiring fulfillment
  - Added tracking fields to Order model: `trackingNumber`, `carrier`, `shippedAt`
  - Inventory management: automatically decrement stock quantity when orders are placed
  - Environment configuration for email service with development-friendly defaults (onboarding@resend.dev)

## 0.11.1 - 2025-11-15

- **Guest Order Fulfillment Fix**: Complete restructure of order shipping data storage
  - Added shipping fields directly to Order model: `recipientName`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`
  - Removed `shippingAddressId` relation - shipping data now stored denormalized on Order table
  - Fixed critical issue: guest orders now properly save shipping addresses for fulfillment
  - Webhook updated to populate shipping fields for ALL orders (guests and logged-in users)
  - Order detail pages updated to display shipping from Order model fields
  - Benefits: enables merchant fulfillment queries, marketing campaigns (e.g., 15-30 day discount emails), complete order data without Stripe dashboard dependency
  - Logged-in users still get addresses saved to Address table for future reuse
- **Code Cleanup**:
  - Removed unused `OrdersTab.tsx` component (order management now uses dedicated `/orders` pages)
  - Simplified order queries by removing unnecessary relation includes

## 0.11.0 - 2025-11-15

- **Account Settings & Order Management (Phase 5)**: Complete user account management and order tracking system
  - Account Settings page with 5 tabs: Profile, Security, Connected Accounts, Addresses, Danger Zone
  - Profile management: edit name and email with validation and conflict detection
  - Security tab: change password functionality with current password verification
  - OAuth providers display showing connected accounts (Google, GitHub)
  - Address book: full CRUD operations with default address selection
  - Account deletion with confirmation dialog and cascading cleanup
- **Shopping Cart Enhancements**:
  - Delivery method selection: DELIVERY (shipping) or PICKUP (store pickup)
  - Address picker with saved addresses or "Enter new address at checkout" option
  - Visual delivery method UI with icons (truck for delivery, store for pickup)
- **Stripe Integration Enhancements**:
  - Shipping rates: Standard ($5.99), Express ($12.99), Overnight ($24.99)
  - Automatic address saving from Stripe checkout via webhook
  - Stripe Link support with customer email pre-fill
  - Auto-update user name from Stripe checkout data
  - Duplicate address detection before saving
  - Payment card last 4 digits capture and display
- **Order Management System**:
  - New `/orders` page with responsive table layout
  - Status filtering: All Orders, Pending, Completed, Cancelled dropdown
  - Order details page with items table, shipping info, and payment method
  - Order cancellation with immediate Stripe refund for PENDING orders
  - Mobile-optimized layout with vertical card design
  - Order display: Order #, Date, Items, Status, Total, Actions
- **Security & Data Integrity**:
  - Server-side price validation in checkout (prevents client-side price manipulation)
  - Optimized Stripe metadata to stay under 500 character limit
  - Session provider integration throughout app for auth state management
- **Database Schema Updates**:
  - Added `paymentCardLast4` field to Order model
  - Order status enum: PENDING, SHIPPED, PICKED_UP, CANCELLED
  - Shipping address relation on orders (only for delivery orders)
  - Delivery method field (DELIVERY/PICKUP)
- **Documentation**:
  - Documented Stripe Link test mode address mismatch issue
  - Setup guide for shipping rates creation
  - Guest checkout decision: email-only, no order history access
- **API Routes**:
  - `/api/user/profile` - Update user profile (name, email)
  - `/api/user/password` - Change password
  - `/api/user/addresses` - Address CRUD operations
  - `/api/user/orders` - Fetch orders with status filtering
  - `/api/user/orders/[orderId]/cancel` - Cancel order with refund
  - `/api/user/account` - Delete user account
- Dependencies: Added shadcn/ui components (alert-dialog, input, tabs, textarea, select)
- UI/UX: Fully responsive design with mobile-first approach, optimized table layouts

## 0.9.0 - 2025-11-14

- **Auth.js Integration Complete (Phase 3)**: Full authentication and order tracking implementation
  - User authentication with Google and GitHub OAuth providers
  - Sign-in page with OAuth buttons and guest checkout option
  - User menu in header with account settings and sign out
  - Order tracking: webhook automatically saves orders to database
  - Orders linked to authenticated users (guest orders saved with email only)
  - Order history page showing all user orders with status and details
  - Protected routes (orders page requires authentication)
  - Database schema with Stripe integration fields (sessionId, paymentIntentId, customerId, customerEmail)
- Dependencies: Added `date-fns` for date formatting
- **Next Steps (Phase 4)**: Email notifications, inventory management, subscription management portal

## 0.8.0 - 2025-11-14

- **Auth.js Integration (Phase 3 - Partial)**: Started authentication implementation
  - Installed `next-auth@beta` and `@auth/prisma-adapter`
  - Updated Prisma schema with Stripe fields for Order model
  - Configured Auth.js with Google and GitHub OAuth providers
  - Created sign-in page with OAuth buttons
  - Database migration for order tracking preparation

## 0.7.0 - 2025-11-14

- **Stripe Checkout (Phase 2)**: Integrated Stripe payment processing for one-time purchases and subscriptions
  - Checkout API endpoint creates Stripe Checkout Sessions with cart items
  - Support for both one-time purchases and subscription products
  - Product images and metadata passed to Stripe
  - Success page with order confirmation and cart clearing
  - Cancel page with cart preservation
  - Webhook handler for payment events and subscription lifecycle
  - Secure signature verification for webhooks
  - Loading states and error handling in checkout flow
- Documentation: Complete Stripe setup guide with test card numbers and webhook configuration
- Environment: Added `.env.example` with required Stripe keys
- Dependencies: Installed `stripe` and `@stripe/stripe-js` packages

## 0.6.0 - 2025-11-14

- **Shopping Cart (Phase 1)**: Implemented full shopping cart functionality with Zustand state management and localStorage persistence
  - Created cart store with add/remove/update/clear operations and computed totals
  - Special handling for subscriptions (replace instead of increment quantity)
  - Cart drawer UI with product images, variant details, quantity controls, and subtotal
  - Hydration-safe cart badge in header
  - Client-side persistence (survives page refresh, lost on localStorage clear)
- Architecture: Refactored cart logic into dedicated `ShoppingCart` component (separation of concerns from `SiteHeader`)
- Integration: Wired `ProductCard`, `ProductClientPage`, and `FeaturedProducts` to use cart store
- Checkout button placeholder (disabled, ready for Phase 2 Stripe integration)

## 0.5.3 - 2025-11-14

- Security: patched moderate vulnerability by upgrading transitive `js-yaml` (npm audit fix). No breaking changes.
- Mobile menu: revamped using shadcn Sheet (left-aligned title, icon-only Home shortcut, improved hierarchy & spacing, accessible focus and description).
- Breadcrumbs: truthful category context (load all product categories; use `from` only when linked; robust searchParams handling).
- Product cards: full-card focus ring, keyboard navigation improvements, prevent accidental navigation on Add to Cart, refined hover scaling.
- Lint/IDE: typed `params` & `searchParams` as Promises to remove false `await` warnings in server components.
- Theming: hero CTA button now uses theme tokens (removed hardcoded `bg-white text-primary`).
- Housekeeping: ignore npm audit report artifacts; minor accessibility enhancements (screen-reader menu description).

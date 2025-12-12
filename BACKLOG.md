# Product Backlog

## High Priority

### Refactor Client Components to Server Actions Pattern

**Status**: Backlog  
**Priority**: High  
**Description**: Modernize client components that use `useEffect` for data fetching to follow Next.js App Router best practices with Server Components and Server Actions. This improves performance (SSR), reduces client-side JavaScript, eliminates useEffect exhaustive-deps warnings, and follows current React/Next.js patterns.

**Current State**:

- Multiple client components fetch data via `useEffect` + `fetch()` (e.g., ProductAddOnsClient, ProductVariantsClient, CategoryManagementClient)
- Data fetching happens client-side on mount, causing loading states and unnecessary network requests
- useCallback hooks used unnecessarily for functions that don't need memoization
- ESLint exhaustive-deps warnings require ignoring or adding unnecessary dependencies

**Proposed Pattern**:

1. **Server Component wrapper**: Fetch initial data server-side, pass as props to client component
2. **Server Actions for mutations**: Use `"use server"` actions for create/update/delete operations
3. **Client Component focus**: Handle only interactive UI state (form inputs, dialogs, toasts)
4. **Remove useEffect data fetching**: No more useEffect hooks for initial data loading

**Example Transformation**:

```tsx
// Before (Client Component with useEffect)
"use client";
function ProductAddOnsClient({ productId }) {
  const [addOns, setAddOns] = useState([]);
  useEffect(() => {
    fetch(`/api/admin/products/${productId}/addons`)
      .then((res) => res.json())
      .then((data) => setAddOns(data.addOns));
  }, [productId]);
  // ...
}

// After (Server Component + Client Component)
// Server Component (page.tsx)
async function ProductAddOnsWrapper({ productId }) {
  const addOns = await getProductAddOns(productId);
  const products = await getAvailableProducts();
  return <ProductAddOnsClient addOns={addOns} products={products} />;
}

// Client Component (handles UI only)
("use client");
function ProductAddOnsClient({ addOns, products }) {
  // Server Actions for mutations
  async function handleAdd(formData) {
    "use server";
    // ...
  }
  // ...
}
```

**Components to Refactor**:

- [ ] `ProductAddOnsClient` - useEffect for add-ons, products, variants
- [ ] `ProductVariantsClient` - useEffect for variants list
- [ ] `CategoryManagementClient` - useEffect for categories, labels
- [ ] `ProductFormClient` - useEffect for product data, categories
- [ ] `ProductManagementClient` - useEffect for products list
- [ ] `OrdersManagementClient` - useEffect for orders
- [ ] `UsersManagementClient` - useEffect for users
- [ ] `NewsletterManagementClient` - useEffect for subscribers
- [ ] `SettingsManagementClient` - useEffect for settings
- [ ] `SocialLinksManagementClient` - useEffect for social links
- [ ] `PagesManagementClient` - useEffect for pages list

**Benefits**:

- ✅ Faster initial page load (server-rendered data)
- ✅ Better SEO (data available in HTML)
- ✅ Reduced client-side JavaScript bundle
- ✅ No more exhaustive-deps eslint warnings
- ✅ Follows current Next.js 13+ best practices
- ✅ Cleaner separation of concerns (data vs UI)

**Migration Strategy**:

1. Start with simpler components (ProductAddOns, ProductVariants)
2. Create server-side data fetching utilities (can reuse existing API logic)
3. Convert API routes to server actions where appropriate
4. Test each component individually before moving to next
5. Update tests to reflect new patterns

**Acceptance Criteria**:

- No client components use `useEffect` for initial data fetching
- All data fetching happens server-side or via server actions
- No exhaustive-deps eslint warnings
- Page load performance improves (measurable via Lighthouse)
- All existing functionality preserved

**References**:

- [Next.js Server Actions docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React useEffect cleanup patterns](https://react.dev/learn/synchronizing-with-effects)

---

### Testing – AI Assist About (must-do)

- [ ] API happy paths: `/api/admin/pages/[id]/replace-blocks`, `/api/admin/pages/[id]/ai-state` (200/401/409-ish) via Jest + supertest or Next route harness.
- [ ] AI Assist hook: `useAiAssist` caching/fingerprint, skip-on-same-state, cache reuse, `resetDraft`; mock fetch/localStorage to avoid network/state leaks.
- [ ] UI smoke: `AiAssistClient`/`AiAssistContent` renders, disables buttons while regenerating, shows spinner overlay, auto-close on success.
- [ ] E2E smoke: Admin logs in, opens About page editor, triggers regenerate, sees toast, blocks update, dialog closes.
- [ ] Toast regressions: auto-dismiss after ~5s and manual close stays accessible.

---

### Admin-Specific Sign-In Page

**Status**: Backlog  
**Priority**: High  
**Description**: Provide a dedicated admin sign-in flow that always returns admins to `/admin` instead of the public homepage. Avoids confusion when public users sign in and land on the main site instead of the admin dashboard.

**Tasks**:

- [ ] Create an admin-only sign-in page/route with its own UI copy.
- [ ] Ensure successful auth redirects to `/admin` (respecting callback if provided, defaulting to admin dashboard).
- [ ] Update auth middleware/config so admin routes send unauthenticated users to the admin sign-in (not the public sign-in).
- [ ] Keep public sign-in behavior unchanged for storefront users.

**Acceptance Criteria**:

- Admin login always lands on `/admin` after successful sign-in (or provided callback).
- Public users continue to sign in via the existing public flow.
- No redirect loops between admin layout and auth pages.

### Admin Dashboard Reorganization

**Status**: Backlog  
**Priority**: High  
**Description**: The admin dashboard has too many tabs (8+) making navigation cluttered. Need to reorganize into a proper navigation structure with dedicated routes for major features.

**Current State**:

- Single dashboard with 8 tabs: Overview, Users, Orders, Products, Categories, Newsletter, Settings, Profile
- All features crammed into tabs within one route (/admin)
- Adding new features (like Pages CMS) makes the tabs overflow
- Poor UX for features requiring rich interactions (TipTap editor, complex forms)

**Proposed Changes**:

- Convert to sidebar navigation with dedicated routes:
  - /admin (Dashboard overview with stats cards)
  - /admin/orders (Full order management)
  - /admin/products (Product catalog)
  - /admin/categories (Category management)
  - /admin/pages (Pages CMS)
  - /admin/newsletter (Newsletter management)
  - /admin/settings (Site settings)
  - /admin/users (User management)
- Keep Profile as dropdown in header
- Use consistent layout with sidebar across all admin routes

**Tasks**:

- [ ] Design new admin layout with sidebar navigation
- [ ] Create AdminSidebarNav component
- [ ] Migrate each tab to dedicated route
- [ ] Update AdminLayout to include sidebar
- [ ] Add breadcrumbs for deep navigation
- [ ] Test all admin routes and transitions

**Impact**: Pages CMS feature is currently complete but not integrated into admin nav due to this limitation.

---

### Advanced Discount & Promotion Controls

**Status**: Backlog  
**Priority**: High  
**Description**: Build a flexible discount system so marketing can run site-wide promotions, SKU-specific sales, and subscriber incentives without code changes.

**Current State**:

- Only ad-hoc coupon codes exist inside Stripe; not exposed in admin
- No way to schedule discounts or target specific products/collections
- Cart/checkout logic lacks awareness of stacked promotions

**Proposed Changes**:

- Add Discount model capturing type, scope, schedule, and targeting
- Surface discount creation + monitoring inside admin dashboard
- Extend cart + checkout flows to evaluate active discounts before payment
- Sync applied promotions to Stripe line items for accurate receipts

**Tasks**:

- [ ] Design Prisma model + migration for discounts (type, percentage/amount, schedule window, target SKUs/categories, usage caps)
- [ ] Create admin UI (list + create/edit modal) with validation and preview of impacted products
- [ ] Update product listing + PDP to show strike-through pricing and promotional messaging when applicable
- [ ] Enhance cart totals service to stack compatible discounts, enforce exclusivity rules, and expose savings breakdown
- [ ] Update checkout/session creation to attach promotion metadata for Stripe + order records
- [ ] Add audit logging + reporting to track redemptions, revenue impact, and abuse

**Acceptance Criteria**:

- Admins can create, schedule, and retire discounts without engineering help
- Customers see accurate promotional pricing across PDP/cart/checkout
- Orders record which discount(s) applied for analytics
- Conflicting promotions are prevented or resolved deterministically

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

### Persist AI Wizard Answers

**Status**: Backlog  
**Priority**: Medium  
**Description**: Save AI About wizard answers to the database so merchants can resume, reuse cached generations, and audit what was sent to the model.

**Tasks**:

- [ ] Add Prisma model for stored wizard answers linked to page/user (timestamps, latest flag)
- [ ] Persist answers on regenerate and when dialog closes
- [ ] Preload saved answers in AI Assist dialog; show "last saved" state
- [ ] Add admin view to inspect/download prior answer sets
- [ ] Migration + seed: none needed beyond model creation

**Acceptance Criteria**:

- Answers auto-save and reload across sessions
- Regeneration cache can key off persisted answers
- Admins can view historical answer sets for compliance/debugging

### Legacy Content Block for Static Demo Pages

**Status**: Backlog  
**Priority**: Medium  
**Description**: Create a virtual "legacy content" block type that automatically wraps static HTML content from the `Page.content` field, making it visible and editable in the PageEditor alongside real blocks.

**Context**:

We have two types of pages during development:

- **Demo pages** (developer use): Static HTML in `content` field for quick demos
- **CMS pages** (shop owner use): Flexible block system for production

Currently, pages with `content` but no blocks show "Content coming soon" because the block renderer expects blocks. This implementation bridges the gap by treating legacy content as a virtual block.

**Proposed Solution**:

Automatically generate a virtual "legacyContent" block when:

- `blocks.length === 0` AND
- `page.content` exists and is not empty

This virtual block:

- ✅ Shows up in PageEditor like any other block
- ✅ Renders the static HTML content
- ✅ Can be edited via dialog (update `page.content` field)
- ✅ Can be deleted (prompts migration to real blocks)
- ✅ Uses existing block rendering infrastructure

**Implementation Steps**:

1. **Add legacyContent block type to schema**

   ```typescript
   // lib/blocks/schemas.ts
   type: z.enum([
     "hero",
     "stat",
     "pullQuote",
     "richText",
     "location",
     "hours",
     "faqItem",
     "imageGallery",
     "imageCarousel",
     "locationCarousel",
     "legacyContent", // ← Add this
   ]);
   ```

2. **Create virtual block in getPageBlocks**

   ```typescript
   // lib/blocks/actions.ts - getPageBlocks()
   export async function getPageBlocks(pageId: string) {
     const blocks = await prisma.block.findMany({...});

     // If no blocks, check for legacy content
     if (blocks.length === 0) {
       const page = await prisma.page.findUnique({
         where: { id: pageId },
         select: { content: true },
       });

       if (page?.content?.trim()) {
         return [{
           id: `legacy-${pageId}`,
           pageId,
           type: 'legacyContent',
           order: 0,
           content: { html: page.content },
           isDeleted: false,
           createdAt: new Date(),
           updatedAt: new Date(),
         }];
       }
     }

     return blocks;
   }
   ```

3. **Create LegacyContentBlock component**

   ```typescript
   // components/blocks/LegacyContentBlock.tsx
   export function LegacyContentBlock({ block }: BlockProps) {
     return (
       <div className="container mx-auto px-4 py-8 max-w-4xl">
         <div
           className="prose prose-lg dark:prose-invert max-w-none"
           dangerouslySetInnerHTML={{ __html: block.content.html }}
         />
       </div>
     );
   }
   ```

4. **Add to BlockRenderer**

   ```typescript
   // components/blocks/BlockRenderer.tsx
   switch (block.type) {
     // ... existing cases
     case 'legacyContent':
       return <LegacyContentBlock {...blockProps} block={block} />;
   ```

5. **Create LegacyContentDialog for editing**

   ```typescript
   // components/block-dialogs/LegacyContentDialog.tsx
   // - Textarea for HTML editing
   // - Warning badge: "Legacy Content - Consider migrating to blocks"
   // - "Delete & Migrate" button (removes content, allows adding real blocks)
   // - Updates page.content field via API
   ```

6. **Handle legacy block updates**

   ```typescript
   // app/api/blocks/route.ts
   if (block.type === "legacyContent") {
     // Update page.content instead of block table
     await prisma.page.update({
       where: { id: block.pageId },
       data: { content: block.content.html },
     });
     return NextResponse.json({ success: true });
   }
   ```

7. **Handle legacy block deletion**
   ```typescript
   // Delete legacy block = clear page.content
   if (block.type === "legacyContent") {
     await prisma.page.update({
       where: { id: pageId },
       data: { content: null },
     });
   }
   ```

**Benefits**:

- No separate rendering logic - uses existing block system
- Legacy content visible in editor (not hidden)
- Easy migration path: delete legacy block → add real blocks
- Consistent UX: everything is a block
- Shop owners can understand and manage legacy content
- No changes to public-facing page rendering

**Edge Cases**:

- **Virtual block ID**: Use `legacy-${pageId}` to avoid DB conflicts
- **Block ordering**: Legacy block always order 0, real blocks start at 1
- **Mixed content**: Once ANY real block is added, legacy block disappears
- **Edit dialog**: Include "Migrate to Blocks" wizard that converts HTML to richText block

**Migration Wizard (Future Enhancement)**:

When user clicks "Migrate to Blocks":

1. Parse HTML into semantic sections (headings, paragraphs, images)
2. Auto-create appropriate blocks (hero, richText, imageGallery)
3. Delete legacy block (clear `page.content`)
4. Show success message with created blocks

**Files to Modify**:

1. `lib/blocks/schemas.ts` - Add 'legacyContent' to block type enum
2. `lib/blocks/actions.ts` - Generate virtual block in getPageBlocks
3. `components/blocks/LegacyContentBlock.tsx` - New component
4. `components/blocks/BlockRenderer.tsx` - Add case for legacyContent
5. `components/block-dialogs/LegacyContentDialog.tsx` - New dialog
6. `app/api/blocks/route.ts` - Handle legacy block CRUD operations
7. `components/app-components/PageEditor.tsx` - Handle legacy block type in UI

**Acceptance Criteria**:

- ✅ Pages with `content` but no blocks show legacy content block in editor
- ✅ Legacy block renders HTML correctly in public view
- ✅ Can edit HTML via dialog and save to `page.content`
- ✅ Can delete legacy block (clears `page.content`)
- ✅ Adding real blocks alongside legacy block works
- ✅ Once real blocks exist, legacy block no longer appears
- ✅ Warning badge indicates this is temporary/legacy content
- ✅ Dark mode prose styling works correctly
- ✅ No impact on pages that already use blocks

**Testing Checklist**:

- [ ] Demo page (About) shows legacy block in editor
- [ ] Can edit legacy block HTML and save changes
- [ ] Can delete legacy block, content cleared from DB
- [ ] Adding real block makes legacy block disappear
- [ ] Empty page (no content, no blocks) shows "Add Block" button
- [ ] Page with real blocks doesn't show legacy block
- [ ] Public view renders legacy content correctly
- [ ] Dark mode works with prose styling

**Estimated Effort**: 3-4 hours

**Future Removal**: Before production, audit all pages and migrate legacy content to blocks, then remove legacyContent block type entirely.

---

### Carousel Infinite Scroll with Manual Dot Controls

**Status**: Backlog  
**Priority**: Medium  
**Description**: Fix the location carousel infinite scroll to work seamlessly with manual dot navigation controls without visible jumping or stopping at edges.

**Current State**:

- Carousel uses 5 copies of slides for infinite scroll buffer
- Auto-scroll works but stops after user interaction
- Manual dot clicking works but scroll position jumps are visible
- Repositioning logic causes visible shifts during manual swipes
- Elongated dots (w-8 active, w-2 inactive) without size animation

**Issues to Resolve**:

1. **Scroll stopping issue**: Carousel stops scrolling after 5th set instead of continuing infinitely
2. **Visible jumping**: When manually swiping near edges, repositioning causes noticeable jumps
3. **Dot sync issues**: Active dot indicator doesn't always match visible slide during transitions
4. **Edge detection**: Current 50px threshold may be too aggressive or not precise enough

**Proposed Solutions to Explore**:

- Investigate using Framer Motion or Motion library for smoother scroll animations
- Implement smoother repositioning with preserved sub-pixel accuracy
- Adjust buffer zone thresholds (currently first copy < 0.5, last copy > 4.5)
- Consider alternative infinite scroll approaches:
  - CSS scroll-snap with dynamic DOM manipulation
  - Virtual scrolling with position tracking
  - Transform-based animation instead of native scroll

**Technical Context**:

- Component: `components/blocks/CarouselBlock.tsx`
- Current implementation: 5x slide duplication with scroll repositioning
- Auto-scroll: Disabled after first user interaction
- Dot controls: Elongated active dot without transition animation
- Repositioning trigger: `scrollDelta < 1` for settled scroll detection

**Acceptance Criteria**:

- Carousel scrolls infinitely in both directions without stopping
- No visible jumps or shifts during manual swipes
- Dot indicators accurately reflect current visible slide
- Smooth transitions when clicking dots
- Auto-scroll disabled after user interaction (current behavior OK)
- Works across all breakpoints (mobile, tablet, desktop)

**Tasks**:

- [ ] Research Motion library capabilities for carousel implementation
- [ ] Prototype alternative infinite scroll approaches
- [ ] Test repositioning logic with various scroll speeds
- [ ] Optimize buffer zone thresholds and detection timing
- [ ] Implement sub-pixel position preservation during repositioning
- [ ] Test edge cases: rapid swipes, dot clicking during auto-scroll, hover interactions
- [ ] Verify behavior on touch devices vs mouse/trackpad
- [ ] Add performance monitoring to detect scroll jank

**References**:

- Hero background mask: 65% opacity (35% brightness)
- Left padding: sm:pl-8 (32px), lg:pl-16 (64px)
- Slide width calculation: `calc((100% - 2rem) / 2.5)` (~2.5 cards visible)
- Extended slides: `[...slides, ...slides, ...slides, ...slides, ...slides]` (5 copies)

**Notes**:

- Feature was working well at one point but regressed during repositioning refinements
- May need to revert to simpler approach or completely rethink infinite scroll strategy
- Consider if infinite scroll is truly needed or if standard carousel with edge limits is acceptable

---

### AI Image Generation for About Page Wizard

**Status**: Backlog  
**Priority**: Medium  
**Description**: Integrate AI image generation into the About Page wizard to automatically create hero images based on the user's story and brand personality.

**Current State**:

- Wizard includes optional hero image URL field (step 3)
- Users must manually upload/provide image URLs
- No visual content generation capability

**Proposed Changes**:

- Add AI image generation option in wizard after story questions
- Use DALL-E, Midjourney API, or similar service
- Generate hero image based on:
  - Founding story context
  - Brand personality (passionate/professional/friendly)
  - Coffee roastery aesthetic
- Provide 2-3 image variations for user selection
- Allow users to regenerate or skip and upload manually

**Tasks**:

- [ ] Research and select AI image generation provider
  - Evaluate: DALL-E 3, Stable Diffusion, Midjourney API
  - Consider: cost per image, quality, commercial usage rights
- [ ] Design prompt engineering strategy
  - Extract key visual elements from wizard answers
  - Incorporate brand personality into image style
  - Include coffee roastery context (equipment, origin, workspace)
- [ ] Add new wizard step: "Generate Hero Image (Optional)"
  - Button: "Generate AI Image" vs "Upload Your Own"
  - Show loading state during generation (15-30 seconds)
  - Display 2-3 variations with radio selection
  - Include "Regenerate" and "Skip" options
- [ ] Create API endpoint: `POST /api/admin/pages/generate-image`
  - Accept wizard answers as context
  - Build descriptive prompt from story + personality
  - Call AI service with prompt
  - Return image URLs or base64 data
- [ ] Handle image storage
  - Upload generated images to cloud storage (Cloudinary/S3)
  - Or store as base64 in database (temporary solution)
  - Provide permanent URLs for page hero image field
- [ ] Update wizard flow
  - Insert image generation step after hero image URL field
  - Populate heroImageUrl automatically if AI image selected
  - Allow continuing without image (optional nature preserved)
- [ ] Add cost controls and rate limiting
  - Limit generations per user/session
  - Cache generated images for retry scenarios
  - Track generation costs in admin analytics

**Prompt Engineering Considerations**:

- Combine founding story, sourcing details, roasting philosophy
- Map brand personality to art styles:
  - Passionate & Artisanal → warm, textured, rustic
  - Professional & Expert → clean, modern, technical
  - Friendly & Approachable → bright, inviting, casual
  - Educational & Informative → detailed, documentary-style
- Include coffee-specific keywords: roaster, beans, origin, café

**Example Prompts**:

- _"Professional photograph of a specialty coffee roastery workspace, warm lighting, vintage roasting equipment, bags of green coffee beans, rustic wooden surfaces, artisanal aesthetic"_
- _"Modern coffee roasting facility, clean industrial design, precision equipment, coffee samples on cupping table, professional atmosphere, natural light"_

**Acceptance Criteria**:

- Users can generate AI hero images from wizard
- Generated images reflect story context and brand personality
- 2-3 variations provided for selection
- Images stored permanently and accessible via URL
- Feature is optional - users can skip or upload manually
- Generation costs tracked and controlled

**Future Enhancements**:

- Allow custom prompt editing before generation
- Provide style presets (vintage, modern, minimal)
- Generate multiple images for use throughout page content
- Integrate with existing image library/gallery

---

### Lifecycle Marketing Automation

**Status**: Backlog  
**Priority**: Medium  
**Description**: Introduce automated marketing campaigns (welcome, abandoned cart, win-back) powered by in-app triggers and our existing email infrastructure.

**Current State**:

- Only transactional emails are sent (order confirmations, shipping, etc.)
- No subscriber segmentation or drip cadence management
- Abandoned carts + inactive customers receive no automated outreach

**Proposed Changes**:

- Create MarketingCampaign + CampaignStep models to define triggers, delays, templates, and experiments
- Integrate with Resend to queue personalized sends tied to customer lifecycle events
- Add analytics in admin dashboard to show campaign performance (opens, clicks, conversions)

**Tasks**:

- [ ] Define Prisma models for campaigns, steps, audiences, and delivery logs
- [ ] Add admin UI for building a campaign (trigger selection, template picker, delay offsets, enable/disable)
- [ ] Instrument key events (signup, first order, abandoned cart, churn risk) and push into a marketing job queue
- [ ] Build worker/cron process to evaluate audiences daily and enqueue Resend deliveries with merge variables
- [ ] Update email templates folder with new marketing layouts + CTA styles consistent with brand
- [ ] Expose campaign metrics (deliveries, opens, CTR, revenue lift) in admin analytics tab

**Acceptance Criteria**:

- Welcome, abandoned cart, and win-back campaigns can be configured and toggled independently
- Emails respect user subscription preferences and CAN-SPAM requirements
- Campaign reporting shows basic funnel metrics within 15 minutes of send
- System is extensible for future SMS/push channels

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

### Replace Hardcoded Frontend Values with Admin Settings

**Status**: Backlog  
**Priority**: Medium  
**Description**: Centralize all customer-facing copy (store name, taglines, contact info, footer CTAs) into the Site Settings model so non-technical staff can update branding without deployments.

**Current State**:

- Multiple components (Navbar, Footer, Hero banners, SEO metadata, emails) embed "Artisan Roast" strings and marketing blurbs
- SiteSettings table only stores a handful of keys (support email, newsletter text)
- Updating branding requires code edits + redeploys

**Proposed Changes**:

- Expand SiteSettings schema to include store name, hero headline/subtitle, support phone, social URLs, CTA labels, etc.
- Provide admin UI (Settings → Branding) with preview cards and validation
- Refactor frontend + email templates to read from settings hook/API and fallback gracefully

**Tasks**:

- [ ] Audit repository for hardcoded brand strings and categorize by usage (navigation, hero, footer, SEO, emails)
- [ ] Update Prisma `SiteSettings` model + seed data with new keys + defaults
- [ ] Extend `/api/admin/settings` endpoint + Settings client to manage branding values with live preview
- [ ] Create frontend helper (e.g., `useSiteSettings`) with caching to avoid repeated fetches
- [ ] Replace hardcoded literals across components (`app/layout.tsx`, `components/app-components/SiteFooter.tsx`, email templates, metadata builders)
- [ ] Add regression tests (unit + Cypress smoke) ensuring settings propagate to critical pages

**Acceptance Criteria**:

- Admins can update branding copy from dashboard and see immediate changes after refresh
- All hardcoded brand values removed or have default fallback from settings service
- Emails inherit settings so transactional + marketing messages stay on-brand
- Site renders even if some settings missing, using seeded defaults

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

### Evaluate FileUpload Component Usage & Deprecation

**Status**: Backlog  
**Priority**: Low  
**Description**: The `FileUpload` component (`components/app-components/FileUpload.tsx`) was created for icon uploads in admin settings. With the new standardized `ImageField` component for block dialogs, evaluate whether FileUpload should be deprecated or kept for icon-specific use cases.

**Current Usage**:

- `app/admin/settings/SettingsManagementClient.tsx` - favicon and logo uploads
- `app/admin/settings/SocialLinksSettings.tsx` - social platform icon uploads

**Key Differences**:

| Feature       | FileUpload                   | ImageField                   |
| ------------- | ---------------------------- | ---------------------------- |
| API Endpoint  | `/api/admin/upload-icon`     | `/api/upload`                |
| Upload Timing | Immediate                    | Deferred (on save)           |
| Preview       | Inline small                 | Full preview area            |
| Use Case      | Small icons (favicon, logos) | Hero images, gallery images  |
| Max Size      | 2MB                          | 5MB (configurable)           |
| Pattern       | "Choose File" button         | Hidden input + Upload button |

**Recommendation**: Keep both components:

- **FileUpload**: For icon uploads (settings, social links) - immediate upload, small files
- **ImageField**: For content images (blocks, pages) - deferred upload, larger files, integrated preview

**Tasks**:

- [ ] Document intended use cases for each component
- [ ] Add JSDoc comments clarifying when to use each
- [ ] Consider renaming `FileUpload` to `IconUpload` for clarity
- [ ] Verify both components follow accessibility best practices

**Notes**:

- FileUpload uses InputGroup pattern which may be preferred for settings forms
- ImageField uses FormHeading for consistent validation UI in block dialogs
- No immediate need to deprecate - serve different purposes

---

### About Page Not Restored After Seed

**Status**: To Fix  
**Priority**: Low  
**Description**: The About page is not properly restored after running the database seed command, requiring investigation before merging CMS features into main.

**Current Behavior**:

- Running seed command does not recreate About page
- Other pages (Cafe, etc.) may be affected as well
- Issue discovered during CMS block feature development

**Impact**:

- Developers need functional About page after seeding
- QA/testing workflows interrupted
- Demo environments may be incomplete

**Investigation Needed**:

- [ ] Check if About page blocks are included in seed.ts
- [ ] Verify page creation logic in seed file
- [ ] Test seed command and verify all pages exist after
- [ ] Check if issue affects other CMS pages
- [ ] Ensure page metadata (title, slug, published status) properly set

**Tasks**:

- [ ] Debug seed.ts to identify why About page not created
- [ ] Fix seed logic to properly create About page with blocks
- [ ] Test full seed → verify About page exists and is accessible
- [ ] Document any special seeding requirements for CMS pages

**Notes**:

- This should be resolved before merging fix/cms-blocks branch into main
- May be related to recent CMS block system changes
- Low priority as it only affects development/demo environments

---

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

_Last Updated: November 25, 2025_

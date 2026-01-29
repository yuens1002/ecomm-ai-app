# Product Backlog

## High Priority

### Admin Breadcrumb Navigation (Bug Fix)

**Status**: TODO
**Priority**: High
**Description**: Admin breadcrumb navigation is buggy and doesn't correctly reflect the current page context when navigating within admin sections, views, and menus.

**Current Issues:**
- Breadcrumb doesn't update correctly when navigating between admin views
- Nested navigation (e.g., Menu Builder → Labels → Edit) shows incorrect paths
- Context is lost when switching between different admin sections
- Dynamic entity names (product names, category names) not always displayed

**Root Cause:**
The current `useBreadcrumb` hook relies on individual pages setting their breadcrumbs, but this approach doesn't handle:
- Route-based automatic breadcrumb generation
- Parent-child relationships in nested admin routes
- Query parameter-based views (e.g., `?view=labels`)

**Proposed Solution:**
1. Create a breadcrumb configuration that maps routes to breadcrumb paths
2. Auto-generate breadcrumbs from URL structure with override capability
3. Support dynamic segments (e.g., `/admin/products/[id]` → "Products / Ethiopian Yirgacheffe")
4. Handle query-param based views in Menu Builder

**Affected Areas:**
- `/admin/product-menu/*` - Menu Builder views
- `/admin/products/*` - Product editing
- `/admin/orders/*` - Order details
- `/admin/settings/*` - Nested settings pages
- All admin pages with dynamic routes

**Tasks:**
- [ ] Audit current breadcrumb behavior across all admin routes
- [ ] Design route-to-breadcrumb mapping config
- [ ] Implement automatic breadcrumb generation from route
- [ ] Add support for dynamic entity names
- [ ] Handle query parameter views (Menu Builder tabs)
- [ ] Test all admin navigation flows

---

### Canonical Product URLs (SEO Fix)

**Status**: Complete ✅
**Priority**: High
**Completed**: January 27, 2026 (v0.73.0)
**Description**: Migrate from dynamic category-based URLs (`/{category}/{slug}`) to stable product-only URLs (`/products/{slug}`) for better SEO and build performance.

**Problem:**
- Products accessible at multiple URLs (one per category they belong to)
- No canonical URL - search engines see duplicate content
- Build generates 3× more static pages than needed (125 paths for 42 products)
- URL changes when admin recategorizes products (bad for SEO/bookmarks)

**Solution:**
- Single canonical URL per product: `/products/{slug}`
- 301 redirects from old `/{category}/{slug}` URLs
- Reduces static paths from O(products × categories) to O(products)

**Impact Analysis:**
| Products | Old (all paths) | New (product-only) |
|----------|-----------------|-------------------|
| 42 (current) | 125 paths | 42 paths |
| 100 | ~300 paths | 100 paths |
| 500 | ~1,500 paths | 500 paths |

**Tasks:**
- [x] Create `/products/[slug]` route with ProductClientPage and actions
- [x] Update `generateStaticParams` to only generate `/products/*` paths
- [x] Update ProductCard to use `/products/{slug}` URLs
- [x] Fix analytics page trending product links
- [x] Update ShoppingCart, AiHelperModal product links
- [x] Remove old `[category]/[productSlug]` route
- [x] All 595 tests passing

---

### Customizable Product Menu (Coffee Dropdown)

**Status**: Complete ✅
**Priority**: High
**Completed**: January 2026
**Description**: Allow admins to customize the product menu icon and text in header/footer navigation. Currently hardcoded to show coffee beans icon (`/beans.svg`) with "Coffee" text. Should support dynamic configuration for stores that sell multiple product types or want different branding.

**Current Hardcoded Implementation** (SiteHeader.tsx lines 197-211):

```tsx
<Image
  src="/beans.svg"
  alt="Coffee selections"
  width={20}
  height={20}
  className="w-5 h-5 dark:invert"
/>
<span className="text-[10px] uppercase tracking-wide font-medium leading-3">
  Coffee
</span>
```

**Proposed Solution**:

Add two new settings to `SiteSettings` table:

- `product_menu_icon` - Lucide icon name (e.g., "Coffee", "ShoppingBag", "Package")
- `product_menu_text` - Display text (e.g., "Coffee", "Shop", "Products")

**Use Cases**:

- Multi-category stores (coffee + merch + accessories) want "Shop" or "Products"
- Specialty stores want brand-specific terminology ("Beans", "Roasts", "Blends")
- International stores want localized text
- Stores want to match icon to primary product type

**Technical Implementation**:

1. **Schema Changes** (prisma/schema.prisma):
   - No schema change needed - use existing `SiteSettings` model

2. **Seed Data** (prisma/seed/settings.ts):

   ```ts
   { key: "product_menu_icon", value: "Coffee" },
   { key: "product_menu_text", value: "Coffee" },
   ```

3. **Settings UI** (app/admin/settings/page.tsx):
   - Add "Product Menu" section after branding settings
   - Icon picker using same `DynamicIcon` + Lucide pattern as page icons
   - Text input with max length ~15 characters (fits nav button)
   - Live preview showing icon + text

4. **Header Wrapper** (components/app-components/SiteHeaderWrapper.tsx):

   ```ts
   const [labels, session, headerPages, productMenuSettings] = await Promise.all([
     getCategoryLabelsWithCategories(),
     auth(),
     getPagesForHeader(),
     getProductMenuSettings(), // NEW
   ]);
   ```

5. **Header Component** (components/app-components/SiteHeader.tsx):
   - Add optional `productMenuIcon?: string` and `productMenuText?: string` to props
   - Replace hardcoded `/beans.svg` with `<DynamicIcon name={productMenuIcon || "Coffee"} />`
   - Replace hardcoded "Coffee" with `{productMenuText || "Coffee"}`
   - Fallback to defaults if settings not configured

6. **Mobile Menu** (SiteHeader.tsx ~line 300-350):
   - Apply same icon/text customization to mobile sheet menu

**Testing Checklist**:

- [ ] Settings save and persist correctly
- [ ] Icon picker shows all Lucide icons
- [ ] Text input validates length
- [ ] Header displays custom icon in desktop nav
- [ ] Header displays custom text in desktop nav
- [ ] Mobile menu reflects changes
- [ ] Defaults work when settings not configured
- [ ] Dark mode icon rendering works correctly
- [ ] Icon + text + chevron alignment maintained

**Future Enhancements** (separate PRs):

- Multiple product menus (e.g., "Coffee" + "Merch" separate dropdowns)
- Per-menu category filtering
- Custom dropdown width/height settings
- Localization support for multi-language stores

---

### Unified Product Menu Admin Page

**Status**: Complete ✅ (v0.72.0 - Launched January 26, 2026)
**Priority**: High
**Completed**: January 26, 2026
**Description**: Complete admin tool for managing product menu hierarchy with labels and categories. All phases complete.

**Phase 1 Complete ✅** (January 3, 2026):

**Foundation & Integration:**

- ✅ Central state management (`useMenuBuilder` hook) - single source of truth
- ✅ URL state persistence - navigation survives refresh, bookmarkable URLs
- ✅ Action strategy pattern - declarative config eliminates if/else chains
- ✅ Action bar integration - all buttons connected to strategies
- ✅ Navigation system - breadcrumb with URL-based routing
- ✅ Comprehensive tests - hooks + strategies fully tested (527 lines)
- ✅ Complete documentation - implementation guide + hub document in `/docs`

**Key Architecture:**

- Single source of truth: `useMenuBuilder()` manages all state
- Persistent (URL): view, labelId, categoryId - survives refresh
- Transient (local): selections, expand/collapse - resets on refresh
- Strategy pattern: `ACTION_STRATEGIES[view][action]` - no conditionals
- Type-safe: TypeScript throughout, Zod validation, no `any` types

**Code Quality:**

- Reduced complexity: 67% fewer lines in action handlers
- Cyclomatic complexity: From 5-6 down to 1 per action
- Maintainability: Add new view = 5 minutes of config
- Test coverage: 100% for hooks and strategies

**Phase 2 Complete ✅** (Table Views - January 14-21, 2026):

- [x] Shared table components (CheckboxCell, ExpandToggle, VisibilityCell, InlineNameEditor)
- [x] AllLabelsTableView (flat list with selection + inline editing)
- [x] AllCategoriesTableView (flat list with selection + inline editing)
- [x] LabelTableView (categories within selected label)
- [x] CategoryTableView (products view with linking)
- [x] MenuTableView (2-level hierarchy: label → category, products as count)
- [x] Drag & drop support for reordering with undo/redo
- [x] Multi-select DnD with grouped entities ghost
- [x] Cross-boundary DnD (move categories between labels)
- [x] Context menus for all table views
- [x] Keyboard shortcuts (Delete, C, V, H, etc.)
- [x] Range selection with shift+click and long-press
- [x] 44x44px touch targets (WCAG compliance)
- [x] 521+ tests passing

**Follow-up (Jan 8, 2026): Pathway to a data-config-driven Menu Builder**

The goal is to make the Menu Builder predictable and shippable by driving UI behavior from a small, typed configuration layer, without attempting a “single mega config file” all at once.

**What’s already true today (foundation we can trust):**

- Action bar behavior is driven by `ACTION_BAR_CONFIG`.
- View surfaces are declared by `VIEW_CONFIGS` (e.g. `tableViewId`, feature flags, future context-menu action IDs).
- Table rendering is routed through `TableViewRenderer`.
- Admin/server actions share a product-menu data layer for labels/categories to reduce drift.

**Proposed pathway (incremental, not a rewrite):**

1. **Define the smallest “data config” we need**

- Decide what is config vs code. Keep config to stable declarations only (IDs, capabilities, tableViewId).
- Keep business logic in server actions/data layer; config references capabilities, it doesn’t re-implement them.

2. **Make view rendering 100% config-driven**

- Replace remaining view-based conditionals with a `tableViewId → component` registry in `TableViewRenderer`.
- Acceptance: adding a new table view requires only registering the component + setting `VIEW_CONFIGS[view].tableViewId`.

3. **Align table “surfaces” behind shared primitives**

- Continue building shared table cells (selection, visibility, inline name editor) so each new table is mostly data + columns.
- Acceptance: second table view ships with minimal duplicated cell logic.

4. **Drive secondary surfaces (context menus) from action IDs**

- Context menus should reference action IDs already defined in `ACTION_BAR_CONFIG` (avoid duplicate action definitions).
- Acceptance: a context-menu item triggers the same execute logic as the action bar.

5. **Lock the pathway with a small set of invariants tests**

- DTO invariants are already covered (join-table ordering).
- Add config invariant tests as needed (e.g. each view has a valid `tableViewId`, referenced action IDs exist).

6. **Decompose `ACTION_BAR_CONFIG` (reduce mixed config+logic)**

- Target split:
  - `ACTION_DEFINITIONS` (UI-only metadata)
  - per-view action availability (IDs only)
  - action behaviors (disabled/aria + execute logic keyed by actionId)
  - action effects (refresh targets + error messages)
- Acceptance: per-view arrays become readable lists of IDs; execute logic is centralized and testable.

**Non-goals (to avoid a repeat of the last attempt):**

- Don’t unify all configs into one giant object until boundaries prove stable.
- Don’t push business logic into config; keep it in server actions + data layer.

**Current State - Phase 1 Foundation Ready**:

- Category CRUD scattered across multiple locations
- Category labels managed in `/admin/categories` but UI is basic table
- No visual representation of how menu will appear to customers
- Manual category assignment to products (no bulk operations)
- Menu icon/text settings will live in Settings (temporary)
- No way to preview menu structure during configuration

**Proposed Solution - Visual Menu Builder** (similar to Pages CMS):

A **block-based, drag-and-drop interface** where admins build the menu structure visually:

**Single Canvas Layout**:

- Top: Menu settings bar (icon, text - inline editable)
- Center: **Visual menu structure builder** - WYSIWYG representation of the actual menu
- Right sidebar: Toolbox with draggable components + properties panel

**Building Blocks (Draggable Components)**:

```
┌─────────────────────────────────────────────┐
│ 🔧 Menu Settings                            │
│ [Coffee Icon ▼] [Text: "Coffee"]           │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─ BY ROAST LEVEL ───────────┐ [Drag]   │ ← Label block
│   │  [Icon] Light Roast    (8) │           │ ← Category block (shows count)
│   │  [Icon] Medium Roast  (12) │           │
│   │  [Icon] Dark Roast     (5) │           │
│   │  + Add Category            │           │
│   └────────────────────────────┘           │
│                                             │
│   ┌─ BY ORIGIN ──────────────┐ [Drag]     │
│   │  [Icon] Ethiopian     (6) │           │
│   │  [Icon] Colombian     (4) │           │
│   │  + Add Category            │           │
│   └────────────────────────────┘           │
│                                             │
│   + Add Label Group                         │
│                                             │
└─────────────────────────────────────────────┘
     Sidebar: [+ Label] [+ Category] [Preview]
```

**Interaction Patterns** (like Page block editor):

1. **Add Label**:
   - Click "+ Add Label Group" or drag from sidebar
   - Inline edit: Click label name to edit in place
   - Click icon to open icon picker popover
   - Drag handle to reorder labels

2. **Add Category**:
   - Click "+ Add Category" within label
   - Or drag "Category" component from sidebar
   - Opens dialog: Name, slug, icon, assign products
   - Category appears in structure immediately

3. **Reorder** (like Notion/block editors):
   - Drag handles (⋮⋮) on labels and categories
   - Drag category between labels (visual drop zones)
   - Drag labels up/down to reorder
   - Live feedback with drop indicators

4. **Edit in Place**:
   - Click label/category name: Inline text edit
   - Click icon: Popover icon picker
   - Click product count: Opens product assignment dialog
   - Hover shows quick actions (edit, delete, duplicate)

5. **Product Assignment**:
   - Click category → opens dialog
   - Search/filter products (similar to add-ons UI)
   - Bulk select with checkboxes
   - Set primary category toggle
   - Shows current assignments with remove option

6. **Menu Preview**:
   - Toggle button in top-right
   - Side-by-side view or overlay
   - Shows exactly how menu renders in header
   - Desktop + mobile preview tabs

**No Separate Panels** - Everything is contextual:

- Click element → Properties appear in right sidebar
- Dialog for complex operations (product assignment)
- Inline editing for simple changes (names, icons)
- Drag-drop for structure changes

**Technical Implementation**:

**1. Route Structure**:

```
/admin/menu-builder                    # Main menu builder (feature-gated)
/admin/labels/[id]                     # Edit label (optional, can be inline)
/admin/categories/[id]                 # Edit category details
```

**2. API Endpoints to Leverage** (mostly already exist):

```typescript
// Category Labels
GET    /api/admin/category-labels           # List all labels
POST   /api/admin/category-labels           # Create label
PATCH  /api/admin/category-labels/[id]      # Update label (name, icon, order)
DELETE /api/admin/category-labels/[id]      # Delete label
PATCH  /api/admin/category-labels/reorder   # Bulk reorder

// Categories
GET    /api/admin/categories                # List all categories
POST   /api/admin/categories                # Create category
PATCH  /api/admin/categories/[id]           # Update category
DELETE /api/admin/categories/[id]           # Archive category
PATCH  /api/admin/categories/reorder        # Reorder within label

// Products (existing)
GET    /api/admin/products                  # List for assignment
PATCH  /api/admin/products/[id]/categories  # Bulk update category links

// New: Product Menu Settings
GET    /api/admin/product-menu/settings     # Menu icon, text, config
PATCH  /api/admin/product-menu/settings     # Update menu settings
```

**3. Component Structure** (block-based architecture):

```tsx
app/admin/(product-menu)/
├── menu-builder/page.tsx              # Route group; URL stays /admin/menu-builder
├── labels/page.tsx                    # Labels list/editor at /admin/labels
├── categories/page.tsx                # Categories list/editor at /admin/categories
└── MenuContext.tsx                    # Shared SWR context

components/product-menu-builder/
├── MenuCanvas.tsx                     # Main visual builder area
├── MenuSettingsBar.tsx                # Top bar: icon + text inline edit
├── LabelBlock.tsx                     # Draggable label group component
│   ├── LabelHeader.tsx                # Name, icon, drag handle, actions
│   └── CategoryList.tsx               # Categories within label
├── CategoryBlock.tsx                  # Draggable category item
│   ├── CategoryItem.tsx               # Icon, name, count, actions
│   └── CategoryDropZone.tsx           # Visual drop indicator
├── ComponentToolbox.tsx               # Right sidebar: drag sources
├── PropertiesPanel.tsx                # Context-sensitive properties
├── ProductAssignmentDialog.tsx       # Bulk product assignment
└── MenuPreviewPanel.tsx               # Toggle preview (desktop/mobile)

lib/menu-builder/
├── useDragDrop.ts                     # @dnd-kit logic for labels/categories
├── useMenuState.ts                    # Optimistic state management
└── menuBuilderActions.ts              # Server actions for CRUD ops
```

**4. Key Features**:

- **Drag-and-drop**: `@dnd-kit/core` for reordering labels and categories
- **Bulk operations**: Multi-select products for category assignment
- **Search/filter**: Quick find products by name, type, status
- **Optimistic UI**: Instant feedback on reorder/assignment
- **Validation**: Prevent orphaned categories, ensure at least one primary category
- **Undo support**: Keep operation history for easy rollback

**5. Migration from Existing Pages**:

- `/admin/categories` page remains for simple category list view (legacy)
- Add prominent "Product Menu Builder" link in categories page
- Eventually deprecate old categories page in favor of unified builder

**Use Cases**:

- **Initial setup**: Shop owner builds entire menu structure from scratch
- **Seasonal updates**: Quickly reorder categories for holiday promotions
- **New product launch**: Create category, assign products, set menu position
- **Menu optimization**: Preview and adjust layout based on customer behavior
- **Bulk category changes**: Reassign multiple products at once

**Testing Checklist**:

- [ ] Label CRUD operations work correctly
- [ ] Drag-and-drop persists order to database
- [ ] Category reordering within/between labels works
- [ ] Product assignment updates category relationships
- [ ] Primary category enforcement works
- [ ] Live preview accurately reflects menu structure
- [ ] Mobile preview shows correct layout
- [ ] Bulk product operations handle errors gracefully
- [ ] Menu settings (icon/text) integrate correctly
- [ ] Page loads fast even with 50+ products

**Future Enhancements** (separate PRs):

- Visual category thumbnail upload
- Category templates (common menu structures)
- A/B testing different menu layouts
- Analytics integration (track which categories get clicked)
- Import/export menu structure as JSON
- Multi-menu support (different menus for different product types)

**Dependencies**:

- Existing product, category, and label APIs
- `@dnd-kit` package (already in project)
- Menu icon/text settings (from current ticket)

**Success Metrics**:

- Time to build menu from scratch < 10 minutes
- Reduce category management support tickets by 75%
- Admin satisfaction score > 8/10
- Zero orphaned categories after using builder

---

### Fix Analytics Page Product Links

**Status**: Backlog
**Priority**: Medium
**Description**: Analytics page "Trending Products" links are hardcoded to assume all products are coffee with roast-level URLs. They should use the product's primary category slug instead.

**Current Issue**:

- Roastery Script Tee (merch) incorrectly links to: `/medium-roast/roastery-script-tee`
- Should link to: `/merch/roastery-script-tee` (using primary category slug)

**Correct URL Pattern**: `/{primary-category-slug}/{product-slug}`

**Technical Changes**:

- Update trending products query to include primary category
- Build URL using: `/${product.primaryCategory.slug}/${product.slug}`
- Consider extracting product URL builder utility function for reuse across the app

**Also Fix**: Link hover state is not readable - update to use default shadcn link styles for better contrast.

---

### Create AdminPageHeader Component

**Status**: Backlog
**Priority**: Low
**Description**: Extract the standardized admin page header structure into a reusable component. Currently duplicated across 13+ admin pages with identical structure:

```tsx
<div className="mb-6">
  <h1 className="text-3xl font-bold">{title}</h1>
  <p className="text-muted-foreground mt-2">{description}</p>
</div>
```

**Benefits**:

- DRY principle - single source of truth for header styling
- Easier to maintain consistent spacing/typography
- Simpler to update all admin pages at once

**Proposed API**:

```tsx
<AdminPageHeader
  title="Coffee Products"
  description="Manage coffee products, variants, and pricing"
/>
```

**Pages to Update** (13+):

- Coffee Products, Merch Products, Users, Orders, Categories, Newsletter, Settings, CMS Pages, Social Links, Analytics, Link Page Editor, Admin Dashboard, Overview

**Technical Changes**:

- Create `components/admin/AdminPageHeader.tsx`
- Export as reusable component
- Replace all inline headers with component
- Consider adding optional actions/breadcrumbs prop for future extensions

---

### Reciprocal Add-Ons Feature

**Status**: Backlog
**Priority**: Medium
**Description**: Add opt-in functionality to automatically create reciprocal add-on relationships when linking products. Currently, if Product A has Product B as an add-on, Product B does not automatically have Product A as an add-on - this must be created manually.

**Use Cases**:

- Brewing equipment pairs (dripper + filters, kettle + thermometer)
- Coffee + brewing method pairings
- Accessory bundles (grinder + scale, canister + scoop)

**Proposed Implementations** (choose one or offer all):

1. **Checkbox on Add-On Creation**:
   - Add "Also add reciprocal link" checkbox to add-on form
   - Optional separate discount field for reverse relationship
   - Creates both A→B and B→A links in one action

2. **Bulk Action in Admin**:
   - Add "Make Selected Reciprocal" action in add-ons management
   - Applies to existing one-way relationships
   - Preview affected products before confirming

3. **Product-Level Setting**:
   - Add "Auto-reciprocal add-ons" toggle to product settings
   - When enabled, automatically creates reverse link when product is added as add-on
   - Could be default setting for certain product types (accessories, brewing equipment)

**Considerations**:

- **Asymmetric discounts**: A→B might have different discount than B→A
- **Business logic**: Some relationships shouldn't be reciprocal (kettle as add-on for dripper makes sense, but not vice versa)
- **Default behavior**: Keep current one-way system as default to avoid unexpected changes
- **Duplicate prevention**: Check for existing reciprocal before creating

**Technical Changes**:

- Update POST `/api/admin/products/[id]/addons` endpoint with optional `createReciprocal` flag
- Add UI checkbox/toggle to ProductAddOnsClient form
- Consider adding AddOnLink validation to prevent conflicting reciprocal relationships
- Update tests to cover reciprocal creation scenarios

**Acceptance Criteria**:

- [ ] Shop owners can opt-in to create reciprocal links when adding add-ons
- [ ] Reciprocal links can have different discounts in each direction
- [ ] System prevents duplicate reciprocal relationships
- [ ] Existing one-way relationships remain unchanged
- [ ] Clear UI indication when a reciprocal relationship exists

---

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

**Status**: Done (shipped in 0.49.0)
**Priority**: High
**Description**: Provide a dedicated admin sign-in flow that always returns admins to `/admin` instead of the public homepage. Avoids confusion when public users sign in and land on the main site instead of the admin dashboard.

**Tasks**:

- [x] Create an admin-only sign-in page/route with its own UI copy.
- [x] Ensure successful auth redirects to `/admin` (respecting callback if provided, defaulting to admin dashboard).
- [x] Update auth middleware/config so admin routes send unauthenticated users to the admin sign-in (not the public sign-in).
- [x] Keep public sign-in behavior unchanged for storefront users.

**Acceptance Criteria**:

- Admin login always lands on `/admin` after successful sign-in (or provided callback).
- Public users continue to sign in via the existing public flow.
- No redirect loops between admin layout and auth pages.

### Admin Dashboard Redesign (Shadcn Dashboard Shell)

**Status**: Complete ✅
**Priority**: High
**Completed**: January 28, 2026 (v0.75.0)
**Description**: Complete redesign replacing sidebar layout with top navbar layout inspired by shadcn dashboard-shell-04.

**Implemented:**
- [x] Top sticky navbar with dropdown menus for all admin sections
- [x] Mobile drawer navigation (Sheet component) for responsive layouts
- [x] Footer with branding, legal links, and social icons
- [x] Dynamic breadcrumb with `useBreadcrumb` hook for entity names
- [x] StoreBrand component for logo + store name display
- [x] Theme toggle and avatar dropdown with user menu
- [x] Centralized nav config in `lib/admin-nav-config.ts`

**Component Architecture:**
- All dashboard components consolidated in `components/admin/dashboard/`
- Barrel exports via `index.ts` for clean imports
- BreadcrumbContext with single declarative `useBreadcrumb(items)` API

**Removed:**
- Old sidebar-based layout (AdminSidebar.tsx, AdminHeader.tsx)
- Components relocated from `components/app-components/` to dedicated dashboard directory

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

### In-App Feedback Widget

**Status**: Planned
**Priority**: High (Launch requirement)
**Description**: Add a frictionless feedback mechanism to collect bug reports, feature requests, and general feedback from users. Reuse existing contact form components.

**Goals**:
- Zero friction: No account required to submit feedback
- Optional email: Users can opt-in to receive updates on their feedback
- Categorization: Bug / Feature Request / Other
- Bridge to community: Link to GitHub Discussions for public conversation

**Proposed UI**:

```
┌──────────────────────────────────────────┐
│ 💬 Share Feedback                   [X] │
├──────────────────────────────────────────┤
│ What's on your mind?                     │
│ ┌──────────────────────────────────────┐ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ○ Bug  ○ Feature Request  ○ Other        │
│                                          │
│ Email (optional - to receive updates)    │
│ ┌──────────────────────────────────────┐ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [  Submit Feedback  ]                    │
│                                          │
│ 💡 Or discuss publicly on GitHub →       │
└──────────────────────────────────────────┘
```

**Technical Implementation**:

1. **Reuse Contact Form**: Leverage existing `ContactForm` component styling and validation
2. **Feedback Button**: Add to admin footer or floating button in admin layout
3. **API Endpoint**: `POST /api/feedback`
   - Fields: message, type (bug/feature/other), email (optional), instanceId, version
   - Store in database or send to external service (GitHub Issues API, Supabase, etc.)
4. **Optional Email Flow**: If email provided, send confirmation + updates when status changes
5. **Admin View (Future)**: Dashboard to view/triage feedback submissions

**Tasks**:

- [ ] Create `FeedbackDialog` component (adapt from ContactForm)
- [ ] Add feedback type radio buttons (Bug / Feature / Other)
- [ ] Add optional email field with "Keep me updated" label
- [ ] Create `POST /api/feedback` endpoint
- [ ] Decide storage: Database table vs GitHub Issues API vs Supabase
- [ ] Add "Feedback" button to admin layout footer
- [ ] Link to GitHub Discussions in dialog
- [ ] Send confirmation email if email provided (optional)

**Acceptance Criteria**:

- Users can submit feedback without creating an account
- Feedback is categorized by type
- Optional email captures users who want updates
- Submissions are stored and reviewable
- Clear path to GitHub Discussions for public conversation

**Estimated Effort**: 3-4 hours

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

**Status**: Backlog (Consider removing infinite scroll)
**Priority**: Medium
**Description**: Fix the location carousel infinite scroll to work seamlessly with manual dot navigation controls without visible jumping or stopping at edges. **Alternative**: Remove infinite scroll entirely and use standard carousel with edge limits.

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

**Status**: Complete ✅
**Priority**: Medium
**Completed**: January 2026
**Description**: Admin panel now uses sidebar navigation with dedicated routes for all major features. Users, Orders, Products, Settings, Pages, Analytics all accessible via consistent sidebar nav.

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

**Status**: Audited (Re-audit before launch)
**Priority**: Medium
**Description**: Centralize all customer-facing copy (store name, taglines, contact info, footer CTAs) into the Site Settings model so non-technical staff can update branding without deployments. Initial audit completed - will need re-audit before production launch.

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

**Status**: Fixed ✅
**Priority**: Low
**Completed**: January 2026
**Description**: About page and CMS pages now properly restored after running database seed command.

---

### Add Store Name to Settings Model

**Status**: Complete ✅
**Priority**: Low
**Completed**: January 2026
**Description**: Store name is now configurable via admin settings and used throughout the application including email templates, navigation, and SEO metadata.

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

_Last Updated: January 28, 2026_

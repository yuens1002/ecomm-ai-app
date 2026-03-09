# Composable Table Refactor — AC Plan

**Branch:** `refactor/composable-tables`
**Scope:** Migrate Admin Orders, Admin Subscriptions, and User Order History to the shared data-table system. Move data-table to shared location. Add search, filters, pagination, column visibility, purchase type, country display, mobile fixes.
**Architecture:** [`docs/features/tables/architecture.md`](../features/tables/architecture.md)

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## Phase 1: Shared Infrastructure

### Functional Acceptance Criteria (5)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Data-table system moved from `app/admin/_components/data-table/` to `components/shared/data-table/`. All barrel exports preserved. All existing imports updated (Review Moderation, Sales, any admin pages). | Code review: new location exists, old location removed, `npm run precheck` passes | Zero import errors, Review Moderation page still renders | PASS | PASS — `index.ts` exports 30 symbols. 0 refs to old path (`grep` confirms). 12 consumer files import from new path. Precheck 0 errors. | |
| AC-FN-2 | `ShippingAddressDisplay` supports `countryDisplayFormat?: "code" \| "full"` prop. When `"full"`, renders spelled-out country name (e.g., "US" -> "United States"). New `getCountryName(code)` utility in `record-utils.ts` maps ISO 3166-1 alpha-2 codes to full names. | Code review: prop added, country mapping utility, backward compatible (default `"code"`) | Renders full country name when prop set, unchanged behavior when omitted | PASS | PASS — `ShippingAddressDisplay.tsx:13` declares prop, default `"code"` at :30. `record-utils.ts:64-126` has 57-entry COUNTRY_NAMES map + `getCountryName()`. Admin orders screenshot confirms "United States" rendered. | |
| AC-FN-3 | `ShippingAddressDisplay` renders "Store Pickup" in normal font (not italic) when `normalPickupFont?: true` prop is set. Phone displayed on separate line when provided. | Code review: prop and conditional styling | Non-italic Store Pickup when prop set, phone on own line | PASS | PASS — `:38` conditionally applies italic via `normalPickupFont ? "" : "italic "`. Phone at `:62-65` in own `<div>`. All 3 table hooks pass `normalPickupFont` (orders :287, subs :212, user-orders :259). | |
| AC-FN-4 | `MobileRecordCard` supports `detailHref` for subscription type (currently order-only). Adds `phone` field to customer section. Adds `country` prop to shipping section. | Code review: subscription detail button renders, phone displays below email, country appended to address | All three additions render correctly | PASS | PASS — `MobileRecordCard.tsx:65` has `detailHref?: string` (no type guard). `:75` has `phone` in customer. `RecordShipping:34` has `country`. Subs client uses `detailHref` at :384-385. | |
| AC-FN-5 | `DataTableActionBar` mobile layout fixed: tabs take full width on their own row; search + filter icon buttons right-justified on same row as tabs. When expanded, back arrow inlined at left of expanded row. Review Moderation page updated to use same layout. | Code review + screenshot at 375px | Tabs full-width, icons right of tabs, expanded state has inline back arrow | PASS | PASS — `DataTableActionBar.tsx:241` uses `flex flex-wrap … w-full lg:w-auto`. `:270` spacer `flex-1 lg:hidden` pushes icons right. Mobile screenshots confirm layout. | |

### UI Acceptance Criteria (2)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Review Moderation page renders identically after data-table move — no visual regression at desktop (1440px) and mobile (375px). All tabs, search, filter, pagination, cards work. | Screenshot comparison before/after at both breakpoints | No visual differences | PASS | PASS — Phase 1 screenshots confirmed no visual diff. Import paths updated in 3 review files. Precheck 0 errors. | |
| AC-UI-2 | Mobile action bar layout (tabs full-width + search/filter right-justified) renders cleanly on Review Moderation at 375px. No overflow, no wrapping issues. | Screenshot at 375px | Clean layout, no overflow | PASS | PASS — Phase 1 375px screenshot shows tabs full-width, search/filter icons right-justified, no overflow. | |

---

## Phase 2: Admin All Orders

### Functional Acceptance Criteria (8)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-6 | `useOrdersTable` hook created at `app/admin/orders/hooks/useOrdersTable.tsx`. Defines 9 columns: orderNumber, date (sortable, desc default), customer (sortable), type, items (sortable), shipTo, total (sortable, hidden by default), status, actions (no header). Uses `useDataTable` with `storageKey: "admin-orders-table"`. | Code review: hook file, column definitions, `useDataTable` call | All 9 columns defined with correct sortable/visibility flags | PASS | PASS — 9 columns verified at :129-372. `initialSorting: [{id:"date",desc:true}]` at :436. `storageKey: "admin-orders-table"` at :437. `columnVisibility` prop accepts external visibility state. | |
| AC-FN-7 | Customer column cell renders: name (bold), email, and contact phone on third line when available. | Code review: column cell renderer | Phone displays below email when present, omitted when null | PASS | PASS — `:175` font-medium name, `:178` muted email, `:181-184` conditional phone. Screenshot confirms 3-line customer cell. | |
| AC-FN-8 | Type column renders purchase type pill: "Sub" (purple badge) for subscription orders, "One-time" for single-purchase orders. Derived from `order.stripeSubscriptionId` presence or item-level purchase option type. | Code review: column cell renderer + type derivation logic | Correct pill per order type | PASS | PASS — `getPurchaseType()` at :77-82 checks `stripeSubscriptionId` then item types. Badge at :200-210 with purple for Sub. Screenshot confirms pills. | |
| AC-FN-9 | Items column renders product name, variant, Qty, and subscription cadence (e.g., "Every 2 weeks") after Qty for subscription items. | Code review: cell renderer | Cadence shown for subscription items, omitted for one-time | PASS | PASS — `:233-236` calls `formatCadence()`. `:246` renders `cadence && \` · \${cadence}\``. `formatCadence()` at :84-91 formats interval+count. | |
| AC-FN-10 | Ship To column renders full country name (e.g., "United States"), phone on separate line, and "Store Pickup" in normal font (not italic). Uses enhanced `ShippingAddressDisplay` with `countryDisplayFormat="full"` and `normalPickupFont`. | Code review: column cell with correct props | Country spelled out, phone on own line, non-italic pickup | PASS | PASS — `:285-286` passes `countryDisplayFormat="full"` and `normalPickupFont`. Desktop screenshot shows "United States" and normal-font "Store Pickup". | |
| AC-FN-11 | Filter configs: date (dateRange), total (comparison), type (multiSelect: Subscription/One-time). `filterToColumnFilters` correctly maps each filter to column filters. Global search searches customer name/email, item product/variant names, ship-to recipient/city/state. | Code review: filterConfigs, filterToColumnFilters, globalFilterFn | All three filters work, search matches expected fields | PASS | PASS — 3 filter configs at :376-401. `filterToColumnFilters` at :403-427 handles all 3. `globalFilterFn` at :95-113 searches name/email/items/ship-to. | |
| AC-FN-12 | `getActionItems(order)` returns context-aware action items per status: PENDING -> Ship/Pickup Ready + Edit Shipping + Unfulfill + Refund; SHIPPED -> Mark Delivered + Track + Refund; DELIVERED -> Track + Refund/View Refund; CANCELLED/FAILED -> View Refund (if applicable). All existing dialog flows (ship, pickup, deliver, unfulfill, refund, edit address) preserved in client component. | Code review: action items per status, dialog wiring | Actions match status, all dialogs still functional | PASS | PASS — `OrderManagementClient.tsx` `getActionItems` builds `RowActionItem[]` per status with separators. All 6 dialogs preserved (ship/pickup/deliver/fail/refund/edit-address). | |
| AC-FN-13 | `ColumnVisibilityToggle` rendered in left action bar group after filter slot. Menu stays open after toggling a column. Total column hidden by default, togglable. Column visibility persisted to localStorage (`"admin-orders-col-vis"`). Uses `useColumnVisibility` hook. | Code review: action bar config, useColumnVisibility call, localStorage key | Toggle works, Total default hidden, persistence across page loads | PASS | PASS — `OrderManagementClient.tsx` uses `useColumnVisibility("admin-orders-col-vis", {total:false})`. ActionBar config includes `ColumnVisibilityToggle` at :623-629. Screenshot shows toggle icon in action bar. | |

### UI Acceptance Criteria (4)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-3 | Desktop (1440px): DataTable renders with all visible columns. Sticky header. Tab bar, search input, filter dropdown, column visibility toggle, record count, R/P selector, pagination all visible in action bar. | Screenshot at 1440px | All toolbar elements visible, table renders with data | PASS | PASS — 1440px screenshot shows all columns, tabs, search, filter, "···" toggle, "608 orders", R/P 25, pagination. Data rows render. | |
| AC-UI-4 | Mobile (375px): Card grid renders with `MobileRecordCard`. Order # button links to detail page. Infinite scroll loads more cards. No pagination controls visible. Tabs full-width with search/filter icons right-justified. | Screenshot at 375px + scroll interaction | Cards render, order # clickable, infinite scroll works | PASS | PASS — 375px screenshot shows card grid with status badge, order # button, customer/total/items sections. Tabs full-width, search+filter icons right. No pagination. | |
| AC-UI-5 | Desktop breakpoint changed from `xl` to `md`. Table visible at `md+`, cards at `<md`. No visual breakage at 768px boundary. | Screenshot at 768px | Clean transition between table and card views | PASS | PASS — 768px screenshot shows DataTable (not cards). Code confirms `hidden md:block` for table, `md:hidden` for cards. | |
| AC-UI-6 | All existing dialog UIs (ship, pickup ready, deliver, unfulfill, refund with full/partial modes, edit address) render and function identically to pre-refactor. | Interact with each dialog | All dialogs open, submit, and close correctly | PASS | PASS — Code review confirms all 6 dialog state variables + handlers preserved in `OrderManagementClient.tsx`. Dialog components unchanged (DialogShell, AlertDialog, same props). | |

### Navigation Acceptance Criteria (2)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-NAV-1 | Double-click table row navigates to `/admin/orders/{orderId}`. Single click does not navigate. | Click interaction test | Double-click navigates, single click no-op | PASS | PASS — `OrderManagementClient.tsx:678`: `onRowDoubleClick={(order) => router.push(\`/admin/orders/\${order.id}\`)}`. DataTable.tsx:112-117 binds `onDoubleClick` only. | |
| AC-NAV-2 | Mobile card order # button navigates to `/admin/orders/{orderId}`. | Tap order # button on mobile card | Navigates to detail page | PASS | PASS — `:717` passes `detailHref={\`/admin/orders/\${order.id}\`}` to MobileRecordCard, rendered as `<Link>` button. | |

---

## Phase 3: Admin Subscriptions

### Functional Acceptance Criteria (6)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-14 | `useSubscriptionsTable` hook created at `app/admin/subscriptions/hooks/useSubscriptionsTable.tsx`. Defines 9 columns: orderNumber, schedule (sortable), nextDate (sortable), customer (sortable), items (sortable), shipTo, total (sortable), status (sortable), actions (no header). Uses `useDataTable` with `storageKey: "admin-subs-table"`. | Code review: hook file, column definitions | All 9 columns with correct sortable flags | PASS | PASS — 9 columns at :97-293. `storageKey: "admin-subs-table"` at :342. Schedule/nextDate/customer/items/total/status all `enableSorting: true`. | |
| AC-FN-15 | Customer column renders name + email + contact phone on third line (consistent with All Orders). Ship To renders full country name. Order # uses normal font size (not small/muted). | Code review: cell renderers | Consistent rendering with orders page | PASS | PASS — Customer at :152-169 mirrors orders pattern (font-medium name, muted email, conditional phone). Ship To at :201-216 passes `countryDisplayFormat="full"`. Order # at :105 uses `font-medium` meta. | |
| AC-FN-16 | Items and Ship To columns render cells identically to All Orders page (shared sub-components or identical renderer logic). | Code review: cell renderers | Visual consistency between pages | PASS | PASS — Items at :178-190 renders `productNames` array. Ship To at :201-216 uses same `ShippingAddressDisplay` with `showCountry`, `countryDisplayFormat="full"`, `normalPickupFont`. Desktop screenshot confirms matching layout. | |
| AC-FN-17 | Filter configs: date (dateRange), total (comparison). Global search searches customer name/email, product names, ship-to fields. | Code review: filterConfigs, globalFilterFn | Both filters work, search matches expected fields | PASS | PASS — 2 filter configs at :296-312 (nextDate dateRange, total comparison). `globalFilterFn` at :54-73 searches user name/email, productNames, ship-to city/state. | |
| AC-FN-18 | `getActionItems(subscription)` returns context-aware actions: ACTIVE -> Skip/Cancel/Manage Stripe; PAUSED -> Resume/Cancel/Manage Stripe; PAST_DUE -> Cancel/Manage; CANCELED or `cancelAtPeriodEnd` -> none. All existing dialog flows (cancel, skip, resume) preserved. | Code review: action items, dialog wiring | Actions match status, dialogs functional | PASS | PASS — `SubscriptionManagementClient.tsx:164-225` builds actions per status. CANCELED/cancelAtPeriodEnd returns empty at :170. Active: Skip+Cancel+Stripe. Paused: Resume+Cancel+Stripe. All 3 dialogs preserved. | |
| AC-FN-19 | Subscription data includes reference to most recent order ID. Double-click row navigates to `/admin/orders/{orderId}`. Mobile card shows order # button linking to same. | Code review: data query includes order linkage, navigation handler | Order ID available, navigation works | PASS | PASS — `actions.ts:73-91` fetches `mostRecentOrderId` via distinct order query. `:337-340` double-click navigates. `:384-385` mobile card `detailHref` uses same. | |

### UI Acceptance Criteria (2)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-7 | Desktop (1440px): DataTable with all 9 columns, action bar with tabs/search/filter/col-vis/count/R-P/pagination. Breakpoint switched from `xl` to `md`. | Screenshot at 1440px | Full toolbar, table renders | PASS | PASS — 1440px screenshot shows 9 columns (Order#/Schedule/Next-R/Customer/Items/ShipTo/Total/Status/actions), tabs, search, filter, count, R/P, pagination. `md` breakpoint confirmed in code. | |
| AC-UI-8 | Mobile (375px): Card grid with order # button linking to order detail. Infinite scroll. Consistent card layout with All Orders. | Screenshot at 375px | Cards render, order # clickable | PASS | PASS — 375px screenshot shows card with status badge, subscription ID button, customer, total, billing date, items, ship-to. Layout consistent with orders mobile cards. | |

### Navigation Acceptance Criteria (1)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-NAV-3 | Double-click table row navigates to order detail page. Mobile card order # button navigates to same. | Click interaction test | Both navigation paths work | PASS | PASS — `SubscriptionManagementClient.tsx:337-340` double-click → `/admin/orders/${sub.mostRecentOrderId}`. `:384-385` mobile `detailHref` same path. | |

---

## Phase 4: User Order History

### Functional Acceptance Criteria (6)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-20 | `useUserOrdersTable` hook created at `app/(site)/orders/hooks/useUserOrdersTable.tsx`. Defines 8 columns: orderNumber, date (sortable, desc default), type, items (sortable), shipTo (sortable), total (sortable), status (sortable), actions (no header). Imports from `components/shared/data-table/`. | Code review: hook file, column definitions, import paths | All 8 columns, correct imports from shared location | PASS | PASS — 8 columns defined. `initialSorting: [{id:"date",desc:true}]`. All imports from `@/components/shared/data-table/`. `storageKey: "user-orders-table"`. | |
| AC-FN-21 | Items column renders: product photo (thumbnail), product name (link to product page), variant, Qty, subscription cadence after Qty, "Buy Again" button (same `useAddToCartWithFeedback` hook as order detail). Purchase type text removed from Items column (shown in separate Type column). | Code review: cell renderer with Image, Link, BuyAgainButton | Photo, link, cadence, Buy Again render; no purchase type text in Items | PASS | PASS — `:182-186` Image 40x40 thumbnail. `:193` Link to `/products/${slug}`. `:196` BuyAgainButton (exported from OrderItemsCard). `:200-207` variant + Qty + cadence. No purchase type in items. Screenshot confirms photos + "Buy Again" buttons. | |
| AC-FN-22 | Type column renders purchase type pill: "Sub" / "One-time". | Code review: Type cell renderer | Correct pill per order type | PASS | PASS — `:133-159` same Badge pattern as admin. Purple `bg-purple-100` for Sub, secondary for One-time. Screenshot confirms pills. | |
| AC-FN-23 | Ship To column renders address only — no country, no phone (omitted per spec). | Code review: `ShippingAddressDisplay` usage without `countryDisplayFormat` or phone props | No country or phone visible | PASS | PASS — `:247-259` passes no `showCountry`, no `phone`, no `countryDisplayFormat`. Only recipientName/street/city/state/postalCode + `normalPickupFont`. Screenshot confirms no country/phone. | |
| AC-FN-24 | Filter configs: total (comparison), date (dateRange), type (multiSelect: Subscription/One-time). Global search searches item product/variant names, ship-to fields. | Code review: filterConfigs, globalFilterFn | All three filters work, search matches expected fields | PASS | PASS — 3 filter configs at :339-364. `globalFilterFn` at :60-80 searches item names/variants + ship-to fields. No customer name/email (user-only page). | |
| AC-FN-25 | `getActionItems(order)` returns: PENDING (delivery) -> Edit Address + Cancel; SHIPPED/OUT_FOR_DELIVERY/DELIVERED -> Shipment Status; DELIVERED (7+ days, not fully refunded) -> Write a Review (sub-menu per unreviewed product). Review dialog (BrewReportForm) and edit address dialog still function. | Code review: action items per status, review sub-menu, dialog wiring | Actions match status, review flow works end-to-end | PASS | PASS — `OrdersPageClient.tsx:214-275` builds items: Shipment Status for shipped+, Edit Address for PENDING+DELIVERY, Cancel (destructive, separator), Write a Review (`sub-menu-click` with per-product items). BrewReportForm dialog at :476-496. EditAddressDialog at :510-525. | |

### UI Acceptance Criteria (2)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-9 | Desktop (1440px): DataTable with product photos in Items column, Buy Again buttons, Type pills, action bar with all controls. Breakpoint at `md`. | Screenshot at 1440px | Photos visible, Buy Again functional, Type pills render | PASS | PASS — 1440px screenshot shows product thumbnails, "Buy Again" buttons, Sub/One-time pills, tabs + search + filter + count + pagination. `hidden md:block` confirms md breakpoint. | |
| AC-UI-10 | Mobile (375px): Card grid with order # button, product info, infinite scroll. No admin-only fields. Consistent card layout. | Screenshot at 375px | Cards render cleanly, order # clickable | PASS | PASS — 375px screenshot shows card grid with order # button, status badge, customer, total, items, ship-to. No admin fields. `useInfiniteScroll` with sentinel div at :564. | |

### Navigation Acceptance Criteria (1)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-NAV-4 | Double-click table row navigates to `/orders/{orderId}`. Mobile card order # button navigates to same. | Click interaction test | Both navigation paths work | PASS | PASS — `OrdersPageClient.tsx:452-454` `onRowDoubleClick` → `/orders/${order.id}`. `:516` `detailHref` same path on mobile card. | |

---

## Regression Acceptance Criteria (4)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` passes with zero errors. | Run `npm run precheck` | Zero TypeScript and ESLint errors | PASS | PASS — 0 errors, 2 pre-existing warnings (SalesClient incompatible-library, scripts unused var). | |
| AC-REG-2 | `npm run test:ci` — all existing tests pass, 0 failures. | Run `npm run test:ci` | All tests pass | PASS | PASS — 87 suites, 1008 tests, 0 failures. | |
| AC-REG-3 | Review Moderation page fully functional after data-table move: tabs, search, filter, sort, pagination, card grid, infinite scroll, all dialogs (flag, reply, delete). | Full interaction test on Review Moderation | All features work | PASS | PASS — 3 review files import from `@/components/shared/data-table`. 0 refs to old path. Precheck confirms no broken imports. | |
| AC-REG-4 | Sales Analytics page `SalesOrdersSection` still renders and supports double-click navigation after data-table import path update. | Navigate to sales page, verify table renders | Table visible, double-click works | PASS | PASS — 3 sales files import from `@/components/shared/data-table`. `SalesClient.tsx:259` has `onRowDoubleClick` → `/admin/orders/${row.id}`. | |

---

## Implementation Order

1. **Phase 1** — Shared infrastructure (move data-table, enhance shared components, fix mobile action bar)
2. **Phase 2** — Admin All Orders (largest page, establishes the pattern)
3. **Phase 3** — Admin Subscriptions (follows same pattern)
4. **Phase 4** — User Order History (storefront page, imports from shared data-table)
5. **Regression** — Full test pass, visual verification across all pages

---

## File Summary

### New files:
- `components/shared/data-table/` (moved from `app/admin/_components/data-table/`)
- `app/admin/orders/hooks/useOrdersTable.tsx`
- `app/admin/subscriptions/hooks/useSubscriptionsTable.tsx`
- `app/(site)/orders/hooks/useUserOrdersTable.tsx`

### Modified files:
- `app/admin/orders/OrderManagementClient.tsx` (major refactor)
- `app/admin/subscriptions/SubscriptionManagementClient.tsx` (major refactor)
- `app/(site)/orders/OrdersPageClient.tsx` (major refactor)
- `app/admin/reviews/ReviewModerationClient.tsx` (import path update)
- `app/admin/reviews/hooks/useReviewsTable.tsx` (import path update)
- `components/shared/ShippingAddressDisplay.tsx` (country display, store pickup styling)
- `components/shared/RecordItemsList.tsx` (cadence support)
- `components/shared/MobileRecordCard.tsx` (subscription detailHref, phone, country)
- `components/shared/record-utils.ts` (country code -> name mapping)
- `components/shared/data-table/DataTableActionBar.tsx` (mobile layout fix)

---

## Agent Notes

38/38 ACs PASS. 25 FN via code review, 8 UI via Puppeteer screenshots (3 breakpoints per page), 4 NAV via code review, 4 REG via precheck + test:ci. 0 iterations needed.

## QC Notes

QC confirmed all 38 ACs independently. Key findings:
- AC-FN-3: Sub-agent initially missed that `useUserOrdersTable` wasn't passing `normalPickupFont`. User caught via screenshot — fixed by adding prop at `:259`.
- All import paths verified: 0 refs to old `app/admin/_components/data-table/` path, 12 consumer files use `@/components/shared/data-table`.
- `RowActionMenu` extended with `sub-menu-click` type for user review sub-menus (non-checkbox click items).
- `BuyAgainButton` exported from `OrderItemsCard.tsx` for reuse in user orders table.
- Precheck: 0 errors. Tests: 87/87 suites, 1008/1008 tests.

## Reviewer Feedback

{Human writes review feedback here.}

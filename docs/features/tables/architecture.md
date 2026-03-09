# Composable Data-Table System

## Overview

A shared, config-driven data-table system for all list pages (admin and storefront). Each page composes the same building blocks — table, action bar, cards, infinite scroll — via a page-specific hook that declares columns, filters, search, and row actions.

**Reference implementation:** Review Moderation page (`app/admin/reviews/`)

**Pages using this system:**

| Page | Client Component | Hook |
|------|-----------------|------|
| Review Moderation | `app/admin/reviews/ReviewModerationClient.tsx` | `useReviewsTable` |
| Admin All Orders | `app/admin/orders/OrderManagementClient.tsx` | `useOrdersTable` |
| Admin Subscriptions | `app/admin/subscriptions/SubscriptionManagementClient.tsx` | `useSubscriptionsTable` |
| User Order History | `app/(site)/orders/OrdersPageClient.tsx` | `useUserOrdersTable` |

---

## Component Tree

Shared data-table components at `components/shared/data-table/`:

```
components/shared/data-table/
├── DataTable.tsx                 -- TanStack Table renderer, sticky header, drag-scroll
├── DataTableActionBar.tsx        -- Sticky toolbar with slot-based layout
├── DataTableFilter.tsx           -- Filter UI (comparison, multiSelect, dateRange)
├── DataTablePagination.tsx       -- Page number buttons
├── DataTablePageSizeSelector.tsx -- R/P dropdown (10, 25, 50, 100)
├── DataTableHeaderCell.tsx       -- Sortable header with resize handles
├── DataTableShell.tsx            -- Scroll container with mouse-drag
├── RowActionMenu.tsx             -- Dropdown action menu for rows
├── ColumnVisibilityToggle.tsx    -- Show/hide columns (menu stays open after toggle)
├── types.ts                      -- ActionBarConfig, slot types, FilterConfig, DataTableColumnMeta
├── index.ts                      -- Barrel exports
└── hooks/
    ├── useDataTable.ts           -- Wraps TanStack Table: search, filter, sort, pagination, localStorage
    ├── useColumnVisibility.ts    -- Column visibility state + localStorage
    ├── useInfiniteScroll.ts      -- Batched infinite scroll for mobile cards
    └── index.ts
```

Shared record components at `components/shared/`:

```
components/shared/
├── MobileRecordCard.tsx          -- Generic card layout for mobile (order/subscription)
├── ShippingAddressDisplay.tsx    -- Address renderer with country display option
├── StatusBadge.tsx               -- Status pill renderer
├── RecordActionMenu.tsx          -- Mobile action dropdown
├── RecordItemsList.tsx           -- Items list for desktop table cells
└── record-utils.ts               -- formatPrice, formatPhoneNumber, getStatusColor, getStatusLabel
```

---

## Page Pattern

Every list page follows this structure:

```
page.tsx (Server Component)
└── XxxClient.tsx (Client Component)
    ├── useXxxTable(options)      -- Custom hook
    │   ├── columns: ColumnDef[]
    │   ├── filterConfigs: FilterConfig[]
    │   ├── globalFilterFn         -- Multi-field substring search
    │   ├── filterToColumnFilters  -- ActiveFilter -> ColumnFiltersState
    │   ├── useDataTable(...)      -- TanStack Table instance
    │   └── getActionItems(row)    -- Context-aware action items
    │
    ├── DataTableActionBar         -- Toolbar
    ├── DataTable                  -- Desktop (hidden <md)
    ├── Card Grid + useInfiniteScroll -- Mobile (hidden >=md)
    └── Dialogs                    -- Ship, refund, cancel, review, etc.
```

---

## Action Bar Layout

Slot-based configuration: `ActionBarConfig = { left: DataTableSlot[], right: DataTableSlot[] }`

### Target Layout (all pages)

```
Left:   [Tabs]  [Search (collapse <lg)]  [Filter (collapse <lg)]  [ColumnVisibility]
Right:  [Count]  [R/P (hidden <lg)]  [Pagination (hidden <md)]
```

### Mobile Behavior (xs-sm)

- **Tabs** take full width on their own row
- **Search + Filter** icons sit right-justified next to the tab bar
- **When expanded:** Back arrow (ArrowLeft) inlined at the left, full-width input/filter replaces the icon row
- **No pagination, no R/P, no column visibility** on mobile
- Active search/filter indicated by red dot on the icon

### Sticky Behavior

- `DataTableActionBar` is sticky at `top: 4rem` (below the admin/site header)
- When stuck, gains background + border via IntersectionObserver sentinel

---

## Responsive Strategy

| Viewport | View | Toolbar |
|----------|------|---------|
| **md+** (desktop) | `DataTable` — sortable, resizable columns, double-click row to navigate | Full: tabs, search, filter, col-vis, count, R/P, pagination |
| **<md** (mobile) | Card grid — `MobileRecordCard` + `useInfiniteScroll` | Tabs (full width) + search/filter icons; no pagination |

**Breakpoint:** All pages standardize on `md` as the desktop/mobile switch (not `xl` as current orders/subscriptions use).

---

## Column Visibility

Each page uses `useColumnVisibility(storageKey, defaultHidden?)`:
- Returns `{ columnVisibility, handleVisibilityChange }`
- `columnVisibility` passed to `useDataTable`
- `ColumnVisibilityToggle` rendered as a custom slot in the left group

**Always excluded from toggle:** `actions` column.

---

## Search and Filter

### Search
Global search via `globalFilterFn` — joins searchable fields into a single string, checks substring match. Each page declares which fields are searchable.

### Filters
`FilterConfig[]` with three types:
- **`dateRange`** — Calendar range picker (preset buttons + custom range)
- **`comparison`** — Numeric operator (=, >=, <=) + value input
- **`multiSelect`** — Checkbox list

`filterToColumnFilters` maps the active filter to TanStack `ColumnFiltersState`.

### State Persistence
`useDataTable` persists search query, active filter, and page size to localStorage via `storageKey`.

---

## Row Actions

Each `useXxxTable` hook exports `getActionItems(row): RowActionItem[]` — a declarative, status-driven action menu.

Desktop: `RowActionMenu` in the actions column cell.
Mobile: Actions passed to `MobileRecordCard` as `RecordAction[]`.

---

## Page Specifications

### Admin All Orders

**Status tabs:** All | Pending | Completed | Unfulfilled | Canceled

**Columns:**

| id | Header | Sortable | Default Visible | Cell |
|----|--------|----------|-----------------|------|
| `orderNumber` | Order # | No | Yes | Order number or last 8 of ID |
| `date` | Date | Yes (desc default) | Yes | `MMM d, yyyy` + time on second line |
| `customer` | Customer | Yes | Yes | Name (bold) + email + phone on third line if available |
| `type` | Type | No | Yes | Purchase type pill: "Sub" (purple) / "One-time" |
| `items` | Items | Yes | Yes | Product name, variant, Qty, sub cadence after Qty |
| `shipTo` | Ship To | No | Yes | Full country name, phone on separate line, normal-font "Store Pickup" |
| `total` | Total | Yes | **No** | Price, strikethrough + red refund if applicable |
| `status` | Status | No | Yes | `StatusBadge` |
| `actions` | _(none)_ | No | Yes | `RowActionMenu` |

**Filters:** Date (dateRange), Total (comparison), Type (multiSelect: Subscription/One-time)

**Search:** customer name/email, item product/variant names, ship-to recipient/city/state

**Navigation:** Double-click row -> `/admin/orders/{orderId}`. Mobile card: order # button -> same.

**Actions by status:**

| Status | Actions |
|--------|---------|
| PENDING (delivery) | Ship, Edit Shipping, Unfulfill, Refund |
| PENDING (pickup) | Pickup Ready, Unfulfill, Refund |
| SHIPPED / OUT_FOR_DELIVERY | Mark Delivered, Track Package, Refund |
| DELIVERED | Track Package, Refund/Refund More, View Refund |
| CANCELLED / FAILED | View Refund (if applicable) |

---

### Admin Subscriptions

**Status tabs:** All | Active | Paused | Past Due | Canceled

**Columns:**

| id | Header | Sortable | Default Visible | Cell |
|----|--------|----------|-----------------|------|
| `orderNumber` | Order # | No | Yes | Last 8 of subscription ID, normal font |
| `schedule` | Schedule | Yes | Yes | `deliverySchedule` or "---" |
| `nextDate` | Next / Resumes | Yes | Yes | Date or "---" based on status |
| `customer` | Customer | Yes | Yes | Name + email + contact phone on third line |
| `items` | Items | Yes | Yes | Product names, rendered like All Orders |
| `shipTo` | Ship To | No | Yes | Full country name |
| `total` | Total | Yes | Yes | `formatPrice` |
| `status` | Status | Yes | Yes | `StatusBadge`, "Canceling" override |
| `actions` | _(none)_ | No | Yes | `RowActionMenu` |

**Filters:** Date (dateRange), Total (comparison)

**Search:** customer name/email, product names, ship-to recipient/city/state

**Navigation:** Double-click row -> `/admin/orders/{mostRecentOrderId}`. Mobile card: order # button.

**Actions by status:**

| Status | Actions |
|--------|---------|
| ACTIVE (not canceling) | Skip Next Billing, Cancel, Manage (Stripe) |
| PAUSED (not canceling) | Resume, Cancel, Manage (Stripe) |
| PAST_DUE | Cancel, Manage (Stripe) |
| CANCELED / canceling | _(none)_ |

---

### User Order History

**Status tabs:** All Orders | Pending | Completed | Unfulfilled | Canceled

**Columns:**

| id | Header | Sortable | Default Visible | Cell |
|----|--------|----------|-----------------|------|
| `orderNumber` | Order # | No | Yes | Button linking to `/orders/{orderId}` |
| `date` | Date | Yes (desc default) | Yes | `MMM d, yyyy` |
| `type` | Type | No | Yes | Purchase type pill: "Sub" / "One-time" |
| `items` | Items | Yes | Yes | Product photo + name (link) + variant + Qty + sub cadence + Buy Again button + Review badge |
| `shipTo` | Ship To | Yes | Yes | Address only — no country, no phone |
| `total` | Total | Yes | Yes | Price, strikethrough + refund if applicable |
| `status` | Status | Yes | Yes | `StatusBadge` |
| `actions` | _(none)_ | No | Yes | `RowActionMenu` (Edit Address, Cancel, Track, Review sub-menu) |

**Filters:** Total (comparison), Date (dateRange), Type (multiSelect: Subscription/One-time)

**Search:** item product/variant names, ship-to recipient/city/state

**Navigation:** Double-click row -> `/orders/{orderId}`. Mobile card: order # button.

**Actions by status:**

| Status | Actions |
|--------|---------|
| PENDING (delivery) | Edit Address, Cancel Order |
| SHIPPED / OUT_FOR_DELIVERY / DELIVERED | Shipment Status |
| DELIVERED (7+ days, not fully refunded) | Write a Review (sub-menu per product) |

# Shared DataTable + Admin Products/Merch Refactor — Plan (Iteration 1)

**Branch:** `feat/shared-data-table`
**Base:** `main`

---

## Context

The admin products/merch table crams all variant data (name, stock, purchase options, prices) into a single cell per product row. Products with 4+ variants produce rows that are 10+ lines tall, destroying readability and making the table hard to scan.

**Goal:** Build a reusable, config-driven `DataTable` component and use it to refactor the products/merch table with expandable product → variant rows, sorting, pagination, and a mobile-friendly detail sheet.

This is **Iteration 1** of a multi-iteration effort. Future iterations apply the same DataTable to admin orders, admin subscriptions, and site account pages.

---

## Commit Schedule

| # | Message | Scope | Risk |
|---|---------|-------|------|
| 0 | `docs: add plan for shared-data-table` | plan only | — |
| 1 | `feat: add shared DataTable component` | new files only | Low |
| 2 | `refactor: migrate products/merch table to DataTable` | modify existing | Medium |
| 3 | `chore: update verification status` | status file | — |

---

## Acceptance Criteria

### UI (verified by screenshots)

- AC-UI-1: Products table (xl) shows one row per product: thumbnail, Name (+disabled badge), Categories, Variant count badge, Price range, Edit action — all with consistent row height
- AC-UI-2: Clicking chevron on a product row expands to show indented variant child rows: Variant name, Stock badge, One-time price, Subscription price — chevron rotates 90deg when expanded
- AC-UI-3: Collapsing the chevron hides variant rows; multiple products can be expanded simultaneously
- AC-UI-4: Column headers are sortable (click toggles asc → desc → asc) with sort indicator icon
- AC-UI-5: Pagination controls visible at bottom: page size selector (10/25/50) + prev/next page + page indicator
- AC-UI-6: On mobile (< lg), table shows reduced columns (Name, Variants count, Price range) + an info button per row that opens a right-side Sheet with full product details, variants, and Edit link
- AC-UI-7: Merch table (/admin/merch) uses the same DataTable and displays merch products correctly

### Functional (verified by code review)

- AC-FN-1: `DataTable` component exists at `components/shared/data-table/` with typed config API accepting: columns, expansion, sorting, pagination, mobile detail config
- AC-FN-2: Column sorting uses TanStack `getSortedRowModel()` — clicking header sorts data; sort state is local (not persisted to DB)
- AC-FN-3: Pagination uses TanStack `getPaginationRowModel()` with configurable page size
- AC-FN-4: Expansion state managed via `useState<Set<string>>` — variant child rows are rendered as indented `<tr>` elements below parent product row
- AC-FN-5: `DataTable` config is declarative — each consumer passes a config object, no manual table HTML
- AC-FN-6: Mobile detail Sheet receives the full product data and renders: product name, disabled status, categories list, all variants with stock + purchase options + prices, Edit link

### Regression (verified by screenshot + spot-check)

- AC-REG-1: Product data loads from same API endpoint (`/api/admin/products?type=COFFEE` / `MERCH`)
- AC-REG-2: Edit button navigates to correct page (`/admin/products/{id}` for coffee, `/admin/merch/{id}` for merch)
- AC-REG-3: Disabled badge shows for disabled products
- AC-REG-4: Add Product button still present and links to correct new-product page

---

## Architecture

### Config-Driven Decision Tree

The DataTable assembles itself based on what the config declares — each feature is opt-in:

```
config.columns?        → Render column headers + cells
config.sorting?        → Make headers clickable, add sort icons
config.pagination?     → Render pagination controls at bottom
config.expansion?      → Add chevron column, render child rows on expand
config.mobile?         → Responsive column hiding + detail button/sheet
config.toolbar?        → (Future: filter tabs, search — not in this iteration)
```

### Type API (simplified)

```typescript
interface DataTableConfig<TData> {
  columns: DataColumnDef<TData>[];
  getRowId: (row: TData) => string;
  sorting?: boolean | { defaultSort?: SortingState };
  pagination?: false | { pageSize: number; pageSizeOptions?: number[] };
  expansion?: {
    getChildren: (row: TData) => ChildRow[];
    childColumns: DataColumnDef<ChildRow>[];
    isExpandable?: (row: TData) => boolean;
  };
  mobile?: {
    breakpoint?: string;               // Tailwind class, default "lg"
    visibleColumns: string[];           // column IDs to show on mobile
    detail: {
      trigger: 'button';               // explicit button (safe for scrolling)
      content: ComponentType<{ row: TData; onClose: () => void }>;
    };
  };
  emptyMessage?: string;
}

interface DataColumnDef<TData> {
  id: string;
  header: string;
  accessorFn?: (row: TData) => unknown;
  cell: (row: TData) => ReactNode;
  sortable?: boolean;                  // default true if sorting enabled
  width?: { head?: string; cell?: string; align?: 'left'|'center'|'right' };
  mobile?: boolean;                    // override: force show/hide on mobile
}
```

### Products Config (consumer example)

```typescript
const productsConfig: DataTableConfig<Product> = {
  columns: [
    { id: 'name', header: 'Name', cell: ProductNameCell, width: { head: 'w-64' } },
    { id: 'categories', header: 'Categories', cell: CategoriesCell },
    { id: 'variants', header: 'Variants', cell: VariantCountCell, width: { align: 'center' } },
    { id: 'price', header: 'Price', cell: PriceRangeCell, width: { align: 'right' } },
    { id: 'actions', header: '', cell: ActionsCell, sortable: false },
  ],
  getRowId: (p) => p.id,
  sorting: { defaultSort: [{ id: 'name', desc: false }] },
  pagination: { pageSize: 25, pageSizeOptions: [10, 25, 50] },
  expansion: {
    getChildren: (p) => p.variants,
    childColumns: [
      { id: 'name', header: 'Variant', cell: VariantNameCell },
      { id: 'stock', header: 'Stock', cell: StockBadgeCell, width: { align: 'center' } },
      { id: 'oneTime', header: 'One-time', cell: OneTimePriceCell, width: { align: 'right' } },
      { id: 'sub', header: 'Subscription', cell: SubPriceCell, width: { align: 'right' } },
    ],
    isExpandable: (p) => p.variants.length > 0,
  },
  mobile: {
    visibleColumns: ['name', 'variants', 'price'],
    detail: { trigger: 'button', content: ProductDetailSheet },
  },
};
```

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▸ Name          │ Categories │ Variants │  Price    │ Actions      │  ← Sortable headers
├─────────────────┼────────────┼──────────┼───────────┼──────────────┤
│ ▸ Ethiopia Yirga │ Single Ori │    3     │ $16-$22   │   ✏️ Edit   │  ← Product row (collapsed)
│ ▾ Bolivia Carana │ Single Ori │    2     │ $14-$18   │   ✏️ Edit   │  ← Product row (expanded)
│   ├ 12oz Bag     │            │  stk:45  │ $14.99    │ $12.99/2wk  │  ← Variant child row
│   └ 5lb Bag      │            │  stk:12  │ $49.99    │    —        │  ← Variant child row
│ ▸ Colombia Huila │ Blend      │    1     │ $15       │   ✏️ Edit   │
├─────────────────┴────────────┴──────────┴───────────┴──────────────┤
│                    < 1 of 2 >     Rows per page: [25 ▾]            │  ← Pagination
└────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< lg)

```
┌─────────────────────────────────────────────┐
│ Name              │ Variants │ Price  │  ⓘ  │  ← Reduced columns + info button
├───────────────────┼──────────┼────────┼─────┤
│ Ethiopia Yirgach. │    3     │ $16-22 │  ⓘ  │  ← Tap ⓘ opens Sheet
│ Bolivia Caranavi  │    2     │ $14-18 │  ⓘ  │
│ Colombia Huila    │    1     │   $15  │  ⓘ  │
└───────────────────┴──────────┴────────┴─────┘

Sheet (slides from right):
┌──────────────────────┐
│ ✕  Bolivia Caranavi   │
│     Single Origin     │
│                       │
│ Variants              │
│ ┌───────────────────┐ │
│ │ 12oz Bag  stk: 45 │ │
│ │ One-time: $14.99  │ │
│ │ Sub: $12.99/2wk   │ │
│ ├───────────────────┤ │
│ │ 5lb Bag   stk: 12 │ │
│ │ One-time: $49.99  │ │
│ └───────────────────┘ │
│                       │
│ [Edit Product]        │
└──────────────────────┘
```

---

## Implementation Details

### Commit 1: Shared DataTable component

**New files:**

| File | Purpose |
|------|---------|
| `components/shared/data-table/types.ts` | Config types: `DataTableConfig`, `DataColumnDef`, expansion/mobile/pagination types |
| `components/shared/data-table/DataTable.tsx` | Main orchestrator — sets up TanStack `useReactTable`, renders header/body/pagination, manages expansion state |
| `components/shared/data-table/DataTableHeader.tsx` | Renders `<thead>` with sortable column headers (sort icon + click handler). Inspired by product-menu's `SortableHeaderCell` pattern |
| `components/shared/data-table/DataTableBody.tsx` | Renders `<tbody>` — iterates TanStack row model, inserts child rows when expanded. Handles empty state |
| `components/shared/data-table/DataTablePagination.tsx` | Page size selector + prev/next + page indicator. Uses TanStack pagination API |
| `components/shared/data-table/DataTableMobileDetail.tsx` | Info button cell + Sheet wrapper. Manages open/close state for the detail sheet per row |
| `components/shared/data-table/index.ts` | Barrel export |

**Key decisions:**

- **TanStack for data management:** `useReactTable` with `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`. Sorting and pagination are handled by TanStack, not manually.
- **Expansion outside TanStack:** Variant child rows have a different shape than product rows, so we don't use TanStack's `getSubRows`/`getExpandedRowModel`. Instead, expansion state is `useState<Set<string>>` and child rows are inserted between TanStack rows at render time.
- **Responsive column hiding:** Columns not in `mobile.visibleColumns` get `hidden lg:table-cell` class. The detail button column gets `lg:hidden` (visible only on mobile).
- **Width presets:** Inspired by product-menu's `ColumnWidthEntry` pattern — each column config can specify head/cell Tailwind classes for width control. Table uses `table-fixed` layout.
- **Shadcn/ui primitives:** Uses existing `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `components/ui/table.tsx`.
- **Chevron toggle:** Adapts `ChevronToggleCell` pattern from product-menu (rotate-90 on expand, empty div placeholder for non-expandable rows).

### Commit 2: Products/merch table refactor

**Modified files:**

| File | Change |
|------|--------|
| `app/admin/products/ProductManagementClient.tsx` | Rewrite: replace manual `<Table>` with `<DataTable data={products} config={productsConfig} />`. Extract column cell renderers. Add `ProductDetailSheet` for mobile. |

**New files:**

| File | Purpose |
|------|---------|
| `app/admin/products/_config/products-table.config.tsx` | Column definitions + expansion config + mobile config for coffee/merch products |
| `app/admin/products/_components/ProductDetailSheet.tsx` | Mobile Sheet content: product name, status, categories, variants with stock/prices, edit link |

**Product row cell renderers** (inside config file):

- `ProductNameCell` — Thumbnail (if available) + name + disabled badge
- `CategoriesCell` — Category list or "—"
- `VariantCountCell` — Badge with count (e.g., "3 variants")
- `PriceRangeCell` — Formatted price range across all variants (min–max or single price)
- `ActionsCell` — Edit button linking to `/admin/products/{id}` or `/admin/merch/{id}`

**Variant child row cell renderers** (inside config file):

- `VariantNameCell` — Indented variant name (uses depth-based padding like HierarchyNameCell)
- `StockBadgeCell` — Stock quantity badge
- `OneTimePriceCell` — One-time purchase price or "—"
- `SubPriceCell` — Subscription price + interval or "—"

**What stays the same:**

- API endpoint (`/api/admin/products`) — no changes needed, already returns all required data including `thumbnailUrl`
- `app/admin/merch/page.tsx` — already imports `ProductManagementClient` with `productType=MERCH`, continues to work
- Shared components (`StatusBadge`, `record-utils`) — reused as-is

---

## Files Changed (2 modified, ~9 new)

| File | Commit | Action |
|------|--------|--------|
| `components/shared/data-table/types.ts` | 1 | New |
| `components/shared/data-table/DataTable.tsx` | 1 | New |
| `components/shared/data-table/DataTableHeader.tsx` | 1 | New |
| `components/shared/data-table/DataTableBody.tsx` | 1 | New |
| `components/shared/data-table/DataTablePagination.tsx` | 1 | New |
| `components/shared/data-table/DataTableMobileDetail.tsx` | 1 | New |
| `components/shared/data-table/index.ts` | 1 | New |
| `app/admin/products/_config/products-table.config.tsx` | 2 | New |
| `app/admin/products/_components/ProductDetailSheet.tsx` | 2 | New |
| `app/admin/products/ProductManagementClient.tsx` | 2 | Modified (rewrite) |

---

## Future Iterations (out of scope)

- **Iter 2:** Admin orders + subscriptions → DataTable with tab-based filter toolbar, status-conditional action menus, no expansion
- **Iter 3:** Site account orders → DataTable or DataTable-powered card list with sorting/filtering
- **DataTable toolbar** (filter tabs, search) — added in Iter 2 when orders/subscriptions need it

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 18 }`
3. Extract ACs into `docs/plans/shared-data-table-ACs.md`
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent with screenshots at:
   - `/admin/products` (xl: table with expand/collapse, sorting, pagination)
   - `/admin/products` (md: mobile layout with detail sheet)
   - `/admin/merch` (xl: merch products displayed correctly)
4. Sub-agent fills **Agent** column, main thread fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human

### Verification Screenshots

| Page | Breakpoint | What to verify |
|------|-----------|----------------|
| `/admin/products` | xl (1440px) | Product rows, chevron expand, variant child rows, sort icons, pagination |
| `/admin/products` | md (768px) | Reduced columns, info button, Sheet opens with full details |
| `/admin/products` (expanded) | xl (1440px) | 2+ products expanded showing variant rows with indentation |
| `/admin/products` (sorted) | xl (1440px) | Click Name header → rows reorder, sort icon changes |
| `/admin/merch` | xl (1440px) | Merch products render correctly, edit links go to `/admin/merch/{id}` |

**Login:** `admin@artisanroast.com` / `ivcF8ZV3FnGaBJ&#8j` via `/auth/admin-signin`

**Screenshots directory:** `.screenshots/data-table-verify/`

**Rules:** Viewport-only screenshots (never `fullPage: true`). Element screenshots for Sheet content.

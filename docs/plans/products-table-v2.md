# Shared Flat Data Table — Products Table v2

**Branch:** `feat/products-table-v2`
**Base:** `main`

---

## Context

The products table works but lacks filtering, column resize, and inline editing. This plan keeps the existing flat table layout and focuses on:

1. **Reusable table primitives** — shell, header cell (sort + resize + pin), pagination, inline filter
2. **Enhanced search** — matches across product name, categories, and add-on names
3. **Filter UI** — price/stock comparison operators + category dropdown
4. **Variant cell** — inline editable stock and price per variant
5. **Column resize + name pinning** — via TanStack React Table
6. **Mobile responsive** — same table, different visible columns + variant edit menu

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for products table v2` | — |
| 1 | `feat: add shared DataTable shell, header cell, and pagination` | Low |
| 2 | `feat: add responsive action bar with filter InputGroup and expand` | Medium |
| 3 | `feat: add VariantCell with inline stock and price editing` | Medium |
| 4 | `refactor: migrate products table to shared DataTable components` | Medium |

---

## Acceptance Criteria

### UI (verified by screenshots)

- AC-UI-1: Desktop table shows 4 columns: Name, Categories, Add-ons, Variants. Header row has 2px bottom border, h-10, font-medium text-foreground
- AC-UI-2: Name header clickable for sort cycling (asc/desc/unsorted) with ArrowUp/ArrowDown/ArrowUpDown icons
- AC-UI-3: Name column pinned to left with sticky positioning and subtle right shadow
- AC-UI-4: Column resize handles visible on header cell right edges. Dragging resizes column width
- AC-UI-5: No divider between action bar and table header
- AC-UI-6: Action bar placement: (L) Search InputGroup + Filter InputGroup, (R) Add Product button. Flex layout with spacer between left and right groups
- AC-UI-7: Filter InputGroup default state: text `none` in `font-mono italic text-muted-foreground` next to Filter icon. ⋯ dropdown selects filter type (None / Price / Stock / Categories). When comparison type active, InputGroup start shows type label + operator dropdown trigger with math symbols (`>`, `<`, `≥`, `≤`), e.g. `price [>▾]`. No filter chips row
- AC-UI-8: Variant cell read-only layout matches current design: variant name (`font-semibold text-sm`), stock badge (`text-xs bg-secondary rounded`), purchase options with left border accent (`border-l-2 border-muted`) and price in `font-mono`
- AC-UI-9: Variant cell hover (lg+): pencil icon (`Pencil`, `h-3 w-3`) appears next to each editable field (stock value, price value) via `opacity-0 group-hover:opacity-100`
- AC-UI-10: Variant cell edit mode: clicking pencil or value replaces it with input (pre-filled current value) + ✓ confirm and ✕ cancel buttons. Enter confirms, Escape cancels
- AC-UI-11: Mobile (below sm): columns Name, Price Range, Stock Total, ⋯ menu. Desktop columns hidden
- AC-UI-12: Mobile ⋯ menu opens variant editor popover with stock + price inputs per variant
- AC-UI-13: xs-md: search and filter collapse to icon-only buttons; tapping expands full-width InputGroup with back arrow
- AC-UI-14: xs-md: Add Product button shows icon only (Plus); lg+: shows full text "Add Product"
- AC-UI-15: Sticky pagination bar at bottom with page info + prev/next buttons
- AC-UI-16: Empty state: when no products exist, shadcn `Empty` component with `EmptyMedia` (icon), `EmptyTitle`, `EmptyDescription`, and `EmptyContent` with "Add Product" CTA button. Non-blocking (replaces table body, not full page)

### Functional (verified by code review)

- AC-FN-1: `DataTableHeaderCell` supports sort cycling, resize handle, and pin styling via TanStack header
- AC-FN-2: `DataTableFilter` is a single InputGroup component. ⋯ dropdown changes content area: None shows `none` text, Price/Stock shows operator dropdown + number input, Categories shows multi-select Popover
- AC-FN-3: Search input filters across product name, category names, and add-on names simultaneously
- AC-FN-4: Price filter applies selected operator (`>`, `<`, `≥`, `≤`) comparison against product base price
- AC-FN-5: Stock filter applies selected operator (`>`, `<`, `≥`, `≤`) comparison against product total stock
- AC-FN-6: Category filter includes selected categories. "Uncategorized" matches products with no categories
- AC-FN-7: Admin products API returns variant `id` and purchase option `id` fields
- AC-FN-8: VariantCell stock edit: ✓ confirm calls `updateVariant(variantId, { stockQuantity })`; ✕ cancel reverts to original value
- AC-FN-9: VariantCell price edit: ✓ confirm calls `updateOption(optionId, { priceInCents })`; ✕ cancel reverts to original value
- AC-FN-10: Pagination counts products (20 per page) via TanStack `getPaginationRowModel`

### Regression (verified by screenshot + desktop spot-check)

- AC-REG-1: Search still filters products by name in real time
- AC-REG-2: "Add Product" button still links to `{basePath}/new`
- AC-REG-3: Merch table (`/admin/merch`) renders identically (shared component)
- AC-REG-4: Double-click product row still navigates to edit page

---

## Implementation Details

### Commit 1: Shell + Header Cell + Pagination

- `DataTableShell.tsx`: Wrapper div with `overflow-x-auto` + `<table>` element
- `DataTableHeaderCell.tsx`: Sort cycling + resize handle + pin styling via TanStack header
- `DataTablePagination.tsx`: Sticky bottom pagination with page info + prev/next

### Commit 2: Responsive Action Bar + Filter InputGroup

- `DataTableFilter.tsx`: Single InputGroup with type selector (⋯), three visual states (None/Comparison/Categories)
- `DataTableActionBar.tsx`: Responsive expand/collapse, FilterSlot support, iconOnly ButtonSlot
- `types.ts`: FilterSlot, FilterConfig, ActiveFilter types

### Commit 3: VariantCell + API

- `VariantCell.tsx`: Variant display with hover-to-edit (pencil → input + ✓/✕)
- `MobileVariantEditor.tsx`: Popover for mobile variant editing
- API: Add variant `id` and purchase option `id` fields

### Commit 4: Migration + Responsive + Empty State

- Wire up TanStack useReactTable in ProductManagementClient
- Multi-field search, responsive columns, column filters
- Empty state with shadcn Empty component

---

## Files Changed (12 modified/new)

| File | Action | Commit |
|------|--------|--------|
| `app/admin/_components/data-table/DataTableShell.tsx` | Create | 1 |
| `app/admin/_components/data-table/DataTableHeaderCell.tsx` | Create | 1 |
| `app/admin/_components/data-table/DataTablePagination.tsx` | Create | 1 |
| `app/admin/_components/data-table/index.ts` | Modify | 1 |
| `app/admin/_components/data-table/DataTableFilter.tsx` | Create | 2 |
| `app/admin/_components/data-table/DataTableActionBar.tsx` | Modify | 2 |
| `app/admin/_components/data-table/types.ts` | Modify | 2 |
| `app/admin/products/_components/VariantCell.tsx` | Create | 3 |
| `app/admin/products/_components/MobileVariantEditor.tsx` | Create | 3 |
| `app/api/admin/products/route.ts` | Modify | 3 |
| `app/admin/products/ProductManagementClient.tsx` | Modify | 3, 4 |
| `components/ui/empty.tsx` | Create (shadcn) | 4 |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 30 }`
3. Extract ACs into `docs/plans/products-table-v2-ACs.md` using the ACs template
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human → human fills **Reviewer** column

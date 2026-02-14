# Add-Ons Bundle Rework — Acceptance Criteria

> Branch: `feat/addon-edit` — Base: `main`

## UI (verified by screenshots)

| # | Criteria | QC |
|---|---------|-----|
| AC-UI-1 | Add-Ons section shows title "Add-Ons" and description "Bundle products to upsell on product page and shopping cart" | |
| AC-UI-2 | Product combobox groups products by their DB categories (alphabetized within each group), with "Added" group at top (non-selectable), uncategorized products in a headerless group | |
| AC-UI-3 | Add row shows only grouped combobox + [+] Add button (no variant/discount fields) | |
| AC-UI-4 | Per-product card shows product name + type badge in header, trash button on opposite end | |
| AC-UI-5 | Variant table is borderless with columns: checkbox, Name, Price, Discount, Adj. Price | |
| AC-UI-6 | "All variants" row shows dashes for Price and Adj. Price columns | |
| AC-UI-7 | When "All variants" is checked, individual variant checkboxes are disabled; discount controls on individual rows are muted/disabled | |
| AC-UI-8 | When any individual variant is checked, "All variants" checkbox is disabled | |
| AC-UI-9 | Discount control shows $/% Select toggle + InputGroup value input | |
| AC-UI-10 | Adj. Price shows computed effective price in regular text (same style as other table cells) | |
| AC-UI-11 | When product has only 1 variant, "All variants" row is hidden — the single variant is the default | |
| AC-UI-12 | When product has >=2 variants, "All variants" row is shown and checked by default | |

## Functional (verified by code review)

| # | Criteria | QC |
|---|---------|-----|
| AC-FN-1 | `DiscountType` enum (FIXED, PERCENTAGE) and `discountType`/`discountValue` fields added to AddOnLink schema | |
| AC-FN-2 | POST `/api/admin/products/[id]/addons` accepts only `{ addOnProductId }`, creates row with `addOnVariantId=null` | |
| AC-FN-3 | PUT `/api/admin/products/[id]/addons/sync` accepts `{ addOnProductId, selections[] }`, transactionally replaces all rows for that product combo | |
| AC-FN-4 | DELETE `/api/admin/products/[id]/addons?addOnProductId=xxx` removes all rows for that product combo | |
| AC-FN-5 | GET includes all variants of each add-on product with ONE_TIME purchase option prices (including salePriceInCents) | |
| AC-FN-6 | Effective price computation: FIXED -> `max(0, price - value)`, PERCENTAGE -> `round(price * (1 - value/100))`, null -> `price` | |
| AC-FN-7 | Storefront `getProductAddOns` computes effective price from `discountType`/`discountValue` instead of `discountedPriceInCents` | |
| AC-FN-8 | Storefront handles `addOnVariantId=null` by expanding to one AddOnItem per in-stock variant | |
| AC-FN-9 | Checkbox/discount state changes sync to DB via debounced (600ms) PUT call | |
| AC-FN-10 | Logical paths use declarative maps/lookups, not if/else conditionals | |

## Regression (verified by screenshot + test)

| # | Criteria | QC |
|---|---------|-----|
| AC-REG-1 | Product detail page add-ons carousel renders correctly with discounted prices | |
| AC-REG-2 | Cart add-ons suggestions display correctly | |
| AC-REG-3 | `npm run precheck` passes | |
| AC-REG-4 | Existing add-on links continue working on storefront after schema migration | |

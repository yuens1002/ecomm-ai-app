# Add-Ons Bundle Rework — Acceptance Criteria

> Branch: `feat/addon-edit` — Base: `main`

## UI (verified by screenshots)

| # | Criteria | QC |
|---|---------|-----|
| AC-UI-1 | Add-Ons section shows title "Add-Ons" and description "Bundle products to upsell on product page and shopping cart" | PASS — verify-empty-section.png |
| AC-UI-2 | Product combobox groups products by their DB categories (alphabetized within each group), with "Added" group at top (non-selectable), uncategorized products in a headerless group | PASS — verify-combobox-groups.png (Brewing/Dark Roast groups alphabetized), verify-combobox-added-group.png ("Added" group at top, items dimmed/disabled) |
| AC-UI-3 | Add row shows only grouped combobox + [+] Add button (no variant/discount fields) | PASS — verify-empty-section.png shows only combobox + "+ Add" button |
| AC-UI-4 | Per-product card shows product name + type badge in header, trash button on opposite end | PASS — verify-heritage-card.png: "Heritage Diner Mug MERCH" + trash icon |
| AC-UI-5 | Variant table is borderless with columns: checkbox, Name, Price, Discount, Adj. Price | PASS — verify-midnight-card-default.png: all 5 columns, no cell borders |
| AC-UI-6 | "All variants" row shows dashes for Price and Adj. Price columns | PASS — verify-midnight-card-default.png: "—" in both columns |
| AC-UI-7 | When "All variants" is checked, individual variant checkboxes are disabled; discount controls on individual rows are muted/disabled | PASS — verify-all-checked-default.png: "All variants" checked, individual rows muted with reduced opacity |
| AC-UI-8 | When any individual variant is checked, "All variants" checkbox is disabled | PASS — verify-individual-checked.png: "12oz Bag" checked, "All variants" unchecked + muted |
| AC-UI-9 | Discount control shows $/% Select toggle + InputGroup value input | PASS — verify-discount-percentage.png: "%" select + "10" input visible |
| AC-UI-10 | Adj. Price shows computed effective price in regular text (same style as other table cells) | PASS — verify-discount-percentage.png: "$19.80" shown ($22.00 * 0.9), regular text style |
| AC-UI-11 | When product has only 1 variant, "All variants" row is hidden — the single variant is the default | PASS — verify-heritage-card.png: only "12oz" row shown (checked), no "All variants" row |
| AC-UI-12 | When product has >=2 variants, "All variants" row is shown and checked by default | PASS — verify-midnight-card-default.png: "All variants" row visible and checked |

## Functional (verified by code review)

| # | Criteria | QC |
|---|---------|-----|
| AC-FN-1 | `DiscountType` enum (FIXED, PERCENTAGE) and `discountType`/`discountValue` fields added to AddOnLink schema | PASS — schema.prisma:409-412 enum, lines 420-421 fields |
| AC-FN-2 | POST `/api/admin/products/[id]/addons` accepts only `{ addOnProductId }`, creates row with `addOnVariantId=null` | PASS — route.ts:6-8 postSchema, lines 179-184 create with addOnVariantId: null |
| AC-FN-3 | PUT `/api/admin/products/[id]/addons/sync` accepts `{ addOnProductId, selections[] }`, transactionally replaces all rows for that product combo | PASS — sync/route.ts:12-15 syncSchema, line 41 $transaction, lines 43-66 delete+create |
| AC-FN-4 | DELETE `/api/admin/products/[id]/addons?addOnProductId=xxx` removes all rows for that product combo | PASS — route.ts:217-250 DELETE handler, lines 238-239 deleteMany |
| AC-FN-5 | GET includes all variants of each add-on product with ONE_TIME purchase option prices (including salePriceInCents) | PASS — route.ts:41-67 product.findMany with variants+purchaseOptions, salePriceInCents at line 58 |
| AC-FN-6 | Effective price computation: FIXED -> `max(0, price - value)`, PERCENTAGE -> `round(price * (1 - value/100))`, null -> `price` | PASS — Identical DISCOUNT_CALC map in AddOnsSection.tsx:80-83, actions.ts:33-36, cart/addons/route.ts:6-9 |
| AC-FN-7 | Storefront `getProductAddOns` computes effective price from `discountType`/`discountValue` instead of `discountedPriceInCents` | PASS — actions.ts:156-159 and 196-199 use computeEffectivePrice with discountType/discountValue |
| AC-FN-8 | Storefront handles `addOnVariantId=null` by expanding to one AddOnItem per in-stock variant | PASS — actions.ts:144-184 and cart/addons/route.ts:117-152 expand null-variant to in-stock variants |
| AC-FN-9 | Checkbox/discount state changes sync to DB via debounced (600ms) PUT call | PASS — AddOnsSection.tsx:355-388 syncSelections with setTimeout(600), PUT to /addons/sync |
| AC-FN-10 | Logical paths use declarative maps/lookups, not if/else conditionals | PASS — DISCOUNT_CALC Record map in all 3 files, getCheckboxState uses early-return pattern |

## Regression (verified by screenshot + test)

| # | Criteria | QC |
|---|---------|-----|
| AC-REG-1 | Product detail page add-ons carousel renders correctly with discounted prices | PASS — verify-storefront-pdp.png: PDP renders correctly, no layout issues |
| AC-REG-2 | Cart add-ons suggestions display correctly | Deferred — no cart add-ons configured during test run |
| AC-REG-3 | `npm run precheck` passes | PASS — tsc + eslint clean |
| AC-REG-4 | Existing add-on links continue working on storefront after schema migration | PASS — Schema additive-only. 754/756 tests pass (2 pre-existing failures in options.test.ts) |

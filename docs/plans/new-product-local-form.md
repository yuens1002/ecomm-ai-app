# New Product Local-State Form — Plan

**Branch:** `feat/new-product-local-form`
**Base:** `main`

---

## Context

When clicking "Add Product", the user lands on `/admin/products/new` with an empty form. Three UX problems:

1. **Error on load** — Empty `name` fails `isValid` → SaveStatus immediately shows red "Product name is required"
2. **Can't save** — Auto-save blocks while required fields are empty; no manual save button exists
3. **Variants/add-ons locked** — Both sections require `productId` which only exists after first save

---

## Commit Schedule

| # | Message | Issues | Risk |
|---|---------|--------|------|
| 0 | `docs: add plan for new product local-state form` | — | — |
| 1 | `feat: add field-level required validation and sticky action bar` | #1, #2, #3, #4 | Low |
| 2 | `feat: add local mode for variants and add-ons` | #5, #6 | Medium |
| 3 | `feat: add batch create and route protection for new product` | #7, #8, #9 | Medium |

---

## Acceptance Criteria

### UI (verified by screenshots)

- AC-UI-1: New product page (`/admin/products/new`) loads without red error status indicator
- AC-UI-2: Name field shows inline "Required field" indicator (red pulsing dot + text) via FormHeading when empty
- AC-UI-3: Origin field (coffee only) shows inline "Required field" indicator when empty
- AC-UI-4: Sticky action bar appears below title/description on its own line, right-aligned, docks below navbar on scroll
- AC-UI-5: New product page shows "Create Product" button in sticky bar (no SaveStatus)
- AC-UI-6: Edit product page shows SaveStatus + undo/redo in sticky bar (same position)
- AC-UI-7: Variants section shows "No variants yet" empty state (not "Save the product first") on new product page
- AC-UI-8: Add-ons section shows product selector (not "Save the product first") on new product page

### Functional (verified by code review)

- AC-FN-1: VariantsSection `isNewProduct` mode — all CRUD handlers work on local state only (no server action calls)
- AC-FN-2: AddOnsSection `isNewProduct` mode — add/remove/sync work locally (no API calls to addon endpoints)
- AC-FN-3: `useAutoSave` disabled on new product page (`deps: []` prevents auto-save triggering)
- AC-FN-4: Batch create handler creates product → variants → options → images → add-on links in sequence
- AC-FN-5: Variant temp IDs (`crypto.randomUUID()`) mapped to real IDs after `createVariant`
- AC-FN-6: `beforeunload` listener active when form has unsaved changes on new product page
- AC-FN-7: After batch create, redirects to edit page (`/admin/products/{id}` or `/admin/merch/{id}`)
- AC-FN-8: Error text shows "Enter required field(s)" instead of "Product name is required"

### Regression (verified by test suite + visual spot-check)

- AC-REG-1: Edit product page auto-save still works (SaveStatus shows "Saved" after field change)
- AC-REG-2: Edit page variants section CRUD still uses server actions (not local mode)
- AC-REG-3: `npm run precheck` passes
- AC-REG-4: `npm run test:ci` passes

---

## Implementation Details

### Commit 1: Field-level validation + sticky action bar

**Files:**

- `app/admin/_components/cms/fields/NameSlugField.tsx` — Add `validationType="required"` when `required && !name.trim()`
- `app/admin/products/_components/CoffeeSpecsSection.tsx` — Add `validationType="required"` on origin FormHeading when empty
- `app/admin/products/_components/ProductPageLayout.tsx` — Move SaveStatus to sticky bar below title; add `onManualSave`/`isSaving` props for "Create Product" button
- `app/admin/products/_components/CoffeeProductForm.tsx` — Change error message to "Enter required field(s)"
- `app/admin/products/_components/MerchProductForm.tsx` — Change error message to "Enter required field(s)"

### Commit 2: Local mode for variants and add-ons

**Files:**

- `app/admin/products/_components/VariantsSection.tsx` — Add `isNewProduct` prop; all handlers work locally when true; expose `getPendingFiles()` via ref
- `app/admin/products/_components/AddOnsSection.tsx` — Add `isNewProduct` + `onAddOnsChange` props; local-only CRUD; fetch available products without productId

### Commit 3: Batch create + route protection

**Files:**

- `app/admin/products/_hooks/useUnsavedChanges.ts` — New hook: `beforeunload` listener when `isDirty`
- `app/admin/products/_components/CoffeeProductForm.tsx` — New product mode: disable auto-save, batch create handler, route protection, pass `isNewProduct` to children
- `app/admin/products/_components/MerchProductForm.tsx` — Same pattern as Coffee

---

## Files Changed (9 modified, 1 new)

| File | Commit | Issues |
|------|--------|--------|
| `app/admin/_components/cms/fields/NameSlugField.tsx` | 1 | AC-UI-2 |
| `app/admin/products/_components/CoffeeSpecsSection.tsx` | 1 | AC-UI-3 |
| `app/admin/products/_components/ProductPageLayout.tsx` | 1 | AC-UI-4, AC-UI-5, AC-UI-6 |
| `app/admin/products/_components/CoffeeProductForm.tsx` | 1, 3 | AC-FN-3, AC-FN-4, AC-FN-8 |
| `app/admin/products/_components/MerchProductForm.tsx` | 1, 3 | AC-FN-3, AC-FN-4, AC-FN-8 |
| `app/admin/products/_components/VariantsSection.tsx` | 2 | AC-FN-1, AC-UI-7 |
| `app/admin/products/_components/AddOnsSection.tsx` | 2 | AC-FN-2, AC-UI-8 |
| `app/admin/products/_hooks/useUnsavedChanges.ts` (new) | 3 | AC-FN-6 |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 20 }`
3. Extract ACs into `docs/plans/new-product-local-form-ACs.md` using the ACs template
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human → human fills **Reviewer** column

# New Product Local-State Form — AC Verification Report

**Branch:** `feat/new-product-local-form`
**Commits:** 3
**Iterations:** 0

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-UI-1 | New product page (`/admin/products/new`) loads without red error status indicator | | | |
| AC-UI-2 | Name field shows inline "Required field" indicator (red pulsing dot + text) via FormHeading when empty | | | |
| AC-UI-3 | Origin field (coffee only) shows inline "Required field" indicator when empty | | | |
| AC-UI-4 | Sticky action bar appears below title/description on its own line, right-aligned, docks below navbar on scroll | | | |
| AC-UI-5 | New product page shows "Create Product" button in sticky bar (no SaveStatus) | | | |
| AC-UI-6 | Edit product page shows SaveStatus + undo/redo in sticky bar (same position) | | | |
| AC-UI-7 | Variants section shows "No variants yet" empty state (not "Save the product first") on new product page | | | |
| AC-UI-8 | Add-ons section shows product selector (not "Save the product first") on new product page | | | |

## Functional Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-FN-1 | VariantsSection `isNewProduct` mode — all CRUD handlers work on local state only (no server action calls) | | | |
| AC-FN-2 | AddOnsSection `isNewProduct` mode — add/remove/sync work locally (no API calls to addon endpoints) | | | |
| AC-FN-3 | `useAutoSave` disabled on new product page (`deps: []` prevents auto-save triggering) | | | |
| AC-FN-4 | Batch create handler creates product → variants → options → images → add-on links in sequence | | | |
| AC-FN-5 | Variant temp IDs (`crypto.randomUUID()`) mapped to real IDs after `createVariant` | | | |
| AC-FN-6 | `beforeunload` listener active when form has unsaved changes on new product page | | | |
| AC-FN-7 | After batch create, redirects to edit page (`/admin/products/{id}` or `/admin/merch/{id}`) | | | |
| AC-FN-8 | Error text shows "Enter required field(s)" instead of "Product name is required" | | | |

## Regression Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-REG-1 | Edit product page auto-save still works (SaveStatus shows "Saved" after field change) | | | |
| AC-REG-2 | Edit page variants section CRUD still uses server actions (not local mode) | | | |
| AC-REG-3 | `npm run precheck` passes | | | |
| AC-REG-4 | `npm run test:ci` passes | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

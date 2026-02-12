# Shared Table Components — AC Verification Report

**Branch:** `feat/shared-table-components`
**Commits:** 1
**Iterations:** 0

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## Functional Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-FN-1 | Shared `StatusBadge`, `RecordActionMenu`, `RecordItemsList`, `ShippingAddressDisplay` components exist in `components/shared/` with correct exported interfaces | | | |
| AC-FN-2 | `formatPrice()` utility exists in `record-utils.ts` using `Intl.NumberFormat` | | | |
| AC-FN-3 | No local `StatusBadge`, `getStatusBadge`, `OrderItemsList`, `ShipToInfo`, `formatShippingAddress`, or `formatPrice` definitions remain in any consumer file | | | |
| AC-FN-4 | `RecordItem` and `RecordShipping` interfaces are exported from `MobileRecordCard.tsx` | | | |
| AC-FN-5 | `npm run typecheck` passes with zero errors | | | |
| AC-FN-6 | `npm run lint` passes with zero errors | | | |

## Regression Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-REG-1 | Admin orders table (xl) — status badges show correct colors per status (PENDING=yellow, PICKED_UP=purple, FAILED=red), three-dot menus render, items show name+variant+qty | | | |
| AC-REG-2 | Admin subscriptions table (xl) — status badges correct (ACTIVE=green, PAUSED=yellow, cancelAtPeriodEnd=orange "Canceling"), action menus render, addresses display | | | |
| AC-REG-3 | Site orders table (xl) — product names are clickable links, prices formatted correctly, status badges render | | | |
| AC-REG-4 | Admin orders card view (< xl) — cards render with status, items, actions, price (spot-check at md breakpoint) | | | |
| AC-REG-5 | Admin subscriptions card view (< xl) — cards render with status, customer, actions (spot-check at md breakpoint) | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

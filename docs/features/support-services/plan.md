# Support & Services Rework — Plan

**Branch:** `feat/support-plans-restructure`
**Base:** `main`
**Contract:** `docs/internal/phase3-contract-update.md` + `docs/internal/phase3-contract-addendum.md`

---

## Context

Rework all Support pages to align with the Phase 3 platform contract. Implements metered support (tickets + 1:1 sessions), dual credit pools (plan + purchased), a la carte packages, inactive/renewal state, platform-hosted legal docs, and FREE user a la carte flow. Consolidates Manage page into a tabbed "License & Terms" page.

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan and ACs for support-services rework` | — |
| 1 | `refactor: update LicenseInfo type with Phase 3 contract fields` | Low |
| 2 | `refactor: rename nav/routes to Support & Services` | Low |
| 3 | `feat: unified ticket form with credit display and a la carte` | High |
| 4 | `feat: rework Subscriptions page with active/inactive/none + a la carte` | High |
| 5 | `feat: plan detail page with add-on packages and snapshotAt` | Medium |
| 6 | `feat: tabbed License & Terms with hybrid legal docs` | High |
| 7 | `chore: cleanup unused components and verify precheck` | Low |

---

## Acceptance Criteria

See `docs/plans/support-services-ACs.md` for the full verification report.

---

## Implementation Details

### Commit 1: Update LicenseInfo type

- `lib/license-types.ts` — Add `plan`, `lapsed`, `support`, `alaCarte`, `legal` fields
- `lib/support-types.ts` — Update `SupportUsage` → use `CreditPool` type (plan + purchased)
- `lib/license.ts` — Ensure `validateLicense()` passes through new fields

### Commit 2: Nav + route rename

- `lib/config/admin-nav.ts` — "Support & Services", "Subscriptions", remove Manage, "License & Terms"
- `lib/navigation/route-registry.ts` — Labels + remove manage + update terms label
- `app/admin/support/plans/PlanPageClient.tsx` — `title="Subscriptions"`
- `app/admin/support/manage/page.tsx` — Redirect to `/admin/support/terms?tab=license`

### Commit 3: Unified ticket form

- `app/admin/support/SupportPageClient.tsx` — Full rework with `computeTicketPageConfig()`
- `app/admin/support/SupportTicketsSection.tsx` — Ticket list only + EmptyState
- `app/admin/support/CommunityIssueSection.tsx` — DELETE
- `app/admin/support/page.tsx` — Fetch license + tickets + a la carte
- `app/admin/support/actions.ts` — Update to use new API endpoints
- `lib/legal.ts` — NEW — `fetchLegalDoc(slug)`, `acceptLegalDocs(slugs[])`

### Commit 4: Subscriptions page rework

- `app/admin/support/plans/PlanPageClient.tsx` — Full rework with `computePlanCardConfig()`
- Two sections: Plans (cards) + A La Carte Packages (separate)
- Active/Inactive/None states, post-checkout flow

### Commit 5: Plan detail page with add-on packages

- `app/admin/support/plans/[slug]/PlanDetailClient.tsx` — Add-on packages + snapshotAt versioning

### Commit 6: Tabbed License & Terms

- `app/admin/support/terms/TermsPageClient.tsx` — Full rewrite (3 tabs)
- `app/admin/support/terms/page.tsx` — Updated data fetching

### Commit 7: Cleanup

- Delete `CommunityIssueSection.tsx`, `ManagePageClient.tsx`
- `npm run precheck` — 0 errors

---

## Files Changed (est. 15 modified, 1 new, 2 deleted)

| File | Commit | Notes |
|------|--------|-------|
| `lib/license-types.ts` | 1 | Phase 3 type additions |
| `lib/support-types.ts` | 1 | CreditPool type |
| `lib/license.ts` | 1 | Pass through new fields |
| `lib/config/admin-nav.ts` | 2 | Labels, remove Manage |
| `lib/navigation/route-registry.ts` | 2 | Labels, remove manage |
| `app/admin/support/manage/page.tsx` | 2 | Redirect |
| `app/admin/support/SupportPageClient.tsx` | 3 | Full rework |
| `app/admin/support/SupportTicketsSection.tsx` | 3 | Ticket list only |
| `app/admin/support/CommunityIssueSection.tsx` | 3 | DELETE |
| `app/admin/support/page.tsx` | 3 | Updated data fetching |
| `app/admin/support/actions.ts` | 3 | New API endpoints |
| `lib/legal.ts` | 3 | NEW — legal doc fetch + accept |
| `app/admin/support/plans/PlanPageClient.tsx` | 2, 4 | Title + full rework |
| `app/admin/support/plans/[slug]/PlanDetailClient.tsx` | 5 | Add-on packages + snapshotAt |
| `app/admin/support/terms/TermsPageClient.tsx` | 6 | Full rewrite — tabbed |
| `app/admin/support/terms/page.tsx` | 6 | Updated data fetching |
| `app/admin/support/manage/ManagePageClient.tsx` | 7 | DELETE |

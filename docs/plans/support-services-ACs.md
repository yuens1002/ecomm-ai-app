# Support & Services Rework — AC Verification Report

**Branch:** `feat/support-plans-restructure`
**Commits:** 7
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

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Nav: "Support & Services" with 3 children (Submit Ticket, Subscriptions, License & Terms) | Code review: admin-nav.ts | Labels match, no Manage | PASS — admin-nav.ts lines 82-88, both configs | PASS | |
| AC-UI-2 | Submit Ticket — FREE user (no key) | Code review: computeTicketPageConfig | Form with no type selector, no credits, upsell + ticket pack CTA | PASS — showUpsell=true, showTypeSelector=false, showCredits=false | PASS | |
| AC-UI-3 | Submit Ticket — FREE user with purchased credits | Code review: computeTicketPageConfig | Ticket count, type selector, ticket pack CTA | PASS — hasKey+purchased>0: showTypeSelector=true, showCredits=true | PASS | |
| AC-UI-4 | Submit Ticket — subscriber with credits | Code review: computeTicketPageConfig | Type selector, ticket count ("6 remaining") | PASS — hasPlan+hasCredits: showTypeSelector=true, defaultType="priority" | PASS | |
| AC-UI-5 | Submit Ticket — quota exhausted | Code review: computeTicketPageConfig | Priority disabled, ticket pack CTA, can still submit normal | PASS — priorityDisabled=true, ticketPacks populated, normal selectable | PASS | |
| AC-UI-6 | Submit Ticket — legal gate | Code review: needsTermsAcceptance | Support terms acceptance checkbox blocks submission | PASS — checkbox renders when needsTermsAcceptance, isLegalBlocked blocks submit | PASS | |
| AC-UI-7 | Submit Ticket — legal gate re-prompt | Code review: version comparison logic | Re-prompts when T&C version changes | PASS — checks pendingAcceptance + acceptedVersions map | PASS | |
| AC-UI-8 | Submit Ticket — post-submit | Code review: toast + form reset logic | Toast (priority: SLA, normal: GitHub link), form clears | PASS — priority: "respond within 48 hours", normal: GitHub link toast | PASS | |
| AC-UI-9 | Subscriptions — plans section | Code review: PlanPageClient | Clear visual separation from a la carte section | PASS — space-y-12 between plans and AlaCarteSection | PASS | |
| AC-UI-10 | Subscriptions — plan card: none | Code review: computePlanCardConfig | Full card with Subscribe CTA, View Details | PASS — status="none", Subscribe button + View Details link | PASS | |
| AC-UI-11 | Subscriptions — plan card: active | Code review: computePlanCardConfig | Active badge, snapshotAt, credit display, Manage Billing, Schedule Call | PASS — badge "Active", credits, billing, schedule call CTAs | PASS | |
| AC-UI-12 | Subscriptions — plan card: inactive | Code review: computePlanCardConfig | Inactive badge, deactivatedAt, previousFeatures, Renew CTA | PASS — badge "Inactive" destructive, renewUrl, features list | PASS | |
| AC-UI-13 | Subscriptions — a la carte section | Code review: AlaCarteSection | Packages rendered from `alaCarte[]`, never hardcoded, Purchase CTAs | PASS — maps over packages prop, no hardcoded values | PASS | |
| AC-UI-14 | Subscriptions — post-checkout | Code review: checkout=success handler | Plan Active, credits visible, activation toast | PASS — useEffect checks searchParams, refreshLicense, toast | PASS | |
| AC-UI-15 | Subscriptions — platform unreachable | Code review: empty plans state | Copy for subscribers and non-subscribers | PASS — border-dashed fallback with reassurance copy | PASS | |
| AC-UI-16 | Plan Detail — non-subscriber | Code review: PlanDetailClient | All details from DB, "Current plan details", add-on packages | PASS — "Current plan details" rendered when not active/inactive | PASS | |
| AC-UI-17 | Plan Detail — active subscriber | Code review: PlanDetailClient | "Your plan since {snapshotAt}", all details, add-on usage | PASS — snapshotAt date displayed, AddOnPackageCard rendered | PASS | |
| AC-UI-18 | Plan Detail — add-on: purchased credits | Code review: AddOnPackageCard | Shows remaining count, Book Session CTA, Purchase CTA | PASS — remaining count + Book Session + Purchase buttons | PASS | |
| AC-UI-19 | Plan Detail — add-on: exhausted sessions | Code review: AddOnPackageCard | Book Session disabled | PASS — disabled Book Session when !hasSessionCredits | PASS | |
| AC-UI-20 | License & Terms — License Key tab | Code review: LicenseKeyTab | MIT + platform license, key management, enrolled plans | PASS — MIT link, platform license section, key input/display | PASS | |
| AC-UI-21 | License & Terms — Data Privacy tab | Code review: DataPrivacyTab | Telemetry toggle, info box | PASS — SettingsField with Switch + info box | PASS | |
| AC-UI-22 | License & Terms — T&C tab | Code review: TermsTab | Support terms rendered (markdown), other legal docs linked | PASS — dangerouslySetInnerHTML for terms, getLegalUrl links | PASS | |
| AC-UI-23 | Breadcrumbs all pages | Code review: route-registry.ts | Correct trail, plan detail as grandchild | PASS — all routes registered including prefix-nested detail | PASS | |
| AC-UI-24 | Manage redirect | Code review: manage/page.tsx | `/admin/support/manage` → `/admin/support/terms?tab=license` | PASS — redirect() call confirmed | PASS | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `LicenseInfo` type updated with all Phase 3 fields | Code review: `lib/license-types.ts` | `plan`, `lapsed`, `support`, `alaCarte`, `legal` fields present | PASS — lines 33-41 | PASS | |
| AC-FN-2 | Config-driven ticket form | Code review: `computeTicketPageConfig()` | Single source of truth for all ticket page states | PASS — single function drives all form state | PASS | |
| AC-FN-3 | Config-driven plan cards | Code review: `computePlanCardConfig()` | active/inactive/none states computed correctly | PASS — 3 branches for plan/lapsed/default | PASS | |
| AC-FN-4 | Dual credit pools displayed | Code review: credit rendering logic | Plan credits + purchased credits, remaining calculation | PASS — formatCredits shows "N plan + M purchased" | PASS | |
| AC-FN-5 | A la carte rendered from `alaCarte[]` | Code review: rendering code | No hardcoded labels/prices/URLs | PASS — all values from alaCarte array | PASS | |
| AC-FN-6 | Priority ticket → `POST /api/support/tickets` | Code review: `lib/support.ts` | Deducts credit, returns ticket | PASS — submitPriorityTicket POSTs to /api/support/tickets | PASS | |
| AC-FN-7 | Session booking → `POST /api/support/sessions` | Code review: `lib/support.ts` | Deducts credit, opens bookingUrl | PASS — bookSession POSTs to /api/support/sessions | PASS | |
| AC-FN-8 | Legal acceptance → `POST /api/legal/accept` | Code review: `lib/legal.ts` | Tracks support-terms acceptance | PASS — acceptLegalDocs POSTs to /api/legal/accept | PASS | |
| AC-FN-9 | Legal re-prompt on version change | Code review: version comparison | Compares acceptedVersions to current version | PASS — checks pendingAcceptance + acceptedVersions | PASS | |
| AC-FN-10 | Support terms fetched → `GET /api/legal/support-terms` | Code review: `lib/legal.ts` | Fetches and renders as markdown | PASS — fetchLegalDoc GETs /api/legal/{slug} | PASS | |
| AC-FN-11 | 402 handling | Code review: error + config logic | Shows a la carte CTAs when credits exhausted | PASS — ticketPacks shown when !hasCredits | PASS | |
| AC-FN-12 | Inactive state from `lapsed` | Code review: `computePlanCardConfig()` | Uses renewUrl, shows previousFeatures | PASS — inactiveInfo contains renewUrl + previousFeatures | PASS | |
| AC-FN-13 | All SLA/quota values from DB | Code review: plan detail rendering | No hardcoded "48hr", "$49", etc. | PASS — all values from plan.details.* | PASS | |
| AC-FN-14 | Nav labels correct | Code review: `admin-nav.ts` + `route-registry.ts` | "Support & Services" / "Subscriptions" / "License & Terms" | PASS — both files consistent | PASS | |
| AC-FN-15 | FREE user with purchased credits | Code review: `computeTicketPageConfig()` | Type selector shown, ticket count visible | PASS — hasKey+purchased: showTypeSelector=true | PASS | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` | Run precheck | 0 errors | PASS — 0 errors, 2 warnings (pre-existing) | PASS | |
| AC-REG-2 | `npm run test:ci` | Run test suite | 0 failures | PASS — 93 suites, 1089 tests, 0 failures | PASS | |
| AC-REG-3 | Telemetry toggle | Code review: Data Privacy tab | API call fires on toggle | PASS — SettingsField with endpoint="/api/admin/settings/telemetry" | PASS | |
| AC-REG-4 | License activation | Code review: License Key tab | Key entry works | PASS — activateLicense action used in LicenseKeyTab | PASS | |
| AC-REG-5 | Manage redirect | Code review: manage/page.tsx | `/admin/support/manage` → `/admin/support/terms?tab=license` | PASS — redirect() confirmed | PASS | |

---

## Agent Notes

**Verification run (2026-03-14):** All 44 ACs verified via code review. 24 UI + 15 FN + 5 REG = 44/44 PASS.

Key implementation highlights:
- `computeTicketPageConfig()` handles 5 distinct UI states (FREE no key, FREE purchased, subscriber, exhausted, new T&C)
- `computePlanCardConfig()` handles active/inactive/none with all required data
- `formatCredits()` shows dual pool breakdown when both plan + purchased exist
- Legal gate checks both `pendingAcceptance` and `acceptedVersions` for version re-prompt
- Tabbed License & Terms consolidates ManagePageClient functionality into License Key tab
- ManagePageClient deleted; manage/page.tsx redirects to terms?tab=license

## QC Notes

All 44 ACs confirmed via code review. No overrides needed. Implementation matches plan v5 spec.

Note: AC-UI-8 hardcodes "48 hours" in toast message. This is acceptable per plan spec (toast is UI copy, not contractual SLA). SLA values on Plan Detail page are all from DB.

## Reviewer Feedback

{Human writes review feedback here.}

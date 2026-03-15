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
| AC-UI-1 | Nav: "Support & Services" with 3 children (Submit Ticket, Subscriptions, License & Terms) | Screenshot: nav dropdown | Labels match, no Manage | | | |
| AC-UI-2 | Submit Ticket — FREE user (no key) | Screenshot: mock FREE state | Form with no type selector, no credits, upsell + ticket pack CTA | | | |
| AC-UI-3 | Submit Ticket — FREE user with purchased credits | Screenshot: mock FREE+purchased state | Ticket count, type selector, ticket pack CTA | | | |
| AC-UI-4 | Submit Ticket — subscriber with credits | Screenshot: mock PRO state | Type selector, ticket count ("6 remaining") | | | |
| AC-UI-5 | Submit Ticket — quota exhausted | Screenshot: mock exhausted state | Priority disabled, ticket pack CTA, can still submit normal | | | |
| AC-UI-6 | Submit Ticket — legal gate | Screenshot: mock pendingAcceptance state | Support terms acceptance checkbox blocks submission | | | |
| AC-UI-7 | Submit Ticket — legal gate re-prompt | Code review: version comparison logic | Re-prompts when T&C version changes | | | |
| AC-UI-8 | Submit Ticket — post-submit | Code review: toast + form reset logic | Toast (priority: SLA, normal: GitHub link), form clears, ticket in list | | | |
| AC-UI-9 | Subscriptions — plans section | Screenshot: plans section | Clear visual separation from a la carte section | | | |
| AC-UI-10 | Subscriptions — plan card: none | Screenshot: mock none state | Full card with Subscribe CTA, View Details | | | |
| AC-UI-11 | Subscriptions — plan card: active | Screenshot: mock active state | Active badge, snapshotAt, credit display, Manage Billing, Schedule Call | | | |
| AC-UI-12 | Subscriptions — plan card: inactive | Screenshot: mock inactive state | Inactive badge, deactivatedAt, previousFeatures, Renew CTA | | | |
| AC-UI-13 | Subscriptions — a la carte section | Screenshot: a la carte packages | Packages rendered from `alaCarte[]`, never hardcoded, Purchase CTAs | | | |
| AC-UI-14 | Subscriptions — post-checkout | Code review: checkout=success handler | Plan Active, credits visible, activation toast | | | |
| AC-UI-15 | Subscriptions — platform unreachable | Screenshot: error state | Copy for both subscribers and non-subscribers | | | |
| AC-UI-16 | Plan Detail — non-subscriber | Screenshot: mock none state | All details from DB, "Current plan details", add-on packages | | | |
| AC-UI-17 | Plan Detail — active subscriber | Screenshot: mock active state | "Your plan since {snapshotAt}", all details, add-on usage | | | |
| AC-UI-18 | Plan Detail — add-on: purchased credits | Screenshot: mock purchased state | Shows remaining count, Book Session CTA (sessions), Purchase CTA | | | |
| AC-UI-19 | Plan Detail — add-on: exhausted sessions | Screenshot: mock exhausted state | Book Session disabled | | | |
| AC-UI-20 | License & Terms — License Key tab | Screenshot: License Key tab | MIT + platform license, key management, enrolled plans | | | |
| AC-UI-21 | License & Terms — Data Privacy tab | Screenshot: Data Privacy tab | Telemetry toggle, info box | | | |
| AC-UI-22 | License & Terms — T&C tab | Screenshot: T&C tab | Support terms rendered (markdown), other legal docs linked | | | |
| AC-UI-23 | Breadcrumbs all pages | Screenshot: each page breadcrumb | Correct trail, plan detail as grandchild | | | |
| AC-UI-24 | Manage redirect | Code review: redirect logic | `/admin/support/manage` → `/admin/support/terms?tab=license` | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `LicenseInfo` type updated with all Phase 3 fields | Code review: `lib/license-types.ts` | `plan`, `lapsed`, `support`, `alaCarte`, `legal` fields present | | | |
| AC-FN-2 | Config-driven ticket form | Code review: `computeTicketPageConfig()` | Single source of truth for all ticket page states | | | |
| AC-FN-3 | Config-driven plan cards | Code review: `computePlanCardConfig()` | active/inactive/none states computed correctly | | | |
| AC-FN-4 | Dual credit pools displayed | Code review: credit rendering logic | Plan credits + purchased credits, remaining calculation | | | |
| AC-FN-5 | A la carte rendered from `alaCarte[]` | Code review: rendering code | No hardcoded labels/prices/URLs | | | |
| AC-FN-6 | Priority ticket → `POST /api/support/tickets` | Code review: `actions.ts` | Deducts credit, returns githubIssueUrl | | | |
| AC-FN-7 | Session booking → `POST /api/support/sessions` | Code review: `actions.ts` | Deducts credit, opens bookingUrl | | | |
| AC-FN-8 | Legal acceptance → `POST /api/legal/accept` | Code review: `lib/legal.ts` | Tracks support-terms acceptance | | | |
| AC-FN-9 | Legal re-prompt on version change | Code review: version comparison | Compares acceptedVersions to current version | | | |
| AC-FN-10 | Support terms fetched → `GET /api/legal/support-terms` | Code review: `lib/legal.ts` | Fetches and renders as markdown | | | |
| AC-FN-11 | 402 handling | Code review: error handling in actions | Shows a la carte CTAs from error response | | | |
| AC-FN-12 | Inactive state from `lapsed` | Code review: `computePlanCardConfig()` | Uses renewUrl, shows previousFeatures | | | |
| AC-FN-13 | All SLA/quota values from DB | Code review: no hardcoded values | No hardcoded "48hr", "$49", etc. | | | |
| AC-FN-14 | Nav labels correct | Code review: `admin-nav.ts` + `route-registry.ts` | "Support & Services" / "Subscriptions" / "License & Terms" | | | |
| AC-FN-15 | FREE user with purchased credits | Code review: `computeTicketPageConfig()` | Type selector shown, ticket count visible | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` | Run precheck | 0 errors | | | |
| AC-REG-2 | `npm run test:ci` | Run test suite | 0 failures | | | |
| AC-REG-3 | Telemetry toggle | Code review: Data Privacy tab | API call fires on toggle | | | |
| AC-REG-4 | License activation | Code review: License Key tab | Key entry works | | | |
| AC-REG-5 | Manage redirect | Code review: manage/page.tsx | `/admin/support/manage` → `/admin/support/terms?tab=license` | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here.}

## QC Notes

{Main thread writes fix notes here.}

## Reviewer Feedback

{Human writes review feedback here.}

# Phase 2B: Plan Page + Support v2 — AC Verification Report

**Branch:** `feat/phase2b-license-plan`
**Commits:** cfbc9bd, 58f1e73, ca65dc8, 2c6b852, 319dae2, d33df7a
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
| AC-UI-1 | Plan card shows plan data from API | Screenshot: `/admin/settings/plan` with TRIAL mock | Plan name, description, price ($29/mo), benefits list, quotas all rendered from plan payload — nothing hardcoded | | | |
| AC-UI-2 | Subscribe CTA on plan card (not subscribed) | Screenshot: `/admin/settings/plan` with FREE mock | [Subscribe] button visible on plan card for non-subscribed plan | | | |
| AC-UI-3 | Active state on plan card (subscribed) | Screenshot: `/admin/settings/plan` with TRIAL mock (has priority-support) | Active badge, [Manage Billing] button visible — no Subscribe button | | | |
| AC-UI-4 | Feature catalog grouped by category | Screenshot: `/admin/settings/plan` | Features grouped (Analytics, AI, Support), green check for enabled, muted for disabled | | | |
| AC-UI-5 | License key section (FREE vs licensed) | Screenshot: `/admin/settings/plan` with FREE vs TRIAL mock | FREE: input + Activate button. Licensed: masked key + Remove button | | | |
| AC-UI-6 | Non-subscriber sees community form only | Screenshot: `/admin/support` with FREE mock | Community issue form with title, details, email fields. No priority section. Upsell text linking to `/admin/settings/plan` | | | |
| AC-UI-7 | Subscriber sees priority section + community section | Screenshot: `/admin/support` with TRIAL mock | Priority Support section at top with usage bar + form. Community issue section below | | | |
| AC-UI-8 | Ticket list shows Priority badge column | Screenshot: `/admin/support` with TRIAL mock + tickets | Each ticket row has a "Priority" badge distinguishing ticket type | | | |
| AC-UI-9 | No ticket list when no tickets | Screenshot: `/admin/support` with TRIAL mock (0 tickets) | Priority section shows usage + form but no ticket list section | | | |
| AC-UI-10 | Quota exhausted disables priority form | Code review: `SupportTicketsSection.tsx` | When `usage.remaining === 0`, priority submit button disabled with "quota exhausted" message | | | |
| AC-UI-11 | Plan page in admin nav | Screenshot: Settings nav dropdown | "Plan" appears in Settings group between "AI" and "Shipping" | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `fetchPlans()` calls `GET /api/plans` | Code review: `lib/plans.ts` | Fetches `${PLATFORM_URL}/api/plans`, no auth, returns `Plan[]`, graceful fallback on error | | | |
| AC-FN-2 | Plan types match handoff doc | Code review: `lib/plan-types.ts` | `Plan` has slug, name, description, price, currency, interval, features, details (benefits, quotas), highlight | | | |
| AC-FN-3 | `createCommunityIssue()` calls `POST /api/support/issues` | Code review: `lib/support.ts` | Sends `{ title, body, email }`, no auth header, 10s timeout, returns `{ issueNumber, issueUrl }` | | | |
| AC-FN-4 | Community issue types | Code review: `lib/support-types.ts` | `CommunityIssueInput { title, body?, email }`, `CommunityIssueResponse { issueNumber, issueUrl }` | | | |
| AC-FN-5 | `submitCommunityIssue` server action | Code review: `actions.ts` | Zod: title required min 1 max 200, email required email format, body max 5000 optional. Uses `requireAdmin()` | | | |
| AC-FN-6 | `startCheckout(planSlug)` action | Code review: `app/admin/settings/plan/actions.ts` | Calls `POST /api/checkout` with `{ planSlug, instanceId }`, returns `{ url }` | | | |
| AC-FN-7 | Support page fetches tickets for any user with license key | Code review: `app/admin/support/page.tsx` | Fetch tickets when license key exists (not just when `priority-support` feature present) | | | |
| AC-FN-8 | Plan page server component | Code review: `app/admin/settings/plan/page.tsx` | Calls `validateLicense()` + `fetchPlans()` + `getFeatureCatalog()`, passes all to client | | | |
| AC-FN-9 | Plan page license actions | Code review: `app/admin/settings/plan/actions.ts` | `activateLicense(formData)` uses `setLicenseKey` + `invalidateCache` + `validateLicense`. `deactivateLicense()` sets key to empty. | | | |
| AC-FN-10 | Graceful degradation: plans fetch fails | Code review: `app/admin/settings/plan/page.tsx` | If `fetchPlans()` throws, page still renders with empty plans array | | | |
| AC-FN-11 | Graceful degradation: community issue fails | Code review: `CommunityIssueSection.tsx` | Error toast on failure, form not cleared on error | | | |
| AC-FN-12 | Plan nav entry | Code review: `admin-nav.ts` | `{ label: "Plan", href: "/admin/settings/plan" }` in both desktop and mobile nav configs | | | |
| AC-FN-13 | UpgradePrompt links to Plan page | Code review: `UpgradePrompt.tsx` | `href` changed from `/admin/support` to `/admin/settings/plan` | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Existing priority ticket submission works | Code review: `SupportTicketsSection.tsx` + `actions.ts` | `submitSupportTicket` action and `createTicket` client unchanged | | | |
| AC-REG-2 | Data Privacy section unchanged | Screenshot: `/admin/support` | Telemetry toggle section renders identically | | | |
| AC-REG-3 | Precheck passes | `npm run precheck` | 0 errors | | | |
| AC-REG-4 | Test suite passes | `npm run test:ci` | All tests pass, 0 failures | | | |

---

## Agent Notes

{Filled by verification sub-agent}

## QC Notes

{Filled by main thread after reading agent report}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

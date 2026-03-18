# Support & Plans Restructure — Acceptance Criteria

## UI — States

| AC | Page | State | What to verify |
|----|------|-------|----------------|
| AC-UI-1 | Nav | — | "Support & Plans" top-level with LifeBuoy icon, 4 children visible in dropdown |
| AC-UI-2 | Submit Ticket | FREE (no key) | Community issue form (title + body, no email field), upsell text linking to Plans, empty ticket list card with EmptyState |
| AC-UI-3 | Submit Ticket | Licensed + priority-support | Priority ticket form with quota bar, ticket list (if tickets exist) |
| AC-UI-4 | Submit Ticket | Licensed + quota exhausted | Submit button disabled, "Ticket limit reached" message |
| AC-UI-5 | Plans | Not subscribed | Plan card(s) with name, desc, price. No status badge. "Subscribe" CTA + "View Details" link |
| AC-UI-6 | Plans | Active subscription | Plan card shows "Active" badge. "Manage" CTA instead of "Subscribe" |
| AC-UI-7 | Plans | Expired subscription | Plan card shows "Expired" badge. "Renew" CTA |
| AC-UI-8 | Plans | Platform unreachable | Graceful empty state or error message, no crash |
| AC-UI-9 | Plan Detail | Not subscribed | Full details (benefits, SLA, quotas, scope, excludes). "Subscribe" CTA |
| AC-UI-10 | Plan Detail | Subscribed | Full details. "Manage Billing" CTA. No "Subscribe" |
| AC-UI-11 | Plan Detail | Expired | Full details. "Renew" CTA |
| AC-UI-12 | Manage | No key (FREE) | License key input + Activate button |
| AC-UI-13 | Manage | Licensed | Masked key (read-only) with show/hide toggle. Current plan(s). Renewal/expiration. "Manage Billing" CTA. Refresh button. No remove button |
| AC-UI-14 | Terms | — | 2-col desktop, stacked mobile. Data privacy toggle functional. Plan terms displayed |
| AC-UI-15 | Breadcrumb | All pages | Correct breadcrumb trail (Support & Plans > Submit Ticket / Plans / Manage / Terms) |

## FN — Functional

| AC | What | How to verify |
|----|------|---------------|
| AC-FN-1 | Community issue sends `email` + `instanceId` | Code review: `submitCommunityIssue` fetches contactEmail from siteSettings + instanceId from `getInstanceId(prisma)` |
| AC-FN-2 | No contactEmail blocks submission | Trigger submit with no contactEmail configured → error message prompting Settings > Contact |
| AC-FN-3 | `startCheckout` sends `callbackUrl` + `customerEmail` + `instanceId` | Code review: checkout request body includes all 3 fields |
| AC-FN-4 | Auto-activation endpoint | `POST /api/admin/platform/activate` with `{ licenseKey, email }` saves key + invalidates cache |
| AC-FN-5 | Plan status derived correctly | Active = plan feature in `license.features`. Expired = feature absent but key exists. Not subscribed = no key |
| AC-FN-6 | Manage show/hide key toggle | Click toggle: key reveals full value / masks back |
| AC-FN-7 | Nav registered correctly | "Support & Plans" in both desktop and mobile nav configs |
| AC-FN-8 | Route registry complete | All 6 routes registered with correct parentId and matchMode |

## E2E — Happy + Failed Paths

| AC | Path | Steps | Expected |
|----|------|-------|----------|
| AC-E2E-1 | Happy: Subscribe | Plans → Subscribe CTA → redirects to Stripe checkout URL | Browser navigates to `checkout.stripe.com/...` |
| AC-E2E-2 | Happy: Auto-activate | Platform POSTs `{ licenseKey, email }` to `/api/admin/platform/activate` | Key saved, license validates, Manage page shows active subscription |
| AC-E2E-3 | Happy: Manual activate | Manage → paste key → Activate → key saved | Manage page shows masked key, plan(s), Manage Billing CTA |
| AC-E2E-4 | Happy: Submit community issue | Submit Ticket → fill title + body → Submit | Toast with GitHub issue link, form cleared |
| AC-E2E-5 | Happy: Submit priority ticket | Submit Ticket (with priority-support) → fill title → Submit | Ticket appears in list, quota decrements |
| AC-E2E-6 | Failed: Checkout platform down | Plans → Subscribe → platform returns 500 | Error toast "Checkout failed", no redirect |
| AC-E2E-7 | Failed: Auto-activate bad key | POST `/api/admin/platform/activate` with invalid payload | 400 response, key not saved |
| AC-E2E-8 | Failed: Community issue no contactEmail | Submit Ticket → Submit without contactEmail configured | Error message: "Configure contact email in Settings > Contact" |
| AC-E2E-9 | Failed: Plans API unreachable | Plans page loads with platform down | Empty/error state, no crash |

## REG — Regression

| AC | What | How to verify |
|----|------|---------------|
| AC-REG-1 | Precheck passes | `npm run precheck` — 0 errors |
| AC-REG-2 | Test suite passes | `npm run test:ci` — 0 failures |
| AC-REG-3 | Other nav items unchanged | Dashboard, Products, Orders, Pages, Management, Settings all render correctly |
| AC-REG-4 | Telemetry toggle works on Terms page | Toggle on/off, verify API call to `/api/admin/settings/telemetry` |

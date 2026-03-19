# Demo Domain Migration + Simulated Checkout — Plan

**Branch:** `feature/fix-alacarte-checkout-demo-guard`
**Base:** `main`

---

## Context

Two related goals:

1. **Domain migration** — `artisanroast.app` (root) is moving from the OSS store to the platform
   marketing site. The demo store moves to `demo.artisanroast.app`. All OSS repo references need
   to reflect this.

2. **Demo checkout** — The demo site (`demo.artisanroast.app`, `NEXT_PUBLIC_DEMO_MODE=true`) needs
   a simulated checkout flow so visitors can experience the full upgrade/purchase UX without hitting
   Stripe or the platform API. Currently the buttons are just disabled — not a good demo experience.

3. **Dev environment** — `dev.artisanroast.app` is now wired to the platform `dev` branch. The OSS
   store's `.env.local` has `PLATFORM_URL=https://dev.artisanroast.app` for real end-to-end testing
   with Stripe test keys (no demo mode).

---

## Commit Schedule

| # | Message | Issues | Risk |
|---|---------|--------|------|
| 0 | `docs: add plan for demo domain migration and simulated checkout` | — | — |
| 1 | `chore: update artisanroast.app references to demo.artisanroast.app` | — | Low |
| 2 | `feat: simulated checkout flow for demo mode` | — | Low |

---

## Acceptance Criteria

### UI (verified by screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Demo site: clicking "Purchase" on Add-Ons page shows loading spinner | Screenshot: navigate to `/admin/support/add-ons`, click Purchase | Spinner visible during transition |
| AC-UI-2 | Demo site: after "purchase", lands on success state with demo disclaimer | Screenshot: add-ons page post-confirm | Toast or banner visible with "Demo mode — no charge made" |
| AC-UI-3 | Demo site: clicking subscribe on Plans page triggers simulated flow | Screenshot: `/admin/support/plans`, click subscribe CTA | Loading → success state |
| AC-UI-4 | Demo site: dashed "Checkout is disabled in demo mode" banner removed from Add-Ons | Screenshot: add-ons page | Banner gone, buttons active |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | `startAlaCarteCheckout` returns local `/admin/support/add-ons?demo=success` URL when `DEMO_MODE=true` server-side | Code review: `app/admin/support/add-ons/actions.ts` | Early return with local URL before platform fetch |
| AC-FN-2 | `startCheckout` (plans) returns local `/admin/support/plans?demo=success` URL when `DEMO_MODE=true` | Code review: `app/admin/support/plans/actions.ts` | Same pattern |
| AC-FN-3 | Success URL renders a toast on mount when `?demo=success` query param present | Code review: client component reads searchParam + fires toast | Toast shown once on page load |
| AC-FN-4 | All `NEXT_PUBLIC_APP_URL` fallbacks in code reference `demo.artisanroast.app` | Code review: layout.tsx, sitemap.ts, robots.ts, OG images | No remaining `artisanroast.app` fallbacks |
| AC-FN-5 | README demo links point to `demo.artisanroast.app` | Code review: README.md | All 3 links updated |
| AC-FN-6 | Non-demo mode (dev env): buttons are enabled, `startAlaCarteCheckout` calls `dev.artisanroast.app` platform | Code review: actions.ts + `.env.local` | `PLATFORM_URL=https://dev.artisanroast.app` used |

### Regression (verified by test suite + spot-check)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | `npm run precheck` passes with 0 errors | Run precheck | 0 TypeScript + ESLint errors |
| AC-REG-2 | `npm run test:ci` passes | Run test suite | 0 failures |
| AC-REG-3 | Non-demo checkout flow unchanged — buttons enabled, calls platform API | Code review: actions.ts guard is server-side env only | DEMO_MODE guard exits early only when env is true |

---

## UX Flows

| Flow | Question | Answer |
|------|----------|--------|
| Demo purchase | What happens when visitor clicks Purchase? | Loading spinner → redirect to same page with `?demo=success` → toast "Purchase complete (Demo — no charge made)" |
| Real purchase (dev/prod) | What happens when admin clicks Purchase? | Loading spinner → server action calls platform `/api/checkout` → redirect to Stripe hosted checkout |
| Error | What does the user see when the platform call fails? | Destructive toast with error message from platform response |
| Loading | What does the user see while waiting? | Spinner on button, button disabled |

---

## Implementation Details

### Commit 1: Domain reference updates (already done)

**Files:**

- `README.md` — 3 demo links → `demo.artisanroast.app`
- `CLAUDE.md` — Live URL updated
- `app/layout.tsx` — `NEXT_PUBLIC_APP_URL` fallback
- `app/sitemap.ts` — fallback
- `app/robots.ts` — fallback
- `app/opengraph-image.tsx` — fallback
- `app/(site)/about/opengraph-image.tsx` — fallback
- `app/(site)/features/opengraph-image.tsx` — fallback
- `.env.example` — comment updated to `manage.artisanroast.app`

### Commit 2: Simulated checkout

**Strategy:** Server-side `DEMO_MODE` check in both checkout actions returns a local success URL
instead of calling the platform. Client reads `?demo=success` query param and fires a toast.

**Files:**

- `app/admin/support/add-ons/actions.ts` — add early return when `process.env.NEXT_PUBLIC_DEMO_MODE === "true"`
- `app/admin/support/plans/actions.ts` — same pattern
- `app/admin/support/add-ons/AddOnsPageClient.tsx` — read `?demo=success`, fire toast, remove static disabled banner
- `app/admin/support/plans/PlanPageClient.tsx` — read `?demo=success`, fire toast, remove static `disabled={DEMO_MODE}`
- `app/admin/support/SupportPageClient.tsx` — same for ticket pack buttons

---

## Ops Tasks (Vercel — manual, not code)

These are infrastructure steps outside the codebase:

| # | Task | Status |
|---|------|--------|
| 1 | Remove `artisanroast.app` from OSS store Vercel project | Pending |
| 2 | Add `artisanroast.app` to platform Vercel project | Pending |
| 3 | Set `NEXT_PUBLIC_APP_URL=https://demo.artisanroast.app` on demo deployment env vars | Pending |
| 4 | `dev.artisanroast.app` aliased to platform `dev` branch | Done |

---

## Files Changed

| File | Commit | Notes |
|------|--------|-------|
| `README.md` | 1 | 3 links |
| `CLAUDE.md` | 1 | Live URL |
| `app/layout.tsx` | 1 | fallback URL |
| `app/sitemap.ts` | 1 | fallback URL |
| `app/robots.ts` | 1 | fallback URL |
| `app/opengraph-image.tsx` | 1 | fallback URL |
| `app/(site)/about/opengraph-image.tsx` | 1 | fallback URL |
| `app/(site)/features/opengraph-image.tsx` | 1 | fallback URL |
| `.env.example` | 1 | comment |
| `app/admin/support/add-ons/actions.ts` | 2 | demo guard |
| `app/admin/support/plans/actions.ts` | 2 | demo guard |
| `app/admin/support/add-ons/AddOnsPageClient.tsx` | 2 | toast on success |
| `app/admin/support/plans/PlanPageClient.tsx` | 2 | toast on success |
| `app/admin/support/SupportPageClient.tsx` | 2 | toast on success |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan doc
2. Register branch in `verification-status.json`: `{ status: "planned", acs_total: 9 }`
3. Transition to `"implementing"` when coding begins (Commit 2 is the only remaining work)
4. After Commit 2 → transition to `"pending"` → run precheck → run `/ac-verify`

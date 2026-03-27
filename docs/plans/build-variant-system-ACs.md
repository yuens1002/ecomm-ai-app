# Build Variant System — AC Verification Report

**Branch:** `feat/build-variant-system`
**Commits:** 0
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
| AC-UI-1 | Demo sign-in page shows one-click buttons only — no email form, no OAuth | Screenshot: `/auth/signin` with `NEXT_PUBLIC_BUILD_VARIANT=demo` | Page shows "Sign in as Admin" + "Sign in as Demo Customer" buttons; no email input, no Google/GitHub buttons | | | |
| AC-UI-2 | Live sign-in page shows email form + OAuth — no demo buttons | Screenshot: `/auth/signin` without build variant set | Page shows email/password form + Google + GitHub; no demo one-click buttons | | | |
| AC-UI-3 | DELETE address button triggers demo toast, not deletion | Interactive: `/account?tab=addresses` → click delete (X) on an address | Toast appears: "This action is disabled in demo mode." Address still exists | | | |
| AC-UI-4 | DELETE account button triggers demo toast, not deletion | Interactive: `/account?tab=danger` → click "Delete My Account" | Toast appears; account still exists | | | |
| AC-UI-5 | Plan subscribe triggers fake redirect + toast | Interactive: `/admin/support/plans` → click Subscribe on a paid plan | Redirects to `?demo=success`; toast: "Purchase complete — Demo mode, no charge made." | | | |
| AC-UI-6 | Add-ons purchase triggers single-button loading + fake redirect | Interactive: `/admin/support/add-ons` → click Purchase on one package | Only that button shows loading; redirects to `?demo=success`; toast shown | | | |
| AC-UI-7 | Admin profile save triggers demo toast | Interactive: `/admin/profile` → edit name → click Save | Toast: "Changes are disabled in demo mode." Name unchanged | | | |
| AC-UI-8 | Store name save triggers demo toast | Interactive: `/admin/settings` (general) → edit store name → save | Toast: "Changes are disabled in demo mode." Store name unchanged | | | |
| AC-UI-9 | T&C acceptance status shown on terms page | Screenshot: `/admin/support/terms` | Page heading or near heading shows acceptance status (accepted date or "not yet accepted") | | | |
| AC-UI-10 | Account connected accounts email CTA navigates to security tab | Interactive: `/account?tab=accounts` → click email CTA | Navigates to `/account?tab=security` | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `lib/demo.ts` exports `IS_DEMO` + `demoBypassAction`; `lib/demo-hooks.ts` exports `useDemoDeleteGuard` + `useDemoProtectedAction` | Code review: `lib/demo.ts`, `lib/demo-hooks.ts` | All 4 exports present with correct signatures (split for Next.js server/client boundary) | | | |
| AC-FN-2 | `middleware.ts` deleted from repo | Code review: repo root | File does not exist | | | |
| AC-FN-3 | `NEXT_PUBLIC_BUILD_VARIANT` replaces `NEXT_PUBLIC_DEMO_MODE` everywhere | Code review: grep for `NEXT_PUBLIC_DEMO_MODE` | Zero occurrences in source files (`.env.example`, `playwright.config.ts`, seeds, etc.) | | | |
| AC-FN-4 | All 10 delete actions wired to `useDemoDeleteGuard` | Code review: `AddressesTab.tsx`, `DangerZoneTab.tsx`, `ProductManagementClient.tsx`, `VariantsSection.tsx`, `ReviewModerationClient.tsx`, `EditPageClient.tsx`, CMS block components, `SocialLinksManagement.tsx`, `MenuBuilder.tsx` | Each delete handler passes through `useDemoDeleteGuard` | | | |
| AC-FN-5 | Plans checkout wrapped with `demoBypassAction` | Code review: `app/admin/support/plans/actions.ts` | `startCheckout` calls `demoBypassAction` when `IS_DEMO` | | | |
| AC-FN-6 | Add-ons checkout wrapped with `demoBypassAction` + per-package `isPending` | Code review: `app/admin/support/add-ons/AddOnsPageClient.tsx` | `isPending` tracked per package ID (not a single boolean) | | | |
| AC-FN-7 | Protected writes wired to `useDemoProtectedAction` | Code review: profile, settings/store, settings/ai, settings/contact, social links create/edit, submit ticket | Each protected save handler passes through `useDemoProtectedAction` | | | |
| AC-FN-8 | `demoSignIn` server action removed from `auth/actions.ts` | Code review: `app/auth/actions.ts` | No `demoSignIn` function present | | | |
| AC-FN-9 | Fake checkout logic removed from live build (plans + add-ons actions) | Code review: `plans/actions.ts`, `add-ons/actions.ts` | No fake redirect logic present when `IS_DEMO` is false (build-time dead code) | | | |
| AC-FN-10 | `app/api/test/reset-cache/route.ts` gated or removed | Code review: route file | Route does not exist or is explicitly demo-only | | | |
| AC-FN-11 | Auth pages are a complete swap (not conditional show/hide) | Code review: `app/auth/signin/signin-content.tsx`, `app/auth/admin-signin/admin-signin-content.tsx` | Demo build renders only demo buttons; live build renders only email+OAuth. No shared branch rendering both. | | | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | VAPI files fully removed — no broken imports | Code review: grep for `vapi`, `VoiceBarista`, `use-vapi` in source + `package.json` | Zero references in source; `@vapi-ai/web` removed from `package.json` if present | | | |
| AC-REG-2 | Precheck passes (TypeScript + ESLint) | `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Test suite passes | `npm run test:ci` | 0 test failures | | | |
| AC-REG-4 | Real writes still work in demo — product create saves | Interactive: `/admin/products/new` → create a product in demo mode | Product is created and appears in product list | | | |
| AC-REG-5 | Admin sign-in works in demo build (one-click) | Interactive: `/auth/admin-signin` → click Sign in as Admin | Successfully authenticates and redirects to `/admin` | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

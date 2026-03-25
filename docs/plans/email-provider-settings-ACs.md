# Email Provider Settings — AC Verification Report

**Branch:** `feature/email-provider-settings`
**Commits:** 4
**Iterations:** 0
**Total ACs:** 23 (5 UI + 8 FN + 4 REG + 6 QA)

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

> **How column — verification methods for UI ACs:**
>
> | Method | Format | Evidence required |
> |--------|--------|-------------------|
> | **Screenshot** | `Screenshot: {page/element at breakpoint}` | `.png` file path in Agent/QC columns |
> | **Interactive** | `Interactive: {click/hover} → screenshot` | `.png` file path in Agent/QC columns |
> | **Exercise** | `Exercise: {form flow} → screenshot` | `.png` file path in Agent/QC columns |
> | **Code review** | `Code review: {file}` | file:line refs (no screenshot needed) |

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Contact settings page shows "Email Sending (Resend)" section with API key, from email, from name fields and Save button | Screenshot: `/admin/settings/contact` desktop | Section visible below existing Email Configuration section | | | |
| AC-UI-2 | API key field masks its value by default (password type) | Screenshot: `/admin/settings/contact` — API key input | Input renders masked (dots), not plain text | | | |
| AC-UI-3 | Saving email settings shows success toast | Interactive: fill API key + from email + from name → click Save → screenshot | Success toast visible | | | |
| AC-UI-4 | Test Send button is present and wired to a POST action | Code review: `app/api/admin/settings/email/route.ts` POST handler + `app/admin/settings/contact/page.tsx` Test Send button | POST handler exists; button renders and calls it | | | |
| AC-UI-5 | Setup flow shows optional Store Name field | Screenshot: `/setup` account/store step | Store Name input visible; not marked required (no asterisk, no `required` attr) | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | GET `/api/admin/settings/email` returns `apiKey` (masked), `fromEmail`, `fromName` from DB | Code review: `app/api/admin/settings/email/route.ts` GET handler | `apiKey` masked to last 4 chars (e.g., `••••abcd`); `fromEmail` and `fromName` returned as-is | | | |
| AC-FN-2 | PUT `/api/admin/settings/email` calls `setEmailProviderSettings()` and persists all 3 keys | Code review: PUT handler → `lib/config/app-settings.ts` `setEmailProviderSettings` | DB upsert confirmed for `email.apiKey`, `email.fromEmail`, `email.fromName` | | | |
| AC-FN-3 | `send-order-confirmation` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-order-confirmation.ts` | `from` field built from `fromName <fromEmail>` returned by DB getter; `getResend(apiKey)` called | | | |
| AC-FN-4 | `send-merchant-notification` uses `getEmailProviderSettings()` for from address; merchant TO email falls back to `contactEmail` DB key | Code review: `lib/email/send-merchant-notification.ts` | `from` uses DB settings; merchant email: env → `contactEmail` DB → empty | | | |
| AC-FN-5 | `send-review-request` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-review-request.ts` | `from` field uses DB `fromName`/`fromEmail` | | | |
| AC-FN-6 | `send-new-review-notification` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-new-review-notification.ts` | `from` field uses DB `fromName`/`fromEmail` | | | |
| AC-FN-7 | All 4 send functions pass DB `apiKey` to `getResend()` | Code review: each send function | `getResend(apiKey)` called with DB-sourced key in all 4 functions | | | |
| AC-FN-8 | Setup route accepts `storeName`, seeds `store_name`, `email.fromName`, `email.fromEmail` in DB | Code review: `app/api/admin/setup/route.ts` | Three `SiteSettings` upserts present; only runs when `storeName` non-empty | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` passes (0 TypeScript + ESLint errors) | Run `npm run precheck` | 0 errors, 0 warnings that block build | | | |
| AC-REG-2 | `npm run test:ci` passes (0 failures) | Run `npm run test:ci` | 0 test failures | | | |
| AC-REG-3 | Existing `contactEmail` field on contact settings page still saves correctly | Code review: PUT handler in `app/api/admin/settings/email/route.ts` | `contactEmail` upsert preserved alongside new email provider writes | | | |
| AC-REG-4 | Email send functions work when no DB settings exist (env var fallback) | Code review: `getEmailProviderSettings()` fallback chain in `lib/config/app-settings.ts` | Chain: DB value → `RESEND_FROM_EMAIL` env → hardcoded default; no crash when DB empty | | | |

## QA Dry Run Acceptance Criteria

> These ACs verify Commit 4 — that VERIFICATION.md and `scripts/qa-agent.js` were updated
> correctly, and that a local dry run against a fresh DB confirms end-to-end store name seeding.
>
> **Dry run command (run after `npx prisma migrate reset --force` + `npm run dev`):**
> ```bash
> BASE_URL=http://localhost:3000 QA_MODEL=claude-haiku-4-5-20251001 node scripts/qa-agent.js
> ```
> Required env in `.env.local`: `QA_ADMIN_NAME`, `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`,
> `QA_STORE_NAME=Morning Roast`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-QA-1 | `VERIFICATION.md` AC-IF-5 includes store name as the first fill step | Code review: `VERIFICATION.md` AC-IF-5 row | Row reads "Fill Store Name=$QA_STORE_NAME first, then Full Name=…" before other fields | | | |
| AC-QA-2 | `VERIFICATION.md` AC-KV-3 requires store name in both header AND footer | Code review: `VERIFICATION.md` AC-KV-3 row | Pass condition reads "$QA_STORE_NAME visible in header AND footer" | | | |
| AC-QA-3 | `qa-agent.js` AC_HINTS["AC-IF-5"] fills 5 fields with store name first; MAX_TURNS = 18 | Code review: `scripts/qa-agent.js` AC_HINTS["AC-IF-5"] + MAX_TURNS line | Hint lists 5 fills starting with `fill('Store name', Store name)`; MAX_TURNS for AC-IF-5 is 18 | | | |
| AC-QA-4 | `qa-agent.js` AC_HINTS["AC-KV-3"] added, instructs agent to check header and footer | Code review: `scripts/qa-agent.js` AC_HINTS["AC-KV-3"] | Hint present; instructs PASS only if store name found in both locations | | | |
| AC-QA-5 | Local dry run — AC-IF-5 PASS: agent fills "Morning Roast" as store name, setup completes, `/admin` reached | Dry run: run qa-agent.js locally; observe AC-IF-5 result line | `✅ AC-IF-5 PASS` in output; "Morning Roast" confirmed as filled value in agent log | | | |
| AC-QA-6 | Local dry run — AC-KV-3 PASS: "Morning Roast" visible in both storefront header and footer | Dry run: observe AC-KV-3 result line | `✅ AC-KV-3 PASS` in output; evidence line confirms header and footer match | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

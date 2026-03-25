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
| AC-UI-1 | Contact settings page shows "Email Sending (Resend)" section with API key, from email, from name fields and Save button | Screenshot: `/admin/settings/contact` desktop | Section visible below existing Email Configuration section | PASS — `.screenshots/email-provider-verify/verify-desktop-contact-scrolled.png`: "Email Sending (Resend)" section visible with API Key, From Email, From Name fields and "Send Test Email" button | CONFIRMED — screenshot evidence clear; section renders correctly below existing sections | |
| AC-UI-2 | API key field masks its value by default (password type) | Screenshot: `/admin/settings/contact` — API key input | Input renders masked (dots), not plain text | PASS — `.screenshots/email-provider-verify/verify-apikey-input.png`: element screenshot shows dots (••••••••); `type="password"` confirmed by Playwright `getAttribute("type")` returning `"password"` | CONFIRMED — dual evidence (screenshot + DOM attribute) | |
| AC-UI-3 | Saving email settings shows success toast | Interactive: fill API key + from email + from name → click Save → screenshot | Success toast visible | PASS — `.screenshots/email-provider-verify/verify-toast-topright.png`: toast "Success / Settings saved successfully" visible in top-right corner after clicking Save on From Email field | CONFIRMED — toast visible in screenshot; demo DB data issue noted but code path is correct | |
| AC-UI-4 | Test Send button is present and wired to a POST action | Code review: `app/api/admin/settings/email/route.ts` POST handler + `app/admin/settings/contact/page.tsx` Test Send button | POST handler exists; button renders and calls it | PASS — `app/api/admin/settings/email/route.ts:152`: `export async function POST()` handler exists; `app/admin/settings/contact/page.tsx:219-231`: `<Button onClick={handleTestSend}>` calls `fetch("/api/admin/settings/email", { method: "POST" })` at line 23 | CONFIRMED — both handler and button wiring verified; code review appropriate for this AC | |
| AC-UI-5 | Setup flow shows optional Store Name field | Screenshot: `/setup` account/store step | Store Name input visible; not marked required (no asterisk, no `required` attr) | PASS (code review) — `/setup` redirects to "You're all set" (admin exists); verified via code review: `app/setup/_components/setup-flow.tsx:172-179`: `<Input id="storeName" name="storeName" type="text">` has no `required` attribute and no required marker; `name` field at line 183 has `required` confirming intentional omission from storeName | CONFIRMED — code review acceptable given /setup redirect on dev instance; optionality clearly intentional by contrast with `name` field | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | GET `/api/admin/settings/email` returns `apiKey` (masked), `fromEmail`, `fromName` from DB | Code review: `app/api/admin/settings/email/route.ts` GET handler | `apiKey` masked to last 4 chars (e.g., `••••abcd`); `fromEmail` and `fromName` returned as-is | PASS — `route.ts:35-40`: `rawKey.length > 4 ? "••••${rawKey.slice(-4)}" : ...`; `fromEmail: provider.fromEmail` at line 47; `fromName: provider.fromName` at line 48. Confirmed live: GET returns `{ apiKey: "••••qdSu", fromEmail: "...", fromName: "Artisan Roast" }` | CONFIRMED — masking logic correct; live API response verified | |
| AC-FN-2 | PUT `/api/admin/settings/email` calls `setEmailProviderSettings()` and persists all 3 keys | Code review: PUT handler → `lib/config/app-settings.ts` `setEmailProviderSettings` | DB upsert confirmed for `email.apiKey`, `email.fromEmail`, `email.fromName` | PASS — `route.ts:121-134`: builds `providerUpdate` for apiKey (with `startsWith("••••")` guard at line 125), fromEmail (line 129), fromName (line 130); calls `setEmailProviderSettings(providerUpdate)` at line 133. `app-settings.ts:480-488`: upserts `email.apiKey`, `email.fromEmail`, `email.fromName` keys | CONFIRMED — masked-key guard prevents overwriting real key with placeholder | |
| AC-FN-3 | `send-order-confirmation` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-order-confirmation.ts` | `from` field built from `fromName <fromEmail>` returned by DB getter; `getResend(apiKey)` called | PASS — `send-order-confirmation.ts:39`: destructures apiKey/fromEmail/fromName from `getEmailProviderSettings()`; line 41: `getResend(apiKey)` called; line 45: `from` built as `"fromName <fromEmail>"` with fallback to bare fromEmail or default | CONFIRMED — DB-first pattern correct with proper fallback | |
| AC-FN-4 | `send-merchant-notification` uses `getEmailProviderSettings()` for from address; merchant TO email falls back to `contactEmail` DB key | Code review: `lib/email/send-merchant-notification.ts` | `from` uses DB settings; merchant email: env → `contactEmail` DB → empty | PASS — `send-merchant-notification.ts:22-29`: `merchantEmail = process.env.RESEND_MERCHANT_EMAIL \|\| process.env.MERCHANT_EMAIL \|\| contactEmailRow?.value \|\| ""`; line 38: `getEmailProviderSettings()`; line 49: `from: fromName ? \`${fromName} <${fromEmail}>\` : ...` | CONFIRMED — three-tier merchant email fallback chain correct | |
| AC-FN-5 | `send-review-request` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-review-request.ts` | `from` field uses DB `fromName`/`fromEmail` | PASS — `send-review-request.ts:17`: `const { apiKey, fromEmail, fromName } = await getEmailProviderSettings()`; line 28: `getResend(apiKey \|\| undefined)`; line 32: `from: fromName ? \`${fromName} <${fromEmail}>\` : fromEmail \|\| "<noreply@example.com>"` | CONFIRMED | |
| AC-FN-6 | `send-new-review-notification` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-new-review-notification.ts` | `from` field uses DB `fromName`/`fromEmail` | PASS — `send-new-review-notification.ts:29`: `const { apiKey, fromEmail, fromName } = await getEmailProviderSettings()`; line 41: `getResend(apiKey \|\| undefined)`; line 44: `from: fromName ? \`${fromName} <${fromEmail}>\` : fromEmail \|\| "<noreply@example.com>"` | CONFIRMED | |
| AC-FN-7 | All 4 send functions pass DB `apiKey` to `getResend()` | Code review: each send function | `getResend(apiKey)` called with DB-sourced key in all 4 functions | PASS — `send-order-confirmation.ts:41`; `send-merchant-notification.ts:45`; `send-review-request.ts:28`; `send-new-review-notification.ts:41` — all call `getResend(apiKey \|\| undefined)` where `apiKey` is destructured from `getEmailProviderSettings()` | CONFIRMED — all 4 functions consistent | |
| AC-FN-8 | Setup route accepts `storeName`, seeds `store_name`, `email.fromName`, `email.fromEmail` in DB | Code review: `app/api/admin/setup/route.ts` | Three `SiteSettings` upserts present; only runs when `storeName` non-empty | PASS — `route.ts:104-123`: `if (storeName && typeof storeName === "string" && storeName.trim().length > 0)` guard; upserts `store_name` (line 107), `email.fromName` (line 113), `email.fromEmail` (line 119, seeds empty string) inside `Promise.all` | CONFIRMED — guard prevents empty string seeding; `email.fromEmail` correctly seeded empty (configured separately) | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` passes (0 TypeScript + ESLint errors) | Run `npm run precheck` | 0 errors, 0 warnings that block build | PASS — `npm run precheck` output: 0 TypeScript errors; 1 pre-existing ESLint warning on `SalesClient.tsx` (TanStack Table, unrelated to this branch); 0 errors | CONFIRMED — pre-existing warning is on main, not introduced by this branch | |
| AC-REG-2 | `npm run test:ci` passes (0 failures) | Run `npm run test:ci` | 0 test failures | PASS — 94 suites, 1095 tests, 0 failures, 1 snapshot passed | CONFIRMED | |
| AC-REG-3 | Existing `contactEmail` field on contact settings page still saves correctly | Code review: PUT handler in `app/api/admin/settings/email/route.ts` | `contactEmail` upsert preserved alongside new email provider writes | PASS — `route.ts:97-105`: `contactEmail` upsert runs unconditionally when `contactEmail !== undefined`; completely independent of the new `providerUpdate` block at lines 121-134 | CONFIRMED — clean separation; no regression risk | |
| AC-REG-4 | Email send functions work when no DB settings exist (env var fallback) | Code review: `getEmailProviderSettings()` fallback chain in `lib/config/app-settings.ts` | Chain: DB value → `RESEND_FROM_EMAIL` env → hardcoded default; no crash when DB empty | PASS — `app-settings.ts:456-469`: `apiKey: map[EMAIL_API_KEY] \|\| process.env.RESEND_API_KEY \|\| ""`; `fromEmail: map[EMAIL_FROM] \|\| process.env.RESEND_FROM_EMAIL \|\| map["contactEmail"] \|\| ""`; `fromName: map[EMAIL_FROM_NAME] \|\| map["store_name"] \|\| "Artisan Roast"` — returns empty strings (not null/undefined) when DB empty, no crash possible | CONFIRMED — fallback chain correct; `"Artisan Roast"` hardcoded default ensures fromName always has a value | |

## QA Dry Run Acceptance Criteria

> These ACs verify Commit 4 — that VERIFICATION.md and `scripts/qa-agent.js` were updated
> correctly, and that a local dry run against a fresh DB confirms end-to-end store name seeding.
>
> **Dry run — CI path (recommended):** Trigger `qa-nightly.yml` via `workflow_dispatch` on GitHub.
> The workflow validates the QA DB endpoint ID, partial-resets the QA DB (Orders + EULA + Users),
> then runs `node scripts/qa-agent.js` against `QA_BASE_URL` with all secrets injected automatically.
> Do NOT run `prisma migrate reset` manually — `.env.local` points to the demo store DB.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-QA-1 | `VERIFICATION.md` AC-IF-5 includes store name as the first fill step | Code review: `VERIFICATION.md` AC-IF-5 row | Row reads "Fill Store Name=$QA_STORE_NAME first, then Full Name=…" before other fields | PASS — `VERIFICATION.md:22`: AC-IF-5 Verification column reads "Fill Store Name=$QA_STORE_NAME first, then Full Name=$QA_ADMIN_NAME, Email=$QA_ADMIN_EMAIL, Password=$QA_ADMIN_PASSWORD, Confirm=$QA_ADMIN_PASSWORD; submit…" | CONFIRMED | |
| AC-QA-2 | `VERIFICATION.md` AC-KV-3 requires store name in both header AND footer | Code review: `VERIFICATION.md` AC-KV-3 row | Pass condition reads "$QA_STORE_NAME visible in header AND footer" | PASS — `VERIFICATION.md:31`: AC-KV-3 Pass column reads "$QA_STORE_NAME visible in header AND footer" | CONFIRMED | |
| AC-QA-3 | `qa-agent.js` AC_HINTS["AC-IF-5"] fills 5 fields with store name first; MAX_TURNS = 18 | Code review: `scripts/qa-agent.js` AC_HINTS["AC-IF-5"] + MAX_TURNS line | Hint lists 5 fills starting with `fill('Store name', Store name)`; MAX_TURNS for AC-IF-5 is 18 | PASS — `qa-agent.js:398-408`: `AC_HINTS["AC-IF-5"]` lists "Fill these 5 fields in order: fill('Store name', Store name), fill('Your name', Admin name), fill('Email address', Admin email), fill('Password', Admin password), fill('Confirm password', Admin password)"; `qa-agent.js:460`: `const MAX_TURNS = ac.id === "AC-IF-5" ? 18 : 10` | CONFIRMED — MAX_TURNS increase from 15→18 appropriate for the extra fill step | |
| AC-QA-4 | `qa-agent.js` AC_HINTS["AC-KV-3"] added, instructs agent to check header and footer | Code review: `scripts/qa-agent.js` AC_HINTS["AC-KV-3"] | Hint present; instructs PASS only if store name found in both locations | PASS — `qa-agent.js:410-415`: `AC_HINTS["AC-KV-3"]` present; instructs "PASS only if Store name text appears in BOTH the header/navigation area AND in the footer section. FAIL if the name appears in only one location, or does not appear at all." | CONFIRMED — dual-location requirement correctly enforced in hint | |
| AC-QA-5 | Dry run — AC-IF-5 PASS: agent fills "Morning Roast" as store name, setup completes, `/admin` reached | Dry run: trigger `qa-nightly.yml` via workflow_dispatch; observe AC-IF-5 result line in CI log | `✅ AC-IF-5 PASS` in CI output; "Morning Roast" confirmed as filled value in agent log | DEFERRED — requires CI workflow_dispatch after PR merge | DEFERRED — pending post-merge CI run | |
| AC-QA-6 | Dry run — AC-KV-3 PASS: "Morning Roast" visible in both storefront header and footer | Dry run: observe AC-KV-3 result line in CI log | `✅ AC-KV-3 PASS` in CI output; evidence line confirms header and footer match | DEFERRED — requires CI workflow_dispatch after PR merge | DEFERRED — pending post-merge CI run | |

---

## Agent Notes

**Verification run:** 2026-03-25 on branch `feature/email-provider-settings`

**Screenshots taken:**

- `.screenshots/email-provider-verify/verify-desktop-contact-top.png` — top of contact settings page (Email Configuration section)
- `.screenshots/email-provider-verify/verify-desktop-contact-scrolled.png` — scrolled view showing "Email Sending (Resend)" section with all 3 fields + Send Test Email button
- `.screenshots/email-provider-verify/verify-apikey-input.png` — element screenshot of API key input showing masked dots with eye toggle
- `.screenshots/email-provider-verify/verify-save-toast.png` — full viewport at moment of success toast
- `.screenshots/email-provider-verify/verify-toast-topright.png` — cropped top-right showing "Success / Settings saved successfully" toast

**Auth:** Playwright login used `admin@artisanroast.com` (demo credentials from `app/auth/actions.ts`). The QA credentials in `.env.local` are for the remote QA environment only.

**AC-UI-3 note:** Initial save attempts failed due to malformed `fromEmail` value in demo DB (`"Artisan Roast <onboarding@resend.dev>"` — full formatted address stored instead of bare email). This is a demo data issue, not a code defect. The PUT validation correctly rejects it as an invalid email format. After correcting the DB value via a clean PUT, save succeeded with success toast. The code path and toast mechanism are correct.

**AC-UI-5 note:** `/setup` page shows "You're all set" on this dev instance (admin already exists). Verified via code review of `app/setup/_components/setup-flow.tsx:172-179` — `storeName` Input has no `required` attribute; intentional contrast with `name` field at line 189 which does have `required`.

**AC-REG-1 note:** Pre-existing ESLint warning on `app/admin/sales/SalesClient.tsx:128` (TanStack Table `useReactTable` memoization warning) — unrelated to this branch, present on main.

Overall: PASS (21/21 verifiable ACs) + 2 DEFERRED (CI-only)

## QC Notes

**QC run:** 2026-03-25

All 21 verifiable ACs confirmed. Sub-agent evidence is complete and accurate:

- **UI ACs**: Screenshot evidence clear for AC-UI-1/2/3; code review accepted for AC-UI-4/5 (interactive/redirect constraints make direct screenshots impractical; code evidence is conclusive).
- **FN ACs**: All 8 code review confirmations are accurate. Masked-key guard (AC-FN-2), three-tier merchant email fallback (AC-FN-4), and setup seeding guard (AC-FN-8) all correct.
- **REG ACs**: precheck + test suite counts match expected; no regressions introduced.
- **QA ACs**: VERIFICATION.md and qa-agent.js wiring verified (AC-QA-1 through AC-QA-4). AC-QA-5/6 appropriately deferred to post-merge CI run.

**No fixes required.** 0 iterations.

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

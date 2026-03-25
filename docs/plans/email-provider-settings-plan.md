# Email Provider Settings — Plan

**Branch:** `feature/email-provider-settings`
**Base:** `main`

---

## Context

The store currently reads Resend credentials from environment variables only (`RESEND_API_KEY`,
`RESEND_FROM_EMAIL`). Self-hosters need to update their Resend config without redeploying —
especially after initial setup or when rotating API keys. This feature:

1. Adds DB-stored email provider settings (API key, from email, from name) managed through
   `/admin/settings/contact` — extending the existing "Email Configuration" section
2. Wires all 4 email send functions to use DB settings first (env var fallback for backwards
   compatibility)
3. Seeds email defaults during setup using the new optional store name field
4. Updates the QA agent to verify store name seeding with a non-default value ("Morning Roast")

**DB layer already complete** (from prior session): `APP_SETTINGS_KEYS` entries, `getEmailProviderSettings()`,
`setEmailProviderSettings()`, and `getResend(apiKey?)` overload are all in place.

---

## Commit Schedule

| # | Message | Issues | Risk |
|---|---------|--------|------|
| 0 | `docs: add plan and ACs for email provider settings` | — | — |
| 1 | `feat: wire email provider settings into all email send functions` | — | Low |
| 2 | `feat: add email provider settings UI to contact settings page` | — | Low |
| 3 | `feat: add optional store name to setup flow` | — | Low |
| 4 | `chore: update QA agent for Morning Roast store name` | — | Low |

---

## Acceptance Criteria

### UI (verified by screenshots)

> **How column methods:** `Screenshot:`, `Interactive:`, `Exercise:` (require `.png` evidence), or
> `Code review:` (only for non-visual ACs like redirects/route registration). At least 50% of UI
> ACs must use screenshot-based methods.

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Contact settings page shows "Email Sending (Resend)" section with API key, from email, from name fields and a Save button | Screenshot: `/admin/settings/contact` | Section visible below existing Email Configuration section |
| AC-UI-2 | API key field masks its value by default | Screenshot: `/admin/settings/contact` — API key input | Input renders as password type (dots), not plain text |
| AC-UI-3 | Saving email settings shows success toast | Interactive: fill API key + from email + from name → click Save → screenshot | Success toast visible |
| AC-UI-4 | Test Send button is present and wired to a POST action | Code review: POST handler exists in email API route + button rendered in contact page | Handler and button confirmed |
| AC-UI-5 | Setup flow shows optional Store Name field | Screenshot: `/setup` account/store step | Store Name input visible, not marked required |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | GET `/api/admin/settings/email` returns apiKey (masked), fromEmail, fromName from DB | Code review: `app/api/admin/settings/email/route.ts` GET handler | apiKey masked (last 4 chars only), fromEmail and fromName returned |
| AC-FN-2 | PUT `/api/admin/settings/email` calls `setEmailProviderSettings()` and persists all 3 keys | Code review: PUT handler trace into `lib/config/app-settings.ts` | DB upsert confirmed for EMAIL_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME |
| AC-FN-3 | `send-order-confirmation` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-order-confirmation.ts` | `from` field built from `fromName`/`fromEmail` returned by DB getter |
| AC-FN-4 | `send-merchant-notification` uses `getEmailProviderSettings()` for from address; merchant email falls back to `contactEmail` in DB | Code review: `lib/email/send-merchant-notification.ts` | `from` uses DB settings; merchant email falls back to `contactEmail` DB key |
| AC-FN-5 | `send-review-request` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-review-request.ts` | `from` field uses DB settings |
| AC-FN-6 | `send-new-review-notification` uses `getEmailProviderSettings()` for from address | Code review: `lib/email/send-new-review-notification.ts` | `from` field uses DB settings |
| AC-FN-7 | All send functions pass DB `apiKey` to `getResend()` | Code review: each send function | `getResend(apiKey)` called with DB key, not env-only singleton |
| AC-FN-8 | Setup route accepts `storeName`, seeds `store_name`, `email.fromName`, `email.fromEmail` in DB | Code review: `app/api/admin/setup/route.ts` | Three `SiteSettings` upserts on successful setup completion |

### Regression (verified by test suite + spot-check)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | `npm run precheck` passes (0 TypeScript + ESLint errors) | Run precheck | 0 errors |
| AC-REG-2 | `npm run test:ci` passes (0 failures) | Run test suite | 0 failures |
| AC-REG-3 | Existing `contactEmail` field on contact settings page still saves correctly | Code review: PUT handler still writes `contactEmail` key | `contactEmail` upsert preserved |
| AC-REG-4 | Email send functions work when no DB settings exist (env var fallback) | Code review: `getEmailProviderSettings()` fallback chain | Falls back to `RESEND_FROM_EMAIL` env → hardcoded default |

---

## UX Flows

| Flow | Question | Answer |
|------|----------|--------|
| Save | What happens after the user clicks Save? | Toast: "Email settings saved." Fields remain filled with saved values |
| Test Send | What happens when the user clicks Test Send? | Loading spinner → success toast "Test email sent" or destructive toast with error |
| Error | What does the user see when save fails? | Destructive toast with error message from server |
| Loading | What does the user see while saving? | Save button disabled + spinner |
| Setup name blank | What happens if store name is left blank during setup? | `email.fromName` falls back to `store_name` DB value, then "Artisan Roast" |

---

## Implementation Details

### Commit 1: Wire email send functions

The DB layer is already complete. Each of the 4 send functions needs the same pattern applied:

```ts
const { apiKey, fromEmail, fromName } = await getEmailProviderSettings();
const resend = getResend(apiKey || undefined);
if (!resend) return { success: true };

await resend.emails.send({
  from: fromName ? `${fromName} <${fromEmail}>` : fromEmail || "orders@artisan-roast.com",
  ...
});
```

For `send-merchant-notification`, the merchant TO address also needs a DB fallback:

```ts
const merchantEmail =
  process.env.RESEND_MERCHANT_EMAIL ||
  (await prisma.siteSettings.findUnique({ where: { key: "contactEmail" } }))?.value ||
  "";
```

**Files:**

- `lib/email/send-order-confirmation.ts` — replace hardcoded `from` + add `getEmailProviderSettings` call
- `lib/email/send-merchant-notification.ts` — same + merchant email DB fallback
- `lib/email/send-review-request.ts` — replace env-only `from`
- `lib/email/send-new-review-notification.ts` — same

### Commit 2: Email settings UI

**`app/api/admin/settings/email/route.ts`:**

- Extend GET to return `apiKey` (last 4 chars masked as `••••{last4}`), `fromEmail`, `fromName`
- Extend PUT to call `setEmailProviderSettings()` alongside existing `contactEmail` write
- Add POST handler for test send: reads current settings → sends test email to `contactEmail`

**`app/admin/settings/contact/page.tsx`:**

- Add "Email Sending (Resend)" section below existing Email Configuration block
- Fields: API Key (password input with show/hide toggle), From Email, From Name
- Buttons: Save (existing submit pattern), Test Send (secondary action, separate fetch)
- Section uses flat card pattern: `rounded-lg border p-6` — no shadcn Card wrappers

### Commit 3: Setup flow store name

**`app/setup/_components/setup-flow.tsx`:**

- Add optional Store Name field (no `required`, no asterisk label)
- Position: first field in the account/store step, before Admin Name

**`app/api/admin/setup/route.ts`:**

- Accept `storeName?: string` in request body
- On success: upsert `store_name`, `email.fromName` (= storeName if provided), `email.fromEmail` (= "" — admin configures later via settings)
- Upsert only if `storeName` is non-empty to avoid overwriting existing DB values on re-run

### Commit 4: QA agent update

**`scripts/qa-agent.js`:**

- Update `AC_HINTS["AC-IF-5"]` to include store name fill step using `KNOWN.storeName`
- `KNOWN.storeName` already populated from `QA_STORE_NAME` env var
- Updated hint fills: store name → admin name → email → password → confirm password → submit

---

## Files Changed (9 modified, 0 new)

| File | Commit | Notes |
|------|--------|-------|
| `lib/email/send-order-confirmation.ts` | 1 | from address from DB |
| `lib/email/send-merchant-notification.ts` | 1 | from + merchant email DB fallback |
| `lib/email/send-review-request.ts` | 1 | from address from DB |
| `lib/email/send-new-review-notification.ts` | 1 | from address from DB |
| `app/api/admin/settings/email/route.ts` | 2 | extend GET/PUT + add POST test send |
| `app/admin/settings/contact/page.tsx` | 2 | add Email Sending section |
| `app/setup/_components/setup-flow.tsx` | 3 | optional store name field |
| `app/api/admin/setup/route.ts` | 3 | seed store_name + email defaults |
| `scripts/qa-agent.js` | 4 | AC-IF-5 hint + Morning Roast |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 17 }`
3. Extract ACs into `docs/plans/email-provider-settings-ACs.md` using the ACs template
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human → human fills **Reviewer** column

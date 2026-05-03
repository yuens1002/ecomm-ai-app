# Admin Stripe Payments — AC Verification Report

**Branch:** `feat/admin-stripe-payments`
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
| AC-UI-1 | `/admin/settings/commerce` page on initial load (env set, DB empty) | Screenshot: viewport at desktop breakpoint after admin login | New "Stripe Payments & Coupons" section is the top section; status banner says "Configured via environment variables"; form is present below banner; existing Promotion Codes subsection still renders below | | | |
| AC-UI-2 | Stripe-account-first card visible | Screenshot: viewport showing top of section | Card with link to dashboard.stripe.com/register is visible above the status banner; external-link icon present | | | |
| AC-UI-3 | Page in env-unset, DB-empty, encryption-key-set state | Screenshot: viewport after `STRIPE_SECRET_KEY` removed from `.env.local` | Status banner: "Not configured" (yellow); form fields are enabled; Validate button enabled | | | |
| AC-UI-4 | Page in encryption-key-NOT-set state | Screenshot: viewport after `PAYMENT_CREDENTIALS_ENCRYPTION_KEY` removed | Status banner: "Encryption key required" (red) with `openssl rand -hex 32` instruction; form is **disabled** | | | |
| AC-UI-5 | Test mode warning while typing `sk_test_*` | Interactive: focus secret key field, type `sk_test_abc` → screenshot | Yellow "Test Mode" badge appears next to the field | | | |
| AC-UI-6 | Show/hide toggle on secret key field | Interactive: click eye-icon button → screenshot | Field changes from password to text type; characters become visible | | | |
| AC-UI-7 | Validation modal after successful Validate | Exercise: enter valid test keys, click Validate → wait for modal → screenshot | Modal shows "Save credentials for `Acme Coffee` (acct_xyz, US, USD)?" with Save + Cancel buttons | | | |
| AC-UI-8 | Inline error on test/live mismatch | Exercise: enter `sk_test_*` + `pk_live_*`, click Validate → screenshot | Inline error: "Test/live mode mismatch — secret key is test, publishable key is live. Both must be from the same Stripe mode." Save flow does not advance | | | |
| AC-UI-9 | Inline error on bad secret key | Exercise: enter `sk_test_invalid`, click Validate → screenshot | Inline error under the secret key field showing the Stripe API error verbatim | | | |
| AC-UI-10 | Active config section after successful save | Screenshot: viewport after confirming the validation modal | "Active config" subsection shows account name, account ID, last validated timestamp, test/live mode badge | | | |
| AC-UI-11 | Masked stored secret key on page reload | Screenshot: viewport after navigating away and returning to the page | Secret key field shows `••••••••<last4>` placeholder; admin must re-enter to change | | | |
| AC-UI-12 | Clear DB credentials confirmation modal | Interactive: click Clear → wait for modal → screenshot | Modal asks "This will remove DB-stored credentials. Stripe will fall back to environment variables. Continue?" with Confirm + Cancel | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Auth guard via `requireAdminApi` on all 4 methods | Code review: `app/api/admin/settings/stripe/route.ts` | Each handler calls `requireAdminApi()` and returns 401 with the helper's error when unauthorized | | | |
| AC-FN-2 | Zod validation on POST + PUT bodies | Code review: route file → trace schemas | Schemas reject malformed keys (regex check); 400 with details on failure | | | |
| AC-FN-3 | `stripe.accounts.retrieve()` called on POST and re-called on PUT | Code review: route file → trace validation | Real Stripe API call wrapped in try/catch on both methods; 400 with Stripe message on failure; success extracts account metadata | | | |
| AC-FN-4 | Test/live mismatch hard-block | Code review: route file → trace mismatch check | Both POST and PUT compare secret + publishable mode; return 400 with mismatch error before calling Stripe | | | |
| AC-FN-5 | Encryption applied to secret key + webhook secret on PUT | Code review: route file → trace encrypt() calls | Both fields passed through `encrypt()` before `prisma.paymentProcessorConfig.upsert`; publishable key NOT encrypted | | | |
| AC-FN-6 | "Don't overwrite with masked value" preprocessing on PUT | Code review: route file → trace mask-prefix check | If `secretKey?.startsWith("••")` (or `webhookSecret`), drop from update payload | | | |
| AC-FN-7 | `getStripe()` env-then-DB resolution order | Code review: `lib/services/stripe.ts` → trace function | Returns env-built client when env set; DB-built client only when env unset; null when both unset | | | |
| AC-FN-8 | `getStripeWebhookSecret()` mirrors `getStripe()` precedence | Code review: `lib/services/stripe.ts` | Same env-then-DB-then-null shape | | | |
| AC-FN-9 | `resetStripeClient()` called from successful PUT and DELETE | Code review: route file → trace post-save calls | Singleton cleared so next `getStripe()` re-reads from current source | | | |
| AC-FN-10 | Webhook route uses `getStripeWebhookSecret()` not `process.env` | Code review: `app/api/webhooks/stripe/route.ts` | No `process.env.STRIPE_WEBHOOK_SECRET` read in this file after this change | | | |
| AC-FN-11 | DELETE drops DB row but doesn't touch env | Code review: route file → trace DELETE handler | `prisma.paymentProcessorConfig.delete()` called; no env mutation; resetStripeClient called | | | |
| AC-FN-12 | GET response masks secrets matching AI settings convention | Code review: route file → trace `maskApiKey` usage | Stored secret returned as `"••••••••" + last4`; absent secret returned as empty string | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | Encryption round-trip + tampering | Test run: `npm run test:ci` | `encrypt(x)` → `decrypt(...)` recovers `x`; tampered ciphertext throws; wrong key throws; malformed envelope throws; version mismatch throws | | | |
| AC-TST-2 | DB access layer with mocked Prisma | Test run: `npm run test:ci` | `loadStripeCredentials()` returns null on empty table, decrypted creds when row exists, null + console.error on decryption failure | | | |
| AC-TST-3 | `getStripe()` env-then-DB resolution | Test run: `npm run test:ci` | 4 cases: env-only / DB-only / both (env wins) / neither (null) | | | |
| AC-TST-4 | PUT validation + encryption + reset | Test run: `npm run test:ci` | Mocked Stripe call; assert encrypted blob written to DB (not plaintext); assert resetStripeClient called; assert masked-prefix preprocessing | | | |
| AC-TST-5 | Test/live mismatch hard-block | Test run: `npm run test:ci` | POST and PUT both reject with 400 when modes disagree, BEFORE calling Stripe | | | |
| AC-TST-6 | DELETE auth + side effects | Test run: `npm run test:ci` | 401 on unauth; deletes row; calls resetStripeClient | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Existing test suite | Test run: `npm run test:ci` | All pre-existing tests pass after `getStripe()` becomes async (call sites updated) | | | |
| AC-REG-2 | Existing checkout flow with env-set credentials | Exercise: env set, no DB row → add product → checkout → screenshot success page | Stripe Checkout session creates and redirects; success page renders | | | |
| AC-REG-3 | Existing webhook signature verification | Test run: `lib/payments/stripe/__tests__/verify.test.ts` (or equivalent) | Tests pass — signature verification still works | | | |
| AC-REG-4 | Health check endpoint Stripe-configured state | Code review: `app/api/health/route.ts` | Returns `stripe.configured: true` when env OR DB is set | | | |
| AC-REG-5 | Existing Promotion Codes section behavior | Screenshot: same commerce page after change → click promo-code Switch | Promo-codes Switch still works; Stripe Dashboard external link still present; behavior identical to before | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

# Agentic QA — Install Assurance

## What We Built

An automated post-merge CI system that verifies a fresh install of Artisan Roast on the reference stack (Neon + Vercel) after every merge to `main`.

A deterministic Puppeteer script walks through `VERIFICATION.md` and confirms each acceptance criterion passes in a real browser against a real deployment. Claude Haiku is called only on failure to write a concise GitHub issue body.

---

## Why

Manual install testing is slow and error-prone. Every merge to `main` could silently break the self-host experience. This system catches regressions immediately, before users encounter them.

---

## Design Decisions

### Dedicated QA Stack (not ephemeral previews)

A separate Vercel project (`artisan-roast-qa`) watches the same repo on `main`. Paired with a dedicated Neon QA database.

**Why:** Ephemeral preview builds take 3–5 min each run. The dedicated stack redeploys from cache in ~1 min. The QA URL is stable — stored once as `QA_BASE_URL`.

**DB isolation per run:** `prisma migrate reset --force` before each run drops all data and re-runs migrations from scratch — equivalent to a fresh install, without Neon branch API overhead.

### Deterministic Puppeteer (not AI in the hot path)

Each AC is a labeled Puppeteer block with explicit DOM interactions: `page.click()`, `page.type()`, `page.evaluate()`, `waitForNavigation()`. Selectors and visible-text constants are defined at the top of `scripts/qa-agent.js` as the canonical update points when the setup UI changes.

**Why:** ~$0/run when all ACs pass. Fast (~2 min). Predictable output — no LLM variance in pass/fail decisions. Easy to debug: each AC block maps 1:1 to a row in `VERIFICATION.md`.

**AI on the failure path only:** If any AC fails, Claude Haiku (`claude-haiku-4-5-20251001`) is called once to write a concise failure summary (3–5 bullets) which is printed to the run log. The workflow then opens a GitHub issue with a link to the run. (~$0.002 on failure, $0 on pass).

### Selector Stability

Two constants at the top of `scripts/qa-agent.js` are the only places that need updating when the setup UI changes:

```js
const SEL = { /* CSS selectors */ };
const TEXT = { /* visible strings to assert */ };
```

`checkText()` checks both `document.body.innerText` and visible `<input>`/`<textarea>`/`<select>` values, so assertions work even when values are in form fields rather than rendered text.

### VERIFICATION.md is Static

`VERIFICATION.md` at the repo root is the single source of truth for what "a correct install" looks like. It is never modified by the agent or by CI. Results live in:
- GitHub Actions run logs (full per-AC breakdown)
- GitHub issues opened on failure

**Why:** Writing results back to the repo would trigger another push → another install run → infinite loop.

### 30-Minute Debounce on Production Runs

After a merge to `main`, the workflow sleeps 30 min before triggering. GitHub Actions `cancel-in-progress: true` means rapid merges cancel earlier queued runs — only the latest gets tested.

**Why:** Rapid merge sequences (e.g., version bump commits, docs fixes) would otherwise queue many redundant runs.

**Development override:** `workflow_dispatch` with `skip_debounce: true` runs immediately — no wait.

---

## Spec Document

[`VERIFICATION.md`](../../../VERIFICATION.md) — repo root. Three sections:

- **Install Flow** (AC-IF-1 through AC-IF-6) — setup page, EULA scroll gate, admin account creation
- **Known Value Round-Trips** (AC-KV-1 through AC-KV-4) — verify inputs surface correctly in the app
- **Initial App State** (AC-IS-1 through AC-IS-6) — empty state, nav reachability, no errors

---

## Spec Drift Guard

`.github/workflows/spec-drift.yml` enforces two bidirectional checks on every PR:

| Trigger | Missing | Comment |
|---------|---------|---------|
| `app/setup/**`, `prisma/schema.prisma`, `INSTALLATION.md`, or `app/admin/**` changed | `VERIFICATION.md` not updated | "Update the spec — install flow may have changed" |
| `VERIFICATION.md` changed | `scripts/qa-agent.js` not updated | "Add the test block — untested ACs fail CI" |

### Untested ACs are hard failures

`qa-agent.js` compares every AC parsed from `VERIFICATION.md` against the results produced by `runVerification()`. Any AC with no corresponding test block is recorded as a **FAIL**, not a skip. This means:

- You cannot add an AC to `VERIFICATION.md` and merge without also implementing the test
- The PR comment from spec-drift is a reminder; CI is the enforcement

---

## How to Maintain the Spec

### When the setup flow, admin UI, or schema changes

1. Update the affected AC rows in `VERIFICATION.md` (or add new ones)
2. Update the corresponding test block in `runVerification()` in `scripts/qa-agent.js`
3. If UI selectors or copy changed, update the `SEL` / `TEXT` constants at the top of `qa-agent.js`
4. The spec-drift workflow will remind you if either file is missed

```js
// ── Selectors — UPDATE THESE if the setup UI elements change ─────────────
const SEL = { ... };

// ── Text markers — UPDATE THESE if visible copy changes ──────────────────
const TEXT = { ... };
```

### When adding a new AC

1. Add the row to `VERIFICATION.md` with the correct `AC-XX-N` ID
2. Add a labeled block to `runVerification()` in `scripts/qa-agent.js`:
   ```js
   // AC-XX-N: <what>
   console.log("\n[AC-XX-N]");
   // ... puppeteer assertions ...
   results.push(pass("AC-XX-N", "...") or fail("AC-XX-N", "..."));
   ```
3. If you skip step 2, CI will fail with: `No test block implemented in qa-agent.js`

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `QA_BASE_URL` | Fixed URL of the `artisan-roast-qa` Vercel project |
| `QA_VERCEL_DEPLOY_HOOK` | Webhook to trigger QA project redeploy |
| `QA_DATABASE_URL` | Pooled Neon connection for QA DB (runtime) |
| `QA_DIRECT_URL` | Direct Neon connection for QA DB (migrations) |
| `QA_ADMIN_NAME` | Known admin name for round-trip verification |
| `QA_ADMIN_EMAIL` | Known admin email |
| `QA_ADMIN_PASSWORD` | Known admin password |
| `QA_STORE_NAME` | Expected store name post-setup |
| `ANTHROPIC_API_KEY` | Claude Haiku — called only on failure to generate issue body |

---

## One-Time Infrastructure Setup

1. Create a new Vercel project — import from `yuens1002/artisan-roast`, name it `artisan-roast-qa`, branch `main`
2. Add env vars to the Vercel QA project (all environments — Production **and** Preview):
   - `DATABASE_URL`, `DIRECT_URL` (QA Neon connection strings)
   - `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (= `QA_BASE_URL`)
3. Vercel QA project → Settings → Git → Deploy Hooks → create hook → store as `QA_VERCEL_DEPLOY_HOOK`
4. Create a dedicated Neon project for QA → copy connection strings → store as `QA_DATABASE_URL` / `QA_DIRECT_URL`
5. Add all secrets to GitHub repo → Settings → Secrets → Actions

---

## Files

| File | Purpose |
|------|---------|
| `VERIFICATION.md` | Static install spec — 16 ACs in table format |
| `scripts/qa-agent.js` | Deterministic Puppeteer script — walks each AC, calls Haiku on failure for issue body |
| `.github/workflows/install-test.yml` | Triggered on push to main (30 min debounce) or `workflow_dispatch` |
| `.github/workflows/spec-drift.yml` | PR comment guard — flags spec-related file changes without `VERIFICATION.md` update |

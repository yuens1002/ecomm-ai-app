# Agentic QA — Install Assurance

## What We Built

An automated nightly CI system that verifies a fresh install of Artisan Roast on the reference stack (Neon + Vercel) after every merge to `main`.

A Claude Agent SDK script drives Playwright through each acceptance criterion autonomously — reading the accessibility tree, navigating, filling forms, and verifying outcomes. No hardcoded selectors. No fixed timeouts. The agent reads each AC's plain-English description from `VERIFICATION.md`, receives a structured hint for tricky interactions, and decides what actions to take.

---

## Why

Manual install testing is slow and error-prone. Every merge to `main` could silently break the self-host experience. This system catches regressions immediately, before users encounter them.

---

## Design Decisions

### Dedicated QA Stack (not ephemeral previews)

A separate Vercel project (`artisan-roast-qa`) watches the same repo on `main`. Paired with a dedicated Neon QA database.

**Why:** Ephemeral preview builds take 3–5 min each run. The dedicated stack redeploys from cache in ~1 min. The QA URL is stable — stored once as `QA_BASE_URL`.

**DB reset per run:** `prisma migrate reset --force` before each verification run drops all data and re-runs migrations from scratch — equivalent to a fresh install, without Neon branch API overhead.

### Claude Agent SDK in the Hot Path

Each AC is driven by a per-AC agent loop: Claude receives the AC description + a structured hint, then calls Playwright tools (navigate, fill, click, scroll, read_page) until it's confident in a pass or fail verdict.

**Why:** Deterministic Puppeteer required hardcoded CSS selectors and visible-string constants that broke silently when UI copy changed. The agent reads the accessibility tree (semantic text, ~3–5K tokens/snapshot) and finds elements by accessible name — no selector maintenance needed.

**Tool filtering:** Each AC only receives the subset of tools it actually needs (`getToolsForAC`). This reduces token usage and prevents the agent from attempting actions that could interfere with subsequent ACs.

**AC_HINTS:** A per-AC machine-readable hint map in `scripts/qa-agent.js` short-circuits known-tricky interactions — scroll gates, sign-in redirect chains, session clear flows — without making the broader implementation brittle. Only ACs that need special handling have entries; simple ACs run unassisted.

### Cost Model (Vercel AI Gateway)

All Claude API calls route through Vercel AI Gateway, billed against the Anthropic Max subscription — never pay-per-token API charges.

| Mode | Model | Est. tokens/run | Est. cost |
|------|-------|-----------------|-----------|
| Local dev | `claude-haiku-4-5-20251001` | ~40K | ~$0.02 |
| CI nightly | `claude-sonnet-4-6` | ~150K | ~$0.90 |
| Budget hard cap | either | 300K | run aborts (exit 2) |

### Two-Workflow Architecture

Browser verification is decoupled from the push-triggered deployment workflow.

**`install-test.yml`** — triggered on push to `main` (30-min debounce):

1. Triggers QA Vercel redeploy
2. Resets QA database (`prisma migrate reset --force`)
3. Waits for deployment health check
4. **Does NOT run browser tests** — just prepares the environment

**`qa-nightly.yml`** — daily 6am UTC cron + `workflow_dispatch`:

1. Installs Playwright (Chromium)
2. Runs `scripts/qa-agent.js` against the settled QA deployment
3. Opens a GitHub issue on failure

**Why:** Push-triggered runs race with Vercel's deployment pipeline. Decoupling into a nightly schedule lets the QA stack fully settle before verification begins. Rapid merge sequences don't queue redundant verification runs.

### VERIFICATION.md is Static

`VERIFICATION.md` at the repo root is the single source of truth for what "a correct install" looks like. It is never modified by the agent or by CI. Results live in:

- GitHub Actions run logs (full per-AC breakdown with token counts)
- GitHub issues opened on failure

**Why:** Writing results back to the repo would trigger another push → another run → infinite loop.

### 30-Minute Debounce on Production Runs

After a merge to `main`, `install-test.yml` sleeps 30 min before proceeding. `cancel-in-progress: true` means rapid merges cancel earlier queued runs — only the latest gets tested.

**Development override:** `workflow_dispatch` with `skip_debounce: true` runs immediately.

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
| `VERIFICATION.md` changed | `scripts/qa-agent.js` not updated | "Update AC_HINTS or add hints for new ACs if needed" |

---

## How to Maintain the Spec

### When the setup flow, admin UI, or schema changes

1. Update the affected AC rows in `VERIFICATION.md` (or add new ones)
2. If the change affects agent interactions (button text, redirect paths, form labels), update the corresponding entry in `AC_HINTS` in `scripts/qa-agent.js`
3. The spec-drift workflow will remind you if either file is missed

### When adding a new AC

1. Add the row to `VERIFICATION.md` with the correct `AC-XX-N` ID
2. The agent will attempt the new AC automatically — it reads all ACs from `VERIFICATION.md`
3. If the AC involves tricky interactions (scroll gates, redirect chains, session clears), add a hint:

```js
// scripts/qa-agent.js — AC_HINTS map
const AC_HINTS = {
  // ... existing hints ...
  "AC-XX-N": "Call clear_session first. Navigate to /auth/admin-signin. Fill 'Email' with the known Admin email ...",
};
```

1. Verify locally before merging: `npm run qa:teardown && npm run qa:install`

---

## Local Development Workflow

```bash
# Reset DB to fresh-install state
npm run qa:teardown

# Run all 16 ACs against localhost:3000
QA_MODEL=claude-haiku-4-5-20251001 npm run qa:install
```

Set `QA_MODEL=claude-haiku-4-5-20251001` in `.env.local` for cheap local runs (~$0.02). The default in CI is `claude-sonnet-4-6`.

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
| `VERCEL_AI_GATEWAY_BASE_URL` | Vercel AI Gateway base URL (routes Claude calls through Max subscription) |
| `VERCEL_AI_GATEWAY_TOKEN` | Vercel OIDC token — replaces `ANTHROPIC_API_KEY` |

> `ANTHROPIC_API_KEY` is **not** used in CI. All Claude API calls route through `VERCEL_AI_GATEWAY_BASE_URL` with `VERCEL_AI_GATEWAY_TOKEN`, billing against your Anthropic Max subscription via the Vercel AI Gateway.

---

## One-Time Infrastructure Setup

1. Create a new Vercel project — import from `yuens1002/artisan-roast`, name it `artisan-roast-qa`, branch `main`
2. Add env vars to the Vercel QA project (all environments — Production **and** Preview):
   - `DATABASE_URL`, `DIRECT_URL` (QA Neon connection strings)
   - `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (= `QA_BASE_URL`)
3. Vercel QA project → Settings → Git → Deploy Hooks → create hook → store as `QA_VERCEL_DEPLOY_HOOK`
4. Create a dedicated Neon project for QA → copy connection strings → store as `QA_DATABASE_URL` / `QA_DIRECT_URL`
5. Add all secrets to GitHub repo → Settings → Secrets → Actions
6. In Vercel dashboard → AI Gateway → link your Anthropic Max subscription → copy the gateway token → store as `VERCEL_AI_GATEWAY_TOKEN`

---

## Files

| File | Purpose |
|------|---------|
| `VERIFICATION.md` | Static install spec — 16 ACs in table format |
| `scripts/qa-agent.js` | Claude Agent SDK script — per-AC agent loop driving Playwright |
| `scripts/qa-teardown.js` | Resets local/QA DB to fresh-install state (deletes users + EULA record) |
| `.github/workflows/install-test.yml` | On push to main — redeploys QA stack, resets DB, waits for health check |
| `.github/workflows/qa-nightly.yml` | Nightly cron (6am UTC) — runs QA agent against settled QA deployment |
| `.github/workflows/spec-drift.yml` | PR comment guard — flags spec/agent file changes without the other |

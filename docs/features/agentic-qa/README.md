# Agentic QA — Install Assurance

## What We Built

An automated post-merge CI system that verifies a fresh install of Artisan Roast on the reference stack (Neon + Vercel) after every merge to `main`.

A Claude agent — using the computer use API — walks through `VERIFICATION.md` and confirms each acceptance criterion passes in a real browser against a real deployment.

---

## Why

Manual install testing is slow and error-prone. Every merge to `main` could silently break the self-host experience. This system catches regressions immediately, before users encounter them.

---

## Design Decisions

### Dedicated QA Stack (not ephemeral previews)

A separate Vercel project (`artisan-roast-qa`) watches the same repo on `main`. Paired with a dedicated Neon QA database.

**Why:** Ephemeral preview builds take 3–5 min each run. The dedicated stack redeploys from cache in ~1 min. The QA URL is stable — stored once as `QA_BASE_URL`.

**DB isolation per run:** `prisma migrate reset --force` before each run drops all data and re-runs migrations from scratch — equivalent to a fresh install, without Neon branch API overhead.

### Claude Computer Use (not Puppeteer)

The agent uses `claude-sonnet-4-6` with the `computer_use` tool type. Claude receives a screenshot of a real Chromium browser and decides where to click, what to type, when to scroll — no DOM querying, no selectors, no brittle XPath.

**Why:** Selector-based automation breaks whenever UI text or structure changes. Computer use is resilient to refactoring; it sees the page as a user would.

### VERIFICATION.md is Static

`VERIFICATION.md` at the repo root is the single source of truth for what "a correct install" looks like. It is never modified by the agent or by CI. Results live in:
- GitHub Actions run logs (full per-AC breakdown)
- GitHub issues opened on failure

**Why:** Writing results back to the repo would trigger another push → another install run → infinite loop.

### 30-Minute Debounce on Production Runs

After a merge to `main`, the workflow sleeps 30 min before triggering. GitHub Actions `cancel-in-progress: true` means rapid merges cancel earlier queued runs — only the latest gets tested.

**Why:** Rapid merge sequences (e.g., version bump commits, docs fixes) would otherwise queue many redundant runs.

**Development override:** `workflow_dispatch` with `skip_debounce: true` runs immediately — no wait.

### Model: `claude-sonnet-4-6`

Not Opus. Sonnet 4.6 is capable for visual browser tasks and cost-efficient for automated runs that may trigger many times per day.

---

## Spec Document

[`VERIFICATION.md`](../../../VERIFICATION.md) — repo root. Three sections:

- **Install Flow** (AC-IF-1 through AC-IF-6) — setup page, EULA scroll gate, admin account creation
- **Known Value Round-Trips** (AC-KV-1 through AC-KV-4) — verify inputs surface correctly in the app
- **Initial App State** (AC-IS-1 through AC-IS-6) — empty state, nav reachability, no errors

---

## Spec Drift Guard

`.github/workflows/spec-drift.yml` watches setup-related files:
- `app/setup/**`
- `prisma/schema.prisma`
- `INSTALLATION.md`
- `app/admin/**`

If any of these change in a PR without `VERIFICATION.md` also changing, the workflow posts a PR comment reminding the author to update the spec.

---

## How to Maintain the Spec

When you change the setup flow, admin UI, or database schema:

1. Open `VERIFICATION.md`
2. Update the affected AC rows (or add new ones)
3. If you remove a step, remove its AC
4. The spec-drift workflow will remind you if you forget

The spec is plain markdown — no tooling required to edit it.

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `QA_BASE_URL` | Fixed URL of the `artisan-roast-qa` Vercel project |
| `QA_VERCEL_DEPLOY_HOOK` | Webhook to trigger QA project redeploy |
| `QA_DATABASE_URL` | Pooled Neon connection for QA DB |
| `QA_DIRECT_URL` | Direct Neon connection for QA DB (migrations) |
| `QA_ADMIN_NAME` | Known admin name for round-trip verification |
| `QA_ADMIN_EMAIL` | Known admin email |
| `QA_ADMIN_PASSWORD` | Known admin password |
| `QA_STORE_NAME` | Expected store name post-setup |
| `ANTHROPIC_API_KEY` | Claude agent (Sonnet 4.6) |

---

## One-Time Infrastructure Setup

1. Create a new Vercel project — import from `yuens1002/artisan-roast`, name it `artisan-roast-qa`, branch `main`
2. Add `QA_DATABASE_URL`, `QA_DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (= `QA_BASE_URL`) to its Vercel env vars
3. Vercel QA project → Settings → Git → Deploy Hooks → create hook → store as `QA_VERCEL_DEPLOY_HOOK`
4. Create a dedicated Neon project for QA → copy connection strings → store as `QA_DATABASE_URL` / `QA_DIRECT_URL`
5. Add all secrets to GitHub repo → Settings → Secrets → Actions

---

## Files

| File | Purpose |
|------|---------|
| `VERIFICATION.md` | Static install spec — ACs in table format |
| `scripts/qa-agent.js` | Claude computer use agent — parses VERIFICATION.md, walks each AC, reports PASS/FAIL |
| `.github/workflows/install-test.yml` | Triggered on push to main (debounced) or workflow_dispatch |
| `.github/workflows/spec-drift.yml` | PR comment guard — flags spec-related file changes without VERIFICATION.md update |

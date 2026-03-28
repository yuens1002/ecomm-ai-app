# QA Self-Healing — Plan

**Branch:** `feat/qa-self-heal`
**Base:** `main`
**Scope:** CI/backend only — no UI, no dev server needed
**ACs doc:** `docs/features/qa-self-healing/ACs.md`

---

## Context

The nightly QA verification (`qa-nightly.yml`) opens a GitHub issue when it fails, requiring a
human to triage the log, identify the root cause, fix it, and wait for the next nightly run to
confirm. Three failure categories exist:

- **Category A** — Config bugs in `AC_HINTS` (wrong label/selector). Fully automatable.
- **Category B** — App regressions (feature broke). Issue enrichment with git analysis only.
- **Category C** — Infrastructure failures (Vercel down, Neon suspended, budget exceeded). Diagnostic comment only.

This feature automates the full loop for Category A and adds structured diagnostics for B/C,
eliminating the human-in-the-loop for the most common failure type.

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for qa-self-heal` | — |
| 1 | `feat(qa): enrich qa-agent output — write qa-results.json` | Low |
| 2 | `feat(qa): add qa-classify.js + workflow fixture mode` | Low |
| 3 | `feat(qa): add issue enrichment + self-heal job (B/C path)` | Low |
| 4 | `feat(qa): add qa-repair-agent + wire Category A repair path` | Medium |

---

## How It Works

```text
Nightly QA fails
    ↓
self-heal job (in same workflow, needs: [qa], if: failure())
    ↓
Classify: A (AC_HINTS config bug) | B (app regression) | C (infra)
    ↓
Category A → Repair agent → verify with STOP_AFTER → open PR
Category B → Enrich issue with git log (recent commits on relevant paths)
Category C → Enrich issue with health probe diagnostics
    ↓
Next nightly passes → existing "close issues on success" step fires
```

---

## Implementation Details

### Commit 1: Enrich qa-agent.js output

**Files:** `scripts/qa-agent.js`, `.gitignore`

**Pattern — module-level `runState` + `process.on('exit')` handler:**

```javascript
const runState = {
  runId: process.env.GITHUB_RUN_ID || String(Date.now()),
  timestamp: new Date().toISOString(),
  exitCode: 0,
  baseUrl: BASE_URL,
  model: QA_MODEL,
  totalTokens: 0,
  infraError: null,
  results: [],
};
process.on("exit", () =>
  fs.writeFileSync("qa-results.json", JSON.stringify(runState, null, 2))
);
```

**`runSingleAC` additions:**

- `toolCallTrace = []` — push tool name before each `executeTool` call
- `turnCount = 0` — increment each loop iteration
- On FAIL or max-turns: call `readPage(page)`, store `finalPageSnapshot` + `finalPageUrl`
- Return enriched: `{ id, status, evidence, turnCount, toolCallTrace, finalPageSnapshot, finalPageUrl }`

**`main()` additions:**

- Push each result into `runState.results`
- Set `runState.exitCode` + `runState.totalTokens` before each `process.exit()` call
- Set `runState.infraError` before `process.exit(3)`

**`.gitignore`:** Add `qa-results.json`

---

### Commit 2: qa-classify.js + fixture mode

**Files:** `scripts/qa-classify.js`, `scripts/qa-classify.test.js`, `.github/workflows/qa-nightly.yml`

**`qa-classify.js` — decision tree:**

1. `exitCode >= 2` OR `infraError !== null` → Category C
2. For each failed AC: A-signals = (in AC_HINTS keys) AND (toolCallTrace has fill/click) AND (evidence/turnCount suggests element-not-found)
3. All failed ACs have A-signals → Category A
4. Any failed AC lacks A-signals → Category B (conservative)

**Output:** `{ category: "A"|"B"|"C", failedAcs: [...], reason: string, repairable: boolean }`

**AC_HINTS key extraction from source:**

```javascript
const src = fs.readFileSync("scripts/qa-agent.js", "utf8");
const hintKeys = new Set([...src.matchAll(/"(AC-[A-Z]+-\d+)":/g)].map(m => m[1]));
```

**Workflow additions:**

- `fixture_results` input on `workflow_dispatch` — injects pre-built JSON, skips QA agent run
- `Upload QA results artifact` step (`always()`, `retention-days: 3`)
- `QA agent` step gated: `if: ${{ inputs.fixture_results == '' }}`

This enables pipeline testing without waiting for a real failure.

---

### Commit 3: Issue enrichment + self-heal job (B/C)

**Files:** `scripts/qa-enrich-issue.js`, `.github/workflows/qa-nightly.yml`, `docs/internal/runbook-qa-nightly.md`

**`qa-enrich-issue.js`:**

- Category C: fetch `BASE_URL/api/health`, report HTTP status + DB connectivity
- Category B: `git log --oneline --since="7 days ago" -- <relevant paths>` per AC group
  - AC-IF-* → `app/setup/ app/api/admin/setup/`
  - AC-KV-* → `app/auth/`
  - AC-IS-* → `app/admin/`
- Posts via `gh issue comment` in a `<details>` collapsible block
- Noise guard: only post if issue is less than 24 hours old

**`self-heal` job:**

```yaml
self-heal:
  needs: [qa]
  if: failure() && needs.qa.result == 'failure'
  runs-on: ubuntu-latest
  permissions:
    contents: write
    pull-requests: write
    issues: write
```

Steps: checkout → setup node → npm ci → download artifact → classify → set CATEGORY → repair (placeholder) → enrich issue (if CATEGORY != A)

**Permissions:** Top-level `contents: read` → `contents: write`; add `pull-requests: write`

---

### Commit 4: qa-repair-agent.js + wire Category A

**Files:** `scripts/qa-repair-agent.js`, `.github/workflows/qa-nightly.yml`, `docs/internal/runbook-qa-nightly.md`

**`qa-repair-agent.js` flow:**

1. Read classification JSON → failing AC id + current hint text + evidence
2. Check for existing open repair PR → if found, post update comment and exit
3. Run agentic loop (Playwright + Anthropic SDK, same setup as `qa-agent.js`):
   - Tools: `navigate`, `read_page`, `propose_hint_fix` (output tool)
   - Agent reads live page, identifies correct label, calls `propose_hint_fix`
4. Validate proposal (unique substring, actually changed)
5. Apply fix to `scripts/qa-agent.js`
6. `npm run qa:reset` — abort if non-zero (Category C signal)
7. `STOP_AFTER=<acId> node scripts/qa-agent.js` — read results
8. Pass: `gh pr create` with repair PR body
9. Fail: revert fix, post repair-failed comment on issue

**Branch name:** `fix/qa-self-heal-${acId.toLowerCase()}-${Date.now()}`
**Token budget:** `QA_REPAIR_TOKEN_BUDGET = "10000"` (separate env var)
**Model:** `QA_MODEL` (same as nightly, defaults to `claude-haiku-4-5-20251001`)

---

## Files Changed

| File | Commit |
|------|--------|
| `scripts/qa-agent.js` | 1 |
| `.gitignore` | 1 |
| `scripts/qa-classify.js` | 2 (new) |
| `scripts/qa-classify.test.js` | 2 (new) |
| `.github/workflows/qa-nightly.yml` | 2, 3, 4 |
| `scripts/qa-enrich-issue.js` | 3 (new) |
| `scripts/qa-repair-agent.js` | 4 (new) |
| `docs/internal/runbook-qa-nightly.md` | 3, 4 |

---

## Verification

CI/backend only — verified by code review + Jest + fixture-mode `workflow_dispatch`.

After commit 2: `npm run test:ci` — `qa-classify.test.js` must pass.

After commit 3: `gh workflow run qa-nightly.yml -f fixture_results='{"exitCode":3,...}'` — verify self-heal fires and enriches issue.

After commit 4: `gh workflow run qa-nightly.yml -f fixture_results='{"exitCode":1,"results":[{"id":"AC-KV-2","status":"FAIL",...}],...}'` — verify repair agent proposes fix and opens PR.

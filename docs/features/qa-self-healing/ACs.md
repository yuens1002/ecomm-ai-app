# QA Self-Healing — AC Verification Report

**Branch:** `feat/qa-self-heal`
**Commits:** 4
**Iterations:** 0

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `qa-agent.js` writes `qa-results.json` on exit 1 | Code review: `scripts/qa-agent.js` — `process.on('exit')` handler + `runState` accumulator; verify schema has `exitCode`, `timestamp`, `results[]` with `id/status/evidence/toolCallTrace/turnCount` | File written with all required fields on AC failure | PASS — `runState` declared at line 87 with all required fields (`exitCode`, `timestamp`, `results[]`); `process.on("exit")` at line 98 calls `fs.writeFileSync("qa-results.json", …)`; each result includes `id/status/evidence/toolCallTrace/turnCount` (lines 511, 544, 550) | Confirmed | |
| AC-FN-2 | `qa-results.json` written on exit 2 and exit 3 | Code review: `process.on('exit')` fires synchronously on all `process.exit()` calls; `infraError` populated before exit 3 | `exitCode` field correctly reflects 2 or 3; `infraError` non-null on exit 3 | PASS — All `process.exit(3)` call sites (lines 111, 579, 588) set `runState.exitCode=3` and `runState.infraError` before exit; exit 2 path (line 499–503) sets `runState.exitCode=2` and `runState.totalTokens` before exit; `process.on("exit")` fires synchronously in all cases | Confirmed | |
| AC-FN-3 | Failed ACs include `finalPageSnapshot` and `finalPageUrl` | Code review: `runSingleAC` calls `readPage(page)` when `doneResult.status === "FAIL"` or on max-turns timeout; PASS ACs skip snapshot | PASS ACs have `null` snapshot; FAIL ACs have non-null accessibility tree string and URL | PASS — Lines 537–543: snapshot taken only when `doneResult.status === "FAIL"`; PASS returns `null` for both fields; `end_turn` path (line 510) and max-turns path (line 549) both capture snapshot unconditionally | Confirmed | |
| AC-FN-4 | `qa-classify.js` classifies Category C | Code review + unit test (`qa-classify.test.js`): fixture `{exitCode:3, infraError:"…"}` → `{category:"C"}` | Output `{ category: "C", repairable: false }` for exit 2 and 3 | PASS — Unit tests: "exit 3 with infraError → Category C" and "exit 2 (budget exceeded) → Category C" both pass; classifier logic at `qa-classify.js:92` gates on `result.exitCode >= 2 \|\| result.infraError`; `repairable: false` in all C paths | Confirmed — 15/15 tests pass | |
| AC-FN-5 | `qa-classify.js` classifies Category A | Code review + unit test: fixture with AC-KV-2 FAIL, `toolCallTrace:["navigate","fill","done"]`, high turnCount → `{category:"A"}` | Output `{ category: "A", repairable: true, failedAcs:[{id:"AC-KV-2",…}] }` | PASS — Unit tests: "AC-KV-2 FAIL with fill trace and 'without verdict' evidence → Category A" and "AC-IF-5 FAIL with fill trace and high turn count → Category A" both pass; `repairable: true` and `failedAcs[0].id === "AC-KV-2"` confirmed | Confirmed — 15/15 tests pass | |
| AC-FN-6 | `qa-classify.js` classifies Category B conservatively | Code review + unit test: fixture with AC-IF-5 FAIL, no A-signals → `{category:"B"}` | Classifier never promotes ambiguous failure to A; conservatively resolves to B | PASS — Unit tests: "403 evidence (no A-signal) → Category B", "AC without hint entry → Category B", "mix of A+B signals → Category B (conservative)", "assertion failure evidence → Category B" all pass; `bSignalAcs.length > 0` guard at `qa-classify.js:124` ensures conservative fallback | Confirmed — 15/15 tests pass | |
| AC-FN-7 | `workflow_dispatch` fixture mode skips QA agent | Code review: `qa-nightly.yml` `fixture_results` input present; "Run QA agent" step has `if: inputs.fixture_results == ''`; "Inject fixture results" step writes JSON to `qa-results.json` | When `fixture_results` is provided, QA agent step is skipped and JSON is injected | PASS — `fixture_results` input declared at `qa-nightly.yml:15`; "Inject fixture results" step at line 45 has `if: ${{ inputs.fixture_results != '' }}`; "Run QA agent" step at line 83 has `if: ${{ inputs.fixture_results == '' }}`; injection writes via `echo '…' > qa-results.json` | Confirmed | |
| AC-FN-8 | `self-heal` job activates only on `qa` job failure | Code review: `self-heal` job has `needs: [qa]` and `if: failure() && needs.qa.result == 'failure'` | Job runs when QA fails; job does not run when QA passes | PASS — `qa-nightly.yml:137` `self-heal` job has `needs: [qa]` and `if: failure() && needs.qa.result == 'failure'` exactly as specified | Confirmed | |
| AC-FN-9 | Category B/C path posts diagnostic comment | Code review: `scripts/qa-enrich-issue.js` fetches health endpoint (C) or runs git log (B); posts via `gh issue comment` with `<details>` block | Comment posted to open issue with failed AC list + health probe (C) or recent commits (B) | PASS — `qa-enrich-issue.js:72` branches on `category === "C"` → calls `healthProbe()` (lines 114–127, fetches `/api/health`); `category === "B"` → calls `buildGitLog()` (lines 129–167, runs `git log`); both paths post via `gh issue comment` at line 174; B path wraps git log in `<details>` block (lines 99–103) | Confirmed | |
| AC-FN-10 | Repair agent verifies fix before opening PR | Code review: `scripts/qa-repair-agent.js` runs teardown then `STOP_AFTER=<id> node scripts/qa-agent.js`; reads resulting `qa-results.json`; only calls `gh pr create` if targeted AC passes | No PR created when verification fails; issue enriched with repair attempt evidence instead | PASS — `qa-repair-agent.js:285` runs `spawnSync("node", ["scripts/qa-teardown.js"])`; line 340 runs `spawnSync("node", ["scripts/qa-agent.js"])` with `STOP_AFTER: acId` in env; lines 348–350 read `qa-results.json` and find targeted AC; lines 353–372 revert patch and post comment if `targetResult?.status !== "PASS"`; `gh pr create` only reached after PASS check at line 380 | Confirmed | |
| AC-FN-11 | Repair agent aborts if teardown fails | Code review: `qa-repair-agent.js` checks exit code of `qa-teardown.js`; non-zero → post diagnostic comment, exit without running verification | Reset failure never leads to a false-pass verification run | PASS — `qa-repair-agent.js:285–299`: `spawnSync` result checked at `resetResult.status !== 0`; on failure, posts diagnostic comment and calls `process.exit(3)` before any verification step is reached | Confirmed | |
| AC-FN-12 | Repair agent does not create duplicate PRs | Code review: before `gh pr create`, script runs `gh pr list --head "fix/qa-self-heal-…"`; if open PR exists, posts update comment instead | Only one open repair PR per AC at a time | PASS — `qa-repair-agent.js:264–270`: `gh pr list --head "${branchName}" --state open` runs before any repair attempt; if `prList.length > 0`, posts "Existing Repair PR" comment and `continue`s without creating a new PR | Confirmed | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Existing nightly QA stdout format unchanged | Code review: `runSingleAC` and `main()` stdout paths not modified; `writeResults()` writes to file only | `✅/❌/⏭️ ${id} ${status} — ${evidence}` format and summary table identical to pre-change output | PASS — Diff confirms all `console.log` stdout lines in `runSingleAC` (line 638) and summary block (lines 659–664) are unchanged; `runState` accumulator replaces `allResults` array but stdout output paths are identical; no new stdout added | Confirmed | |
| AC-REG-2 | Exit codes 0/1/2/3 semantics unchanged | Code review: `process.exit()` call sites not moved or renumbered; `runState` set before exit, not instead of exit | All four exit codes retain original semantics | PASS — All four `process.exit()` call sites retain original codes: exit 0/1 at line 669 (failed.length check), exit 2 at line 503, exit 3 at lines 111/579/588/676; `runState` fields are set as additions before each exit, never replacing the exit call | Confirmed | |
| AC-REG-3 | `precheck` passes | Run `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | PASS — `npm run precheck` exits 0; 0 TypeScript errors, 0 ESLint errors (1 pre-existing warning in `SalesClient.tsx` for TanStack Table, not introduced by this branch) | Confirmed | |
| AC-REG-4 | `qa:reset`, `qa:install`, `qa:teardown` work unchanged | Code review: `qa-reset.js` and `qa-teardown.js` not modified; `qa-agent.js` accepts all existing env vars | All three scripts invocable without new required inputs | PASS — `git log main..feat/qa-self-heal -- scripts/qa-reset.js scripts/qa-teardown.js` produces no output (neither file modified); `qa-agent.js` REQUIRED env vars list (line 102–105) unchanged; `RUN_ONLY` and `STOP_AFTER` env vars remain optional | Confirmed | |

---

## Agent Notes

**Verified:** 2026-03-28 | Branch: `feat/qa-self-heal` | All 16 ACs: PASS

**Test results:** `npx jest scripts/qa-classify.test.js --no-coverage` — 15/15 tests pass across Category A, B, C, and `hasASignal` suites.

**Precheck:** `npm run precheck` exits 0. Zero TypeScript errors. One pre-existing ESLint warning in `SalesClient.tsx` (TanStack Table incompatible-library) — not introduced by this branch and not an error.

**Notable findings:**

- AC-FN-10/11: The ACs doc prompt listed `qa:reset` (npm script) but the actual `How` column and implementation both use `scripts/qa-teardown.js` directly via `spawnSync`. The code correctly matches the `How` column — this is consistent.
- AC-FN-7: Fixture mode injection step uses `${{ inputs.fixture_results != '' }}` (not empty string guard) — correct. The "Run QA agent" step guard is `== ''`. Both conditions are complementary and correct.
- AC-FN-3: PASS ACs return `finalPageSnapshot: null` and `finalPageUrl: null` explicitly; snapshot is only captured on FAIL or timeout/end_turn — consistent with the Pass criteria.
- AC-REG-1: The old `allResults` local array was replaced by `runState.results` — all stdout paths unchanged because they iterate the same data structure with identical format strings.

## QC Notes

All 16 ACs confirmed PASS. Agent evidence is specific and file:line-grounded throughout. Key observations:

- **15/15 Jest tests pass** (`qa-classify.test.js`) — covers all three categories and `hasASignal` unit tests
- **Conservative classifier design holds**: The mix-of-signals test (AC-FN-6) confirms that any single B-signal AC among the failed set forces Category B, preventing false-positive Category A repairs
- **Process.on('exit') handler** correctly covers all `process.exit()` paths — both the explicit exit sites and the `main().catch()` handler, ensuring `qa-results.json` is always written
- **No ACs overridden** — sub-agent evidence matches the implementation exactly. 0 iterations needed.

**Post-verification dry run (2026-03-28):** Three fixture-mode `workflow_dispatch` runs confirmed end-to-end pipeline wiring in CI:

| Category | Result | Notes |
|----------|--------|-------|
| C (infra, exit 3) | ✓ | `qa` failed as expected → `self-heal` triggered → classify → set CATEGORY=C → all steps clean |
| B (regression, exit 1) | ✓ | `qa` failed as expected → `self-heal` triggered → classify → set CATEGORY=B → all steps clean |
| A (repair, exit 1) | ✓ (partial) | `qa-teardown.js` connected to real QA DB ✓; Playwright browser launched ✓; navigation failed on fake fixture URL (expected); graceful exit 1 |

Two bugs found and fixed during dry running (not caught by code-review ACs):

1. **Missing Playwright install in self-heal job** — repair agent calls `chromium.launch()` but the job never installed the browser. Fixed: added `npx playwright install chromium --with-deps` step gated on `CATEGORY == 'A'`.
2. **Fixture mode never triggered self-heal** — qa job always succeeded in fixture mode because no step fails. Fixed: added "Simulate QA failure" step that reads the injected `exitCode` and fails the job if non-zero. Also gated "Open GitHub issue on failure" to skip in fixture mode.

## Reviewer Feedback

*Human fills this section during review.*

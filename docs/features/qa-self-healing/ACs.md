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
| AC-FN-1 | `qa-agent.js` writes `qa-results.json` on exit 1 | Code review: `scripts/qa-agent.js` — `process.on('exit')` handler + `runState` accumulator; verify schema has `exitCode`, `timestamp`, `results[]` with `id/status/evidence/toolCallTrace/turnCount` | File written with all required fields on AC failure | | | |
| AC-FN-2 | `qa-results.json` written on exit 2 and exit 3 | Code review: `process.on('exit')` fires synchronously on all `process.exit()` calls; `infraError` populated before exit 3 | `exitCode` field correctly reflects 2 or 3; `infraError` non-null on exit 3 | | | |
| AC-FN-3 | Failed ACs include `finalPageSnapshot` and `finalPageUrl` | Code review: `runSingleAC` calls `readPage(page)` when `doneResult.status === "FAIL"` or on max-turns timeout; PASS ACs skip snapshot | PASS ACs have `null` snapshot; FAIL ACs have non-null accessibility tree string and URL | | | |
| AC-FN-4 | `qa-classify.js` classifies Category C | Code review + unit test (`qa-classify.test.js`): fixture `{exitCode:3, infraError:"…"}` → `{category:"C"}` | Output `{ category: "C", repairable: false }` for exit 2 and 3 | | | |
| AC-FN-5 | `qa-classify.js` classifies Category A | Code review + unit test: fixture with AC-KV-2 FAIL, `toolCallTrace:["navigate","fill","done"]`, high turnCount → `{category:"A"}` | Output `{ category: "A", repairable: true, failedAcs:[{id:"AC-KV-2",…}] }` | | | |
| AC-FN-6 | `qa-classify.js` classifies Category B conservatively | Code review + unit test: fixture with AC-IF-5 FAIL, no A-signals → `{category:"B"}` | Classifier never promotes ambiguous failure to A; conservatively resolves to B | | | |
| AC-FN-7 | `workflow_dispatch` fixture mode skips QA agent | Code review: `qa-nightly.yml` `fixture_results` input present; "Run QA agent" step has `if: inputs.fixture_results == ''`; "Inject fixture results" step writes JSON to `qa-results.json` | When `fixture_results` is provided, QA agent step is skipped and JSON is injected | | | |
| AC-FN-8 | `self-heal` job activates only on `qa` job failure | Code review: `self-heal` job has `needs: [qa]` and `if: failure() && needs.qa.result == 'failure'` | Job runs when QA fails; job does not run when QA passes | | | |
| AC-FN-9 | Category B/C path posts diagnostic comment | Code review: `scripts/qa-enrich-issue.js` fetches health endpoint (C) or runs git log (B); posts via `gh issue comment` with `<details>` block | Comment posted to open issue with failed AC list + health probe (C) or recent commits (B) | | | |
| AC-FN-10 | Repair agent verifies fix before opening PR | Code review: `scripts/qa-repair-agent.js` runs `npm run qa:reset` then `STOP_AFTER=<id> node scripts/qa-agent.js`; reads resulting `qa-results.json`; only calls `gh pr create` if targeted AC passes | No PR created when verification fails; issue enriched with repair attempt evidence instead | | | |
| AC-FN-11 | Repair agent aborts if `qa:reset` fails | Code review: `qa-repair-agent.js` checks exit code of `qa:reset`; non-zero → post diagnostic comment, exit without running verification | Reset failure never leads to a false-pass verification run | | | |
| AC-FN-12 | Repair agent does not create duplicate PRs | Code review: before `gh pr create`, script runs `gh pr list --head "fix/qa-self-heal-…"`; if open PR exists, posts update comment instead | Only one open repair PR per AC at a time | | | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Existing nightly QA stdout format unchanged | Code review: `runSingleAC` and `main()` stdout paths not modified; `writeResults()` writes to file only | `✅/❌/⏭️ ${id} ${status} — ${evidence}` format and summary table identical to pre-change output | | | |
| AC-REG-2 | Exit codes 0/1/2/3 semantics unchanged | Code review: `process.exit()` call sites not moved or renumbered; `runState` set before exit, not instead of exit | All four exit codes retain original semantics | | | |
| AC-REG-3 | `precheck` passes | Run `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-4 | `qa:reset`, `qa:install`, `qa:teardown` work unchanged | Code review: `qa-reset.js` and `qa-teardown.js` not modified; `qa-agent.js` accepts all existing env vars | All three scripts invocable without new required inputs | | | |

---

## Agent Notes

*Sub-agent fills this section during `/ac-verify`.*

## QC Notes

*Main thread fills this section after reading sub-agent report.*

## Reviewer Feedback

*Human fills this section during review.*

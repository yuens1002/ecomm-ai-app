# Counter Iter-8: Intelligence — Evaluation Harness & Benchmark — AC Verification Report

**Branch:** `feat/counter-iter8`
**Commits:** 6
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

> Harness-only iteration — no user-facing UI changes. Regression spot-check only.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Counter behavior unchanged after harness introduction | Interactive: open Counter, submit "something fruity and light" → screenshot | No visual regression; acknowledgment + products + chips present | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `scripts/counter-qa.ts` — runnable as Node.js script | Code review: `scripts/counter-qa.ts` | File exports `runQA()` and has `main()` entry; imports from `types/search.ts` for response typing | | | |
| AC-FN-2 | Fixture format — typed, versioned | Code review: `scripts/counter-qa.ts` or `scripts/fixtures/` | Each fixture has: `query`, `pageFrom?`, `expectedIntent`, `expectedProductType?`, `expectProducts: boolean`, `bannedPhrases?: string[]`, `minProducts?`, `maxProducts?` | | | |
| AC-FN-3 | Tier 1 scoring — deterministic assertions | Code review: scorer module | Tier 1 checks: intent match, product type match, cadence shape, banned phrase absence; returns 0.0–1.0 | | | |
| AC-FN-4 | Tier 2 scoring — structural assertions | Code review: scorer module | Tier 2 checks: products non-empty when `expectProducts: true`; products empty when `expectProducts: false`; merch products returned for merch queries; returns 0.0–1.0 | | | |
| AC-FN-5 | Tier 3 scoring — LLM-as-judge | Code review: scorer module | Tier 3 makes separate AI call with query + acknowledgment; scores relevance 0–10; normalizes to 0.0–1.0; uses a fast model different from the Counter model | | | |
| AC-FN-6 | Two-judge design for Tier 3 | Code review: scorer module | Tier 3 uses 2 LLM calls from different model families; averages scores; prevents single-model bias | | | |
| AC-FN-7 | Composite score formula applied | Code review: scorer module | Final score = `(tier1 * 0.60) + (tier2 * 0.25) + (tier3 * 0.15)` | | | |
| AC-FN-8 | Run history logged to local JSON | Code review: `scripts/counter-qa-history.json` schema | Each run appends `{ runAt, compositeScore, tier1Score, tier2Score, tier3Score, fixtureCount, model, breakdown[] }` | | | |
| AC-FN-9 | Benchmark gate — script exits 1 on score regression | Code review: runner exit logic | If `compositeScore < previousRunScore`, script exits 1 and prints delta; exits 0 otherwise | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | Harness excluded from `npm run test:ci` | Test run: `npm run test:ci` | `scripts/counter-qa.ts` and fixtures are excluded from Jest CI config; `test:ci` does not attempt to run them | | | |
| AC-TST-2 | Harness runs and scores without errors | Test run: `npm run test:counter-qa` (dev server must be running) | Script completes; prints composite score; exits 0 on first run (no benchmark to compare); no unhandled errors | | | |
| AC-TST-3 | 20 fixtures cover all intent types | Code review: fixture dataset | At least: 3 coffee discovery, 2 merch, 2 comparison, 2 recommendation, 2 how_to, 2 category-scoped, 2 vague/open-ended, 1 cadence check, 1 banned-phrase check, 3 regression | | | |
| AC-TST-4 | Tier 1 scorer unit-testable without dev server | Test run: `npm run test:ci` | Tier 1 scorer is a pure function; unit tests cover intent match, banned phrases, cadence shape — no HTTP call needed | | | |
| AC-TST-5 | `it.failing()` integration tests updated post iter-7 fixes | Test run: `npm run test:ci` | BUG-1 and OBS-4 `it.failing()` tests converted to `it()` (passing) or removed if covered by harness fixtures | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1273+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Counter QA baseline score established | Test run: `npm run test:counter-qa` | First run completes, score logged, benchmark gate does not trigger (no previous run to compare) | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

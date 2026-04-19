# Counter Iter-6: Architecture — Route SRP Refactor — AC Verification Report

**Branch:** `feat/counter-iter6`
**Commits:** 5
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

> Refactor-only iteration — visual regression is the only UI check. Dev server: `http://localhost:3000`.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Counter panel on homepage — full interaction | Interactive: open Counter, submit "something fruity and light" → screenshot | Acknowledgment visible, products returned, chips visible — identical behavior to pre-refactor | | | |
| AC-UI-2 | Counter panel on product page — context-aware greeting | Interactive: open Counter on `/products/origami-air-dripper` → screenshot | Product-aware greeting fires; no blank or skeleton state | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `lib/ai/extraction.ts` — exports `buildExtractionPrompt` and `extractAgenticFilters` | Code review: `lib/ai/extraction.ts` | Both functions exported; no inline implementation remaining in `route.ts` | | | |
| AC-FN-2 | `lib/ai/prompts.ts` — exports `buildSystemPrompt` | Code review: `lib/ai/prompts.ts` | Function exported; no inline implementation remaining in `route.ts` | | | |
| AC-FN-3 | `lib/ai/catalog.ts` — exports `buildCatalogSnapshot` | Code review: `lib/ai/catalog.ts` | Function exported; no inline implementation remaining in `route.ts` | | | |
| AC-FN-4 | `types/search.ts` — exports `FiltersExtracted`, `SearchParams`, `SearchResponse` | Code review: `types/search.ts` | All three types exported; no inline type definitions remaining in `route.ts` | | | |
| AC-FN-5 | `route.ts` is orchestration-only (≤250 lines) | Code review: `app/api/search/route.ts` | File line count ≤ 250; no embedded prompt strings, catalog logic, or type definitions | | | |
| AC-FN-6 | No hardcoded NL stop words in `route.ts` | Code review: `route.ts` + `lib/ai/extraction.ts` | Stop words array lives in `lib/ai/extraction.ts`, not in `route.ts` | | | |
| AC-FN-7 | All existing `route.ts` imports updated to new module paths | Code review: `app/api/search/__tests__/route.test.ts` | Test file imports from new locations; no import errors | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | All existing unit tests pass unmodified | Test run: `npm run test:ci` | Same test count as pre-refactor; 0 failures; import paths updated if needed | | | |
| AC-TST-2 | `build-system-prompt.test.ts` — imports from `lib/ai/prompts.ts` | Test run: `npm run test:ci` | Tests pass after import path update to new module | | | |
| AC-TST-3 | `buildExtractionPrompt` tests import from `lib/ai/extraction.ts` | Test run: `npm run test:ci` | Tests pass after import path update | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1273+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Counter behavior identical to pre-refactor | Interactive: submit 3 diverse queries (coffee, vague, merch attempt) | `acknowledgment`, `products`, `followUps` present in same cases as before | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

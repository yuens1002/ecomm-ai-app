# Search Quality Fixes — AC Verification Report

**Branch:** `feat/smart-search-ux`
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
| AC-FN-1 | BUG-1: `type = COFFEE` set when `flavorProfile` extracted alone | Code review: `app/api/search/route.ts` → `hasCoffeeFilters` block | `hasCoffeeFilters` includes `flavorProfile.length > 0` and assigns `whereClause.type = ProductType.COFFEE` | | | |
| AC-FN-2 | BUG-1: `type = COFFEE` set when `isOrganic` extracted alone | Code review: `app/api/search/route.ts` → `hasCoffeeFilters` block | `isOrganic !== undefined` is part of the `hasCoffeeFilters` condition | | | |
| AC-FN-3 | BUG-2: flavor terms added to OR clause as case-insensitive description search | Code review: `app/api/search/route.ts` → flavor application block | `whereClause.OR` is extended with `{ description: { contains: f, mode: "insensitive" } }` for each flavor term | | | |
| AC-FN-4 | BUG-2: flavor terms also try Title Case tastingNotes hasSome | Code review: `app/api/search/route.ts` → flavor application block | `whereClause.OR` contains `{ tastingNotes: { hasSome: [titleCasedFlavor] } }` for each flavor | | | |
| AC-FN-5 | BUG-3: OR clause deleted when hard DB filter present | Code review: `app/api/search/route.ts` → `hasHardDBFilters` block | `delete whereClause.OR` executes when `roastLevel` or `extractedOrigin` is truthy | | | |
| AC-FN-6 | BUG-4: extraction prompt forbids 3rd-person explanation | Code review: `app/api/search/route.ts` → `buildExtractionPrompt` | Prompt string contains a constraint against "The customer is" or third-person phrasing | | | |
| AC-FN-7 | BUG-5: extraction prompt caps follow-ups at 1 and prohibits repeating known info | Code review: `app/api/search/route.ts` → `buildExtractionPrompt` | Prompt string contains "AT MOST ONE" and a constraint against asking about already-mentioned topics | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | BUG-1: flavorProfile-only AI response → `type = COFFEE` in whereClause | Test run: `npm run test:ci -- --testPathPattern="api/search"` | Test asserts `call.where.type === "COFFEE"` when AI returns `filtersExtracted: { flavorProfile: ["citrus"] }` | | | |
| AC-TST-2 | BUG-1: empty filtersExtracted → `type` NOT in whereClause | Test run: same | Test asserts `call.where.type` is `undefined` when AI returns `filtersExtracted: {}` | | | |
| AC-TST-3 | BUG-2: flavor terms expand OR clause with description contains | Test run: same | Test asserts `call.where.OR` contains `{ description: { contains: "citrus", mode: "insensitive" } }` | | | |
| AC-TST-4 | BUG-2: flavor terms add Title Case tastingNotes hasSome to OR | Test run: same | Test asserts `call.where.OR` contains `{ tastingNotes: { hasSome: ["Citrus"] } }` | | | |
| AC-TST-5 | BUG-3: roastLevel extracted → OR clause removed from whereClause | Test run: same | Test asserts `call.where.OR` is `undefined` when AI returns `roastLevel: "light"` | | | |
| AC-TST-6 | BUG-3: origin extracted → OR clause removed | Test run: same | Test asserts `call.where.OR` is `undefined` when AI returns `origin: "Ethiopia"` | | | |
| AC-TST-7 | BUG-4: user prompt in chatCompletion call forbids 3rd-person | Test run: same | Test asserts the user message passed to `chatCompletion` contains the 3rd-person constraint string | | | |
| AC-TST-8 | BUG-5: user prompt in chatCompletion call contains 1-followup cap | Test run: same | Test asserts the user message passed to `chatCompletion` contains `"AT MOST ONE"` | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All existing search route tests pass | Test run: `npm run test:ci -- --testPathPattern="api/search"` | All pre-existing tests pass, 0 failures | | | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |

---

## Agent Notes

_Sub-agent fills this section during verification._

## QC Notes

_Main thread fills this section after reading agent report._

## Reviewer Feedback

_Human fills this section during final review._

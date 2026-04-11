# Search Quality Fixes — Plan

**Branch:** `feat/smart-search-ux`
**Base:** `main`

---

## Context

The agentic search backbone (`feat/smart-search-ux`) shipped with five quality bugs discovered during manual testing. These are all in `app/api/search/route.ts` — either in the Prisma filter application logic or the AI extraction prompt. No schema changes. No new features.

---

## Bugs in Scope

| ID | Bug | Root Cause |
|----|-----|------------|
| BUG-1 | Gear products appear in coffee results | `type = COFFEE` only set when `roastLevel` is extracted; flavor-only queries skip it |
| BUG-2 | `flavorProfile` extracted but never applied | Flavor terms not added to Prisma query; `tastingNotes` array uses Title Case so `hasSome` fails |
| BUG-3 | Text OR clause fights hard semantic filters | When `roastLevel`/`origin` are applied, stale text tokens (e.g. "cup", "morning") match noise |
| BUG-4 | Explanation written in 3rd person | Prompt says "one sentence why these results match" — AI defaults to "The customer is looking for..." |
| BUG-5 | Follow-up chips repeat known info; 2-3 chips returned | Prompt doesn't prohibit re-asking established info or cap count |

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for search-quality-fixes` | — |
| 1 | `fix: lock type=COFFEE on coffee filters, apply flavor to OR clause, clear OR on hard DB filters` | Low |
| 2 | `fix: tighten AI prompt — first-person explanation, max 1 follow-up, no repeating established info` | Low |
| 3 | `test: search quality — BUG-1 through BUG-5 coverage` | Low |
| 4 | `chore: update verification status` | — |

---

## Acceptance Criteria

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | BUG-1: `type = COFFEE` set when `flavorProfile` extracted alone | Code review: `route.ts` → `hasCoffeeFilters` block | `whereClause.type = ProductType.COFFEE` assigned whenever `flavorProfile.length > 0` |
| AC-FN-2 | BUG-1: `type = COFFEE` set when `isOrganic` extracted alone | Code review: `route.ts` → `hasCoffeeFilters` block | `isOrganic !== undefined` is included in the `hasCoffeeFilters` condition |
| AC-FN-3 | BUG-2: flavor terms added to OR clause as case-insensitive description search | Code review: `route.ts` → flavor application block | `whereClause.OR` extended with `{ description: { contains: flavor, mode: "insensitive" } }` and `{ tastingNotes: { hasSome: [titleCased] } }` for each flavor term |
| AC-FN-4 | BUG-3: OR clause deleted when hard DB filter (roastLevel or origin) present | Code review: `route.ts` → `hasHardDBFilters` block | `delete whereClause.OR` executes when `roastLevel` or `extractedOrigin` is truthy |
| AC-FN-5 | BUG-4: extraction prompt instructs first-person, no 3rd-person | Code review: `route.ts` → `buildExtractionPrompt` | Prompt string contains `"Never use 'The customer is'"` or equivalent constraint |
| AC-FN-6 | BUG-5: extraction prompt caps follow-ups at 1 and prohibits repeat questions | Code review: `route.ts` → `buildExtractionPrompt` | Prompt string contains `"AT MOST ONE"` and `"NEVER ask about anything the customer already mentioned"` |

### Test Coverage (verified by test run)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-TST-1 | BUG-1: flavorProfile-only AI response → `type = COFFEE` in whereClause | Test run: `npm run test:ci -- --testPathPattern="search"` | Test asserts `call.where.type === "COFFEE"` when AI returns `flavorProfile: ["citrus"]` |
| AC-TST-2 | BUG-1: no coffee filters extracted → `type` NOT set (gear can appear) | Test run: same | Test asserts `call.where.type` is `undefined` when AI returns `filtersExtracted: {}` |
| AC-TST-3 | BUG-2: flavor terms expand OR clause with description contains | Test run: same | Test asserts `call.where.OR` contains an entry with `description: { contains: "citrus", mode: "insensitive" }` |
| AC-TST-4 | BUG-2: flavor terms also try Title Case tastingNotes hasSome | Test run: same | Test asserts `call.where.OR` contains `{ tastingNotes: { hasSome: ["Citrus"] } }` |
| AC-TST-5 | BUG-3: roastLevel extracted → OR clause deleted from whereClause | Test run: same | Test asserts `call.where.OR` is `undefined` when AI returns `roastLevel: "light"` |
| AC-TST-6 | BUG-3: origin extracted → OR clause deleted | Test run: same | Test asserts `call.where.OR` is `undefined` when AI returns `origin: "Ethiopia"` |
| AC-TST-7 | BUG-4: system prompt constrains explanation to first-person | Test run: same | Test asserts `chatCompletion` called with user prompt containing `"Never use"` or `"first person"` |
| AC-TST-8 | BUG-5: system prompt caps follow-ups at 1 | Test run: same | Test asserts user prompt contains `"AT MOST ONE"` |

### Regression

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | All existing search route tests still pass | Test run: `npm run test:ci -- --testPathPattern="search"` | All pre-existing tests pass (TST-1 through TST-5 + existing suite) |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors |

---

## Implementation Details

### Commit 1: Filter logic fixes (BUG-1, BUG-2, BUG-3)

**File:** `app/api/search/route.ts`

**BUG-1 — `hasCoffeeFilters` block (after all filter applications):**

```ts
const hasCoffeeFilters = !!(
  roastLevel ||
  extractedOrigin ||
  (flavorProfile && flavorProfile.length > 0) ||
  isOrganic !== undefined ||
  processing ||
  variety
);
if (hasCoffeeFilters) {
  whereClause.type = ProductType.COFFEE;
}
```

**BUG-2 — Expand OR clause with flavor terms:**

```ts
if (flavorProfile && flavorProfile.length > 0) {
  const flavorEntries = flavorProfile.flatMap((f) => [
    { description: { contains: f, mode: "insensitive" as const } },
    { tastingNotes: { hasSome: [f.charAt(0).toUpperCase() + f.slice(1)] } },
  ]);
  whereClause.OR = [...(whereClause.OR ?? []), ...flavorEntries];
}
```

Note: `hasSome` is case-sensitive; Title Case covers the common case ("citrus" → "Citrus"). Description `contains` with `mode: "insensitive"` handles multi-word notes like "Citrus Zest".

**BUG-3 — Delete OR when hard DB filters present:**

```ts
const hasHardDBFilters = !!(roastLevel || extractedOrigin || variety || processing);
if (hasHardDBFilters) {
  delete whereClause.OR;
}
```

### Commit 2: Prompt quality fixes (BUG-4, BUG-5)

**File:** `app/api/search/route.ts` → `buildExtractionPrompt`

Replace the explanation and followUps sections:

```
"explanation": "one sentence spoken directly to the customer in first person. Never use 'The customer is...' or any third-person phrasing. Good example: 'These hit that bright citrus note you're after — light and perfect for mornings.'",
"followUps": []

followUps rules:
- Return AT MOST ONE item, or an empty array [] if the query is already specific
- NEVER ask about anything the customer already mentioned in their query
- Include one item only when a single clarification would significantly change results
```

### Commit 3: Tests

**File:** `app/api/search/__tests__/route.test.ts`

Add 8 new test cases (AC-TST-1 through AC-TST-8) following existing `beforeEach` + mock patterns in the file.

---

## Files Changed (1 modified, 0 new)

| File | Commits | Notes |
|------|---------|-------|
| `app/api/search/route.ts` | 1, 2 | Filter logic + prompt |
| `app/api/search/__tests__/route.test.ts` | 3 | 8 new tests |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan + ACs to branch (`--no-verify` for docs)
2. Register `verification-status.json`: `{ status: "planned", acs_total: 10 }` (8 TST + 2 REG)
3. Transition to `"implementing"` when coding begins
4. After implementation: transition to `"pending"`, run `npm run test:ci`
5. Spawn `/ac-verify` sub-agent to verify FN and TST ACs
6. Human reviews and fills Reviewer column

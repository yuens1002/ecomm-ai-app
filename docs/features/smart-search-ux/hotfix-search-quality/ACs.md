# Search Quality Hotfix — AC Verification Report

**Branch:** `fix/search-quality`
**Commits:** 0
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
| AC-FN-1 | AI extraction replaces keyword OR clause | Code review: `search/route.ts` — trace `agenticData` branch | When `agenticData?.filtersExtracted` is non-null, `whereClause.OR` from NL tokenization is cleared before AI filters are applied | | | |
| AC-FN-2 | Keyword fallback uses PostgreSQL full-text search | Code review: `search/route.ts` — trace non-AI keyword path | When AI unavailable/fails, queries use `tsvector`/`tsquery` with `ts_rank` instead of `contains` | | | |
| AC-FN-3 | Empty AI extraction falls back gracefully | Code review: `search/route.ts` | When AI extracts no filters (all undefined), falls back to full-text keyword search rather than returning everything | | | |

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Empty results always show noResults voice surface | Code review: `ChatPanel.tsx` — trace empty response handler | When search returns 0 products and no acknowledgment, `noResults` voice surface rendered — never silence | | | |
| AC-UI-2 | noResults message uses inviting tone | Code review: `voice-surfaces.ts` default | Default text pivots to learning preferences, not "nothing matches" | | | |

## Test Acceptance Criteria (fixture-based search relevance)

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | "fruity coffee" → fruity coffees only | Test run: fixture test against seed data | Returns Rwanda Bourbon, Colombia Geisha, Ethiopian Yirgacheffe; excludes Italian Roast, French Roast | | | |
| AC-TST-2 | "dark roast" → dark roast category | Test run: fixture test against seed data | Returns French Roast, Italian Roast, Sumatra Mandheling | | | |
| AC-TST-3 | "tropical fruity notes" → fruity/tropical coffees | Test run: fixture test against seed data | Excludes Breakfast Blend, Mexican Altura; returns coffees with tropical/fruity notes | | | |
| AC-TST-4 | "most expensive" → price-sorted results | Test run: fixture test against seed data | Products sorted by price descending; first result is highest priced | | | |
| AC-TST-5 | "smooth chocolatey" → chocolate-profile coffees | Test run: fixture test against seed data | Returns coffees with chocolate/cocoa tasting notes; excludes light/bright coffees | | | |
| AC-TST-6 | "organic" → organic coffees only | Test run: fixture test against seed data | All returned products have `isOrganic: true` | | | |
| AC-TST-7 | "under $25" → price-filtered results | Test run: fixture test against seed data | All returned products have a variant priced ≤ $25.00 | | | |
| AC-TST-8 | Empty results render noResults surface | Test run: component test | ChatPanel renders `noResults` voice surface text when API returns 0 products | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors | | | |
| AC-REG-3 | Roast-level keyword queries still work | Test run: fixture test | "dark roast" → category filter still applied correctly | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here.}

## QC Notes

{Main thread writes fix notes here.}

## Reviewer Feedback

{Human writes review feedback here.}

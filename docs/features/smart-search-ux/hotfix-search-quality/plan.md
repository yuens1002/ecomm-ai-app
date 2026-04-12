# Search Quality Hotfix — Plan

**Branch:** `fix/search-quality` (or bundled into iter-4 branch)
**Base:** `main` (after Phase 2 merge)

---

## Context

The AI search returns irrelevant products for natural language queries. Two root causes:

1. **Keyword OR clause drowns AI results.** When AI extraction succeeds (e.g. `flavorProfile: ["fruity"]`), the extracted filters are appended to a broad keyword OR clause — not replacing it. Tokens like "coffee" or "notes" match nearly every product via `description contains`, so irrelevant products outnumber relevant ones.

2. **No relevance ranking in keyword fallback.** When AI is unavailable, the keyword search uses Prisma `contains` (raw substring match) with no TF-IDF weighting. Words that appear in every description ("coffee", "notes", "roast") match as strongly as discriminating words ("tropical", "geisha").

3. **Silent failure on empty results.** When the search returns zero products, the ChatPanel renders nothing — no acknowledgment, no message. The customer gets dead silence.

User-reported examples:

- "tropical fruity notes?" → Breakfast Blend, Mexican Altura (matched on "notes")
- "yes i like a fruity coffee" → Italian Roast, French Roast (matched on "coffee")
- "which is the most expensive?" → no response (sortBy extracted but keyword OR matched nothing)
- "is the t-shirt made of 100% cotton?" → no response (non-coffee query, silent failure)

---

## Commit Schedule

| # | Message | Scope | Risk |
|---|---------|-------|------|
| 1 | `fix: clear keyword OR when AI extraction succeeds` | route.ts | Low |
| 2 | `fix: switch keyword fallback to PostgreSQL full-text search` | route.ts, prisma | Medium |
| 3 | `fix: always render response on empty results` | ChatPanel.tsx | Low |
| 4 | `test: search relevance fixture tests` | tests | Low |

---

## Acceptance Criteria

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | AI extraction replaces keyword OR clause | Code review: `search/route.ts` | When `agenticData?.filtersExtracted` is non-null, `whereClause.OR` from NL tokenization is cleared before AI filters are applied |
| AC-FN-2 | Keyword fallback uses PostgreSQL full-text search | Code review: `search/route.ts` | When AI unavailable/fails, queries use `tsvector`/`tsquery` with `ts_rank` instead of `contains` |
| AC-FN-3 | Empty AI extraction falls back gracefully | Code review: `search/route.ts` | When AI extracts no filters (all undefined), falls back to full-text keyword search rather than returning everything |

### UI (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Empty results always show noResults voice surface | Code review: `ChatPanel.tsx` | When search returns 0 products and no acknowledgment, `noResults` voice surface rendered — never silence |
| AC-UI-2 | noResults message uses inviting tone | Code review: `voice-surfaces.ts` | Default text pivots to learning preferences, not "nothing matches" |

### Test (verified by test run — fixture-based relevance)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-TST-1 | "fruity coffee" → fruity coffees only | Test run: fixture test against seed data | Returns products with fruity tasting notes (e.g. Rwanda Bourbon, Colombia Geisha, Ethiopian Yirgacheffe); does NOT return Italian Roast, French Roast |
| AC-TST-2 | "dark roast" → dark roast category | Test run: fixture test against seed data | Returns products in dark-roast category (e.g. French Roast, Italian Roast, Sumatra Mandheling) |
| AC-TST-3 | "tropical fruity notes" → fruity/tropical coffees | Test run: fixture test against seed data | Does NOT return Breakfast Blend or Mexican Altura; returns coffees with tropical/fruity tasting notes |
| AC-TST-4 | "most expensive" → AI sort extracted, keyword OR cleared | Test run: fixture test against seed data | AI maps comparative query to nearest supported sort ("newest"); keyword OR is cleared so "expensive"/"most" substrings don't block results. True price sorting requires a denormalized minPrice column — tracked for follow-up. |
| AC-TST-5 | "smooth chocolatey" → chocolate-profile coffees | Test run: fixture test against seed data | Returns coffees with chocolate/cocoa tasting notes; does NOT return light/bright coffees |
| AC-TST-6 | "organic" → organic coffees only | Test run: fixture test against seed data | Returns only products with `isOrganic: true` |
| AC-TST-7 | "under $25" → price-filtered results | Test run: fixture test against seed data | All returned products have a variant with price ≤ $25.00 |
| AC-TST-8 | Empty results render noResults surface | Test run: component test | ChatPanel renders `noResults` voice surface text when API returns 0 products |

### Regression (verified by test suite)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors |
| AC-REG-3 | Roast-level keyword queries still work | Test run: fixture test | "dark roast" → category filter still applied correctly |

---

## Implementation Details

### Commit 1: Clear keyword OR when AI extraction succeeds

**File:** `app/api/search/route.ts`

After AI extraction succeeds (~line 406), clear the initial `whereClause.OR`:

```ts
if (agenticData?.filtersExtracted) {
  delete whereClause.OR; // Discard broad keyword matches — AI is more precise
  // ... existing filter application ...
}
```

### Commit 2: PostgreSQL full-text search for keyword fallback

**File:** `app/api/search/route.ts`

Replace `{ description: { contains: token, mode: "insensitive" } }` with PostgreSQL full-text search using `tsvector`/`tsquery` with `ts_rank`. TF-IDF ranking automatically suppresses high-frequency words.

### Commit 3: Always render response on empty results

**File:** `app/(site)/_components/ai/ChatPanel.tsx`

When API returns 0 products and no acknowledgment, render `noResults` voice surface:

```ts
const content = data.acknowledgment || (data.products?.length === 0 ? voiceSurfaces.noResults : "");
```

### Commit 4: Search relevance fixture tests

**File:** `app/api/search/__tests__/search-relevance.test.ts`

Fixture-based tests that run queries against actual seed data and assert expected products are returned and irrelevant products are excluded. Each fixture defines:

- Input query string
- Expected product names (must be present)
- Excluded product names (must NOT be present)
- Optional: sort order assertion

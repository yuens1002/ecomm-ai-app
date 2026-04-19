# Counter Iter-8: Intelligence — Evaluation Harness & Benchmark — Plan

**Branch:** `feat/counter-iter8`
**Base:** `feat/counter-iter7` (after iter-7 merge)
**Source:** `docs/features/smart-search-ux/iter-6-architecture/BUGS.md` (GAP-9)
**Depends on:** Iter-7 (Zod schema + merch fix must be in place before harness can meaningfully score them)

---

## Context

Tests pass (1273+), but merch search was broken, grounded truth mismatched, and chip re-queries were firing full pipelines. None of this was caught by any test. The test suite verifies prompt text contains certain phrases and that the route makes the right structural choices — it does NOT verify whether the Counter actually produces semantically correct results for real queries.

This iteration builds the infrastructure to close that gap: a Counter QA scoring harness that fires real HTTP requests against the dev server, evaluates response quality programmatically, and produces a single composite score (0.0–1.0). This score is the benchmark gate for all future Counter changes.

**Karpathy loop pattern** — the harness enables a modify → run → score → keep/discard cycle that is fast, cheap, and empirical. A new model, a prompt change, or a new extraction rule can be validated against the same fixture dataset in minutes without manual spot-checking.

**Scoring design (three tiers):**

| Tier | Weight | Type | What it checks |
|------|--------|------|----------------|
| 1 — Deterministic | 60% | Assertions | Intent classification, product type, cadence shape (acknowledgment present, followUps count), banned phrases absent |
| 2 — Structural | 25% | Assertions | Products non-empty when expected, products empty when expected (compare/recommend), merch products returned for merch queries |
| 3 — Semantic quality | 15% | LLM-as-judge | Acknowledgment relevance to query intent (not to products — grounded truth is now Tier 2); judged by a fast model from a different family than the one under test |

**Composite score formula:** `(tier1_score * 0.60) + (tier2_score * 0.25) + (tier3_score * 0.15)`

A run that scores below the previous run's composite score fails the benchmark gate and blocks shipping.

---

## Commit Schedule

| # | Message | Items | Risk |
|---|---------|-------|------|
| 0 | `docs: add plan for counter-iter8` | — | — |
| 1 | `feat: counter-qa harness scaffold — runner, scorer, fixture format` | GAP-9 | Low |
| 2 | `feat: counter-qa fixture dataset — 20 scored fixtures across intent types` | GAP-9 | Low |
| 3 | `feat: counter-qa composite scoring — deterministic + structural tiers` | GAP-9 | Medium |
| 4 | `feat: counter-qa LLM-as-judge tier — semantic quality scoring` | GAP-9 | Medium |
| 5 | `feat: counter-qa run history — log scores per run to local JSON` | GAP-9 | Low |
| 6 | `chore: npm script + Jest config for counter-qa` | GAP-9 | Low |

---

## Acceptance Criteria

**→ See [`acs.md`](acs.md) for the full verification table (Agent / QC / Reviewer columns).**

15 ACs total: 1 UI (visual regression), 9 functional (code review), 5 test coverage, 3 regression.

---

## UX Flows

> Harness-only — no user-facing flows change.

| Flow | Question | Answer |
|------|----------|--------|
| Developer runs harness | What do they see? | Per-fixture pass/fail, tier breakdown, composite score, delta vs. previous run |
| Score regression detected | What happens? | Script exits 1, prints: "FAIL — composite score 0.72 < previous 0.81 (delta: -0.09). Do not ship." |
| First run (no history) | What happens? | Runs all fixtures, logs score as baseline, exits 0 |

---

## Implementation Details

### Commit 1: Scaffold

**File:** `scripts/counter-qa.ts`

```typescript
interface QAFixture {
  id: string;
  query: string;
  pageFrom?: string;          // e.g., "categories/central-america"
  expectedIntent: string;
  expectedProductType?: "coffee" | "merch";
  expectProducts: boolean;    // false for compare/recommend
  bannedPhrases?: string[];
  minProducts?: number;
  maxProducts?: number;
}

interface QAResult {
  fixtureId: string;
  query: string;
  tier1Score: number;
  tier2Score: number;
  tier3Score: number;
  compositeScore: number;
  pass: boolean;
  notes: string[];
}
```

Runner fires `GET /api/search?q={query}&ai=true&from={pageFrom}` for each fixture. Collects `SearchResponse`. Passes to scorer. Prints per-fixture results + aggregate.

### Commit 2: Fixtures

**File:** `scripts/counter-qa-fixtures.ts` (or inline in `counter-qa.ts`)

20 fixtures minimum:

| ID | Query | Intent | expectProducts | Notes |
|----|-------|--------|----------------|-------|
| F01 | "something fruity and light" | product_discovery | true | Core vague query |
| F02 | "most expensive coffee from central america" | product_discovery | true | Category scope + price sort |
| F03 | "do you have a pour over coffee maker?" | product_discovery | true | Merch discovery |
| F04 | "do you have the Origami Air Dripper?" | product_discovery | true | Named merch lookup |
| F05 | "which is better for a beginner, Ethiopian or Colombian?" | compare | false | Comparison → no cards |
| F06 | "what would you recommend for someone who hates bitter coffee?" | recommend | false | Recommend → no cards |
| F07 | "how do I brew a pour over?" | how_to | false | How-to → no cards |
| F08 | "how does natural processing affect flavor?" | how_to | false | How-to → no cards |
| F09 | "I want to reorder last month's bag" | reorder | false | Reorder → no cards |
| F10 | "what's good today?" | product_discovery | true | Vague → products + acknowledgment |
| F11 | "light Ethiopian with floral notes" | product_discovery | true | Specific filter combo |
| F12 | "dark roast" | product_discovery | true | Single-filter |
| F13 | "gift for a coffee lover" | product_discovery | true | Occasion-based |
| F14 | "something strong" | product_discovery | true | Intent signal (not keyword) |
| F15 | "I want to try something I've never had before" | product_discovery | true | Open-ended novelty |
| F16 | "do you stock Kenyan AA?" | product_discovery | true | Stock question (no assert) — bannedPhrases: ["in stock", "we have that"] |
| F17 | "top rated coffees" | product_discovery | true | Sort by top_rated |
| F18 | "newest arrivals" | product_discovery | true | Sort by newest |
| F19 | "welcome in" (regression) | product_discovery | true | bannedPhrases: ["welcome in", "come on in"] |
| F20 | "anything fruity" (with from=categories/central-america) | product_discovery | true | Category pre-scope regression |

### Commit 3: Deterministic + structural scoring

**File:** `scripts/counter-qa.ts` → `scoreFixture()` function

Tier 1 (60%):

- Intent match: `response.intent === fixture.expectedIntent` → 1.0 or 0.0 (hard check)
- Product type: if `expectedProductType` set, all returned products must match → weighted
- Acknowledgment non-null: `response.acknowledgment !== null && response.acknowledgment.length > 0`
- Banned phrases: none of `bannedPhrases` appear in acknowledgment (case-insensitive)
- Cadence: `followUps.length === 0` when `products.length <= 3`

Tier 2 (25%):

- Products non-empty check: `products.length > 0` when `expectProducts === true`
- Products empty check: `products.length === 0` when `expectProducts === false`
- Merch type check: all products in merch response are equipment/non-coffee items

### Commit 4: LLM-as-judge

**File:** `scripts/counter-qa.ts` → `scoreSemantic()` function

Call 2 fast models (e.g., Gemini Flash + Claude Haiku):

```text
Prompt: "A customer said: "{query}". The Counter responded with: "{acknowledgment}". 
Does this response appropriately address what the customer was asking for? 
Score 1–10. Respond with just the number."
```

Average the two scores, normalize to 0.0–1.0.

> Only call LLM judge when `acknowledgment` is non-empty. Compare expects products? Skip judge — structural already covers it.

### Commits 5–6: Run history + npm script

**Files:** `scripts/counter-qa-history.json` (gitignored), `package.json`

```json
"test:counter-qa": "ts-node --project tsconfig.node.json scripts/counter-qa.ts"
```

History file: `[{ runAt, compositeScore, tier1Score, tier2Score, tier3Score, fixtureCount, model }]` — append-only, gitignored.

---

## Files Changed (estimated 3 modified, 4 new)

| File | Commit | Notes |
|------|--------|-------|
| `scripts/counter-qa.ts` | 1–5 | New — runner + scorer + fixtures |
| `scripts/counter-qa-fixtures.ts` | 2 | New (or inlined) — 20 fixture objects |
| `scripts/counter-qa-history.json` | 5 | New — gitignored run log |
| `package.json` | 6 | Add `test:counter-qa` script |
| `jest.config.js` (or equivalent) | 6 | Exclude `scripts/` from CI run (if not already) |
| `app/api/search/__tests__/integration/counter-cadence.integration.test.ts` | — | Update `it.failing()` tests that are now passing (BUG-1, OBS-4 fixed in iter-7) |
| `docs/features/smart-search-ux/iter-8/plan.md` | 0 | This plan |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan: `git commit --no-verify -m "docs: add plan for counter-iter8"`
2. Register `verification-status.json`: `{ status: "planned", acs_total: 15 }`
3. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Run `npm run test:ci`
4. Run `npm run test:counter-qa` (dev server must be running with AI configured) — record baseline score
5. Spawn `/ac-verify` sub-agent — sub-agent fills **Agent** column
6. Main thread reads report, fills **QC** column
7. If any fail → fix → re-verify ALL ACs
8. When all pass → hand off ACs doc to human → human fills **Reviewer** column

**Note:** First run of `test:counter-qa` establishes the baseline score. There is no previous score to compare against on first run — benchmark gate does not trigger. Subsequent runs are gated.

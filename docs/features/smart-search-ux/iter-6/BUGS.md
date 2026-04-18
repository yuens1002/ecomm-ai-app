# Iter-6 Bug Log — Counter Quality & Architecture

**Logged:** 2026-04-15  
**Source:** Iter-5 post-ship manual spot-check (session 2bcdf5e9)  
**Status:** Captured for iter-6 planning  

All bugs and observations below were discovered during a live Counter session. Root causes are identified. No code was changed — these are captured for scoped implementation in iter-6.

---

## Bugs

### BUG-1 — Merch search returns zero results

**Symptom:** Querying for merch (e.g., "do you have a pour over coffee maker?", "looking for a dripper") returns no products even when matching merch items exist in the catalog.

**Root cause:** `route.ts` lines ~801–815 — when `filtersExtracted.productType === "merch"`, the Prisma query uses the raw NL query string for `name/description ILIKE` match:

```typescript
if (query) {
  whereClause.OR = [
    { name: { contains: query, mode: "insensitive" } },
    { description: { contains: query, mode: "insensitive" } },
  ];
}
```

A question like "do you have a pour over coffee maker?" won't match product names like "Origami Air Dripper" or "Hario V60". The raw question string is not a product keyword.

**Fix direction:** The extraction AI should return a `productKeywords: string[]` field (e.g., `["pour over", "dripper", "V60"]`) for merch queries. The Prisma `OR` clause should search against these keywords, not the raw query string. Alternatively: a keyword-extraction pass for the merch `where` clause.

---

### BUG-2 — Grounded truth mismatch (acknowledgment diverges from results)

**Symptom:** The acknowledgment bubble references products that don't appear in the result set. E.g., acknowledgment says "We've got a beautiful Sumatra on right now" but the cards shown are Ethiopian and Colombian.

**Root cause:** Two separate AI calls, each independently reasoning:
1. `buildSystemPrompt()` + conversation history → generates acknowledgment (knows catalog, but hallucinate-prone)  
2. `buildExtractionPrompt()` → extracts `filtersExtracted` → Prisma query → actual products returned

These calls are decoupled. The acknowledgment AI has no constraint to only reference what Prisma will actually return. The results AI has no awareness of what the acknowledgment said.

**Fix direction (two options, pick one):**
- **Option A — unified call:** One AI call returns both `acknowledgment` and `filtersExtracted`. The acknowledgment is generated in context of what the extraction decided, not independently.
- **Option B — post-query acknowledgment:** Run extraction first → fetch products → generate acknowledgment as a third AI call constrained to the actual returned products (pass product names into the prompt). Slower (3-call chain) but ground-truth accurate.

---

### BUG-3 — Chip re-query fires full AI pipeline (no progressive filtering)

**Symptom:** Clicking a follow-up chip (e.g., "Bold", "Light roast") fires a completely new `/api/search?ai=true` pipeline: new catalog snapshot, new AI extraction, new Prisma query, new acknowledgment. This is slow, expensive, and can return a completely different result set that doesn't narrow the previous one.

**Root cause:** Chips are rendered with a new query string and `ai=true`. No state from the previous search is passed. The route has no concept of "narrow this result set" — it only knows "new search".

**Fix direction:**
- **Option A — client-side progressive filter:** Store the full result set from the initial search in the store. Chip click applies a client-side filter (Zustand) to the already-fetched products. No new API call.
- **Option B — server-side narrow:** Pass `existingProductIds[]` and the chip label as filter context to the route. Route skips AI extraction and applies a lightweight keyword/attribute filter to the known ID set.
- Option A is simpler; Option B is more consistent with server-side data access.

---

## Observations

### OBS-4 — Comparison/recommendation intent shows product cards

**Symptom:** "Which of these two would you pick for a beginner — the Ethiopian or the Colombian?" produces product cards for both coffees in the result area. Showing cards for a comparison query is wrong — the user wants the AI's opinion, not a list.

**Root cause:** No intent classification for compare/recommend queries. The extraction AI defaults to product discovery, returns both names as filters, Prisma returns both products, UI shows cards.

**Fix direction:** Don't need a new intent type. When the AI classifies the intent as `compare` or `recommend` (add these values to `FiltersExtracted.intent`), set `products: []` in the route response. Let the acknowledgment carry the AI's reasoning. No product cards rendered.

**Note:** This is distinct from `how_to` intent. Compare = "between these two options, which?" Recommend = "I know nothing, what do you suggest for X context?" Both should return `products: []` but different acknowledgment tone.

---

### OBS-5 — Q&A examples bleed verbatim into AI voice

**Symptom:** AI responds with "we have a great selection of very approachable coffees" — a phrase that appeared verbatim in the extraction prompt's hardcoded example answers. The AI is treating prompt examples as its own vocabulary.

**Root cause:** `buildExtractionPrompt()` contains hardcoded example Q&A pairs (to demonstrate JSON output shape). These example phrases carry semantic weight — the AI learns that this phrasing is "what good answers look like" and reproduces it. This competes directly with the shop owner's actual Q&A voice.

**Fix direction:**
- Remove or genericize the example answer text in the extraction prompt. Use placeholder-style examples that demonstrate structure, not tone.
- Move all example phrases to minimal, clearly-synthetic copy ("here is coffee X it is good") that can't compete with owner voice.
- Longer term: hardcoded examples in code are "intelligence-in-code" — they can't be updated without a deploy. Owner Q&A in the DB is the right place for this.

---

### OBS-6 — Voice/DB mismatch is structural, not a one-off bug

**Symptom:** After shipping iter-4 + iter-5 surface generation fixes, the DB-stored surfaces still reflect old prompt behavior. Fresh Counter opens still use stored surfaces, not newly-correct ones. This recurs every iteration.

**Root cause:** There is no prompt version tracking. When a developer changes `lib/ai/voice-surfaces.server.ts` (generation prompt), the change has no mechanism to invalidate stored surfaces. The regenerate-on-save trigger (iter-5) only fires when an admin re-saves AI settings — not on deploy.

**Fix direction:**
- **Prompt hash invalidation:** Hash the generation prompt string. Store the hash alongside generated surfaces in the DB. On surface load, compare current prompt hash to stored hash — if different, trigger regen. This auto-invalidates on deploy without any admin action.
- **Deploy-time regen:** Run a one-shot surface regen script as part of the build/deploy pipeline (`npm run regen-surfaces`). Simpler but requires pipeline change.
- Either approach prevents the "looks fixed in code but stale in DB" pattern.

---

### OBS-7 — `route.ts` SRP violation (1000+ lines, 8+ responsibilities)

**Symptom:** `app/api/search/route.ts` handles: URL parsing, catalog snapshot building, extraction prompt building, system prompt building, NL heuristics (hardcoded stop words), Prisma query construction, app-side price sorting, cadence enforcement, response serialization. 1000+ lines.

**Root cause:** The route was built incrementally, each iteration adding more responsibility to the same file. No intentional module boundaries were established.

**Specific embedded problems:**
- Hardcoded NL stop words (list in route.ts that defines what counts as "natural language")
- Hardcoded voice examples in extraction prompt that compete with owner Q&A voice
- `FiltersExtracted` TypeScript type lives here instead of a shared types file

**Fix direction (refactor, not a bug fix):**
```
lib/ai/extraction.ts          — buildExtractionPrompt(), extractAgenticFilters()
lib/ai/prompts.ts             — buildSystemPrompt()
lib/ai/catalog.ts             — buildCatalogSnapshot()
lib/ai/voice-surfaces.ts      — already exists, expand
app/api/search/route.ts       — orchestration only (~200 lines)
types/search.ts               — FiltersExtracted, SearchParams, SearchResponse
```
This is a refactor-only commit (no behavior change) that makes future debugging and testing significantly easier.

---

### OBS-8 — `FiltersExtracted` interface and extraction prompt spec can drift

**Symptom:** The TypeScript `FiltersExtracted` interface (`route.ts:22–38`) and the JSON schema description in `buildExtractionPrompt()` are two separate definitions of the same contract. One can change without updating the other — silently.

**Root cause:** No single source of truth for the extraction output shape. TypeScript types don't exist at runtime; the prompt's JSON spec doesn't enforce the TypeScript type.

**Fix direction:** Use Zod as the single source of truth:
```typescript
// types/search.ts
export const FiltersExtractedSchema = z.object({
  intent: z.enum(["product_discovery", "how_to", "reorder", "compare", "recommend"]),
  roast: z.string().optional(),
  origin: z.array(z.string()).optional(),
  productType: z.enum(["coffee", "merch"]).optional(),
  productKeywords: z.array(z.string()).optional(),  // new
  sortBy: z.enum(["newest", "top_rated", "price_asc", "price_desc"]).optional(),
  // ...etc
});
export type FiltersExtracted = z.infer<typeof FiltersExtractedSchema>;
```
`buildExtractionPrompt()` generates the JSON spec by serializing the Zod schema, not hardcoding it. TypeScript type derived from Zod. Runtime validation via `FiltersExtractedSchema.parse()`. Single source of truth.

---

## Gaps

### GAP-9 — Test suite verifies prompt text, not product quality

**Symptom:** All tests pass (`npm run test:ci` 1261+). But merch search is broken, grounded truth mismatches happen, chip re-query is slow and potentially inconsistent. None of these are caught by any test.

**Root cause:** Current tests verify:
- Prompt text contains certain phrases (e.g., "pour-over", "nothing matching")
- Route routing decisions (ai=true → agentic path)
- Response shape (followUps is array)

They do NOT verify:
- Whether a real NL query produces semantically correct products
- Whether the acknowledgment matches the product set
- Whether merch queries return merch products

**Fix direction — Counter QA harness:**
Build `scripts/counter-qa.ts` — a Node.js script that fires real HTTP requests to `http://localhost:3000/api/search?ai=true` and evaluates response quality programmatically. Each scenario defines an input query, expected intent, expected product type, cadence rules, and banned phrases. Evaluation is a mix of:
- Structural assertions (products.length, followUps presence)
- Content assertions (no banned phrases in acknowledgment)
- Type assertions (all returned products match expected productType)
- LLM-evaluates-LLM for semantic quality (ask a fast LLM to score relevance)

18 scenarios proposed — covers regression cases, cadence shape, merch path, comparison/recommendation, voice mismatch detection.

Run with: `npm run test:counter-qa` (requires dev server running with Gemini configured).

**Note on strategy:** This harness tests the actual experience — it's the difference between "tests say we're good" and "the Counter actually works." High value, low maintenance (add a fixture, not a mock).

---

### GAP-10 — Named merch product lookup fails across intents

**Symptom:** "Do you have the Origami Air Dripper?" returns zero results even though the product exists in the catalog.

**Root cause:** This is the same root cause as BUG-1 but for named product lookups. The merch Prisma query uses raw NL query string match. "Do you have the Origami Air Dripper?" contains the product name but wrapped in question syntax — ILIKE won't match "Origami Air Dripper" in the full phrase across name/description.

Additionally: the extraction AI may not classify this as `productType: "merch"` reliably when the query is phrased as a stock question rather than a discovery question. Stock question → might fall through to coffee path → no merch results.

**Fix direction:** Same as BUG-1 (`productKeywords` extracted by AI). The AI extracting `["Origami Air Dripper"]` as a keyword from "Do you have the Origami Air Dripper?" is more reliable than string matching the full question.

---

### OBS-11 — Origin extraction shape is inconsistent for single-country queries

**Symptom:** Queries like "ethiopian coffee" produce inconsistent `origin` output from extraction. The AI sometimes returns a string `"Ethiopia"`, sometimes an array `["Ethiopia"]`, and sometimes a multi-element array or `undefined`. Tests expecting a predictable single-country shape fail intermittently.

**Root cause:** The extraction prompt's `origin` field description doesn't specify whether to return a string or array for single-country queries. The JSON spec in `buildExtractionPrompt()` and the `FiltersExtracted` TypeScript type both allow `string | string[]`, but the AI makes an arbitrary choice per call. The Prisma query handles this with `has` (string) vs `hasSome` (array) — but only because the route has a runtime branch that inspects the type. This branch is fragile and relies on undocumented AI behavior.

**Evidence:** Integration test "single country query → origin extracted (string or single-element array)" failed — "ethiopian coffee" returned neither a string nor a single-element array. The multi-country test ("central america") passed reliably.

**Fix direction:** The extraction prompt should specify the shape contract explicitly:
- Single country → always `string` (`"Ethiopia"`)
- Multiple countries → always `string[]` (`["Guatemala", "Costa Rica"]`)
- Never a single-element array

This eliminates the runtime branch in the route and makes the behavior testable.

Longer term: part of OBS-8 (Zod as single source of truth for `FiltersExtracted` — generates the prompt JSON spec from the schema, enforcing consistent types).

---

## Priority & Dependencies

| ID | Priority | Dependency |
|----|----------|-----------|
| BUG-1 | P0 — blocks merch discovery entirely | None |
| BUG-2 | P0 — undermines trust in the Counter | None |
| OBS-5 | P1 — actively harms owner voice fidelity | None |
| OBS-6 | P1 — recurs every iteration without a structural fix | None |
| BUG-3 | P1 — UX quality + cost | None |
| OBS-4 | P1 — wrong UX for comparison queries | None |
| GAP-9 | P1 — needed to catch regressions in future iters | None |
| GAP-10 | P2 — subsumed by BUG-1 fix | BUG-1 |
| OBS-7 | P2 — tech debt, refactor only | None (but simplifies all other fixes) |
| OBS-8 | P2 — prevents future drift | OBS-7 (natural to do together) |
| OBS-11 | P2 — extraction contract inconsistency; fragile runtime branch | OBS-8 (Zod schema fixes this) |

**Suggested sequencing for iter-6:**
1. BUG-1 + GAP-10 (merch path, add `productKeywords` to extraction)
2. OBS-4 (compare/recommend intent → `products: []`)
3. BUG-2 (grounded truth — post-query acknowledgment approach is lower-risk than unified call)
4. OBS-5 (remove/neutralize extraction prompt examples)
5. OBS-6 (prompt hash invalidation)
6. GAP-9 (Counter QA harness — build + first dry run)
7. BUG-3 (chip progressive filtering — architectural, last because it affects client store)
8. OBS-7 + OBS-8 + OBS-11 (route.ts refactor + Zod + origin shape contract — separate PR, no behavior change)

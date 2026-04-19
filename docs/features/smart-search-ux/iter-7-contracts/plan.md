# Counter Iter-7: Foundation — Contracts, Schema & Behavior Correctness — Plan

**Branch:** `feat/counter-iter7`
**Base:** `feat/counter-iter6` (after iter-6 merge)
**Source:** `docs/features/smart-search-ux/iter-6-architecture/BUGS.md`
**Depends on:** Iter-6 (SRP refactor — modules must exist before behavior fixes land in them)

---

## Context

With iter-6's module boundaries in place, this iteration fixes the behavioral gaps discovered in post-ship testing. All fixes land in the focused modules (`lib/ai/extraction.ts`, `lib/ai/prompts.ts`) rather than a 1000-line route.

Five root causes are addressed:

1. **Merch path is broken end-to-end** (BUG-1, GAP-10): Raw NL query string used for ILIKE match — "do you have a pour over?" will never match "Origami Air Dripper". Fix: AI extracts `productKeywords[]`, Prisma matches on those.

2. **Extraction contract has no single source of truth** (OBS-8, OBS-11): `FiltersExtracted` TypeScript type, the JSON prompt spec, and the Prisma query branches can all drift silently. Fix: Zod schema is the single source — TypeScript type derived from it, prompt JSON spec generated from it, runtime validation via `.parse()`.

3. **Comparison/recommendation queries surface product cards** (OBS-4): No intent classification for `compare`/`recommend`. Fix: Add intents to schema; route returns `products: []` and lets acknowledgment carry the reasoning.

4. **Voice surfaces go stale on every deploy** (OBS-6): No mechanism to invalidate stored surfaces when generation prompt changes. Fix: Hash the generation prompt string, store alongside surfaces in DB, compare on load → auto-regen on mismatch.

5. **Chip re-query fires full AI pipeline** (BUG-3): Clicking a follow-up chip sends a new `ai=true` request — slow, expensive, potentially inconsistent with previous results. Fix: Store the full result set in Zustand; chip click applies client-side progressive filter, no new API call.

Additionally, OBS-5 (verbatim example bleed) had a partial fix in pre-PR patch — the acknowledgment side is fixed. This iteration neutralizes the remaining extraction prompt examples.

---

## Commit Schedule

| # | Message | Items | Risk |
|---|---------|-------|------|
| 0 | `docs: add plan for counter-iter7` | — | — |
| 1 | `feat: Zod FiltersExtractedSchema — single source of truth for extraction contract` | OBS-8, OBS-11 | Medium |
| 2 | `fix: merch productKeywords extraction + keyword-based Prisma query` | BUG-1, GAP-10 | Medium |
| 3 | `fix: compare/recommend intent returns products: [] with AI reasoning` | OBS-4 | Low |
| 4 | `fix: prompt hash invalidation — auto-regen surfaces on prompt change` | OBS-6 | Medium |
| 5 | `fix: chip progressive filtering — client-side result narrowing` | BUG-3 | Medium |
| 6 | `fix: neutralize remaining extraction prompt examples — structure only, no phrasing` | OBS-5 | Low |

---

## Acceptance Criteria

**→ See [`acs.md`](acs.md) for the full verification table (Agent / QC / Reviewer columns).**

20 ACs total: 5 UI (interactive screenshots), 11 functional (code review), 7 test coverage, 5 regression.

---

## UX Flows

| Flow | Question | Answer |
|------|----------|--------|
| Merch query | What does the user see? | Products returned (merch items); acknowledgment in Counter voice |
| Comparison query | What does the user see? | AI reasoning in acknowledgment; no product cards; follow-up chips if appropriate |
| Chip click | What happens? | Result set narrows immediately (client-side); no loading state; no API call |
| Surface staleness | When does regen happen? | Automatically on next Counter open after a deploy with a changed generation prompt; user sees skeleton during regen |

---

## Implementation Details

### Commit 1: Zod schema

**File:** `types/search.ts`

Replace `FiltersExtracted` TypeScript interface with:

```typescript
export const FiltersExtractedSchema = z.object({
  intent: z.enum(["product_discovery", "how_to", "reorder", "compare", "recommend"]),
  roast: z.string().optional(),
  origin: z.union([
    z.string(),
    z.array(z.string()).min(2),
  ]).optional(),
  productType: z.enum(["coffee", "merch"]).optional(),
  productKeywords: z.array(z.string()).optional(),
  sortBy: z.enum(["newest", "top_rated", "price_asc", "price_desc"]).optional(),
  flavorNotes: z.array(z.string()).optional(),
  acknowledgment: z.string(),
  followUps: z.array(z.string()).optional(),
  followUpQuestion: z.string().optional(),
});
export type FiltersExtracted = z.infer<typeof FiltersExtractedSchema>;
```

Read `route.ts` (post iter-6 refactor) to confirm all current fields are accounted for before writing the schema.

### Commit 2: Merch fix

**File:** `lib/ai/extraction.ts` + `app/api/search/route.ts`

In `buildExtractionPrompt()`, update the merch description to instruct AI to populate `productKeywords`:

```json
"productKeywords": ["pour over", "dripper", "V60"]  // keywords to search product names/descriptions — required when productType is "merch"
```

In `route.ts` merch branch, replace:

```typescript
// OLD: uses raw query string
whereClause.OR = [{ name: { contains: query, mode: "insensitive" } }, ...]
// NEW: uses extracted keywords
whereClause.OR = (filtersExtracted.productKeywords ?? []).flatMap(kw => [
  { name: { contains: kw, mode: "insensitive" } },
  { description: { contains: kw, mode: "insensitive" } },
]);
```

### Commit 3: Compare/recommend

**File:** `app/api/search/route.ts`

After extraction, add:

```typescript
if (["compare", "recommend"].includes(filtersExtracted.intent)) {
  return NextResponse.json({
    products: [],
    acknowledgment: agenticData.acknowledgment,
    followUps: [],
    followUpQuestion: "",
    mode: "agentic",
  });
}
```

Skip Prisma query entirely for these intents.

### Commit 4: Prompt hash

**Files:** `lib/ai/hash.ts` (new) + `lib/ai/voice-surfaces.server.ts` + DB schema (if needed)

Create a reusable `hashPrompt(input: string): string` utility in `lib/ai/hash.ts` — a thin wrapper around `crypto.createHash("sha256").update(input).digest("hex")`. This utility is used by voice-surfaces now and will be reused by Phase B for extraction prompt versioning.

In `voice-surfaces.server.ts`: import `hashPrompt` from `lib/ai/hash`. On load, hash the current generation prompt string. Compare to `store.voiceSurfacePromptHash`. If different → regen + store new hash.

> Check `prisma/schema.prisma` to see if `Store` model has a field for this. If not, add `voiceSurfacePromptHash String?` with a migration.

### Commit 5: Chip progressive filter

**File:** `lib/store/chat-panel-store.ts` + chip click handler

Add `allProducts: Product[]` to store state. On Counter search response, store full `products` array in `allProducts`. On chip click, dispatch `filterByChip(label: string)` that sets `messages[last].products = allProducts.filter(...)` using label-to-attribute mapping (e.g., "Bold" → `roast: "dark"`, "Light" → `roast: "light"`).

The chip-to-attribute mapping should be simple and exhaustive for the known chip labels generated by the AI. If a chip label doesn't map cleanly, fall back to case-insensitive product name/description contains check.

### Commit 6: Neutralize extraction prompt examples + vague-query rule

**File:** `lib/ai/extraction.ts`

**6a — Neutralize examples:** Replace any example Q&A pair that contains:

- Sensory adjectives ("approachable", "smooth", "mellow", "bright")
- Named coffees or origins in the answer text
- Complete acknowledgment sentences

Replace with JSON-structure-only examples:

```text
User: [example query]
Extract: { "intent": "product_discovery", "roast": "medium", "productKeywords": [], "acknowledgment": "[voice response here]" }
```

The `acknowledgment` in examples should be a placeholder, not a real sentence the AI can absorb.

**6b — Vague-query extraction rule:** Add to `buildExtractionPrompt()` rules section:

```text
- When the query has no specific filter signals (no roast, origin, flavor, brew method, or price mentioned), emit sortBy: "top_rated" and omit roastLevel and flavorProfile entirely. Do NOT infer "beginner" or "smooth" from vague queries like "what's good?" or "anything interesting?"
```

This prevents the model from pattern-matching vague → "beginner/smooth" → narrow flavor filters, which produces all-dark-roast results for open-ended questions. Directly supports iter-8 fixture F10 (`"what's good today?"`).

---

## Files Changed (estimated 7 modified, 0 new)

| File | Commit | Notes |
|------|--------|-------|
| `types/search.ts` | 1 | Zod schema replaces interface |
| `lib/ai/extraction.ts` | 1, 2, 6 | Schema-derived prompt spec, merch keywords instruction, example neutralization, vague-query rule |
| `app/api/search/route.ts` | 2, 3 | Merch query uses productKeywords; compare/recommend shortcircuit |
| `lib/ai/hash.ts` | 4 | New: reusable `hashPrompt()` utility |
| `lib/ai/voice-surfaces.server.ts` | 4 | Import hashPrompt, regen on mismatch |
| `prisma/schema.prisma` | 4 | `voiceSurfacePromptHash String?` on Store (migration required) |
| `lib/store/chat-panel-store.ts` | 5 | allProducts state + filterByChip action |
| `app/(site)/_components/ai/ChatPanel.tsx` | 5 | Chip click dispatches filterByChip instead of new search |
| `docs/features/smart-search-ux/iter-7/plan.md` | 0 | This plan |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan: `git commit --no-verify -m "docs: add plan for counter-iter7"`
2. Register `verification-status.json`: `{ status: "planned", acs_total: 24 }`
3. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Run `npm run test:ci`
4. Spawn `/ac-verify` sub-agent — sub-agent fills **Agent** column
5. Main thread reads report, fills **QC** column
6. If any fail → fix → re-verify ALL ACs
7. When all pass → hand off ACs doc to human → human fills **Reviewer** column

---

## Phase B Observation — Acknowledgment Tone

Vague queries ("what's good?") produce patronizing acknowledgments ("no worries at all — everyone starts somewhere!"). Root cause: model interprets vague as "beginner." Fix via prompt rules won't stick (per OB1 voice projection insight — rules don't constrain, examples do). Track for Phase B: add vague-query few-shot example to owner voice set, score via iter-8 harness Tier-3 LLM-as-judge, iterate in Karpathy loop.

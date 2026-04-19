# Counter Iter-7: Foundation — Contracts, Schema & Behavior Correctness — AC Verification Report

**Branch:** `feat/counter-iter7`
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

> Dev server: `http://localhost:3000`, Gemini configured. At least 50% of UI ACs must use screenshot-based methods.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Merch query — products returned | Interactive: Counter open (any page), ask "do you have a pour over coffee maker?" → screenshot | At least one merch product visible in results; no zero-results surface | | | |
| AC-UI-2 | Named merch query — product returned | Interactive: ask "do you have the Origami Air Dripper?" → screenshot | Origami Air Dripper card visible in results | | | |
| AC-UI-3 | Comparison query — no product cards | Interactive: ask "which is better for a beginner, Ethiopian or Colombian?" → screenshot | No product cards rendered; acknowledgment contains AI's reasoning | | | |
| AC-UI-4 | Chip filter — narrows without full reload | Interactive: submit "something fruity" → wait for results → click a follow-up chip → screenshot | Result set narrows (count changes or cards change); no visible loading spinner from new API call | | | |
| AC-UI-5 | Counter response after surface regen — fresh copy | Interactive: admin → AI Settings → change a Q&A → save → open Counter → screenshot | New greeting reflects updated Q&A; no "welcome in" or stale phrasing visible | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `FiltersExtractedSchema` in `types/search.ts` — Zod source of truth | Code review: `types/search.ts` | Zod schema defined with all fields; `FiltersExtracted = z.infer<typeof FiltersExtractedSchema>`; `intent` enum includes `"compare"` and `"recommend"` | | | |
| AC-FN-2 | `origin` field — string (single) or string[] (min 2), never single-element array | Code review: `types/search.ts` + `lib/ai/extraction.ts` prompt | Zod schema uses `z.union([z.string(), z.array(z.string()).min(2)])` or equivalent; extraction prompt states "single country → string, multi → array, never `['Ethiopia']`" | | | |
| AC-FN-3 | `productKeywords` field in schema + prompt | Code review: `types/search.ts` + extraction prompt in `lib/ai/extraction.ts` | Schema has `productKeywords: z.array(z.string()).optional()`; extraction prompt instructs AI to populate this for merch queries | | | |
| AC-FN-4 | Merch Prisma query uses `productKeywords`, not raw NL string | Code review: `app/api/search/route.ts` merch branch | When `filtersExtracted.productType === "merch"`, `whereClause.OR` built from `filtersExtracted.productKeywords[]` per keyword; raw `query` string not used in OR | | | |
| AC-FN-5 | `extractAgenticFilters` validates output with `FiltersExtractedSchema` | Code review: `lib/ai/extraction.ts` | Return value goes through `.safeParse()` or `.parse()`; malformed AI output returns null rather than silently passing invalid data | | | |
| AC-FN-6 | `compare` and `recommend` intent → `products: []` in route response | Code review: `app/api/search/route.ts` | When `filtersExtracted.intent === "compare" \|\| "recommend"`, route skips Prisma query and returns `products: []` with `acknowledgment` | | | |
| AC-FN-7 | `buildExtractionPrompt()` generates JSON spec from Zod schema | Code review: `lib/ai/extraction.ts` | JSON schema description in prompt is derived from (or consistent with) the Zod schema; no hardcoded duplicate spec | | | |
| AC-FN-8 | Prompt hash stored alongside voice surfaces in DB | Code review: `prisma/schema.prisma` + `lib/ai/voice-surfaces.server.ts` | `Store` model has `voiceSurfacePromptHash String?`; hash stored on every surface generation | | | |
| AC-FN-9 | Surface load compares prompt hash — triggers regen on mismatch | Code review: `lib/ai/voice-surfaces.server.ts` → load path | On `getSurfaces()`, current generation prompt hashed; if hash differs from stored hash, `generateVoiceSurfaces()` called before returning | | | |
| AC-FN-10 | Chip click applies client-side filter, no new API call | Code review: `lib/store/chat-panel-store.ts` + chip click handler | Store holds `allProducts: Product[]` from last search; chip click dispatches `filterProducts(chipLabel)` against `allProducts`; no `fetch` triggered | | | |
| AC-FN-11 | Extraction prompt examples are structure-only (no phrasing, no named coffees) | Code review: `lib/ai/extraction.ts` → example Q&A section | No quoted flavor phrases, no shop names, no complete acknowledgment sentences with sensory language; examples show only JSON structure | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | Merch query — `productKeywords` drives Prisma OR clause | Test run: `npm run test:ci` | Mocked extraction returns `{ productType: "merch", productKeywords: ["pour over", "dripper"] }`; Prisma mock asserts keyword-based OR (not raw query string) | | | |
| AC-TST-2 | `compare` intent — route returns `products: []` | Test run: `npm run test:ci` | Mocked extraction `intent: "compare"` → response body `products` is `[]`; Prisma mock not called | | | |
| AC-TST-3 | `recommend` intent — route returns `products: []` | Test run: `npm run test:ci` | Mocked extraction `intent: "recommend"` → response body `products` is `[]`; Prisma mock not called | | | |
| AC-TST-4 | Origin shape — single string passes, single-element array rejected | Test run: `npm run test:ci` | `FiltersExtractedSchema.parse({ origin: "Ethiopia" })` succeeds; `FiltersExtractedSchema.parse({ origin: ["Ethiopia"] })` throws | | | |
| AC-TST-5 | Origin shape — multi-element array passes | Test run: `npm run test:ci` | `FiltersExtractedSchema.parse({ origin: ["Guatemala", "Costa Rica"] })` succeeds | | | |
| AC-TST-6 | Prompt hash invalidation — stale hash triggers regen | Test run: `npm run test:ci` | Unit test: mock DB returns surfaces with old hash; `getSurfaces()` detects mismatch → calls `generateVoiceSurfaces()` | | | |
| AC-TST-7 | Extraction prompt contains no verbatim flavor phrases | Test run: `npm run test:ci` | `buildExtractionPrompt()` output does not contain `"approachable"`, `"we have a great selection"`, or any complete acknowledgment sentence in example section | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1273+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Coffee product queries unaffected | Interactive: ask "something fruity and light" → screenshot | Acknowledgment + products + chips present; no regression in coffee discovery path | | | |
| AC-REG-4 | Category page pre-scope still works | Interactive: Counter on `/categories/central-america`, ask "most expensive" → screenshot | Results scoped to Central America; price sort applied | | | |
| AC-REG-5 | Session greeting awareness intact | Interactive: open Counter, close, re-open → screenshot | Second open shows `standby` surface, not salutation | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

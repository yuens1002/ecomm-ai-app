# Counter Iter-7b: Extraction Reliability + UX Fixes — AC Verification Report

**Branch:** `feat/counter-iter7b-fixes`
**Commits:** 6
**ACs:** 23 (5 UI, 10 FN, 6 TST, 2 REG)
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

> Dev server: `http://localhost:3000`, Gemini configured. At least 50% of UI ACs must use screenshot-based methods (2 of 4 minimum).

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Chip click renders user message bubble | Interactive: open Counter, submit query returning >3 results with chips, click any chip → screenshot messages area | User bubble with chip text visible above filtered results; previous chips removed | | | |
| AC-UI-2 | Copy button absent on greeting message | Screenshot: open Counter on homepage → screenshot greeting message area | No copy icon visible on the first assistant bubble | | | |
| AC-UI-3 | Copy button present on search response | Interactive: submit any search query → screenshot assistant response bubble | Copy icon visible below acknowledgment text; not on greeting | | | |
| AC-UI-4 | Recommend cadence — honest reason, no "nothing fits" language | Interactive: navigate to `/products/ethiopian-yirgacheffe`, open Counter, ask "is this good with milk?" → screenshot response | Acknowledgment states why the Yirgacheffe isn't ideal for milk; either (a) shows 1–3 alternative product cards with a bolder/medium-dark profile, or (b) shows no cards with just the honest reason — never shows the Yirgacheffe as a recommended card, never says "nothing fits" or redirects away | | | |
| AC-UI-5 | Compare cadence — delta + all compared products shown | Interactive: open Counter on any page, ask "which is better with milk, Ethiopian Yirgacheffe or Sidamo?" → screenshot response | Acknowledgment states the meaningful difference for milk suitability; both Yirgacheffe and Sidamo cards visible | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Intent schema — clean verb-form enum, no duplicates | Code review: `types/search.ts` → `AgenticIntentSchema` | Enum contains exactly: `"discover"`, `"recommend"`, `"how_to"`, `"reorder"`, `"compare"` — no `"recommendation"`, no `"product_discovery"` |  |  |  |
| AC-FN-2 | Intent schema — legacy values normalize before Zod validation | Code review: `types/search.ts` → `AgenticIntentSchema` preprocess | `.preprocess` normalizes `"recommendation"` → `"recommend"` and `"product_discovery"` → `"discover"` before enum validation |  |  |  |
| AC-FN-3 | Recommend cadence teaching block in extraction prompt | Code review: `lib/ai/extraction.ts` → `buildExtractionPrompt()` | Prompt contains YES/NO decision cadence: YES = no search, NO = extract filters for alternative not for current product |  |  |  |
| AC-FN-4 | Opt-in DB query — no DB when filtersExtracted is empty | Code review: `app/api/search/route.ts` → post-extraction path | Route checks `filtersExtracted` for substantive content; returns `products: []` immediately when empty — no Prisma query executed |  |  |  |
| AC-FN-5 | Merch signal priority rule in extraction prompt | Code review: `lib/ai/extraction.ts` → `buildExtractionPrompt()` — `productType` comment | Prompt contains explicit priority rule: physical equipment nouns → `productType: "merch"` even when coffee descriptors are present |  |  |  |
| AC-FN-6 | Merch acknowledgment grounding in extraction prompt | Code review: `lib/ai/extraction.ts` → `buildExtractionPrompt()` — `acknowledgment` instruction | Acknowledgment rule includes merch exception: for `productType: "merch"`, naming specific catalog products is permitted |  |  |  |
| AC-FN-7 | Compare cadence teaching block in extraction prompt | Code review: `lib/ai/extraction.ts` → `buildExtractionPrompt()` | Prompt contains compare cadence: state the delta, search for compared products, promote clear winner or show all if no winner |  |  |  |
| AC-FN-8 | filterByChip targets last assistant message by role | Code review: `lib/store/chat-panel-store.ts` → `filterByChip()` | `filterByChip` finds last assistant message by scanning `messages` for `role === "assistant"`, not by `messages.length - 1` |  |  |  |
| AC-FN-9 | Chip click adds user bubble before filtering | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → `PanelContent` — `onChipClick` prop | `onChipClick` calls `addMessage` with chip text as user bubble before calling `filterByChip` |  |  |  |
| AC-FN-10 | Copy button guarded by GREETING_ID | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → `MessageBubble` — copy button render condition | Copy button render is guarded by `msg.id !== GREETING_ID`; greeting message excluded |  |  |  |

---

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | Intent schema normalization | Test run: `npm run test:ci` | `lib/ai/__tests__/extraction-schema.test.ts` asserts `"recommendation"` parses to `"recommend"` and `"product_discovery"` parses to `"discover"` via `AgenticIntentSchema.parse()` |  |  |  |
| AC-TST-2 | `buildExtractionPrompt` contains recommend cadence | Test run: `npm run test:ci` | `lib/ai/__tests__/extraction-schema.test.ts` asserts `buildExtractionPrompt("")` output contains all three strings: `"RECOMMEND CADENCE"`, `"Is the answer YES"`, `"Extract filters for the alternative"` |  |  |  |
| AC-TST-3 | Route opt-in: empty filtersExtracted → no products | Test run: `npm run test:ci` | Route test asserts that `recommend` intent with `filtersExtracted: {}` returns `products: []` without executing a DB query |  |  |  |
| AC-TST-4 | `filterByChip` targets last assistant message when trailing user bubble present | Test run: `npm run test:ci` | `lib/store/__tests__/chat-panel-store.test.ts` confirms `filterByChip` on `[..., assistantMsg, userBubble]` updates `assistantMsg.products`, not `userBubble` |  |  |  |
| AC-TST-5 | `buildExtractionPrompt` — compare cadence + intent boundary present | Test run: `npm run test:ci` | `lib/ai/__tests__/extraction-schema.test.ts` asserts prompt contains all three strings: `"COMPARE CADENCE"`, `"state the delta"`, `"requires evaluable criteria"` |  |  |  |
| AC-TST-6 | Route opt-in: populated filtersExtracted → DB runs, products returned | Test run: `npm run test:ci` | Route test asserts that `recommend` intent with `filtersExtracted: { roastLevel: "dark" }` executes a Prisma query and returns non-empty `products` |  |  |  |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 0 test failures; test count ≥ 1285 (iter-7 baseline) |  |  |  |
| AC-REG-2 | TypeScript + ESLint clean | Code review: `npm run precheck` | 0 type errors, 0 lint errors |  |  |  |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here.}

## QC Notes

{Main thread writes fix notes here.}

## Reviewer Feedback

{Human writes review feedback here.}

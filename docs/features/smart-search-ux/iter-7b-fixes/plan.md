# Counter Iter-7b: Extraction Reliability + UX Fixes — Plan

**Branch:** `feat/counter-iter7b-fixes`
**Base:** `main` (post iter-7 merge, v0.100.10)

---

## Context

Iter-7 shipped the foundational extraction contracts. During review, gaps were identified across three layers: intent schema inconsistency, AI extraction reliability, and UX regressions.

---

## Intent Cadence Map

The canonical behavior contract for each intent. This is what the extraction prompt teaches, what the route enforces, and what tests verify.

| Intent | Search? | When | Products returned | Follow-up |
|--------|---------|------|-------------------|-----------|
| **discover** | Always | User is looking for something | Up to 7 matching results | If >3 results |
| **recommend** | Conditional | YES → no search. NO → search for what WOULD work, extract filters for alternative not for current product | 0 (YES or nothing found) or 1–7 alternatives | If >3 results |
| **compare** | Always (named products) | Requires a specific evaluable criteria — "better for milk", "better for espresso". No criteria = `recommend` at classification time | All compared products; clear winner promoted to top | None |
| **how_to** | Never | Informational question. Do not correct the customer if they voice a contradiction — just answer | 0 always | None |
| **reorder** | Never | Redirect to account page | 0 always | None |

**Key rules:**

- DB query runs only when `filtersExtracted` has substantive content — the AI's extraction decision IS the gate
- `recommend`: if nothing found, give the honest reason only — no "nothing fits" language
- `compare`: if phrasing has no evaluable criteria, classify as `recommend` at intent extraction time
- `how_to`: never argue with the customer; if they voice a factual contradiction, acknowledge and serve

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for iter-7b fixes` | — |
| 1 | `fix: clean up intent schema — verb-form, remove recommendation duplicate` | Low |
| 2 | `fix: recommend cadence teaching + opt-in DB query` | Medium |
| 3 | `fix: merch signal priority + merch ack grounding` | Low |
| 4 | `fix: chip click adds user bubble; filterByChip targets last assistant message` | Low |
| 5 | `fix: hide copy button on greeting message` | Low |
| 6 | `test: add iter-7b unit tests` | Low |

---

## Implementation Details

### Commit 1: Intent schema cleanup

**File:** `types/search.ts` → `AgenticIntentSchema`

Current schema has mixed verb/noun naming and a duplicate:

```ts
// BEFORE
"product_discovery" | "recommendation" | "how_to" | "reorder" | "compare" | "recommend"
//                     ↑ noun duplicate                                        ↑ verb
```

Clean set — all verbs:

```ts
// AFTER
"discover" | "recommend" | "how_to" | "reorder" | "compare"
```

Changes:

- `"product_discovery"` → `"discover"`
- Remove `"recommendation"` (duplicate of `"recommend"`)
- Add `.preprocess` to normalize legacy AI output of `"recommendation"` or `"product_discovery"` → canonical values before Zod validation (prevents silent failures during transition)

**File:** `lib/ai/extraction.ts` → `buildExtractionPrompt()` — update intent enum comment to match new schema

**File:** `app/api/search/route.ts` — update any intent string comparisons to new values

---

### Commit 2: Recommend + compare cadence teaching + opt-in DB query

**File:** `lib/ai/extraction.ts` → `buildExtractionPrompt()`

Add RECOMMEND and COMPARE CADENCE teaching blocks to the extraction prompt.

```text
RECOMMEND CADENCE — when a customer asks whether a product suits their goal:

Step 1 — Answer honestly (always).

Step 2 — Is the answer YES?
  → No search. Leave filtersExtracted empty. Just answer.

Step 3 — Is the answer NO?
  → Search for what WOULD work. Extract filters for the alternative,
     NOT for the product being discussed.
  → If alternatives found: state the reason + suggest the alternative(s).
  → If nothing found: state the reason only. Do NOT say "nothing fits" or
     redirect them away — the customer came for a reason and may still want
     what they asked about. Just give the honest reason and let them decide.

Key: extract filters for what you're recommending, not for what you're discussing.
     "is this good with milk?" on a light roast → search for medium/dark roast,
     not the current product's own attributes.

COMPARE CADENCE — when a customer asks to compare specific products:

Step 1 — State the delta: what's meaningfully different between them for
          the customer's stated criteria (roast, body, milk, brew method, etc.).

Step 2 — Search for the specific products being compared by name/keyword.
          Show all of them so the customer can decide.

Step 3 — If one clearly wins for their criteria: promote it to the top.
          If no clear winner: show all, let the customer decide.
          If search returns nothing: no cards — just the reasoning.
```

**File:** `app/api/search/route.ts` — opt-in DB query

Invert the current blocklist gate: run DB only when `filtersExtracted` has substantive content.

```ts
const hasFilters = agenticData?.filtersExtracted &&
  Object.values(agenticData.filtersExtracted).some(
    (v) => v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0)
  );

if (agenticData && !hasFilters) {
  return NextResponse.json({
    products: [], ...agenticData fields..., aiFailed: false, context: ...
  });
}
```

Remove the existing intent blocklist gate (`how_to`, `compare`, `recommend` explicit checks). `how_to`/`compare`/`reorder` intents naturally produce empty `filtersExtracted`, so they return no products without an explicit gate.

Exception: `reorder` intent still returns its redirect acknowledgment directly.

---

### Commit 3: Merch signal priority + ack grounding

**File:** `lib/ai/extraction.ts` → `buildExtractionPrompt()`

**Merch signal priority** — add to `productType` field comment:

> Priority rule: if the query mentions a physical tool, device, or brewing equipment (dripper, grinder, kettle, moka pot, Aeropress, mug, filter, reusable cup), set productType to "merch" — even when the query also contains coffee descriptors like roast level or flavor.

**Merch acknowledgment grounding** — update `acknowledgment` field instruction:

> Exception for merch queries (productType: "merch"): you may name specific products from the catalog — they are confirmed to exist in the shop. The catalog is in your context.

---

### Commit 4: Chip user bubble + filterByChip targeting

**File:** `lib/store/chat-panel-store.ts` → `filterByChip()`

Find last assistant message by role, not by index:

```ts
const lastAssistantIdx = messages.reduce((best, m, i) =>
  m.role === "assistant" ? i : best, -1);
```

**File:** `app/(site)/_components/ai/ChatPanel.tsx` → `PanelContent`

Add `handleChipClick` wrapper:

```ts
const handleChipClick = (chip: string) => {
  addMessage({ id: `u-chip-${Date.now()}`, role: "user", content: chip });
  filterByChip(chip);
};
```

---

### Commit 5: Copy button guard

**File:** `app/(site)/_components/ai/ChatPanel.tsx` → `MessageBubble`

```tsx
{hasContent && msg.id !== GREETING_ID && (
  <button type="button" onClick={handleCopy} ...>
```

---

### Commit 6: Tests

- `lib/ai/__tests__/extraction-schema.test.ts` — intent schema: `"recommendation"` normalizes to `"recommend"`; `"product_discovery"` normalizes to `"discover"`
- `lib/ai/__tests__/extraction-schema.test.ts` — `buildExtractionPrompt("")` contains recommend cadence teaching block
- `app/api/search/__tests__/route.test.ts` — `recommend` intent + empty `filtersExtracted` → `products: []`
- `lib/store/__tests__/chat-panel-store.test.ts` (new) — `filterByChip` updates last assistant message when trailing user bubble present

---

## Files Changed (6 modified, 1 new)

| File | Commits |
|------|---------|
| `types/search.ts` | 1 |
| `lib/ai/extraction.ts` | 1, 2, 3 |
| `app/api/search/route.ts` | 1, 2 |
| `lib/store/chat-panel-store.ts` | 4 |
| `app/(site)/_components/ai/ChatPanel.tsx` | 4, 5 |
| `lib/ai/__tests__/extraction-schema.test.ts` | 6 |
| `lib/store/__tests__/chat-panel-store.test.ts` | 6 (new) |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch (`--no-verify`, docs only)
2. Update `verification-status.json`: `{ status: "planned", acs_total: 22 }`
3. Transition to `"implementing"` when coding begins
4. After implementation: transition to `"pending"`, run `npm run precheck`
5. Spawn `/ac-verify` sub-agent — fills Agent column
6. Main thread fills QC column, hand off to reviewer

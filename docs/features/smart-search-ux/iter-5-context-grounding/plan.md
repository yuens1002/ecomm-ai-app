# Counter Iter-5: Context Grounding & Cadence Hardening — Plan

**Branch:** `feat/counter-iter5`
**Base:** `main`
**Bugs addressed:** BUG-2, BUG-3, BUG-4, BUG-5, BUG-6, OBS-1, OBS-2, OBS-3, Testing gap
**Source:** `docs/features/smart-search-ux/iter-4-conversation-context/BUGS.md`
**Dev server:** `http://localhost:3000` (running, Gemini configured)

---

## Context

Post-ship testing of iter-4 revealed a cluster of bugs sharing a common root: the Counter handles well-formed extractable queries but breaks on vague, category-contextual, and merch-oriented inputs. Beyond query-handling, two structural issues underpin multiple surface bugs:

1. **Surface system is fragile**: `DEFAULT_VOICE_SURFACES` contains Artisan Roast-specific copy that bleeds into any unconfigured state. Surfaces are only lazy-generated on first Counter open — no eager regeneration on Q&A save. The merge strategy (`{ ...DEFAULT_VOICE_SURFACES, ...fetched }`) can expose these defaults to end customers on error.

2. **Greeting state is instance-local**: `hasGreeted` is a React ref (instance-local) but the behavioral intent is session-level. Every time the Counter is opened after a close-without-conversation, the same salutation fires — the component has no memory that it already greeted this session.

**Design principle**: The Counter should not identify itself as a counter, chat, or place. Customers may read it as search; that's fine. The AI greets naturally without implying a physical space ("welcome in!") or a tech interface. Owner voice sets the tone; customer interprets freely.

**Specific failures:**
- Category page queries return zero results (origin ≠ region; no category pre-scope)
- Price sort extracted but silently lost (`price_desc`/`price_asc` omitted from `sortMap`)
- Vague Counter queries drop full cadence — likely `extractAgenticFilters` returning null, causing raw search fallback
- Merch equipment not classified as `productType: "merch"` → wrong search path, no results
- Greeting repeats identically on every Counter open within a session (session unawareness)
- Reset shows salutation (prompting) instead of passive standby
- AI confidently asserts stock levels it has no knowledge of
- `greeting.home` generation defaults to transactional "get started" / "walk-in" tone
- `DEFAULT_VOICE_SURFACES` is Artisan Roast-specific, never neutral
- No routing-gate or cadence-shape tests in the test suite

---

## Commit Schedule

| # | Message | Bugs | Risk |
|---|---------|------|------|
| 0 | `docs: add plan for counter-iter5` | — | — |
| 1 | `fix: category page pre-scope + app-side price sort` | BUG-6 | Medium |
| 2 | `fix: system prompt + extraction prompt constraints + cadence enforcement` | BUG-3, BUG-4, OBS-1, OBS-3 | Medium |
| 3 | `fix: voice surface system — neutral defaults + standby key + eager regen on save` | OBS-2, BUG-2 | Low |
| 4 | `fix: session greeting state + standby on re-open + skeleton loader` | BUG-2, BUG-5 | Low |
| 5 | `test: integration scaffold + cadence regression + routing-gate + banned-word` | Testing gap | Low |

---

## Acceptance Criteria

### UI (verified by screenshots + interactive)

> Dev server on `http://localhost:3000`, Gemini configured. All interactive ACs are verifiable.

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Category page Counter query — scoped results + price sort | Interactive: Counter on `/categories/central-america`, ask "what's the most expensive coffee from here?" → screenshot | Products returned are Central America category only; sorted price-descending; no zero-results surface |
| AC-UI-2 | Vague Counter query — full cadence | Interactive: Counter on homepage, ask "what's good today?" → screenshot | Acknowledgment bubble visible above products; follow-up chips visible; result count ≤ 7; no pagination control |
| AC-UI-3 | Merch equipment query — correct path | Interactive: Counter on `/products/origami-air-dripper`, ask "do you have a pour over coffee maker?" → screenshot | Origami Air Dripper in results OR a no-results message that doesn't assert catalog width ("we have a few styles") |
| AC-UI-4 | Stock question — deflection | Interactive: ask "do you have the Italian Roast in stock?" → screenshot | Response does NOT contain "we have that in stock" or similar assertion; redirects to product page |
| AC-UI-5 | Greeting — no location language | Interactive: fresh Counter open on homepage → screenshot | Greeting does not contain "welcome in", "come on in", "step up", or any physical-space implication |
| AC-UI-6 | Session greeting awareness — subsequent open shows standby | Interactive: open Counter, close without typing, re-open → screenshot | Second open shows the `standby` surface (passive "I'm here" copy), NOT the same salutation as first open |
| AC-UI-7 | Reset shows standby, not salutation | Interactive: start a conversation, click reset → screenshot | Post-reset message is passive standby copy, not a prompting salutation |
| AC-UI-8 | First open is still context-aware | Interactive: fresh Counter on `/products/origami-air-dripper` → screenshot | First-open greeting references the product, not generic homepage greeting |
| AC-UI-9 | Skeleton while surfaces load | Screenshot: open Counter immediately after `resetSurfaces()` (before load completes) | A skeleton loading state is visible in the message area, not a blank panel or hardcoded default text |
| AC-UI-10 | Cadence: ≤3 results → no follow-up chips | Interactive: submit a highly specific query that returns 1-3 results → screenshot | No follow-up chips rendered below results |
| AC-UI-11 | Cadence: ≥4 results → follow-up chips shown | Interactive: submit a vague query returning 4+ results → screenshot | Follow-up chips rendered |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | `from=categories/{slug}` pre-scopes `whereClause` | Code review: `app/api/search/route.ts` → `pageFrom` parse → `whereClause.categories` set | When `from` matches `categories/{slug}`, `whereClause.categories = { some: { slug } }` added before extraction |
| AC-FN-2 | App-side price sort applied post-query | Code review: same file → after Prisma results, before response | When `filtersExtracted.sortBy === "price_desc"`, products sorted by min variant price desc; `"price_asc"` sorts asc |
| AC-FN-3 | Cadence enforcement — `products.length <= 3` clears followUps | Code review: same file → after products resolved | Server zeroes out `followUps` and `followUpQuestion` when result count is 1–3 |
| AC-FN-4 | Cadence fallback when `agenticData === null` and `forceAI` | Code review: same file → `forceAI && !agenticData` branch | Response includes `acknowledgment` from `aiFailed` voice surface; client renders Counter UI, not raw pagination |
| AC-FN-5 | Merch equipment examples in extraction prompt | Code review: `buildExtractionPrompt()` | `productType: "merch"` description explicitly includes: pour-over drippers, moka pot, grinder, kettle, Aeropress, filters, brewing gear |
| AC-FN-6 | Stock deflection in system prompt guardrails | Code review: `buildSystemPrompt()` → `guardrailSection` | Contains: "Never state or imply stock levels. If asked about availability, redirect to the product page." |
| AC-FN-7 | Banned search-style phrases in both prompts | Code review: `buildSystemPrompt()` roleSection + `buildExtractionPrompt()` acknowledgment rules | Both contain explicit ban on: "find", "matching", "nothing matching", "I can't think of", "I'm not sure", "I don't have" |
| AC-FN-8 | `greeting.home` generation prompt avoids location/transactional language | Code review: `lib/ai/voice-surfaces.server.ts` → generation prompt | `greeting.home` description includes: "no 'welcome in', 'come on in', 'get started', or physical-space references" |
| AC-FN-9 | `standby` key in `VoiceSurfaces` + generation prompt | Code review: `lib/ai/voice-surfaces.server.ts` + `lib/store/chat-panel-store.ts` types | `VoiceSurfaces` interface has `standby: string`; generation prompt includes `standby` key with passive "I'm here" guidance |
| AC-FN-10 | `DEFAULT_VOICE_SURFACES` is neutral (no Artisan Roast copy) | Code review: `lib/ai/voice-surfaces.ts` | No proper nouns, no store-specific phrasing; all values are generic non-committal placeholders |
| AC-FN-11 | `sessionGreeted` in Zustand store | Code review: `lib/store/chat-panel-store.ts` | Store has `sessionGreeted: boolean` (default false); `resetSurfaces()` resets it to false |
| AC-FN-12 | Greeting effect uses `sessionGreeted` from store, not React ref | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → greeting `useEffect` | `hasGreeted` ref is removed; `sessionGreeted` from store drives the branch logic |
| AC-FN-13 | Subsequent open (sessionGreeted=true) shows `standby`, not `salutation` | Code review: same file → greeting effect `else` branch | When `sessionGreeted === true` and messages empty: `voiceSurfaces.standby` is added, not `voiceSurfaces.salutation` |
| AC-FN-14 | `handleReset` uses `standby` surface | Code review: same file → `handleReset` | `handleReset` inserts `voiceSurfaces.standby`, not `voiceSurfaces.salutation` |
| AC-FN-15 | Eager surface regen triggered after Q&A save | Code review: `app/admin/settings/ai/_components/SmartSearchSection.tsx` → save handler | After PUT `/api/admin/settings/ai-search` succeeds, `POST /api/admin/settings/ai-search/regenerate-surfaces` is called asynchronously, then `resetSurfaces()` |
| AC-FN-16 | ChatPanel renders skeleton while `voiceSurfaces === null` | Code review: `ChatPanel.tsx` → message list render | When `isOpen && voiceSurfaces === null && messages.length === 0`, a skeleton bubble renders instead of a blank area |

### Test Coverage

> Fixture-intent rule enforced: tests exercise the full input→route path.
> Integration tests (AC-TST-10 through AC-TST-12) run via `npm run test:integration` against local dev server; excluded from `test:ci`.

| AC | What | How | Pass |
|----|------|-----|------|
| AC-TST-1 | `ai=true` always reaches agentic path regardless of NL heuristic | Test run: `npm run test:ci` | Test asserts `extractAgenticFilters` is called when `ai=true&q=xyz`; NOT called when `ai=false&q=xyz` |
| AC-TST-2 | Open-ended Counter query returns `acknowledgment` in response | Test run: `npm run test:ci` | Mocked extraction returning `acknowledgment: "Here's what I'd try today"` → response JSON has `acknowledgment` non-null |
| AC-TST-3 | Category slug from `from` param scopes Prisma `where` | Test run: `npm run test:ci` | With `from=categories/central-america`, Prisma mock asserts `where.categories = { some: { slug: "central-america" } }` |
| AC-TST-4 | `products.length <= 3` zeroes followUps in route response | Test run: `npm run test:ci` | Mocked extraction + 2 Prisma products → response `followUps` is `[]` |
| AC-TST-5 | `products.length >= 4` allows followUps through | Test run: `npm run test:ci` | Mocked extraction with followUps + 5 Prisma products → response `followUps` non-empty |
| AC-TST-6 | `buildSystemPrompt` contains stock deflection rule | Test run: `npm run test:ci` | `build-system-prompt.test.ts` asserts output contains "never state or imply stock" |
| AC-TST-7 | `buildSystemPrompt` + `buildExtractionPrompt` ban search-oriented language | Test run: `npm run test:ci` | Tests assert both prompts contain "nothing matching", "I can't think of", "I'm not sure" in banned-phrase lists |
| AC-TST-8 | `buildExtractionPrompt` includes merch equipment examples | Test run: `npm run test:ci` | Test asserts prompt contains "pour-over" and "brewing gear" in `merch` description |
| AC-TST-9 | `buildSystemPrompt` with `pageContext` includes context section | Test run: `npm run test:ci` | Test asserts output contains the context string when pageContext is provided; absent when not |
| AC-TST-10 | Integration scaffold exists and runs | Test run: `npm run test:integration` | Script runs against `localhost:3000`; `__tests__/integration/` excluded from `test:ci`; Jest config confirmed |
| AC-TST-11 | Intent classification — canonical query fixtures pass | Test run: `npm run test:integration` | "how do I brew a pour over?" → `intent: "how_to"`, `products: []`; "I want to reorder last month's bag" → `intent: "reorder"`, `products: []`; "something fruity and light" → `intent: "product_discovery"`, `acknowledgment` non-null |
| AC-TST-12 | Cadence shape — full round-trip fixtures | Test run: `npm run test:integration` | "what's good today?" → `acknowledgment` non-null, `products.length <= 7`; `from=categories/central-america` query → `products` non-empty, all in category |

### Regression

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1261+ tests pass, 0 failures |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors |
| AC-REG-3 | Non-category Counter queries unaffected | Interactive: Counter on homepage, submit any query | No category pre-scope applied; absence of `from=categories/` handled gracefully |
| AC-REG-4 | Product page first-open greeting still fires (context-aware) | Interactive: fresh Counter on `/products/origami-air-dripper` | First-open greeting references product; `sessionGreeted` transitions to true |
| AC-REG-5 | Coffee queries with specific filters still work | Interactive: ask "I want a light Ethiopian with floral notes" → screenshot | Products filtered correctly by origin/roast/flavor; acknowledgment present; correct cadence |

---

## UX Flows

| Flow | Question | Answer |
|------|----------|--------|
| First open | What greeting fires? | Context-aware: product/category/home; `sessionGreeted` → true |
| Subsequent open (no conversation) | What greeting fires? | `standby` surface — passive, acknowledges presence without re-greeting |
| Post-reset | What fires? | `standby` surface — no prompting question |
| While surfaces load | What does the user see? | Skeleton loading bubble in message area |
| Category page query | Price sort? | App-side sort after Prisma results; category pre-scoped via schema relation |
| `extractAgenticFilters` → null | What does Counter show? | `aiFailed` surface as acknowledgment; keyword search results with Counter UI framing |
| ≤3 results | Follow-up chips? | None — query was specific enough |
| ≥4 results | Follow-up chips? | Yes — chips to narrow |
| Stock question | What does AI say? | Redirect to product page; never asserts availability |

---

## Implementation Details

### Commit 1: Category pre-scope + app-side price sort

**File:** `app/api/search/route.ts`

Read `from` param alongside existing params:
```typescript
const pageFrom = urlParams.get("from") ?? undefined;
const categorySlug = pageFrom?.match(/^categories\/([^/]+)$/)?.[1];
```

Add to `whereClause` before extraction (schema-driven — no hardcoded category list):
```typescript
if (categorySlug) {
  whereClause.categories = { some: { slug: categorySlug } };
}
```

App-side price sort after Prisma results:
```typescript
function getMinVariantPrice(p: ProductWithVariants): number {
  const prices = p.variants.flatMap(v => v.purchaseOptions.map(po => po.price));
  return prices.length > 0 ? Math.min(...prices) : Infinity;
}
const sortBy = agenticData?.filtersExtracted?.sortBy;
if (sortBy === "price_desc") products.sort((a, b) => getMinVariantPrice(b) - getMinVariantPrice(a));
if (sortBy === "price_asc")  products.sort((a, b) => getMinVariantPrice(a) - getMinVariantPrice(b));
```

> Pre-read `prisma/schema.prisma` to confirm the product↔category relation field name before writing. Verify the Prisma `include` already fetches `variants.purchaseOptions` for price access.

---

### Commit 2: System prompt + extraction prompt + cadence enforcement

**File:** `app/api/search/route.ts`

**BUG-4 — cadence fallback when extraction null:**
Add a temporary debug log to capture what `extractAgenticFilters` returns for "what's good today?". Implement based on what's found:
- If `agenticData === null`: add `forceAI && !agenticData` branch → inject `aiFailed` voice surface as fallback acknowledgment so client renders Counter UI
- If `agenticData.acknowledgment === ""`: trace client rendering — ensure acknowledgment check is `!= null` not falsy

Remove debug log in same commit.

**BUG-3 — merch equipment in `buildExtractionPrompt()`:**
Extend `productType: "merch"` description to include: pour-over drippers, Aeropress, moka pots, grinders, kettles, reusable filters, mugs, bags, accessories. Add examples: "do you have a pour over" / "any brewing gear" / "looking for a dripper" → productType must be "merch".

**OBS-3 + banned words — add to `guardrailSection` in `buildSystemPrompt()`:**
```
- Never state or imply stock levels. If asked about availability, redirect to the product page.
- Never use language that sounds like a database query: "nothing matching", "I can't think of",
  "I'm not sure", "I don't have", "find", "results matching", "I found". Redirect in your own voice.
```

**OBS-1 — update `greeting.home` in generation prompt (`voice-surfaces.server.ts`):**
Change description to: "Brief, open-ended greeting. No location cues — never 'welcome in', 'come on in', 'get started', or any phrase implying a physical space or transaction. Just present and curious (1-2 sentences)."

**Cadence enforcement:**
```typescript
if (agenticData && products.length > 0 && products.length <= 3) {
  agenticData.followUps = [];
  agenticData.followUpQuestion = "";
}
```

---

### Commit 3: Voice surface system

**Files:** `lib/ai/voice-surfaces.ts`, `lib/ai/voice-surfaces.server.ts`, `app/admin/settings/ai/_components/SmartSearchSection.tsx`

**Neutralize `DEFAULT_VOICE_SURFACES`** (emergency fallback only, never Artisan Roast-specific):
```typescript
export const DEFAULT_VOICE_SURFACES: VoiceSurfaces = {
  "greeting.home": "Hey — what's on your mind?",
  "greeting.product": "Curious about {product}?",
  "greeting.category": "Browsing {category}?",
  waiting: "hmm",
  salutation: "What can I help with?",
  standby: "I'm here — anything come to mind?",
  aiFailed: "Sorry, I lost my train of thought — what were you after?",
  noResults: "Nothing's jumping out — can you tell me more?",
  error: "Something went sideways on my end — try again?",
};
```

**Add `standby` to `VoiceSurfaces` type** and generation prompt:
```
"standby": "What you'd say when the customer returns but already knows you're there.
Passive, no question, just presence. Something like 'I'm here if anything comes to mind.' (1 sentence)"
```

**Eager surface regen on Q&A save** (fire-and-forget, doesn't block save UX):
```typescript
// After successful PUT response in save handler:
void fetch("/api/admin/settings/ai-search/regenerate-surfaces", { method: "POST" });
resetSurfaces(); // bust client-side cache
```

---

### Commit 4: Session greeting state + skeleton loader

**Files:** `lib/store/chat-panel-store.ts`, `app/(site)/_components/ai/ChatPanel.tsx`

**Add `sessionGreeted` to store** (replaces `hasGreeted` React ref):
```typescript
sessionGreeted: boolean  // default false
setSessionGreeted: (v: boolean) => void
```
Update `resetSurfaces()` to reset `sessionGreeted: false` — admin "Test Counter" gets a fresh first-open experience each time.

**Update greeting `useEffect`** (remove ref, use store):
```typescript
if (!sessionGreeted) {
  setSessionGreeted(true);
  addMessage({ id: GREETING_ID, role: "assistant", content: getContextGreeting(), isLoading: false });
} else {
  // Already greeted this session — passive standby, not another salutation
  addMessage({ id: GREETING_ID, role: "assistant", content: voiceSurfaces.standby, isLoading: false });
}
```

**Update `handleReset()`:** use `surfaces.standby` instead of `surfaces.salutation`.

**Skeleton loader** (while `loadSurfaces()` is in flight):
```tsx
{isOpen && voiceSurfaces === null && messages.length === 0 && (
  <div className="px-4 py-3">
    <Skeleton className="h-4 w-48 mb-2" />
    <Skeleton className="h-4 w-32" />
  </div>
)}
```

---

### Commit 5: Integration scaffold + unit tests

**One-time infrastructure — persists across all future Counter iterations.**

`package.json`:
```json
"test:integration": "jest --testPathPattern='__tests__/integration/' --forceExit"
```

Jest config: add `__tests__/integration/` to `testPathIgnorePatterns` so `test:ci` never picks it up.

**Unit tests** (`route.test.ts` + `build-system-prompt.test.ts`):
- Routing gate: `ai=true` invokes extraction; `ai=false` + non-NL skips it
- Cadence: ≤3 products → `followUps: []`; ≥4 products → followUps preserved
- Category pre-scope: `from=categories/slug` → Prisma where includes `categories: { some: { slug } }`
- Prompt constraints: stock deflection, banned phrases, merch equipment examples, pageContext presence/absence

**Integration tests** (`__tests__/integration/counter-cadence.integration.test.ts`):
- Intent classification: `how_to` → empty products; `reorder` → account redirect; `product_discovery` → acknowledgment + products
- Cadence shapes: vague query → acknowledgment non-null, products ≤ 7; category page query → products in category

---

## Files Changed (estimated)

| File | Commit | Notes |
|------|--------|-------|
| `app/api/search/route.ts` | 1, 2 | Category pre-scope, price sort, prompt updates, cadence rules |
| `lib/ai/voice-surfaces.ts` | 3 | Neutralize `DEFAULT_VOICE_SURFACES`, add `standby` to `VoiceSurfaces` type |
| `lib/ai/voice-surfaces.server.ts` | 3 | Generation prompt: standby key, greeting.home tone |
| `lib/store/chat-panel-store.ts` | 4 | Add `sessionGreeted`, `setSessionGreeted`, update `resetSurfaces` |
| `app/(site)/_components/ai/ChatPanel.tsx` | 4 | Session greeting logic, standby on re-open + reset, skeleton |
| `app/admin/settings/ai/_components/SmartSearchSection.tsx` | 3 | Eager regen after Q&A save |
| `app/api/search/__tests__/route.test.ts` | 5 | Cadence + routing-gate + category scope unit fixtures |
| `app/api/search/__tests__/build-system-prompt.test.ts` | 5 | Banned-word + merch + context-awareness prompt tests |
| `app/api/search/__tests__/integration/counter-cadence.integration.test.ts` | 5 | Real-API intent + cadence fixtures (local only, excluded from CI) |
| `package.json` | 5 | Add `test:integration` script |
| `jest.config.*` | 5 | Exclude `__tests__/integration/` from `testPathIgnorePatterns` |

---

## Verification & Workflow Loop

After plan approval:
1. Commit plan: `git commit --no-verify -m "docs: add plan for counter-iter5"`
2. Register `verification-status.json`: `{ status: "planned", acs_total: 44 }`
3. Extract ACs into `docs/features/smart-search-ux/iter-5-context-grounding/acs.md`
4. Transition to `"implementing"` when coding begins

After implementation:
1. `npm run precheck`
2. `npm run test:integration` (dev server must be running)
3. Transition to `"pending"`
4. Spawn `/ac-verify` sub-agent — fills **Agent** column
5. Main thread reads report + screenshots, fills **QC** column
6. Any failure → fix → re-verify ALL ACs
7. All pass → ACs doc to human → human fills **Reviewer** column

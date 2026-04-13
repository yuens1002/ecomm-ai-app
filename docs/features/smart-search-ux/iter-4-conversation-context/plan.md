# Iter 4: Conversation Context & Multi-Product Search — Plan

**Branch:** `feat/conversation-context`
**Base:** `main` (after Phase 2 merge)

---

## Context

Two categories of issues surfaced during the Phase 2 audit:

**Search quality (blocker — already broken on live demo):**
The search returns irrelevant products for natural language queries. The keyword OR clause (`description contains "coffee"`, `description contains "notes"`) drowns AI-extracted filters. When AI extraction succeeds, the structured filters should replace the keyword search, not supplement it. Additionally, the keyword fallback uses raw `contains` with no relevance ranking — PostgreSQL full-text search with TF-IDF would fix this. When search returns empty results, the ChatPanel goes silent instead of showing the `noResults` voice surface.

**Conversation & context gaps:**
The Smart Search Assistant treats each query as independent — no memory of prior turns. A customer asking "something fruity" then "you have a single origin?" expects "fruity single origin," but the AI starts fresh. Greetings don't update when navigating between pages, the input placeholder assumes coffee-only, and the search pipeline only works for coffee products.

**Voice cohesion (new goal for this iteration):**
The five Q&A voice examples function as a single cohesive voice profile — the AI reads all five together to build its model of the owner's tone, vocabulary, and rhythm. If the answers are inconsistent (some formal, some casual, some terse), the AI's output blends those styles into something incoherent. The current per-field auto-save UI doesn't communicate this — each answer feels like an independent setting, not a coordinated whole. Admins have no feedback loop: they save an answer and have no idea what voice it produces until a customer queries the live store.

The primary goal of commit 10 ("admin two-part textarea — voice answer + AI preview") is to close this loop: every Q&A block shows an AI-generated sample response alongside the owner's answer, so admins can hear their voice in action and tune for consistency before it reaches customers. This reframes the five blocks as a single voice profile edit rather than five independent fields.

---

## Commit Schedule

> **Note:** Search quality fixes (clear keyword OR, pg full-text, empty-result fallback, flavor expansion) shipped in the hotfix branch `fix/search-quality`. Iter-4 builds on that foundation.

| # | Message | Scope | Risk |
|---|---------|-------|------|
| 0 | `docs: add plan for conversation context iteration` | — | — |
| 1 | `feat: pass conversation history to AI extraction` | route.ts, ChatPanel.tsx | Medium |
| 2 | `fix: reset greeting on page navigation` | ChatPanel.tsx | Low |
| 3 | `fix: reset button uses context-aware greeting` | ChatPanel.tsx | Low |
| 4 | `feat: pre-validate follow-up chips — filter zero-result options` | route.ts | Medium |
| 5 | `feat: rewrite acknowledgment as voice-surfaced recovery on empty results` | route.ts | Low |
| 6 | `refactor: remove hardcoded secondary no-results indicator` | ChatPanel.tsx | Low |
| 7 | `feat: context-aware input placeholder` | ChatPanel.tsx, store | Low |
| 8 | `feat: greeting personality — salutation opener` | ChatPanel.tsx, voice-surfaces | Low |
| 9 | `feat: product-type-aware search extraction` | route.ts, extraction prompt | Medium |
| 10 | `feat: admin two-part textarea — voice answer + AI preview` | AISearchSettingsSection.tsx | Medium |
| 11 | `feat: pgvector semantic search — platform value-add with per-store feature flag` | prisma, route.ts, admin UI | High |
| 12 | `test: search quality + conversation context tests` | tests | Low |

---

## Acceptance Criteria

### UI (verified by screenshots/code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Greeting updates when navigating to a different page | Interactive: open panel on homepage, navigate to PDP, check greeting | Greeting changes from `greeting.home` to `greeting.product` with product name |
| AC-UI-2 | Reset button produces context-aware greeting | Interactive: open panel on PDP, click reset | Greeting is product-specific, not homepage greeting |
| AC-UI-3 | Placeholder text adapts to page context | Screenshot: panel on homepage vs category vs merch page | Homepage: "Ask about our products...", Coffee category: "Ask about our coffee...", Merch: "Ask about our gear..." or similar |
| AC-UI-4 | Greeting opens with personality salutation | Screenshot: panel greeting on homepage | Greeting starts with a warm opener (from salutation surface) before the discovery prompt |
| AC-UI-5 | Conversation memory — follow-up narrows prior context | Interactive: "something fruity" → "single origin?" | Second response understands "fruity single origin" — returns fruity single-origin coffees |
| AC-UI-6 | Admin two-part textarea — answer + AI preview | Screenshot: admin AI settings | Each Q&A shows editable answer on top, read-only AI-generated surface below, with regen/reset buttons |
| AC-UI-7 | Non-coffee query returns relevant products (any type) | Interactive: "do you have mugs?" on homepage | Returns merch products matching the query, not coffee — extraction pipeline product-type-aware |
| AC-UI-8 | Follow-up chips never lead to zero results | Interactive: click each chip returned by AI | Every chip click returns at least 1 product — no "nothing matches" after chip narrowing |
| AC-UI-9 | Empty results show owner-voiced recovery — no secondary indicator | Interactive: query guaranteed to return 0 products | Single acknowledgment bubble in owner's voice ("I'm not sure we have that — could you tell me more about..."), no hardcoded "nothing quite lining up" below |
| AC-UI-10 | Admin toggle to enable/disable semantic search (pgvector) | Screenshot: admin Smart Search Assistant settings | Toggle switch labeled clearly ("Semantic search" or similar), with helper text explaining the tradeoff (better relevance vs. embedding API cost) |
| AC-UI-11 | Query with semantic-only match ranks higher when pgvector on | Interactive: "velvety" (not a literal tasting note) with toggle ON vs OFF | With pgvector ON, products with "smooth", "silky", "creamy" notes surface; with OFF, only literal "velvety" matches (probably none) |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | Conversation history passed to extraction prompt | Code review: `route.ts` + `ChatPanel.tsx` | Prior user/assistant turns included in AI extraction call |
| AC-FN-2 | History limited to last N turns | Code review: `route.ts` | Only last 5 turns sent to avoid token bloat |
| AC-FN-3 | Greeting message replaced on navigation | Code review: `ChatPanel.tsx` | `pathname` change triggers greeting replacement when panel has only the greeting |
| AC-FN-4 | Reset handler calls getContextGreeting | Code review: `ChatPanel.tsx` handleReset | Reset uses `getContextGreeting()` instead of hardcoded `greeting.home` |
| AC-FN-5 | Extraction prompt handles non-coffee products | Code review: `route.ts` buildExtractionPrompt | Prompt includes merch product types; `filtersExtracted` has a `productType` field |
| AC-FN-6 | Prisma query handles merch filters | Code review: `route.ts` whereClause | When `productType` is MERCH, search uses name/description matching without coffee-specific filters |
| AC-FN-7 | Follow-up chips pre-validated server-side | Code review: `route.ts` response builder | Before returning followUps to client, each chip is tested against the catalog; chips returning 0 products are filtered out |
| AC-FN-8 | Empty results rewrite acknowledgment in owner's voice | Code review: `route.ts` response builder | When `products.length === 0`, acknowledgment is replaced with `noResults` voice surface (or voice-consistent variant) before response sent to client — works for all product types (coffee AND merch) |
| AC-FN-9 | Hardcoded secondary no-results indicator removed | Code review: `ChatPanel.tsx` | No hardcoded "nothing quite lining up" `<p>` in render — acknowledgment carries the recovery message alone |
| AC-FN-10 | Per-Q&A surface regeneration in admin | Code review: `AISearchSettingsSection.tsx` + API | Individual surface strings can be regenerated or reset without regenerating all |
| AC-FN-11 | pgvector extension enabled + embedding column added | Code review: Prisma migration + schema | `Vector(N)` column added to Product (nullable), pgvector extension enabled on Neon |
| AC-FN-12 | Product embeddings generated on create/update | Code review: admin product actions | `generateEmbedding()` called after upsert; text source is `name + description + tastingNotes + origin` |
| AC-FN-13 | Backfill script for existing products | Code review: `scripts/backfill-embeddings.ts` | Idempotent script embeds all products with NULL embeddings; can resume on failure |
| AC-FN-14 | Vector search path with keyword fallback | Code review: `route.ts` | When store has `semanticSearchEnabled: true` AND query has embedding, use `ORDER BY embedding <=> queryEmbedding`. Fallback to keyword when embedding generation fails or flag is off |
| AC-FN-15 | Per-store feature flag in site settings | Code review: `lib/site-settings.ts` + admin API | `semanticSearchEnabled` boolean in SiteSettings, default false. Admin can toggle. Rollback = flip flag. |

### Regression (verified by test suite)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors |
| AC-REG-3 | Roast-level keyword queries still work | Code review + test: `search/route.ts` | "dark roast" → category filter still applied correctly |
| AC-REG-4 | Single-turn coffee queries still work | Interactive: "something bold for French press" | Returns appropriate dark/bold coffees with correct acknowledgment and follow-ups |
| AC-REG-5 | Salutation detection still works | Interactive: "hey" | Returns salutation surface string, no products |

---

## Implementation Details

### Commit 1: Clear keyword OR when AI extraction succeeds

**File:** `app/api/search/route.ts`

After AI extraction succeeds (~line 406), clear the initial `whereClause.OR` before applying AI filters:

```ts
if (agenticData?.filtersExtracted) {
  delete whereClause.OR; // Discard broad keyword matches — AI is more precise
  // ... existing filter application ...
}
```

### Commit 2: PostgreSQL full-text search for keyword fallback

**File:** `app/api/search/route.ts`

Replace `{ description: { contains: token, mode: "insensitive" } }` with PostgreSQL full-text search using `tsvector`/`tsquery` with `ts_rank`. TF-IDF ranking automatically suppresses high-frequency words like "coffee" and "notes".

### Commit 3: Always render response on empty results

**File:** `app/(site)/_components/ai/ChatPanel.tsx`

When API returns 0 products and no acknowledgment, render `noResults` voice surface:

```ts
const content = data.acknowledgment || (data.products?.length === 0 ? voiceSurfaces.noResults : "");
```

### Commit 4: Conversation history in AI extraction

**Files:** `ChatPanel.tsx`, `search/route.ts`

ChatPanel sends prior messages as a `history` query param (JSON-encoded array of `{role, content}` pairs, last 5 turns). The search route injects these into the extraction prompt:

```ts
const historyContext = history.length > 0
  ? `\n\nConversation so far:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nBuild on the conversation context — the customer's new message may reference prior queries.`
  : "";
```

### Commit 2: Reset greeting on navigation

**File:** `ChatPanel.tsx`

Add a `useEffect` watching `pathname` that replaces the greeting message when the panel has only the initial greeting:

```ts
useEffect(() => {
  const state = useChatPanelStore.getState();
  if (state.messages.length === 1 && state.messages[0].id === GREETING_ID) {
    updateMessage(GREETING_ID, { content: getContextGreeting() });
  }
}, [pathname]);
```

### Commit 3: Reset button fix

**File:** `ChatPanel.tsx`

Move `getContextGreeting` to a shared scope or pass it down. `handleReset` calls it instead of hardcoding `greeting.home`.

### Commit 4: Context-aware placeholder

**File:** `ChatPanel.tsx`, `chat-panel-store.ts`

Derive placeholder from `pageContext`:
- No context / homepage → "Ask about our products..."
- Coffee category → "Ask about our coffee..."
- Merch category → "Ask about our gear..."
- Product page → "Ask about {productName}..."

### Commit 5: Greeting personality

**File:** `ChatPanel.tsx`

Prepend the salutation surface to the greeting:
```ts
const greeting = `${surfaces.salutation} ${getContextGreeting()}`;
```

### Commit 6: Product-type-aware extraction

**File:** `search/route.ts`

Add `productType` to `FiltersExtracted` (`"coffee" | "merch" | "any"`). Update extraction prompt to recognize non-coffee intents. When `productType === "merch"`, skip coffee-specific filters and search by name/description only.

### Commit 7: Admin two-part textarea

**File:** `AISearchSettingsSection.tsx`

Consult shadcn MCP (`/cui`) for the best component pattern. Each Q&A pair becomes:
- Top: editable Textarea (owner's answer)
- Bottom: read-only display of the AI-generated surface string for that question
- Action row: "Regenerate" (re-generates this surface) + "Reset" (reverts answer to default)

### Commit 8: Tests

- Conversation memory: mock test verifying history is passed to extraction
- Navigation greeting: test `getGreetingForPath` with pathname changes
- Non-coffee query: test extraction with merch intent

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

**Coffee domain knowledge (new goal for this iteration):**
The system prompt teaches the AI the owner's voice and the JSON extraction format — but not coffee itself. Without domain knowledge, the AI can't bridge customer language to product attributes: "gift for my mom, something approachable" requires knowing that approachable → smooth/low-acid → Colombian or Brazilian → sort by top-rated. A counter person knows this intuitively; the AI has to be taught it explicitly. A coffee knowledge section in `buildSystemPrompt` should cover: roast level ↔ flavor/body/acidity relationships; origin ↔ flavor profile (Ethiopia = floral/blueberry, Kenya = juicy/wine-like, Sumatra = earthy/full-body); brew method ↔ roast pairing; experiential terms mapped to attributes (approachable, beginner, gift → smooth, medium roast, top-rated); processing method flavor signatures (washed = clean/bright, natural = fruity/winey). This is distinct from voice — voice examples teach personality, domain knowledge teaches expertise.

**Voice cohesion (new goal for this iteration):**
The five Q&A voice examples function as a single cohesive voice profile — the AI reads all five together to build its model of the owner's tone, vocabulary, and rhythm. If the answers are inconsistent (some formal, some casual, some terse), the AI's output blends those styles into something incoherent. The current per-field auto-save UI doesn't communicate this — each answer feels like an independent setting, not a coordinated whole. Admins have no feedback loop: they save an answer and have no idea what voice it produces until a customer queries the live store.

The primary goal of commit 10 ("admin two-part textarea — voice answer + AI preview") is to close this loop: every Q&A block shows an AI-generated sample response alongside the owner's answer, so admins can hear their voice in action and tune for consistency before it reaches customers. This reframes the five blocks as a single voice profile edit rather than five independent fields.

**Voice surface initialization (new goal for this iteration):**
All voice surfaces — greeting, placeholder, salutation, waiting filler, error strings — must come from the same Q&A source. Currently, surfaces are only generated when the admin explicitly saves voice examples. If the admin never touches that page, the ChatPanel falls back to hardcoded TS constants that aren't actually derived from the Q&A examples. This breaks the principle that every surface is one coherent persona.

The fix is lazy initialization: the first time Counter opens with AI configured, `GET /api/settings/voice-surfaces` checks for cached surfaces in DB. If none exist, it calls `generateVoiceSurfaces(storedExamples || DEFAULT_VOICE_EXAMPLES)`, writes the result to `ai_voice_surfaces`, and returns it. Every subsequent open reads the cached version — no re-generation until examples change. When the admin saves new Q&A answers, the PUT handler deletes `ai_voice_surfaces` from DB (only if it already exists — stale surfaces are more harmful than no surfaces). Next Counter open re-initializes from the new examples. The ChatPanel shows a skeleton while the initialization fetch resolves — no flash of TS fallback text before the real voice arrives.

---

## Commit Schedule

> **Note:** Search quality fixes (clear keyword OR, pg full-text, empty-result fallback, flavor expansion) shipped in the hotfix branch `fix/search-quality`. Iter-4 builds on that foundation.

| # | Message | Scope | Risk |
|---|---------|-------|------|
| 0 | `docs: add plan for conversation context iteration` | — | — |
| 1a | `feat: lazy voice surface init — GET generates + caches on first Counter open` | voice-surfaces/route.ts | Low |
| 1b | `fix: cache bust surfaces on example change — delete on PUT when surfaces exist` | ai-search/route.ts | Low |
| 1c | `feat: Counter skeleton while voice surfaces load — no TS fallback flash` | ChatPanel.tsx | Low |
| 2 | `feat: pass conversation history to AI extraction` | route.ts, ChatPanel.tsx | Medium |
| 2 | `fix: reset greeting on page navigation` | ChatPanel.tsx | Low |
| 3 | `fix: reset button uses context-aware greeting` | ChatPanel.tsx | Low |
| 4 | `feat: pre-validate follow-up chips — filter zero-result options` | route.ts | Medium |
| 5 | `feat: rewrite acknowledgment as voice-surfaced recovery on empty results` | route.ts | Low |
| 6 | `refactor: remove hardcoded secondary no-results indicator` | ChatPanel.tsx | Low |
| 7 | `feat: context-aware input placeholder` | ChatPanel.tsx, store | Low |
| 8 | `feat: greeting personality — salutation opener` | ChatPanel.tsx, voice-surfaces | Low |
| 9 | `feat: product-type-aware search extraction` | route.ts, extraction prompt | Medium |
| 10 | `feat: coffee domain knowledge in system prompt — roast/origin/brew/experiential mappings` | route.ts buildSystemPrompt | Low |
| 11 | `feat: admin two-part textarea — voice answer + AI preview` | AISearchSettingsSection.tsx | Medium |
| 12 | `feat: pgvector semantic search — platform value-add with per-store feature flag` | prisma, route.ts, admin UI | High |
| 13 | `test: search quality + conversation context tests` | tests | Low |

---

## Acceptance Criteria

### UI (verified by screenshots/code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-0a | Counter shows skeleton while surfaces load | Screenshot: Counter open immediately after hard refresh (empty cache) | Skeleton placeholder visible in greeting and input areas — no TS fallback text flash before real voice arrives |
| AC-UI-0b | Counter greeting matches Q&A voice after init | Interactive: open Counter fresh (no cached surfaces) — wait for init — screenshot | Greeting text is consistent with the persona from DEFAULT_VOICE_EXAMPLES — not generic AI-assistant copy |
| AC-UI-1 | Greeting updates when navigating to a different page | Interactive: open panel on homepage, navigate to PDP, check greeting | Greeting changes from `greeting.home` to `greeting.product` with product name |
| AC-UI-2 | Reset button produces context-aware greeting | Interactive: open panel on PDP, click reset | Greeting is product-specific, not homepage greeting |
| AC-UI-3 | Placeholder text adapts to page context | Screenshot: panel on homepage vs category vs merch page | Homepage: "Ask about our products...", Coffee category: "Ask about our coffee...", Merch: "Ask about our gear..." or similar |
| AC-UI-4 | Greeting opens with personality salutation | Screenshot: panel greeting on homepage | Greeting starts with a warm opener (from salutation surface) before the discovery prompt |
| AC-UI-5 | Conversation memory — follow-up narrows prior context | Interactive: "something fruity" → "single origin?" | Second response understands "fruity single origin" — returns fruity single-origin coffees |
| AC-UI-6 | Admin two-part textarea — answer + AI preview | Screenshot: admin AI settings | Each Q&A shows editable answer on top, read-only AI-generated surface below, with regen/reset buttons |
| AC-UI-7 | Domain-aware intent resolution | Interactive: "looking for a gift for my mom, something approachable" | Returns smooth/balanced coffees (not zero results); follow-up chips use recipient context ("She loves bold" / "Something smooth") not generic roast labels |
| AC-UI-7b | Non-coffee query returns relevant products (any type) | Interactive: "do you have mugs?" on homepage | Returns merch products matching the query, not coffee — extraction pipeline product-type-aware |
| AC-UI-8 | Follow-up chips never lead to zero results | Interactive: click each chip returned by AI | Every chip click returns at least 1 product — no "nothing matches" after chip narrowing |
| AC-UI-9 | Empty results show owner-voiced recovery — no secondary indicator | Interactive: query guaranteed to return 0 products | Single acknowledgment bubble in owner's voice ("I'm not sure we have that — could you tell me more about..."), no hardcoded "nothing quite lining up" below |
| AC-UI-10 | Admin toggle to enable/disable semantic search (pgvector) | Screenshot: admin Smart Search Assistant settings | Toggle switch labeled clearly ("Semantic search" or similar), with helper text explaining the tradeoff (better relevance vs. embedding API cost) |
| AC-UI-11 | Query with semantic-only match ranks higher when pgvector on | Interactive: "velvety" (not a literal tasting note) with toggle ON vs OFF | With pgvector ON, products with "smooth", "silky", "creamy" notes surface; with OFF, only literal "velvety" matches (probably none) |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-0a | Lazy init fires on first Counter open | Code review: `app/api/settings/voice-surfaces/route.ts` | When `ai_voice_surfaces` absent from DB and AI configured: calls `generateVoiceSurfaces`, upserts result to `ai_voice_surfaces`, returns generated surfaces — not TS fallback |
| AC-FN-0b | Lazy init uses stored examples or defaults | Code review: same route | Reads `ai_voice_examples` from DB first; falls back to `DEFAULT_VOICE_EXAMPLES` if absent |
| AC-FN-0c | Surfaces not regenerated eagerly in PUT | Code review: `app/api/admin/settings/ai-search/route.ts` | PUT handler no longer calls `generateVoiceSurfaces` directly; instead deletes `ai_voice_surfaces` when `voiceExamples` field is present in payload and surfaces currently exist in DB |
| AC-FN-0d | Delete-on-change only when surfaces exist | Code review: same PUT handler | Delete is conditional — `prisma.siteSettings.deleteMany({ where: { key: "ai_voice_surfaces" } })` only after confirming the record exists; no-op on fresh installs |
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

### Commits 1a–1c: Voice Surface Initialization

**Commit 1a — Lazy init in GET `/api/settings/voice-surfaces`**

```ts
export async function GET() {
  try {
    const [surfacesSetting, examplesSetting] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { key: "ai_voice_surfaces" } }),
      prisma.siteSettings.findUnique({ where: { key: "ai_voice_examples" } }),
    ]);

    if (surfacesSetting?.value) {
      try {
        return NextResponse.json(JSON.parse(surfacesSetting.value));
      } catch { /* malformed — fall through to init */ }
    }

    // No surfaces cached — initialize from examples if AI is available
    if (await isAIConfigured()) {
      let examples = DEFAULT_VOICE_EXAMPLES;
      if (examplesSetting?.value) {
        try { examples = JSON.parse(examplesSetting.value); } catch { /* use defaults */ }
      }
      const surfaces = await generateVoiceSurfaces(examples);
      await prisma.siteSettings.upsert({
        where: { key: "ai_voice_surfaces" },
        update: { value: JSON.stringify(surfaces) },
        create: { key: "ai_voice_surfaces", value: JSON.stringify(surfaces) },
      });
      return NextResponse.json(surfaces);
    }

    return NextResponse.json(DEFAULT_VOICE_SURFACES);
  } catch (error) {
    console.error("Error fetching voice surfaces:", error);
    return NextResponse.json(DEFAULT_VOICE_SURFACES);
  }
}
```

**Request lifecycle — keeping initialization minimal:**

```
First-ever install (surfaces not in DB):
  Panel open → GET /api/settings/voice-surfaces
    → surfacesLoaded guard: false → fetch runs
    → DB: no ai_voice_surfaces → isAIConfigured() → generateVoiceSurfaces() [~500ms, one-time]
    → writes to DB → returns surfaces
    → Zustand: voiceSurfaces = result, surfacesLoaded = true

Every subsequent panel open (same session):
  Panel open → loadSurfaces() → surfacesLoaded: true → returns immediately (no fetch)

After page refresh / new tab (surfaces now in DB):
  Panel open → GET /api/settings/voice-surfaces
    → surfacesLoaded guard: false → fetch runs
    → DB: ai_voice_surfaces exists → returns cached JSON [~30ms]
    → Zustand: voiceSurfaces = result, surfacesLoaded = true

During a conversation (queries):
  Every search → POST /api/search (NOT /api/settings/voice-surfaces)
  → surfaces served from Zustand store → zero network overhead
```

The `surfacesLoaded` guard in `lib/store/chat-panel-store.ts` (`if (get().surfacesLoaded) return`) already handles in-session deduplication. Commit 1c changes `voiceSurfaces` initial state from `DEFAULT_VOICE_SURFACES` to `null` — the guard stays, only the initial value changes. Skeleton renders while `voiceSurfaces === null`, real content renders once the fetch resolves.

**Responsive while staying in character:**
The input and submit button are active during skeleton — initialization must not block interaction. If a user types and submits before surfaces resolve:
- The search response goes to `/api/search` which already has Q&A voice examples in its system prompt → the AI response is in character regardless of surface load state
- Surface strings (greeting, waiting filler, placeholder) are cosmetic layer — the voice of actual responses never depends on them
- On the very first install the ~500ms AI generation delay is only felt once, never again. The skeleton makes this feel like loading, not broken.

This separation — surfaces are cosmetic, search voice comes from Q&A examples in the system prompt — means the Counter is always in character from the first query, even if the greeting skeleton is still resolving.

**Commit 1b — Cache bust in PUT `/api/admin/settings/ai-search`**

Replace the eager `generateVoiceSurfaces` call with a conditional delete:

```ts
// When voice examples change, invalidate cached surfaces so next Counter open re-initializes
if (parsed.data.voiceExamples !== undefined) {
  const existingSurfaces = await prisma.siteSettings.findUnique({
    where: { key: "ai_voice_surfaces" },
  });
  if (existingSurfaces) {
    await prisma.siteSettings.delete({ where: { key: "ai_voice_surfaces" } });
  }
}
```

Remove the old `generateVoiceSurfaces` block from this handler entirely. Surfaces are now always initialized lazily.

**Commit 1c — Skeleton in ChatPanel while surfaces load**

`voiceSurfaces` state starts as `null`. While null, render skeleton in place of greeting text and input placeholder. The `loadSurfaces()` call on panel open populates surfaces and triggers a re-render. Once populated, never shown as null again (cached in Zustand store across re-renders within the session).

Skeleton elements match the dimensions of the real content — no layout shift on resolution.

---

### Commit 1 (renumbered → 2): Clear keyword OR when AI extraction succeeds

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

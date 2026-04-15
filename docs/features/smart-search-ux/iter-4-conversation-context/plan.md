# Iter 4: Conversation Context & Multi-Product Search — Plan

**Branch:** `feat/conversation-context`
**Base:** `main` (after Phase 2 merge)

---

## Context

Two categories of issues surfaced during the Phase 2 audit:

**Search quality (✅ shipped in `fix/search-quality`, v0.100.1):**
~~The search returns irrelevant products for natural language queries.~~ Fixed: keyword OR clause is cleared when AI extraction succeeds; keyword fallback uses PostgreSQL full-text search with TF-IDF (`tsvector`/`tsquery`/`TS_RANK`). 16/16 ACs verified. Iter-4 builds on this foundation — the noResults voice surface fallback and chip pre-validation extend it further.

**Conversation & context gaps:**
The Smart Search Assistant treats each query as independent — no memory of prior turns. A customer asking "something fruity" then "you have a single origin?" expects "fruity single origin," but the AI starts fresh. Greetings don't update when navigating between pages, the input placeholder assumes coffee-only, and the search pipeline only works for coffee products.

**Coffee domain knowledge (new goal for this iteration):**
The system prompt teaches the AI the owner's voice and the JSON extraction format — but not coffee itself. Without domain knowledge, the AI can't bridge customer language to product attributes: "gift for my mom, something approachable" requires knowing that approachable → smooth/low-acid → Colombian or Brazilian → sort by top-rated. A counter person knows this intuitively; the AI has to be taught it explicitly. A coffee knowledge section in `buildSystemPrompt` should cover: roast level ↔ flavor/body/acidity relationships; origin ↔ flavor profile (Ethiopia = floral/blueberry, Kenya = juicy/wine-like, Sumatra = earthy/full-body); brew method ↔ roast pairing; experiential terms mapped to attributes (approachable, beginner, gift → smooth, medium roast, top-rated); processing method flavor signatures (washed = clean/bright, natural = fruity/winey). This is distinct from voice — voice examples teach personality, domain knowledge teaches expertise.

**Voice cohesion (new goal for this iteration):**
The five Q&A voice examples function as a single cohesive voice profile — the AI reads all five together to build its model of the owner's tone, vocabulary, and rhythm. If the answers are inconsistent (some formal, some casual, some terse), the AI's output blends those styles into something incoherent. The current per-field auto-save UI doesn't communicate this — each answer feels like an independent setting, not a coordinated whole. Admins have no feedback loop: they save an answer and have no idea what voice it produces until a customer queries the live store.

Two layers close this loop:

**Live Counter preview (commit 12b):** A "Test Counter" button in the Smart Search settings section summons the actual Counter drawer in the admin context. The admin can have a real conversation — type any query, see how the AI responds with their current voice settings. Changes are live when saved (auto-save) — the embedded Counter reflects what customers are already experiencing. This closes the verification loop: instead of opening a separate storefront tab to check, the admin tests from within the settings page itself.

**Voice surface initialization (new goal for this iteration):**
All voice surfaces — greeting, salutation, waiting filler, error strings — must come from the same Q&A source. The input placeholder is excluded from voice surfaces; it is a static page-context derivation always present in the UI. Currently, surfaces are only generated when the admin explicitly saves voice examples. If the admin never touches that page, the ChatPanel falls back to hardcoded TS constants that aren't actually derived from the Q&A examples. This breaks the principle that every surface is one coherent persona.

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
| ~~2~~ | ~~`fix: reset greeting on page navigation`~~ | — | ✅ dropped — silent after first encounter; greeting never needs to update on navigation |
| 3 | `fix: reset clears conversation — no greeting re-injection` | ChatPanel.tsx | Low |
| 4 | `feat: pre-validate follow-up chips — filter zero-result options` | route.ts | Medium |
| ~~5~~ | ~~`feat: rewrite acknowledgment as voice-surfaced recovery on empty results`~~ | ~~route.ts~~ | ✅ already shipped — `voiceSurfaces.noResults` wired in ChatPanel |
| ~~6~~ | ~~`refactor: remove hardcoded secondary no-results indicator`~~ | ~~ChatPanel.tsx~~ | ✅ already shipped — no hardcoded secondary string exists in render |
| ~~8~~ | ~~`feat: greeting personality — salutation opener`~~ | — | ✅ dropped — first-open greeting carries personality via `greeting.home` surface; salutation kept for user-typed "hey" queries only (search/route.ts) |
| 9 | `feat: grounded RAG — dynamic catalog snapshot injected into system prompt` | route.ts, buildSystemPrompt | Medium |
| 9b | `feat: store intelligence — top sellers, new arrivals, on sale, low stock in system prompt` | route.ts, buildSystemPrompt | Low |
| 9c | `feat: product-type-aware search — merch queries use name/description matching, not coffee filters` | route.ts, extraction prompt | Medium |
| 9d | `feat: result reconciliation — promote AI-recommended product to position 1 in results` | route.ts extraction schema + result sort | Low |
| 10 | `feat: intent classification — conversational queries get pure-text response, reorder/service queries get in-character redirect to account page` | route.ts | Medium |
| 10b | `feat: hide Counter on account and order routes — not available on /account, /orders, /subscriptions` | ChatPanel.tsx or SiteHeader | Low |
| 11 | `feat: coffee domain knowledge in system prompt — roast/origin/brew/experiential mappings` | route.ts buildSystemPrompt | Low |
| ~~12~~ | ~~`feat: admin two-part textarea — voice answer + AI preview`~~ | — | ✅ dropped — superseded by 12b; live Counter is a better preview than static per-block samples |
| 12b | `feat: Counter preview panel in admin AI settings — "Test Counter" button summons live Counter drawer` | app/admin/settings/ai/page.tsx, ChatPanel.tsx | Medium |
| ~~13~~ | ~~`feat: pgvector semantic search`~~ | — | ⏸ deferred to iter-5 — pending extension/platform architecture decision; don't ship OSS infrastructure as a platform feature |
| 14 | `test: search quality + conversation context tests` | tests | Low |

---

## Acceptance Criteria

### UI (verified by screenshots/code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-0a | Counter shows skeleton while surfaces load | Screenshot: Counter open immediately after hard refresh (empty cache) | Skeleton visible in greeting area — no TS fallback text flash before real voice arrives; input field is empty (no placeholder) |
| AC-UI-0b | Counter greeting matches Q&A voice after init | Interactive: open Counter fresh (no cached surfaces) — wait for init — screenshot | Greeting text is consistent with the persona from DEFAULT_VOICE_EXAMPLES — not generic AI-assistant copy |
| AC-UI-1 | Counter shows salutation on re-open — no repeated greeting | Interactive: open Counter, close, reopen (same session with no conversation) | Short in-character `salutation` surface shown — no "Hey!" opener, no full greeting replay |
| AC-UI-2 | Reset shows salutation — no greeting re-injected | Interactive: open Counter, have a conversation, click reset | Messages cleared, `salutation` surface shown as sole message — no repeated greeting |
| AC-UI-3 | Input placeholder removed — empty input field | Code review: `ChatPanel.tsx` | No placeholder text on the text input — `placeholder` prop absent or empty string; hardcoded "what are you after today?" string gone |
| AC-UI-4 | First-open greeting carries personality — one-time per session | Screenshot: fresh session Counter open | Full `greeting.home/product/category` surface shown once; re-opens and resets do not re-greet |
| AC-UI-5 | Conversation memory — follow-up narrows prior context | Interactive: "something fruity" → "single origin?" | Second response understands "fruity single origin" — returns fruity single-origin coffees |
| ~~AC-UI-6~~ | ~~Admin two-part textarea — answer + AI preview~~ | — | ✅ dropped — superseded by AC-UI-6b/6c/6d (live Counter preview) |
| AC-UI-6b | "Test Counter" button visible in admin Smart Search settings | Screenshot: admin `/admin/settings/ai` page | Button labeled "Test Counter" (or equivalent) visible in Smart Search Assistant section |
| AC-UI-6c | Clicking "Test Counter" opens Counter drawer in admin context | Interactive: click "Test Counter" button → screenshot | Counter drawer opens showing greeting — no navigation away from admin settings page |
| AC-UI-6d | Counter in admin preview uses store-specific vocabulary (grounded RAG) | Interactive: open admin Counter → type "something fruity" → screenshot response | Acknowledgment or product names contain tasting notes/terms from the store's actual catalog (not generic AI copy); at least one product returned matches a real catalog entry |
| AC-UI-7 | Domain-aware intent resolution | Interactive: "looking for a gift for my mom, something approachable" | Returns smooth/balanced coffees (not zero results); follow-up chips use recipient context ("She loves bold" / "Something smooth") not generic roast labels |
| AC-UI-7b | Non-coffee query returns relevant products (any type) | Interactive: "do you have mugs?" on homepage | Returns merch products matching the query, not coffee — extraction pipeline product-type-aware |
| AC-UI-8 | Follow-up chips never lead to zero results | Interactive: click each chip returned by AI | Every chip click returns at least 1 product — no "nothing matches" after chip narrowing |
| AC-UI-9 | ✅ Empty results show owner-voiced recovery — no secondary indicator | Already shipped — `voiceSurfaces.noResults` wired, no hardcoded secondary string in render | — |
| ~~AC-UI-10~~ | ~~Admin toggle to enable/disable semantic search~~ | — | ✅ dropped — no toggle; pgvector runs automatically when embeddings exist, keyword fallback otherwise |
| ~~AC-UI-11~~ | ~~Semantic-only match surfaces when embeddings exist~~ | — | ⏸ deferred with commit 13 |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-0a | Lazy init fires on first Counter open | Code review: `app/api/settings/voice-surfaces/route.ts` | When `ai_voice_surfaces` absent from DB and AI configured: calls `generateVoiceSurfaces`, upserts result to `ai_voice_surfaces`, returns generated surfaces — not TS fallback |
| AC-FN-0b | Lazy init uses stored examples or defaults | Code review: same route | Reads `ai_voice_examples` from DB first; falls back to `DEFAULT_VOICE_EXAMPLES` if absent |
| AC-FN-0c | Surfaces not regenerated eagerly in PUT | Code review: `app/api/admin/settings/ai-search/route.ts` | PUT handler no longer calls `generateVoiceSurfaces` directly; instead deletes `ai_voice_surfaces` when `voiceExamples` field is present in payload and surfaces currently exist in DB |
| AC-FN-0d | Delete-on-change only when surfaces exist | Code review: same PUT handler | Delete is conditional — `prisma.siteSettings.deleteMany({ where: { key: "ai_voice_surfaces" } })` only after confirming the record exists; no-op on fresh installs |
| AC-FN-0e | Seed does not write `ai_voice_surfaces` | Code review: `prisma/seed/settings.ts` | No `ai_voice_surfaces` key seeded — only `ai_voice_examples`; lazy init is the sole writer of surfaces |
| AC-FN-1 | Conversation history passed to extraction prompt | Code review: `route.ts` + `ChatPanel.tsx` | Prior user/assistant turns included in AI extraction call |
| AC-FN-2 | History limited to last N turns | Code review: `route.ts` | Only last 5 turns sent to avoid token bloat |
| AC-FN-3 | Re-open with no conversation shows salutation | Code review: `ChatPanel.tsx` | When panel opens and `messages.length === 0` (after reset or first session close), `voiceSurfaces.salutation` is shown as sole message — no full greeting |
| AC-FN-4 | Reset handler shows salutation — not greeting | Code review: `ChatPanel.tsx` handleReset | `handleReset` clears messages, then adds `voiceSurfaces.salutation` as sole message; does not call `getContextGreeting()` |
| AC-FN-5 | Extraction prompt handles non-coffee products | Code review: `route.ts` buildExtractionPrompt | Prompt includes merch product types; `filtersExtracted` has a `productType` field |
| AC-FN-6 | Prisma query handles merch filters | Code review: `route.ts` whereClause | When `productType` is MERCH, search uses name/description matching without coffee-specific filters |
| AC-FN-7 | Follow-up chips pre-validated server-side | Code review: `route.ts` response builder | Before returning followUps to client, each chip is tested against the catalog; chips returning 0 products are filtered out |
| AC-FN-8 | ✅ Empty results rewrite acknowledgment in owner's voice | Already shipped — `voiceSurfaces.noResults` assigned in ChatPanel fetch handler when no content + no products | — |
| AC-FN-9 | ✅ Hardcoded secondary no-results indicator removed | Already shipped — no hardcoded string in ChatPanel render | — |
| ~~AC-FN-10~~ | ~~Per-Q&A surface regeneration in admin~~ | — | ✅ dropped — part of 12 (two-part textarea), which is dropped |
| ~~AC-FN-11~~ | ~~pgvector extension + embedding column~~ | — | ⏸ deferred with commit 13 |
| ~~AC-FN-12~~ | ~~Product embeddings on create/update~~ | — | ⏸ deferred with commit 13 |
| ~~AC-FN-13~~ | ~~Backfill script~~ | — | ⏸ deferred with commit 13 |
| ~~AC-FN-14~~ | ~~Vector search path~~ | — | ⏸ deferred with commit 13 |

### Test Coverage Acceptance Criteria

| AC | What | How | Pass |
|----|------|-----|------|
| AC-TST-1 | `GET /api/settings/voice-surfaces` — lazy init: calls `generateVoiceSurfaces` and upserts `ai_voice_surfaces` when no record exists and AI is configured | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts `generateVoiceSurfaces` mock called once and `prisma.siteSettings.upsert` called with `{ where: { key: "ai_voice_surfaces" } }` when `findUnique` returns null and `isAIConfigured` returns true |
| AC-TST-2 | `GET /api/settings/voice-surfaces` — cached path: returns parsed DB value without calling `generateVoiceSurfaces` when `ai_voice_surfaces` already exists | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts `generateVoiceSurfaces` mock never called and response body matches stored JSON |
| AC-TST-3 | `GET /api/settings/voice-surfaces` — falls back to `DEFAULT_VOICE_EXAMPLES` when `ai_voice_examples` absent | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts `generateVoiceSurfaces` called with `DEFAULT_VOICE_EXAMPLES` when `ai_voice_examples` findUnique returns null |
| AC-TST-4 | `GET /api/settings/voice-surfaces` — falls back to `DEFAULT_VOICE_SURFACES` when AI not configured | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts response deep-equals `DEFAULT_VOICE_SURFACES` and `upsert` never called when `isAIConfigured` returns false |
| AC-TST-5 | `PUT /api/admin/settings/ai-search` — cache bust: deletes `ai_voice_surfaces` when `voiceExamples` in payload and record exists | Test run: `npm run test:ci` | `app/api/admin/settings/ai-search/__tests__/route.test.ts` asserts `prisma.siteSettings.delete` called with `{ where: { key: "ai_voice_surfaces" } }` and `generateVoiceSurfaces` NOT called |
| AC-TST-6 | `PUT /api/admin/settings/ai-search` — cache bust is no-op when `ai_voice_surfaces` does not exist | Test run: `npm run test:ci` | `app/api/admin/settings/ai-search/__tests__/route.test.ts` asserts delete not called when `findUnique({ where: { key: "ai_voice_surfaces" } })` returns null |
| AC-TST-7 | `GET /api/search` — conversation history injected into `chatCompletion` messages when `history` param is non-empty | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `chatCompletionMock` called with `messages` array containing prior user message text from `history` param |
| AC-TST-8 | `GET /api/search` — history capped at 5 turns | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts history segment of `chatCompletionMock` call has ≤ 10 messages when a 7-turn `history` array is passed |
| AC-TST-9 | `GET /api/search` — `how_to` intent returns text-only: no DB query, `products` is empty | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `productFindManyMock` never called and `data.products` equals `[]` when extraction returns `intent: "how_to"` |
| AC-TST-10 | `GET /api/search` — `reorder` intent returns in-character redirect: `acknowledgment` contains account reference, `products` empty | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `data.products` equals `[]` and `data.acknowledgment` contains `"account"` when extraction returns `intent: "reorder"` |
| AC-TST-11 | `GET /api/search` — merch query omits `type: COFFEE` and coffee-specific filters from `whereClause` | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `productFindManyMock` called without `.where.type === "COFFEE"` and without `.where.categories` when extraction returns `productType: "merch"` |
| AC-TST-12 | `GET /api/search` — result reconciliation: product matching `recommendedProductName` sorted to index 0 | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `data.products[0].name` equals `recommendedProductName` from extraction when that product appears in DB results |
| AC-TST-13 | `buildSystemPrompt()` — domain knowledge section present: output contains origin-to-flavor and experiential-term mappings | Test run: `npm run test:ci` | `app/api/search/__tests__/build-system-prompt.test.ts` asserts `buildSystemPrompt([], "")` output contains `"Ethiopia"` and `"approachable"` |
| AC-TST-14 | `GET /api/search` — salutation query: returns `isSalutation: true`, empty `products`, `acknowledgment` from `salutation` surface | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `data.isSalutation === true`, `data.products` equals `[]`, acknowledgment matches `aiVoiceSurfaces.salutation` when `q=hey&ai=true` |

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

**Commit 1b — Cache bust in PUT `/api/admin/settings/ai-search` + seed fix**

**Seed fix (critical):** Remove `ai_voice_surfaces` from `prisma/seed/settings.ts`. The seed must only write `ai_voice_examples` — never `ai_voice_surfaces`. If the seed pre-populates surfaces with hardcoded TS defaults, the lazy init in GET never fires and every Counter install gets generic strings instead of AI-generated voice. Only `ai_voice_examples` should be seeded; surfaces are always lazy-initialized.

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

### Commit 2: Conversation history in AI extraction

**Files:** `app/(site)/_components/ai/ChatPanel.tsx`, `app/api/search/route.ts`

ChatPanel sends prior messages as a `history` query param (JSON-encoded array of `{role, content}` pairs, last 5 turns). The search route injects these into the extraction prompt:

```ts
const historyContext = history.length > 0
  ? `\n\nConversation so far:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nBuild on the conversation context — the customer's new message may reference prior queries.`
  : "";
```

### Commit 3: Reset and re-open show salutation — no greeting replay

**File:** `app/(site)/_components/ai/ChatPanel.tsx`

`handleReset` clears messages and input, then adds `voiceSurfaces.salutation` as the sole message — the short in-character connector ("Questions?" / "What are you after?") with no greeting opener.

When Counter re-opens with no conversation (`messages.length === 0` after close), same salutation is shown. `DEFAULT_VOICE_SURFACES.salutation` default updated to strip "Hey!" — the surface is now just the in-character question, no opener.

### Commit 4: Remove input placeholder

**File:** `app/(site)/_components/ai/ChatPanel.tsx`

Remove the hardcoded `placeholder="what are you after today?"` (or equivalent) from the text input. Set `placeholder=""` or omit the prop entirely.

### Commit 9: Grounded RAG — dynamic catalog snapshot

**File:** `app/api/search/route.ts` — `buildSystemPrompt()`

> ⚠️ Implementation details to be drafted during implementation — requires reading current `buildSystemPrompt` signature and `Product` schema to define snapshot shape and token budget.

The catalog snapshot is a compact DB-driven summary injected into the system prompt: product names, tasting notes vocabulary, origins, roast levels — using the store's actual strings, not hardcoded knowledge. Module-level cache, busted on product create/update/delete.

### Commit 9b: Store intelligence

**File:** `app/api/search/route.ts` — `buildSystemPrompt()`

Inject live store signals into system prompt alongside catalog snapshot: top sellers (orders last 30 days), new arrivals (createdAt DESC, last 30 days), on sale (salePrice IS NOT NULL), low stock (Variant.stockQuantity below threshold). ~60-80 tokens, read from DB on each request (or short-lived cache).

### Commit 9c: Product-type-aware search

**File:** `app/api/search/route.ts`

Add `productType` to `FiltersExtracted` (`"coffee" | "merch" | "any"`). Update `buildExtractionPrompt` to recognize non-coffee intents. When `productType === "merch"`, skip coffee-specific filters (`roastLevel`, `origin`, `flavorProfile`, `brewMethod`, etc.) and search by name/description matching only. `whereClause` starts with `{ isDisabled: false }` when merch — removes the hardcoded `type: ProductType.COFFEE`.

### Commit 9d: Result reconciliation

**File:** `app/api/search/route.ts`

Add `recommendedProductName?: string` to extraction schema. When AI names a specific product in the acknowledgment, include the name in the JSON. Post-query, find that product in the result set and promote it to position 1 — a single sort pass, no extra AI call, no extra tokens.

### Commit 10: Intent classification

**File:** `app/api/search/route.ts`

Use the existing `intent` field (`product_discovery | recommendation | how_to | reorder`) to gate routing:
- `how_to` / conversational: return pure-text acknowledgment, no product query
- `reorder` / service: return in-character redirect ("For orders and account stuff, you'd want to head to your account page — I'm really just here for the coffee")

### Commit 10b: Hide Counter on account and order routes

**File:** `app/(site)/_components/ai/ChatPanel.tsx` or site layout

When `pathname` starts with `/account`, `/orders`, or `/subscriptions`, do not render the Counter trigger button. Counter is a product discovery tool — service queries on these routes are handled by the page itself.

### Commit 11: Coffee domain knowledge in system prompt

**File:** `app/api/search/route.ts` — `buildSystemPrompt()`

Add a domain knowledge section covering: roast level ↔ flavor/body/acidity; origin ↔ flavor profile (Ethiopia = floral/blueberry, Kenya = juicy/wine-like, Sumatra = earthy/full-body); brew method ↔ roast pairing; experiential terms (approachable, beginner, gift → smooth, medium roast, top-rated); processing signatures (washed = clean/bright, natural = fruity/winey). Kept concise — knowledge supplements voice examples, not replaces them.

### Commit 12b: Counter preview panel in admin AI settings

**Files:** `app/admin/settings/ai/page.tsx`, `app/(site)/_components/ai/ChatPanel.tsx`

> ⚠️ Implementation details to be drafted during implementation — requires reading admin settings page layout and ChatPanel trigger mechanism.

A "Test Counter" button in the Smart Search settings section renders the Counter drawer in the admin context, using current voice settings. Admin can have a real conversation to verify voice before customers experience it.

### Commit 14: Tests

> ⚠️ Full test spec delegated to test-engineer — see AC-TST section.

- Conversation memory: history passed to extraction call
- Salutation on reset/re-open: `handleReset` produces salutation, not greeting
- Merch search: extraction with non-coffee intent, correct filter omission
- Intent classification routing: `how_to` → text-only, `reorder` → redirect
- Chip pre-validation: chips with zero results filtered before response

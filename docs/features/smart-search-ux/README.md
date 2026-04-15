# Smart Search Assistant

An AI-powered conversational product discovery experience embedded in the storefront. The shop owner's voice in the browser — customers ask questions naturally and get personalized product recommendations.

---

## How It Works

```
Customer types query → AI extracts intent + filters → Prisma searches products → Response in owner's voice
```

**Four layers:**

1. **Voice layer** — the shop owner teaches the AI their personality through Q&A examples. Surface strings (greetings, waiting text, error messages) are lazy-initialized: generated on first Counter open if not cached, from stored examples or defaults. Cached in DB after first generation — no AI call per subsequent page load. Cache is busted (deleted) when voice examples change; next Counter open re-initializes.

2. **Grounded RAG layer** — the system prompt is injected with a dynamic catalog snapshot built from the store's actual DB: product names, tasting notes vocabulary, origins, roast levels, store intelligence (top sellers, new arrivals, on sale, low stock). The AI operates within the store's vocabulary — it can only recommend products that exist. Conversation history (last 5 turns) is also passed so follow-up queries narrow prior context.

3. **Extraction layer** — a structured AI prompt parses natural language into typed filters (`roastLevel`, `flavorProfile`, `origin`, `priceRange`, `sortBy`, `productType`). Product-type-aware: coffee queries use flavor/roast filters, merch queries use name/description matching. Intent classification gates routing: `how_to`/conversational → text-only response; `reorder`/service → in-character redirect to account page. Result reconciliation: when the AI names a specific product in the acknowledgment, that product is promoted to position 1 in results.

4. **Cadence layer** — business rules enforce response ordering in code, not in the AI:
   - Acknowledgment always renders first
   - Products render below acknowledgment
   - Follow-up question + chips shown only when >3 products
   - Salutation-only input ("hey") gets a greeting, no product search
   - AI failure / no results → voice surface fallback, never silence
   - Counter hidden on `/account`, `/orders`, `/subscriptions` — product discovery only

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Storefront                                                      │
│                                                                 │
│  ChatPanel (Drawer)          ←→  chat-panel-store (Zustand)     │
│    • MessageBubble                • messages, isLoading          │
│    • ProductCard                  • voiceSurfaces (cached)       │
│    • FollowUp chips               • pageContext                  │
│                                                                 │
│  CategoryClientPage ──setPageContext──→ store                   │
│  ProductPage ────────pathname regex──→ getContextGreeting()     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ API                                                             │
│                                                                 │
│  GET /api/search?q=...&ai=true                                  │
│    1. Salutation detection (greeting-only → voice surface)      │
│    2. Intent classification (how_to → text-only, reorder → redirect) │
│    3. AI extraction (NL → structured filters + acknowledgment)  │
│       • System prompt: voice examples + grounded RAG catalog    │
│         snapshot + store intelligence + coffee domain knowledge │
│       • Conversation history (last 5 turns) injected            │
│       • Product-type-aware: coffee filters OR merch name/desc   │
│    4. Prisma query (filters → products)                         │
│    5. Result reconciliation (recommendedProductName → position 1) │
│    6. Chip pre-validation (zero-result chips filtered)          │
│    7. Response (products + acknowledgment + followUps)          │
│                                                                 │
│  GET /api/settings/voice-surfaces                               │
│    • Lazy init: generate + cache on first Counter open          │
│    • Returns cached DB value on subsequent opens                │
│                                                                 │
│  PUT /api/admin/settings/ai-search                              │
│    • Save voice examples → delete cached surfaces (lazy re-init) │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Data                                                            │
│                                                                 │
│  SiteSettings keys:                                             │
│    ai_voice_examples  — owner's Q&A pairs (JSON)                │
│    ai_voice_surfaces  — generated UI strings (JSON)             │
│    ai_voice_persona   — free-form persona text (deprecated)     │
│                                                                 │
│  voice-surfaces.ts      — types + defaults (client-safe)        │
│  voice-surfaces.server.ts — generation function (server-only)   │
│  voice-examples.ts      — Q&A types + defaults                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| Area | Files |
|------|-------|
| Chat UI | `app/(site)/_components/ai/ChatPanel.tsx` |
| Store | `stores/chat-panel-store.ts` |
| Search API | `app/api/search/route.ts` |
| Voice (client-safe) | `lib/ai/voice-surfaces.ts`, `lib/ai/voice-examples.ts` |
| Voice (server-only) | `lib/ai/voice-surfaces.server.ts` |
| Admin settings | `app/admin/(product-menu)/_components/AISearchSettingsSection.tsx` |
| Admin API | `app/api/admin/settings/ai-search/route.ts` |
| Page context | `app/(site)/_components/category/CategoryClientPage.tsx` (sets pageContext) |

---

## Design Decisions

**Panel, not a page.** A dedicated `/ask` route takes users away from the product they're browsing. The panel keeps them in context — the barista comes to you.

**AI gated by API key, not admin toggle.** The API key is the intent signal. A second toggle creates a confusing two-step gate.

**Voice examples over free-form persona.** Q&A pairs give the AI concrete examples of how the owner speaks. A free-form paragraph is vague and harder for the AI to emulate consistently.

**Cadence enforced in code, not AI.** The AI decides *what* to say; the code decides *when* to show it. Follow-up visibility is gated on `productCount > 3` — the AI can't override this. This prevents unpredictable UX.

**Surface strings lazy-initialized in DB.** Generated on first Counter open (not when examples are saved). ChatPanel reads cached strings — no AI call per subsequent load. Cache busted on example change; next Counter open re-initializes from new examples. Seed never pre-populates surfaces — lazy init is the sole writer.

**Client/server split for voice-surfaces.** Types and defaults in `voice-surfaces.ts` (imported by client components). Generation function in `voice-surfaces.server.ts` (imports `ai-client` → `prisma`). Prevents RSC boundary violations.

---

## Iteration History

| # | Name | Branch | ACs | Status |
|---|------|--------|-----|--------|
| 1 | [Foundation](iter-1-foundation/ACs.md) | `feat/smart-search-ux` | 43 | Shipped (v0.98.0) |
| 2 | [Agentic Phase A](iter-2-agentic-phase-a/ACs.md) | `feat/agentic-search` | 22 | Shipped (v0.100.0) |
| 3 | [ChatPanel Corrections](chatpanel-corrections/ACs.md) | `feat/agentic-search` | 22 | Shipped (v0.100.0) |
| 4 | [Voice & Conversation](iter-3-voice-and-conversation/ACs.md) | `feat/agentic-search` | — | Shipped (v0.100.0) |
| 5 | [Phase 2: Voice & Cadence Admin](phase-2-voice-admin/ACs.md) | `feat/phase2-voice-cadence` | 45 | Shipped (v0.100.3) |
| 6 | [Iter 4: Conversation Context](iter-4-conversation-context/acs.md) | `feat/conversation-context` | 39 | In progress |

---

## Known Issues & Planned Fixes

All hotfix blockers shipped in `fix/search-quality` (v0.100.1). Phase 2 pre-merge items shipped in v0.100.0–v0.100.3.

**Iter-4 (in progress — `feat/conversation-context`):**
- Conversation memory — pass last 5 turns to AI extraction
- Grounded RAG — dynamic catalog snapshot in system prompt
- Store intelligence — top sellers, new arrivals, on sale, low stock
- Merch-aware search — product-type-aware extraction + filter path
- Result reconciliation — AI-named product promoted to position 1
- Intent classification — `how_to` → text-only, `reorder` → in-character redirect
- Counter hidden on account/order routes
- Voice surface lazy init — seed fix + skeleton on load
- Admin Counter preview — "Test Counter" button in AI settings

**Iter-5 (planned):**
- Draft/publish gate for voice settings
- pgvector semantic search — deferred pending platform/extension architecture decision

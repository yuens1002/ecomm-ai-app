# Smart Search Assistant

An AI-powered conversational product discovery experience embedded in the storefront. The shop owner's voice in the browser — customers ask questions naturally and get personalized product recommendations.

---

## How It Works

```
Customer types query → AI extracts intent + filters → Prisma searches products → Response in owner's voice
```

**Three layers:**

1. **Voice layer** — the shop owner teaches the AI their personality through Q&A examples. The AI generates surface strings (greetings, waiting text, error messages) that match the owner's tone. Cached in DB, no AI call per page load.

2. **Extraction layer** — a structured AI prompt parses natural language into typed filters (`roastLevel`, `flavorProfile`, `origin`, `priceRange`, `sortBy`). The extraction also produces an acknowledgment (second person, never parroting) and optional follow-up narrowing question.

3. **Cadence layer** — business rules enforce response ordering in code, not in the AI:
   - Acknowledgment always renders first
   - Products render below acknowledgment
   - Follow-up question + chips shown only when >3 products
   - Salutation-only input ("hey") gets a greeting, no product search
   - AI failure / no results → voice surface fallback, never silence

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
│    2. AI extraction (NL → structured filters + acknowledgment)  │
│    3. Prisma query (filters → products)                         │
│    4. Response (products + acknowledgment + followUps)           │
│                                                                 │
│  PUT /api/admin/settings/ai-search                              │
│    • Save voice examples → auto-regenerate surface strings      │
│                                                                 │
│  POST /api/admin/settings/ai-search/regenerate-surfaces         │
│    • Manual surface string regeneration                         │
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

**AI gated by API key, not admin toggle.** The API key is the intent signal. A second toggle creates a confusing two-step gate. *(Note: admin enable/disable toggle planned for Phase 2 pre-merge.)*

**Voice examples over free-form persona.** Q&A pairs give the AI concrete examples of how the owner speaks. A free-form paragraph is vague and harder for the AI to emulate consistently.

**Cadence enforced in code, not AI.** The AI decides *what* to say; the code decides *when* to show it. Follow-up visibility is gated on `productCount > 3` — the AI can't override this. This prevents unpredictable UX.

**Surface strings cached in DB.** Generated once when voice examples are saved. ChatPanel reads cached strings — no AI call per page load.

**Client/server split for voice-surfaces.** Types and defaults in `voice-surfaces.ts` (imported by client components). Generation function in `voice-surfaces.server.ts` (imports `ai-client` → `prisma`). Prevents RSC boundary violations.

---

## Iteration History

| # | Name | Branch | ACs | Status |
|---|------|--------|-----|--------|
| 1 | [Foundation](iter-1-foundation/ACs.md) | `feat/smart-search-ux` | 43 | Shipped (v0.98.0) |
| 2 | [Agentic Phase A](iter-2-agentic-phase-a/ACs.md) | `feat/agentic-search` | 22 | Shipped (v0.100.0) |
| 3 | [ChatPanel Corrections](chatpanel-corrections/ACs.md) | `feat/agentic-search` | 22 | Shipped (v0.100.0) |
| 4 | [Voice & Conversation](iter-3-voice-and-conversation/ACs.md) | `feat/agentic-search` | — | Shipped (v0.100.0) |
| 5 | [Phase 2: Voice & Cadence Admin](phase-2-voice-admin/ACs.md) | `feat/phase2-voice-cadence` | 45 | In review |

---

## Known Issues & Planned Fixes

**Hotfix (blocker — on live demo):**
- Search returns irrelevant results — keyword OR clause drowns AI-extracted filters (e.g. "fruity coffee" → Italian Roast because "coffee" matches everything)
- Silent failure — no response when search returns empty; should render `noResults` voice surface
- Keyword fallback uses raw `contains` instead of PostgreSQL full-text search (no TF-IDF ranking)

**Phase 2 pre-merge:**
- Rename feature to "Smart Search Assistant" (remove "AI Chat" / "Coffee Recommender" references)
- Add admin enable/disable toggle
- Deprecate "Your Coffee Voice" persona textarea
- Update default voice examples from DB
- Admin UI polish (max-width, button labels, Q&A instructions)

**Follow-up iteration:**
- Conversation memory (pass prior turns to AI extraction)
- Context-aware greeting on navigation (greeting sticks from first page)
- Context-aware placeholder text (not always "Ask about our coffee...")
- Search support for non-coffee products (merch, gear)
- Admin UI: two-part textarea showing AI output per Q&A pair
- Side panel UX on desktop (future)

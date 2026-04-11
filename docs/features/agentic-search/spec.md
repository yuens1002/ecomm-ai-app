# Agentic Product Discovery — Feature Spec

**Status:** Planned — Phase A next  
**Roadmap:** [`docs/ROADMAP.md`](../../ROADMAP.md)  
**Internal strategy:** `docs/internal/ai-recommendations-internal-plan.md` (gitignored)

---

## What It Is

The search bar becomes the primary AI entry point. Instead of filtering by keyword, customers describe what they want in natural language. The system extracts intent, runs a structured query, and explains the results conversationally.

The floating AI-Barista chat widget is retired. Search *is* the barista.

---

## Tier Boundary

| Capability | Free | Platform |
|---|---|---|
| NL → filter extraction (brew method, roast, origin, flavor) | ✅ | ✅ |
| "Why these results" explanation | ✅ | ✅ |
| Conversational follow-up suggestions | ✅ | ✅ |
| Structured JSON response backbone | ✅ | ✅ |
| Session-scoped turn context (stateless, no persistence) | ✅ | ✅ |
| Per-user context (order history, past views, searches) | ❌ | ✅ |
| Personalized result ranking | ❌ | ✅ |
| "Recommended For You" authenticated carousel | ❌ | ✅ |
| Reviews Tier 2 utility scores in results | ❌ | ✅ |

**Free = discoverability for any visitor.** No account. No data stored beyond the session.  
**Platform = the AI knows you.** Order history, preference learning, cross-session memory.

---

## Search Response Shape (the backbone)

Both free and Platform tier populate this same contract. The Platform tier enriches `explanation` and `followUps` with user-specific context.

```typescript
interface AgenticSearchResponse {
  query: string
  intent: "product_discovery" | "recommendation" | "how_to" | "reorder"
  filtersExtracted: {
    brewMethod?: string        // "V60", "espresso", "french press"
    roastLevel?: string        // "light", "medium", "dark"
    flavorProfile?: string[]   // ["fruity", "bright", "low-acid"]
    origin?: string            // "Ethiopia", "Kenya"
    priceMax?: number
  }
  results: ProductResult[]
  explanation: string          // "These 3 work great for morning V60 brews because..."
  followUps: string[]          // ["Prefer light or medium roast?", "Want our V60 brew guide?"]
  context: {
    sessionId: string
    turnCount: number          // increments per query in the same session
  }
}
```

---

## Phase A — Free Tier

### A0: Homepage Hero Swap

Replace the AI-Barista hero section with a video (preferred) or image slides:
- Video: roasting footage, pour-over process, origin farm — autoplay muted
- Slides: seasonal offerings, featured origins, new arrivals — CMS-controlled
- Search bar becomes prominent below or overlaid on the hero
- Floating AI-Barista chat widget removed entirely

This is a standalone visual change. Ships first, independently.

### A1: Structured Search Backbone

Evolve `/api/search` to return `AgenticSearchResponse` instead of a flat product list.  
The NL extraction step (A2) populates `filtersExtracted`, `explanation`, and `followUps`.  
Falls back gracefully if LLM step fails — returns results without explanation.

### A2: NL Filter Extraction

Add a Gemini Flash preprocessing step before the Prisma query:

```
"something smooth and fruity for my morning V60"
  → { brewMethod: "V60", flavorProfile: ["smooth", "fruity"], roastLevel: "light" }
  → Prisma query with extracted filters
  → explanation: "These 3 work great for V60 morning brews..."
```

Target: under 800ms total. Flash is fast enough — no streaming needed for search.

### A3: Conversational Follow-ups

Session-scoped turn context — in-memory only, never persisted:
- `sessionId` generated client-side on first query
- `turnCount` passed back so server knows conversation depth
- `followUps` in response surface as quick-tap chips in the search UI
- Tapping a follow-up appends to or replaces the current query

---

## Phase B — Platform Tier

### B1: User Context Aggregation

Reuse and expand the existing data layer functions in `lib/data.ts`:
- `getUserPurchaseHistory(userId)` — reuse for past orders with product details; extend only if additional joins/fields are needed for ranking or explanations
- `getUserRecentViews(userId, limit)` — reuse for last N `PRODUCT_VIEW` activities; tune limits/windowing if needed for prompt quality
- `getUserSearchHistory(userId, limit)` — reuse for last N `SEARCH` activities; tune limits/windowing if needed for prompt quality
- `getUserRecommendationContext(userId?)` — reuse as the primary aggregated object for prompt injection and personalized ranking inputs

Phase B gaps to add (if not already covered):
- Normalize the aggregated payload shape for agentic search prompt injection
- Include inferred preferences/summaries derived from purchases, views, and searches
- Apply authenticated/platform-tier gating at the consumption layer

### B2: Personalized Search Ranking

When authenticated, inject user context into the agentic search prompt:
```typescript
// Added to system prompt for Platform-tier users
USER CONTEXT:
- Past purchases: Ethiopian Yirgacheffe (Light), Death Valley Espresso (Dark)
- Recently viewed: Kenyan AA, Colombian Supremo
- Inferred preferences: bright fruity lights + bold darks
```

Results are re-ranked and explanation references personal history.

### B3: "Recommended For You" Carousel

- Authenticated-only section on homepage, below hero
- Endpoint: `/api/recommendations/personalized`
- Algorithm: purchase history → match roast/origin/tasting notes → exclude already-purchased → boost by view count
- Falls back to trending (same as free tier) for anonymous visitors
- Reuses existing `ProductCard`

---

## Data Foundation (Already Shipped)

The activity tracking infrastructure is already in production:

- `UserActivity` model with `PRODUCT_VIEW`, `ADD_TO_CART`, `SEARCH`, `PAGE_VIEW`, `REMOVE_FROM_CART`
- `/api/track-activity` — fire-and-forget endpoint
- `/api/search` — logs `SEARCH` activities automatically
- Product page — tracks `PRODUCT_VIEW` + `ADD_TO_CART`
- Admin analytics (`/admin/analytics`) — `trendingProducts`, `topSearches`, behavior funnel

Phase B only needs the *consumption* layer on top of this existing data.

---

## What This Replaces

| Before | After |
|--------|-------|
| Floating AI-Barista chat widget | Removed |
| Keyword-only search | Agentic NL search |
| Static hero section | Video / image slides |
| "AI Helper" modal (anonymous, generic) | Retained for Platform tier with user context |

---

## Open Questions

- **Always-on or mode toggle?** Current lean: always-on with graceful degradation for short queries
- **Video vs. slides for hero?** TBD — video is higher impact, slides are easier to keep fresh via CMS
- **Phase A + B as one release or two?** Likely two — Phase A is the free-tier claim, Phase B is additive

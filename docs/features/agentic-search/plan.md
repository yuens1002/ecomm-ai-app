# Agentic Search — Plan

**Branch:** `feat/agentic-search`
**Base:** `main`
**Status:** Verified — 19/19 ACs passed
**ACs doc:** `docs/plans/agentic-search-phase-a-ACs.md`

---

## Context

The existing search (`/search`) was a simple Prisma keyword match against product names and
descriptions. Users had to know what they were looking for. This feature adds a conversational
search layer: natural-language queries ("something smooth for a V60 on Monday morning") are
classified by a heuristic, optionally processed by an LLM that extracts structured intent and
filters, and the results are returned with a plain-English explanation and follow-up suggestion
chips. Keyword searches are unchanged.

The homepage also retired the `ChatBarista` floating widget in favour of a proper full-width
hero section with a "Find Your Coffee" CTA linking to search.

---

## Scope — Phase A

Three commits of functional work:

| Commit | Description |
|--------|-------------|
| `0bac028` | Homepage hero + retire ChatBarista |
| `e0b8b60` | Agentic search backbone — NL extraction + structured response |
| `3cecbb0` | Conversational search UI — explanation and follow-up chips |

---

## Architecture

### NL Classification Heuristic

`isNaturalLanguageQuery(query)` in `app/api/search/route.ts`:

- Minimum 3 words
- Matches a keyword regex: `for`, `like`, `smooth`, `fruity`, `bright`, `bold`, `morning`, `recommend`, etc.
- Returns `false` for short terms like "Ethiopia" or "Kenya AA" — those go to keyword search unchanged

Heuristic gates the AI call. No LLM invoked for keyword queries.

### AI Extraction

`extractAgenticFilters(query)` calls `chatCompletion()` from `lib/ai-client` (reuses the
project-wide AI client — no new client). Returns structured JSON:

```ts
{
  intent: "product_discovery" | "recommendation" | "how_to" | "reorder";
  filtersExtracted: { brewMethod?, roastLevel?, flavorProfile?: string[], origin? };
  explanation: string;   // plain-English sentence for the UI
  followUps: string[];   // 2–3 suggested follow-up queries
}
```

Fails silently — any LLM error returns `null` and the route falls back to keyword results with
`explanation: null, followUps: []`. No 500 errors.

### Filter Application

Extracted `roastLevel` and `origin` feed the existing Prisma `whereClause` in the same
positions as explicit URL params (`?roast=`, `?origin=`). Explicit URL params always take
precedence over AI-extracted values (user intent wins).

### Session Tracking

`SearchResults.tsx` maintains two sessionStorage values:

- `artisan_session_id` — UUID, persists for the browser session
<<<<<<< HEAD
- `artisan_search_turn_count` — increments per search query, sent as `turnCount` to the API
=======
- `artisan_turn_count` — increments per search query, sent as `turnCount` to the API
>>>>>>> 0441880 (docs: add feature docs for agentic-search)

Both are included in every API call. The `turnCount` is echoed back in `context` so future
phases can adjust behaviour based on conversation depth.

### AI Guard

`isAIConfigured()` from `lib/ai-client` is checked before every LLM call. If the admin has
not configured an AI provider key, the route short-circuits to keyword search. No errors,
no UX degradation.

---

## Key Files

| File | Role |
|------|------|
| `app/api/search/route.ts` | Search API — heuristic, AI extraction, filter merge, Prisma query, activity tracking |
| `app/(site)/search/SearchResults.tsx` | Client UI — session tracking, explanation text, follow-up chips |
| `app/(site)/_components/content/Hero.tsx` | Homepage hero — image/carousel/video modes |
| `app/(site)/_components/content/HomeHero.tsx` | Hero wrapper — CTA section, storeName fallback |

---

## Decisions

**Why a heuristic gate instead of always calling the LLM?**
Cost and latency. "Ethiopia" is an O(1) database lookup. Running every keyword through an LLM
would add 500–1500 ms to every search with no benefit.

**Why reuse `chatCompletion()` instead of a new client?**
`lib/ai-client` already handles provider selection, API key guards, and error normalisation.
Introducing a second path would fragment that logic.

**Why retire ChatBarista instead of keeping both?**
ChatBarista and the new search serve the same discovery intent. Two entry points created
confusion. The hero CTA is a cleaner funnel to the agentic search experience.

# Smart Search UX — Plan

**Branch:** `feat/smart-search-ux`
**Base:** `main`
**Status:** Shipped (v0.100.0)
**ACs doc:** `docs/plans/smart-search-ux-ACs.md`
**Release:** minor (user-facing feature, new UX surface)

---

## Context

Phase A shipped the agentic search backbone: NL extraction, structured API response, explanation
text, follow-up chips, and an "Ask AI" toggle on the `/search` page. That work proved the
plumbing.

This phase makes the agentic layer a **first-class storefront experience** — not a search-page
extra, but a store-wide presence. The feature is the shop owner's voice in the browser: active
on every page, accessible from the site header on both desktop and mobile.

Key decisions:

- Smart search is **store-wide**, not homepage-specific
- The feature is **auto-enabled by API key** — no separate admin toggle
- The chat UI is a **global slide-out panel** anchored to the right on desktop, bottom on mobile
  — it does NOT navigate the user away from the page they are on
- The keyword search Dialog in the header is **removed**; navigation goes direct to pages
- The panel **persists across navigations** — messages are preserved until the user closes it
- `ChatBarista.tsx` UI shell is **reused** — wired to `/api/search` instead of `/api/chat`
- Voice persona is **mandatory** when AI is configured — the identity of the store
- Product search is **comprehensive** — all product fields are searchable/filterable
- The smart search icon is a **custom SVG** that embodies "smart + search"
- URL param changed: `ai=1` → `ai=true` (semantic clarity)
- No dedicated `/ask` route — the panel is the interface on every page

---

## Scope — 9 Tasks

| # | Task | Domain |
|---|------|--------|
| 1 | Site settings — voice persona only | Settings |
| 2 | Admin UI — voice persona with AI reframing | Admin |
| 3 | Admin API — voice persona reframe endpoint | Backend |
| 4 | Custom smart search icon component | Shared |
| 5 | Chat panel Zustand store | Frontend |
| 6 | Header — SmartSearchIcon toggles panel, remove search dialog | Frontend |
| 7 | Site layout — panel slot + animated reflow | Frontend |
| 8 | Extended product field extraction in search API | Backend |
| 9 | Voice persona injection + ChatPanel UI | Backend + Frontend |

---

## Task 1: Site Settings — Voice Persona Field

**Files:** `lib/site-settings.ts`

Add **one** new field to `SiteSettings`:

```ts
aiVoicePersona: string  // Shop owner's voice. Default "" — API prompt handles empty gracefully.
```

DB key: `ai_voice_persona` → maps in `mapSettingsRecord()`.

**No `aiSearchEnabled` toggle.** Feature is present when `isAIConfigured()` is true (API key +
model set). The shop owner controls it by whether they configure AI integration.

**No `aiSearchHomepageSpotlight`.** The panel is the universal entry point, accessible from any page.

---

## Task 2: Admin UI — Voice Persona with AI Reframing

**Files:**

- `app/admin/settings/storefront/_components/AISearchSettingsSection.tsx` ← new
- `app/admin/settings/storefront/page.tsx` ← register section (only when AI is configured)

### Component

Flat-card convention (`rounded-lg border p-6`, `space-y-6`).

**Voice Persona field**

Textarea with label: **"Your Coffee Voice"**

Hint text:
> "Write a few sentences about how you talk about coffee with your customers — your philosophy,
> what you love to highlight, how you'd answer 'what should I try?' at the counter. The AI will
> speak in your voice."

**AI Reframing flow**

Below the textarea: a **"Reframe with AI"** button. When clicked:

1. Calls `POST /api/admin/reframe-voice-persona` with the current textarea value
2. Shows a loading state on the button
3. On success: displays AI-reframed version in a preview panel beneath the textarea
4. Preview panel has two actions: **"Use this"** (replaces textarea content) and **"Try again"**
   (re-calls the endpoint with the original input)
5. Standard save button writes whatever is in the textarea to settings

**Visibility:** Section only renders when `isAIConfigured()` is true (checked server-side).

---

## Task 3: Admin API — Voice Persona Reframe Endpoint

**Files:** `app/api/admin/reframe-voice-persona/route.ts` ← new

`POST` handler:

- Auth-gated: session must have admin role
- Body: `{ rawPersona: string }`
- Calls `chatCompletion()` with a rewriting prompt
- Returns: `{ reframedPersona: string }`
- Validates input with Zod (`rawPersona` must be non-empty string)

---

## Task 4: Custom Smart Search Icon

**Files:** `components/shared/icons/SmartSearchIcon.tsx` ← new

A custom SVG icon: a magnifying glass with a subtle intelligence motif — a wand or lens flare
inside the glass. Not Sparkles, not Brain, not Cpu. Should feel like "this search understands
you" — purposeful, not sci-fi.

```ts
interface SmartSearchIconProps {
  className?: string;
  size?: number;
}
```

Used in: site header (desktop + mobile), and inside the chat panel header.

---

## Task 5: Chat Panel Zustand Store

**Files:** `stores/chat-panel-store.ts` ← new

```ts
interface PageContext {
  icon: string;   // emoji or short string, e.g. "☕"
  title: string;  // page title, e.g. "Ethiopian Yirgacheffe"
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductSummary[];
  followUps?: string[];
}

interface ChatPanelStore {
  isOpen: boolean;
  messages: ChatMessage[];
  pageContext: PageContext | null;
  isLoading: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setPageContext: (ctx: PageContext) => void;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}
```

Uses `zustand/vanilla` (same pattern as existing cart store). The store is not persisted to
localStorage — messages are in-memory for the session. Closing the browser tab clears history.

---

## Task 6: Header — SmartSearchIcon Replaces Search, Remove Search Dialog

**Files:**

- `app/(site)/_components/layout/SiteHeaderWrapper.tsx` ← pass `aiConfigured`
- `app/(site)/_components/layout/SiteHeader.tsx` ← toggle + remove Dialog + remove keyword Search button

### SiteHeaderWrapper

Add `aiConfigured: boolean` to the data passed to `<SiteHeader>`. Source: `isAIConfigured()`.

### SiteHeader

**Remove the Search Dialog entirely.** Dialog, DialogTrigger, DialogContent, and form removed.

**One search icon — never two side by side.** The header always shows exactly one search icon:

- **AI configured** → SmartSearchIcon, toggles the panel on click
- **AI not configured** → traditional `<Search>` lucide icon, links to `/search`

```tsx
{aiConfigured ? (
  <Button
    variant="ghost"
    size="icon"
    className="hidden md:flex"
    onClick={() => toggle()}
  >
    <SmartSearchIcon className="h-5 w-5" />
    <span className="sr-only">Search — ask about our coffee</span>
  </Button>
) : (
  <Button variant="ghost" size="icon" asChild className="hidden md:flex">
    <Link href="/search">
      <Search className="h-5 w-5" />
      <span className="sr-only">Search products</span>
    </Link>
  </Button>
)}
```

**Mobile sheet:** Same one-or-the-other logic — SmartSearchIcon quick-action (calls `toggle()`)
when AI configured; keyword Search quick-action (links to `/search`) when not.

**The panel always passes `ai=true`** to the search API. The NL heuristic + `forceAI` still
governs when the LLM is actually called, so simple queries ("ethiopia") are handled cheaply
without an AI round-trip.

Remove all Dialog-related imports. Keep or remove `<Search>` lucide import based on whether
the conditional renders it.

Remove all Dialog-related imports no longer needed.

---

## Task 7: Site Layout — Panel Slot + Animated Reflow

**Files:**

- `app/(site)/layout.tsx` ← replace stacked layout with 2-column flex
- `app/(site)/_components/ai/ChatPanel.tsx` ← new (full panel UI)

### Wireframe

```
┌──────────────────────────────────────┬───────────────┐
│  Header (75% column)                 │               │
├──────────────────────────────────────┤  Chat Panel   │
│                                      │  (25% column) │
│  Page content                        │               │
│  (product grid, PDP, etc.)           │  sticky —     │
│                                      │  full height  │
├──────────────────────────────────────┤               │
│  Footer (75% column)                 │               │
└──────────────────────────────────────┴───────────────┘
```

The chat panel is a **full-height sticky column** — it sits alongside both the header and the
content. The header is inside the 75% left column, not spanning the full page width. This
creates a unified two-pane layout, not a tacked-on sidebar.

### Layout structure

```tsx
// app/(site)/layout.tsx (server component)
export default async function SiteLayout({ children }) {
  const aiConfigured = await isAIConfigured();
  return (
    <div className="flex min-h-screen">
      {/* Left column: header + content + footer, scrolls normally */}
      <div className="flex-1 min-w-0 flex flex-col">
        <SiteHeaderWrapper />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      {/* Right column: full-height sticky panel — desktop only */}
      {aiConfigured && (
        <ChatPanel />
      )}
    </div>
  );
}
```

### Desktop panel animation

The `ChatPanel` outer wrapper is sticky and transitions its width:

```tsx
// Desktop: full-height sticky panel
<aside className={cn(
  "hidden md:flex flex-col",
  "sticky top-0 h-screen flex-shrink-0",
  "overflow-hidden border-l bg-background",
  "transition-[width] duration-300 ease-in-out",
  isOpen ? "w-[25vw] min-w-[280px]" : "w-0"
)}>
  {/* Panel content — always rendered, clipped when w-0 */}
  <div className="w-[25vw] min-w-[280px] h-full flex flex-col">
    {/* ... */}
  </div>
</aside>
```

`flex-1 min-w-0` on the left column means it fills all space the panel doesn't claim.
As the panel transitions from `w-0` to `w-[25vw]`, the left column shrinks proportionally.
No changes needed on individual page components — they just get a narrower flex parent.

`sticky top-0 h-screen` keeps the panel pinned to the viewport while the left column
(header, content, footer) scrolls underneath it.

### Mobile panel animation

At `< md`, the panel becomes a bottom sheet:

```tsx
{/* Mobile: bottom sheet — fixed, slides up */}
<div className={cn(
  "fixed bottom-0 inset-x-0 z-50 md:hidden",
  "h-[25dvh] border-t bg-background",
  "transition-transform duration-300 ease-in-out",
  isOpen ? "translate-y-0" : "translate-y-full"
)}>
  {/* Panel content */}
</div>

{/* Spacer prevents content from hiding behind fixed panel */}
{isOpen && <div className="h-[25dvh] md:hidden" />}
```

### ChatPanel internal layout

```
┌─────────────────────────────┐
│ ✦ Ask AI                [×] │  ← panel header (SmartSearchIcon + title + close)
├─────────────────────────────┤
│                             │
│  Messages (flex-1, scroll)  │
│                             │
├─────────────────────────────┤
│  [input field      ] [→]    │  ← sticky input
├─────────────────────────────┤
│  ☕ Ethiopian Yirgacheffe   │  ← context strip (text-[10px] text-muted-foreground)
└─────────────────────────────┘
```

**Context strip:** reads `pageContext` from the store. One line, always visible at panel bottom.
Format: `{icon} {title}`. Falls back to prettified pathname when `pageContext` is null.

**Page context injection:** PDPs and category pages set context via a lightweight hook:

```ts
// hooks/usePanelPageContext.ts
export function usePanelPageContext(ctx: PageContext) {
  const setPageContext = useChatPanelStore(s => s.setPageContext);
  useEffect(() => { setPageContext(ctx); }, [ctx.title]);
}
```

PDPs: `usePanelPageContext({ icon: "☕", title: product.name })`
Category pages: `usePanelPageContext({ icon: "🏷️", title: category.name })`

---

## Task 8: Extended Product Field Extraction

**Files:** `app/api/search/route.ts`

### Extended `FiltersExtracted` type

```ts
interface FiltersExtracted {
  // Phase A (unchanged)
  brewMethod?: string;
  roastLevel?: "light" | "medium" | "dark";
  flavorProfile?: string[];
  origin?: string;
  // New
  isOrganic?: boolean;
  processing?: string;   // "washed" | "natural" | "honey" | "anaerobic" etc.
  variety?: string;      // "heirloom" | "geisha" | "bourbon" etc.
  priceMaxCents?: number; // "under $30" → 3000
  priceMinCents?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "top_rated";
}
```

### Prisma whereClause additions

```ts
if (isOrganic) whereClause.isOrganic = true;
if (processing) whereClause.processing = { contains: processing, mode: "insensitive" };
if (variety) whereClause.variety = { contains: variety, mode: "insensitive" };
if (priceMaxCents || priceMinCents) {
  whereClause.variants = {
    some: {
      purchaseOptions: {
        some: {
          priceInCents: {
            ...(priceMaxCents ? { lte: priceMaxCents } : {}),
            ...(priceMinCents ? { gte: priceMinCents } : {}),
          },
        },
      },
    },
  };
}
```

### `orderBy` clause

```ts
const orderBy =
  sortBy === "newest" ? { createdAt: "desc" as const }
  : sortBy === "price_asc" ? { variants: { _min: { priceInCents: "asc" } } }
  : sortBy === "price_desc" ? { variants: { _min: { priceInCents: "desc" } } }
  : sortBy === "top_rated" ? { averageRating: "desc" as const }
  : undefined;
```

### Text search OR clause — extend to cover more fields

```ts
{ processing: { contains: token, mode: "insensitive" } },
{ variety: { contains: token, mode: "insensitive" } },
{ altitude: { contains: token, mode: "insensitive" } },
```

### `ai=true` param

```ts
const forceAI = searchParams.get("ai") === "true";
```

Update all existing `ai=1` references in `SearchResults.tsx`.

---

## Task 9: Voice Persona Injection + ChatPanel UI

**Files:** `app/api/search/route.ts`, `app/(site)/_components/ai/ChatPanel.tsx`

### Voice persona injection (search route)

```ts
const { aiVoicePersona } = await getPublicSiteSettings();

const personaSection = aiVoicePersona.trim()
  ? `You are the voice of this coffee shop. Embody the shop owner's character exactly:\n"${aiVoicePersona}"\n\n`
  : `You are a knowledgeable coffee shop assistant. Speak with genuine expertise and warmth.\n\n`;

const SYSTEM_PROMPT = `${personaSection}Extract coffee search intent from user queries and return valid JSON only — no markdown, no explanation outside the JSON.`;
```

### ChatPanel UI (adapted from ChatBarista)

**Reuse from ChatBarista:**

- Message state (delegated to Zustand store)
- Visual viewport handling for mobile keyboard
- Scroll-to-bottom behavior
- Input ref and keyboard handling
- Error / retry pattern
- Animated gradient or subtle background

**Adapt:**

- Remove `isActive` / expand-collapse behavior — panel open/close is controlled by the store
- API: `GET /api/search?q=...&ai=true&sessionId=...&turnCount=...`
- Response: map `explanation` + `products[]` + `followUps[]` into message thread

**Message rendering:**

- User message: right-aligned pill bubble (`bg-primary text-primary-foreground`)
- Assistant response card: SmartSearchIcon + explanation + follow-up chips + product cards
- Product cards: compact variant (title + price + image + link to PDP)
- Empty/no-results: "I couldn't find a match — try rephrasing"

**Follow-up chips:** clicking a chip calls `sendMessage(chipText)` — adds user bubble,
fires new search, shows new assistant card.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/site-settings.ts` | Add `aiVoicePersona` field |
| `app/admin/settings/storefront/_components/AISearchSettingsSection.tsx` | New |
| `app/admin/settings/storefront/page.tsx` | Register AI search section |
| `app/api/admin/reframe-voice-persona/route.ts` | New POST endpoint |
| `components/shared/icons/SmartSearchIcon.tsx` | New custom icon |
| `stores/chat-panel-store.ts` | New Zustand store |
| `hooks/usePanelPageContext.ts` | New lightweight context hook |
| `app/(site)/layout.tsx` | Add panel slot + flex layout |
| `app/(site)/_components/ai/ChatPanel.tsx` | New global panel UI |
| `app/(site)/_components/layout/SiteHeaderWrapper.tsx` | Pass `aiConfigured` |
| `app/(site)/_components/layout/SiteHeader.tsx` | Remove Dialog, SmartSearchIcon toggles store |
| `app/api/search/route.ts` | Voice persona, extended filters, `ai=true` param |
| `app/(site)/search/SearchResults.tsx` | Update `ai=1` → `ai=true` references |

**Removed (not created):**

- `app/(site)/ask/page.tsx` — no dedicated `/ask` route; panel is the interface
- `app/(site)/ask/AskPage.tsx` — same

---

## Decisions

**Why a panel instead of `/ask` route?**
A dedicated page takes users away from the product they were just looking at. The panel keeps
them in context — they can see both the page content and the AI response simultaneously. This
is the counter experience: the barista comes to you, not the other way around.

**Why no content reflow on individual pages?**
Main area is `flex-1 min-w-0`. The panel takes `w-[25%]` at the flex level. Individual pages
use their normal max-widths and containers — they just have a narrower flex parent. No per-page
changes needed.

**Why `w-0` → `w-[25%]` instead of CSS grid column transition?**
Flex width transition has better cross-browser support for 2026 than `grid-template-columns`
transition. Both produce the same visual result.

**Why 25dvh on mobile?**
Enough to show the input field + one message + context strip without obscuring the product the
user is looking at. Users can scroll within the panel for full conversation history.

**Why no URL state for panel open/closed?**
The panel is a conversational tool, not a shareable URL. Persisting it to the URL would pollute
every page's URL. In-memory Zustand state is sufficient — it survives route changes within the
session.

**Why no localStorage persistence for messages?**
Keeps complexity low. Coffee search conversations are short-lived. If a user wants to reference
a recommendation later, they can re-ask. Adding stale messages from a previous day adds noise.

**Why one search icon instead of two side by side?**
Two search icons imply they serve different purposes — they don't. Smart search handles
everything keyword search does and more. The panel works for "ethiopia" just as well as for
"something fruity and bright for my V60." One icon, one entry point: SmartSearchIcon when AI
is configured, traditional Search when it isn't. The storefront always has search; it just
upgrades when the shop owner configures AI.

**Why no separate admin enable toggle?**
The API key is the intent signal. A second toggle creates a confusing two-step gate with no UX
benefit.

---

## Commit Schedule

```
1. docs: add plan for smart-search-ux                               (--no-verify)
2. feat: site settings and admin UI for voice persona config
3. feat: admin API endpoint for AI voice persona reframing
4. feat: custom smart search icon component
5. feat: chat panel Zustand store
6. feat: smart search header entry point, remove search dialog
7. feat: site layout panel slot with animated reflow
8. feat: extend search API with full product field extraction
9. feat: inject voice persona and ship global chat panel UI
10. chore: update verification status
```

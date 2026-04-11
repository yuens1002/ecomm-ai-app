# Smart Search UX — ChatPanel Corrections

**Branch:** `feat/agentic-search`
**Base:** `feat/smart-search-ux` (merged state on this branch)
**Status:** Planned
**ACs doc:** `docs/features/smart-search-ux/chatpanel-corrections/ACs.md`
**Release:** patch

---

## Context

After resetting `feat/agentic-search` to the `feat/smart-search-ux` foundation, manual testing
revealed several UX regressions and design gaps in the ChatPanel:

1. **Wrong icon** — the header toggle shows a custom `SmartSearchIcon` (magnifying glass variant).
   The spec calls for `MessageSquareDot` (lucide-react) to communicate "chat" not "search".

2. **Sidebar layout (not an overlay)** — the current `ChatPanel` renders as an `<aside>` flex
   sibling in the site layout. When open, it pushes the main content left (`w-[25vw]`). It should
   be a right-side overlay drawer that leaves page content untouched.

3. **Follow-up UX fragmented** — the API returns a follow-up question string and it renders as a
   full-text pill chip ("What kind of roast do you usually enjoy?"). The intended UX is:
   - The question is woven into the explanation text by the AI
   - `followUps` returns short option labels ("Light & bright", "Medium & smooth", "Dark & bold")
   - Chips are compact descriptive labels the customer clicks as their reply

4. **"No matching products" shown alongside follow-up** — when the AI returns a conversational
   response with follow-ups but no products, the fallback string "No matching products found —
   try rephrasing" appears. This breaks the conversational flow. The AI already handles the
   empty-result case in its explanation; the fallback is redundant noise.

5. **Context strip too faint** — the page icon + label at the bottom of the panel uses
   `text-muted-foreground/50`. Should be `text-muted-foreground` to be readable.

6. **No product expand/collapse** — all matched products are shown at once. UX should show 3
   by default with a "Show more / Show less" toggle for the full list.

---

## Decisions

- **shadcn Drawer (vaul)** for C2: vaul's `Drawer` with `direction="right"` on desktop, default
  bottom on mobile. This replaces the split `<aside>` + mobile `<div>` with a single component
  and gives drag-to-close on mobile for free.
- **followUps as option labels**: Change the extraction prompt so the AI embeds the clarifying
  question in `explanation` and returns 2–3 short option labels in `followUps`. When clicked, the
  label becomes the user's next message (e.g. "Light & bright" triggers a new search).
- **Suppress no-results fallback** when `followUps.length > 0` — the AI conversational response
  is the UX recovery, not a generic error string.
- **MessageSquareDot everywhere**: All smart search instances use `MessageSquareDot` from
  lucide-react — header toggle (desktop + mobile), in-panel message avatar, drawer title.
  `SmartSearchIcon` (custom magnifying glass) is retired from all smart search UI.
- **Drawer title**: The panel header reads `MessageSquareDot` icon + "Smart product search".

---

## Scope

### C1 — Icon: MessageSquareDot everywhere

**Files:**

- `app/(site)/_components/layout/SiteHeader.tsx`
- `app/(site)/_components/ai/ChatPanel.tsx`

**What to change:** Replace ALL uses of `SmartSearchIcon` in smart search UI with
`MessageSquareDot` from lucide-react:

- Desktop header toggle button
- Mobile menu search item
- In-panel message avatar (beside AI responses)
- Drawer title (see C2)

The `SmartSearchIcon` import is removed from all three files. The icon in the admin voice
preview (`AISearchSettingsSection.tsx`) can keep SmartSearchIcon — that is a settings UI, not
a customer-facing smart search instance.

---

### C2 — ChatPanel as shadcn Drawer overlay

**Files:**

- `components/ui/drawer.tsx` (new — vaul-based shadcn Drawer)
- `app/(site)/_components/ai/ChatPanel.tsx` (restructure)
- `app/(site)/layout.tsx` (remove flex sibling, mount as standalone)

**What to change:**

Install vaul: `npm install vaul`

Create `components/ui/drawer.tsx` following the shadcn Drawer template. Export:
`Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent,
DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription`

**Drawer title:** `DrawerHeader` contains `DrawerTitle` with a `MessageSquareDot` icon and the
text "Smart product search".

Restructure `ChatPanel.tsx`:

- Remove the `<aside>` (desktop sidebar) and the `fixed bottom-0` mobile div
- Wrap in `<Drawer open={isOpen} onOpenChange={...} direction="right">` for desktop
- Mobile remains bottom-sheet behavior (vaul default with `direction` omitted or overridden
  via responsive wrapper)
- `DrawerContent` contains `PanelContent` unchanged
- No width-transition animation needed — vaul handles slide-in/out

Update `layout.tsx`:

- Remove `{aiConfigured && <ChatPanel />}` from inside the flex row
- Place it AFTER the flex row (still inside `SiteBannerProvider`) so it renders as a portal
  outside the layout flow

---

### C4 — Follow-up UX: option labels + suppress no-results fallback

**Files:**

- `app/api/search/route.ts` (extraction prompt)
- `app/(site)/_components/ai/ChatPanel.tsx` (MessageBubble)

**Extraction prompt change** (`buildExtractionPrompt`):

Current `followUps` instruction:

```
"followUps": ["single most useful follow-up question (5–7 words) — or empty array if query already has enough detail"]
```

New instruction:

```
"followUps": ["2-4 word option label the customer might choose — e.g. 'Light & bright', 'Medium & smooth', 'Dark & bold'. Return 2–3 options when intent is open-ended; empty array if intent is specific enough. Never use question marks — these are clickable answer choices, not questions."]
```

Also update `explanation` instruction to embed the clarifying question:

```
"explanation": "1–2 sentences spoken directly to the customer in first person. If intent is open-ended, end with a natural question to narrow it down — the options (followUps) are the choices the customer picks from. E.g. 'Sounds like you want something approachable — what kind of roast are you usually after?'"
```

**ChatPanel MessageBubble change:**

- Suppress `No matching products found` when `msg.followUps?.length > 0`
- The chip button styling stays the same; the text inside will now be short labels

---

### C5 — Context strip color

**Files:**

- `app/(site)/_components/ai/ChatPanel.tsx`

`text-muted-foreground/50` → `text-muted-foreground` on the context row.

---

### C6 — Products: show 3, more/less toggle

**Files:**

- `app/(site)/_components/ai/ChatPanel.tsx`

Add `showAll` local state (default `false`) to `MessageBubble`.

- When `showAll` is false: render `msg.products.slice(0, 3)`
- When `showAll` is true: render all products
- Show "Show N more" / "Show less" button only when `products.length > 3`

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for chatpanel-corrections` | — |
| 1 | `chore: add shadcn Drawer component (vaul)` | Low |
| 2 | `feat: chatpanel — overlay drawer, MessageSquareDot, follow-up labels, more/less, context color` | Medium |
| 3 | `fix: extraction followUps as short option labels, embed question in explanation` | Low |
| 4 | `chore: update verification status` | — |

---

## Out of Scope

- Iter-3: voice examples (`DEFAULT_VOICE_EXAMPLES`, `lib/ai/voice-examples.ts`) — separate iteration
- Phase 2: admin editing of voice examples — separate iteration
- Conversation reset button (`startNewConversation`) — separate iteration
- Animation polish (vaul default transitions accepted as-is)

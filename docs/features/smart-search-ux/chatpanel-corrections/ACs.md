# ChatPanel Corrections — Acceptance Criteria

**Branch:** `feat/agentic-search`
**Plan:** `docs/features/smart-search-ux/chatpanel-corrections/plan.md`

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Desktop header: toggle button shows MessageSquareDot icon | Screenshot: homepage desktop, icon area in header | `MessageSquareDot` icon visible; no custom SmartSearchIcon on the toggle | | | |
| AC-UI-2 | Mobile menu: search item shows MessageSquareDot icon | Screenshot: homepage mobile, hamburger menu open | `MessageSquareDot` icon visible in mobile nav search item | | | |
| AC-UI-2b | Drawer title shows MessageSquareDot + "Smart product search" | Screenshot: panel open, drawer header | Title row visible with MessageSquareDot icon and "Smart product search" text | | | |
| AC-UI-2c | In-panel AI message avatar uses MessageSquareDot | Screenshot: panel open after sending a query | MessageSquareDot icon appears beside each AI response; no magnifying-glass icon | | | |
| AC-UI-3 | Page content stays full-width when panel is open | Screenshot: homepage desktop with panel open | Left content area occupies full viewport width; no layout shift | | | |
| AC-UI-4 | Panel opens as overlay drawer (right side, desktop) | Interactive: click header toggle → panel opens | Panel slides in from right over page content; background content still visible behind panel | | | |
| AC-UI-5 | Explanation text shows directly above products (no toggle) | Interactive: submit a query that returns products | Explanation sentence visible above product cards without clicking anything | | | |
| AC-UI-6 | Follow-up chips are short labels (not question strings) | Interactive: submit open-ended query ("anything good?") | Chips show 2–3 short labels (e.g. "Light & bright") not a full question sentence | | | |
| AC-UI-7 | No "No matching products found" when follow-ups exist | Interactive: submit query with no products but follow-ups returned | Fallback error string absent; explanation + chips render | | | |
| AC-UI-8 | Context strip readable (muted-foreground, not faded) | Screenshot: panel open on a product page | Page icon + label text legible at normal muted-foreground opacity | | | |
| AC-UI-9 | 3 products shown by default | Interactive: submit query that returns >3 products | Only 3 product cards visible initially | | | |
| AC-UI-10 | "Show more" button visible when >3 products; expands on click | Interactive: click "Show more" after query returns >3 | Additional products appear; button text changes to "Show less" | | | |
| AC-UI-11 | "Show less" collapses back to 3 | Interactive: click "Show less" | List returns to 3 products | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | Extraction prompt: followUps returns short option labels | Code review: `app/api/search/route.ts` → `buildExtractionPrompt` | followUps instruction specifies 2–4 word labels, no question marks; explanation instruction tells AI to embed the question | | | |
| AC-FN-2 | Explanation instruction embeds clarifying question | Code review: same function | explanation instruction says "end with a natural question if intent is open-ended" | | | |
| AC-FN-3 | ChatPanel uses Drawer (vaul) not aside sidebar | Code review: `app/(site)/_components/ai/ChatPanel.tsx` | `<Drawer>` from vaul wraps panel; no `<aside>` with flex/sticky classes | | | |
| AC-FN-4 | layout.tsx mounts ChatPanel outside flex row | Code review: `app/(site)/layout.tsx` | `<ChatPanel />` is NOT a child of the `flex h-screen` div; renders after it | | | |
| AC-FN-5 | Drawer open/close wired to Zustand store | Code review: `ChatPanel.tsx` | `open={isOpen}` and `onOpenChange` call `close()` / `open()` from `useChatPanelStore` | | | |
| AC-FN-6 | No-results fallback gated on followUps | Code review: `ChatPanel.tsx` → `MessageBubble` | fallback string renders only when `!hasProducts && !hasFollowUps && !isGreeting && hasContent` | | | |

---

## Test Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | `buildExtractionPrompt` followUps instruction specifies option labels | Code review: `app/api/search/route.ts` → `buildExtractionPrompt` | followUps instruction says "2-4 word option label" and explicitly says no question marks | | | |
| AC-TST-2 | BUG-5 test updated to match new followUps format | Test run: `npm run test:ci` | AC-TST-8 test in `route.test.ts` passes with updated assertion (no longer checks for "AT MOST ONE") | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1182+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Site header renders without errors | Screenshot: homepage desktop | Header visible with logo, nav, MessageSquareDot button | | | |
| AC-REG-4 | Panel closes correctly (X button + overlay click) | Interactive: open panel → click X; open panel → click outside | Panel closes in both cases | | | |

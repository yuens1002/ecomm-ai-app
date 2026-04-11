# ChatPanel Corrections — Acceptance Criteria

**Branch:** `feat/agentic-search`
**Plan:** `docs/features/smart-search-ux/chatpanel-corrections/plan.md`

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Desktop header: toggle button shows MessageSquareDot icon | Screenshot: homepage desktop, icon area in header | `MessageSquareDot` icon visible; no custom SmartSearchIcon on the toggle | PASS — `01b-header-close.png`: chat-bubble-dot icon visible in header icon row before Sign In/cart | PASS — confirmed via screenshot | |
| AC-UI-2 | Mobile menu: search item shows MessageSquareDot icon | Screenshot: homepage mobile, hamburger menu open | `MessageSquareDot` icon visible in mobile nav search item | PASS — `02-mobile-menu-open.png`: MessageSquareDot (chat bubble with dot) shown under "SEARCH" label in mobile quick-nav row; code `SiteHeader.tsx:287` confirms `<MessageSquareDot>` when `aiConfigured` | PASS — confirmed via screenshot + SiteHeader.tsx:287 | |
| AC-UI-2b | Drawer title shows MessageSquareDot + "Smart product search" | Screenshot: panel open, drawer header | Title row visible with MessageSquareDot icon and "Smart product search" text | PASS — `03b-panel-drawer.png` + `12-ai-avatar-response.png`: header row shows MessageSquareDot icon (primary color) + "Smart product search" text | PASS — confirmed via screenshot | |
| AC-UI-2c | In-panel AI message avatar uses MessageSquareDot | Screenshot: panel open after sending a query | MessageSquareDot icon appears beside each AI response; no magnifying-glass icon | PASS — `12-ai-avatar-response.png`: MessageSquareDot icon visible beside greeting and AI response text; code `ChatPanel.tsx:296` confirms `<MessageSquareDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/50" />` | PASS — confirmed via screenshot | |
| AC-UI-3 | Page content stays full-width when panel is open | Screenshot: homepage desktop with panel open | Left content area occupies full viewport width; no layout shift | PASS — `03-panel-open-desktop.png` + `05-product-page-panel-open.png`: page content occupies full left area; panel overlays from right without shifting content | PASS — confirmed via screenshot | |
| AC-UI-4 | Panel opens as overlay drawer (right side, desktop) | Interactive: click header toggle → panel opens | Panel slides in from right over page content; background content still visible behind panel | PASS — `03-panel-open-desktop.png`: background page content visible behind right-side drawer; vaul Drawer with `direction="right"` confirmed in code | PASS — confirmed via screenshot | |
| AC-UI-5 | Explanation text shows directly above products (no toggle) | Interactive: submit a query that returns products | Explanation sentence visible above product cards without clicking anything | PASS — `07-query-light-roast-response.png`: explanation "Absolutely! You're looking for a light roast…" visible above product cards with no toggle required | PASS — confirmed via screenshot | |
| AC-UI-6 | Follow-up chips are short labels (not question strings) | Interactive: submit open-ended query ("anything good?") | Chips show 2–3 short labels (e.g. "Light & bright") not a full question sentence | PASS — `11-anything-good-response.png`: chips are "Light & fruity", "Medium & balanced", "Dark & bold" — all 2–3 word option labels; no question marks | PASS — confirmed via screenshot | |
| AC-UI-7 | No "No matching products found" when follow-ups exist | Interactive: submit query with no products but follow-ups returned | Fallback error string absent; explanation + chips render | PASS — "anything good?" response: Puppeteer confirmed `hasNoResults = false`; panel shows explanation + 3 chips; code `ChatPanel.tsx:322` gates fallback on `!hasFollowUps` | PASS — confirmed via code review | |
| AC-UI-8 | Context strip readable (muted-foreground, not faded) | Screenshot: panel open on a product page | Page icon + label text legible at normal muted-foreground opacity | PASS — `05-product-page-panel-open.png`: "Airscape Coffee Canister" label visible at bottom of panel; code confirms `text-muted-foreground` (not `/50` opacity) | PASS — confirmed via screenshot | |
| AC-UI-9 | 3 products shown by default | Interactive: submit query that returns >3 products | Only 3 product cards visible initially | PASS — `07-query-light-roast-response.png` + `12-ai-avatar-response.png`: exactly 3 product cards rendered; code confirms `msg.products!.slice(0, 3)` as default | PASS — confirmed via screenshot | |
| AC-UI-10 | "Show more" button visible when >3 products; expands on click | Interactive: click "Show more" after query returns >3 | Additional products appear; button text changes to "Show less" | PASS (code) / N/A (live) — button logic correct in `MessageBubble` (`extraCount > 0` shows `Show ${extraCount} more`); however API enforces `take: 3` when `ai=true`, so button cannot be triggered via normal chat UI. Code path is correct. | QC FIX — `take: forceAI ? 3 : 50` removed; now `take: 50` for all queries. AI filters naturally bound results; UI slice still shows 3 by default. "Show more" now exercisable in live UI. | |
| AC-UI-11 | "Show less" collapses back to 3 | Interactive: click "Show less" | List returns to 3 products | PASS (code) / N/A (live) — `setShowAll(false)` correctly returns to slice(0,3); same constraint as AC-UI-10 | QC FIX — same as AC-UI-10; now exercisable after take cap removed. | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | Extraction prompt: followUps returns short option labels | Code review: `app/api/search/route.ts` → `buildExtractionPrompt` | followUps instruction specifies 2–4 word labels, no question marks; explanation instruction tells AI to embed the question | PASS — `route.ts:103`: `"2-4 word option label the customer might choose... Never use question marks"` confirmed | PASS — confirmed via code review | |
| AC-FN-2 | Explanation instruction embeds clarifying question | Code review: same function | explanation instruction says "end with a natural question if intent is open-ended" | PASS — `route.ts:102`: `"end with a natural question to narrow it down"` present in explanation field instruction | PASS — confirmed via code review | |
| AC-FN-3 | ChatPanel uses Drawer (vaul) not aside sidebar | Code review: `app/(site)/_components/ai/ChatPanel.tsx` | `<Drawer>` from vaul wraps panel; no `<aside>` with flex/sticky classes | PASS — `ChatPanel.tsx:388`: `<Drawer open={isOpen} onOpenChange={...} direction="right">` with `DrawerContent` from vaul; no `aside` element present | PASS — confirmed via code review | |
| AC-FN-4 | layout.tsx mounts ChatPanel outside flex row | Code review: `app/(site)/layout.tsx` | `<ChatPanel />` is NOT a child of the `flex h-screen` div; renders after it | PASS — `layout.tsx:81-84`: `</div>` closes flex h-screen div at line 81, then `{aiConfigured && <ChatPanel />}` at line 84 is outside and after it | PASS — confirmed via code review | |
| AC-FN-5 | Drawer open/close wired to Zustand store | Code review: `ChatPanel.tsx` | `open={isOpen}` and `onOpenChange` call `close()` / `open()` from `useChatPanelStore` | PASS — `ChatPanel.tsx:389-393`: `open={isOpen}` and `onOpenChange={(o) => { if (o) open(); else close(); }}` confirmed | PASS — confirmed via code review | |
| AC-FN-6 | No-results fallback gated on followUps | Code review: `ChatPanel.tsx` → `MessageBubble` | fallback string renders only when `!hasProducts && !hasFollowUps && !isGreeting && hasContent` | PASS — `ChatPanel.tsx:322`: `{!hasProducts && !msg.isLoading && !isGreeting && hasContent && !hasFollowUps && ...}` matches spec exactly | PASS — confirmed via code review | |

---

## Test Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | `buildExtractionPrompt` followUps instruction specifies option labels | Code review: `app/api/search/route.ts` → `buildExtractionPrompt` | followUps instruction says "2-4 word option label" and explicitly says no question marks | PASS — `route.ts:103`: exact string `"2-4 word option label"` and `"Never use question marks"` present in prompt | PASS — confirmed via code review | |
| AC-TST-2 | BUG-5 test updated to match new followUps format | Test run: `npm run test:ci` | AC-TST-8 test in `route.test.ts` passes with updated assertion (no longer checks for "AT MOST ONE") | PASS — `route.test.ts:714-726` ("user prompt followUps instruction specifies 2-4 word option labels"): asserts `"2-4 word option label"` + `"Never use question marks"`; no "AT MOST ONE" assertion; test passes (37/37 in suite) | PASS — confirmed via test run | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1182+ tests pass, 0 failures | PASS — 100 test suites, 1182 tests, 0 failures | PASS — confirmed via test run | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | PASS — 0 TypeScript errors; 1 pre-existing ESLint warning in `SalesClient.tsx` (TanStack Table memoization, unrelated to this feature) | PASS — 0 errors; pre-existing warning is not this feature's concern | |
| AC-REG-3 | Site header renders without errors | Screenshot: homepage desktop | Header visible with logo, nav, MessageSquareDot button | PASS — `01-desktop-header.png` + `01b-header-close.png`: logo, nav items, MessageSquareDot toggle, Sign In, cart all visible | PASS — confirmed via screenshot | |
| AC-REG-4 | Panel closes correctly (X button + overlay click) | Interactive: open panel → click X; open panel → click outside | Panel closes in both cases | PASS — `06-panel-closed-x.png`: panel closed after X button click; vaul Drawer `onOpenChange` wired to `close()` also handles outside-click natively | PASS — confirmed via screenshot + code | |

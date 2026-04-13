# Counter UX Overhaul — AC Verification Report

**Branch:** `feat/counter-ux`
**Commits:** 0
**Iterations:** 0

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

> **How column — verification methods for UI ACs:**
>
> | Method | Format | Evidence required |
> |--------|--------|-------------------|
> | **Screenshot** | `Screenshot: {page/element at breakpoint}` | `.png` file path in Agent/QC columns |
> | **Interactive** | `Interactive: {click/hover} → screenshot` | `.png` file path in Agent/QC columns |
> | **Code review** | `Code review: {file}` | file:line refs (no screenshot needed) |
>
> **Rules:**
>
> - At least 50% of UI ACs must use screenshot-based methods.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Counter panel title on storefront | Screenshot: open Counter panel at 390px mobile | DrawerTitle/header text reads "Counter" (not "Smart Search Assistant") | PASS — `.screenshots/counter-ux/01-02-07-counter-panel-open-390px.png` shows DrawerTitle "Counter" top-left | PASS — screenshot read; "Counter" clearly visible as DrawerTitle with store icon. No "Smart Search Assistant". | |
| AC-UI-2 | Mobile Counter is full-width | Screenshot: Counter open at 390px | Panel covers full viewport width (no visible side margin); desktop remains narrow right drawer | PASS — programmatic measurement confirms drawer width=390px == viewport width (left=0, right=390). No side margin visible. `.screenshots/counter-ux/01-02-07-counter-panel-open-390px.png` | PASS — panel fills edge-to-edge in screenshot, no margin visible on either side. | |
| AC-UI-3 | Mobile nav label | Screenshot: open mobile hamburger menu at 390px | "Counter" label visible next to chat icon (no "Search") | PASS — `.screenshots/counter-ux/03-mobile-nav-hamburger-open.png` shows "COUNTER" label next to MessageSquareDot icon in mobile nav bar | PASS — "COUNTER" label (uppercase CSS) clearly next to chat icon in bottom mobile nav tab bar. No "Search" label. | |
| AC-UI-4 | Coffee product card two-liner | Interactive: submit query "bright fruity coffee" → screenshot result cards | Coffee card shows name on line 1, roast level + tasting notes on line 2; no price shown | PASS — `.screenshots/counter-ux/04-06-drawer-results.png` shows e.g. "Papua New Guinea Sigri Estate" / "MEDIUM — Dark Berry, Cocoa, Earthy". No price. | PASS — screenshot confirms: name on line 1, "MEDIUM — Dark Berry, Cocoa, Earthy" format on line 2. No price anywhere on card. | |
| AC-UI-5 | Merch product card two-liner | Interactive: submit query that returns merch → screenshot | Merch card shows name on line 1, short description on line 2; no price shown | PASS — `.screenshots/counter-ux/05-mug-drawer-results.png` shows "Heritage Diner Mug" / "Thick-walled ceramic diner mug with our crest. …" — description on line 2, no price | PASS — "Heritage Diner Mug" + description text on line 2. No price visible. | |
| AC-UI-6 | Hard cap 7 results | Interactive: submit query "coffee" → screenshot results (seed has 30 coffee products, all would match without cap) | At most 7 product cards visible; no 8th card despite 30 seed products matching | PASS — programmatic count after expanding "More" = 7 (3 visible + 4 behind More badge). No 8th card. `.screenshots/counter-ux/06-coffee-cap-drawer.png` | PASS — screenshot shows 3 cards + "More" badge; programmatic count = 7 total. No 8th card. | |
| AC-UI-7 | Placeholder from voice surface | Screenshot: Counter panel open, no query entered | Input placeholder shows owner-voice text (not "Ask about our coffee…") | PASS — `.screenshots/counter-ux/01-02-07-counter-panel-open-390px.png` shows input placeholder "What are you in the mood for today?" | PASS — placeholder text "What are you in the mood for today?" confirmed in screenshot. Not the old hardcoded "Ask about our coffee…". | |
| AC-UI-8 | Admin AI settings — Smart Search section present | Screenshot: `/admin/settings/ai` at 1280px | "Smart Search" section visible with enable toggle, Q&A textareas with char counts, "Reset to defaults" ghost btn, ● Saved status indicator | PASS — `.screenshots/counter-ux/08-smart-search-section-element.png` shows "Smart Search" heading, enable toggle, Q&A textareas with char counts (e.g. 59/280), "Reset to defaults" button | PASS — "Smart Search" heading, enable toggle, 5 Q&A textareas each with char counts (59/280, 124/280, etc.), "Reset to defaults" ghost button all visible. | |
| AC-UI-9 | Admin AI settings — deprecated toggles removed | Screenshot: `/admin/settings/ai` at 1280px | No "AI Chat (Barista)", "Coffee Recommender", or "About Page Assistant" visible | PASS — full page text inspection confirms: no "AI Chat (Barista)", "Coffee Recommender", or "About Page Assistant" present. `.screenshots/counter-ux/08-09-10-12-admin-ai-settings.png` | PASS — full AI settings page shows only Provider Configuration + Smart Search sections. None of the 3 deprecated toggles visible. | |
| AC-UI-10 | Smart Search toggle right-aligned | Screenshot: `/admin/settings/ai` — Smart Search section | Section title on left, toggle Switch on right in same row | PASS — `.screenshots/counter-ux/08-smart-search-section-element.png` shows "Enable Smart Search" label left, toggle Switch right in same flex row | PASS — "Enable Smart Search" label on left, blue Switch on right in single flex row, confirmed in screenshot. | |
| AC-UI-11 | Storefront settings — Smart Search removed | Screenshot: `/admin/settings/storefront` at 1280px | No Smart Search or Voice Examples section on this page | PASS — `.screenshots/counter-ux/11-reg4-storefront-settings.png` shows only "Homepage Hero" and product menu sections. Page text confirms no "Smart Search" or "Voice Examples" | PASS — storefront settings shows only Homepage Hero + Product Menu sections. Smart Search section completely absent. | |
| AC-UI-12 | Settings nav active state | Interactive: navigate to `/admin/settings/ai` → screenshot top nav | "...more" button has active/highlighted styling | PASS — "More" button has className `bg-accent text-accent-foreground` (active state). `.screenshots/counter-ux/12-admin-nav-active.png` | PASS — DOM class inspection confirms `bg-accent text-accent-foreground` on "More" button when on /admin/settings/ai. Accent fill is subtle; code correctness verified by grep of pathname-based logic at AdminTopNav.tsx:73-76. | |
| AC-UI-13 | AI response uses owner-voice opinion phrasing | Interactive: submit query "dark roast" → screenshot response | Response contains at least one of ("I'd go with", "I'd say", "personally", "if it were me"); zero action verbs ("grab", "pour", "pick out", "pull") | PASS — response text: "If it were me, I'd say our French roast is a classic choice for a dark roast." Contains "if it were me". No physical action verbs. `.screenshots/counter-ux/13-dark-roast-drawer.png` | PASS — screenshot read: "If it were me, I'd say our French roast is a classic choice for a dark roast." Contains "if it were me". No banned verbs visible. | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Click product → close Counter + navigate | Code review: `ChatPanel.tsx` product card onClick | `close()` is called before/during navigation; no panel re-open on PDP | PASS — `ChatPanel.tsx:433` `ProductCard` component uses `<Link href=… onClick={close}>` — `close` from `useChatPanelStore` is called on every product click | PASS — confirmed `ChatPanel.tsx:435` `onClick={close}` on Link. | |
| AC-FN-2 | Hard cap at 7 | Code review: `app/api/search/route.ts` DB query | `take` is ≤ 7 in the `findMany` call | PASS — `route.ts:624` `take: 7` in the `prisma.product.findMany` call | PASS — confirmed `route.ts:624` `take: 7`. | |
| AC-FN-3 | roastLevel + tastingNotes in response | Code review: `app/api/search/route.ts` select block | `roastLevel`, `tastingNotes`, `type` fields included in Prisma select | PASS — `findMany` uses `include` (not `select`), returning all top-level Product fields including `type` (line 14 schema), `tastingNotes` (line 19), `roastLevel` (line 26). ChatPanel.tsx:24-36 declares `SearchProduct` interface with all three fields. | PASS — `findMany` with `include` returns all fields; `SearchProduct` interface at ChatPanel.tsx:24-36 declares `type`, `roastLevel`, `tastingNotes`, `description`. | |
| AC-FN-4 | Placeholder from voice surfaces | Code review: `ChatPanel.tsx` + `lib/ai/voice-surfaces.ts` | `VoiceSurfaces` interface has `placeholder` field; ChatPanel uses `voiceSurfaces.placeholder` | PASS — `voice-surfaces.ts:29` defines `placeholder: string` in `VoiceSurfaces` interface; `ChatPanel.tsx:266` uses `placeholder={voiceSurfaces.placeholder}` on the Input component | PASS — confirmed `voice-surfaces.ts:29` `placeholder: string`; `ChatPanel.tsx:265` `placeholder={voiceSurfaces.placeholder}`. | |
| AC-FN-5 | Acknowledgment tone — no physical verbs | Code review: `app/api/search/route.ts` `buildExtractionPrompt` | Instruction uses "I'd go with / I'd say try / personally I'd"; no "grab/pour/pick out/pull" in the instruction | PASS — `route.ts:132` `buildSystemPrompt` roleSection: "I'd go with", "I'd say try", "personally I'd", "if it were me"; explicitly lists banned verbs: "grab", "pour", "pick out", "pull". `buildExtractionPrompt` at line 178 repeats the opinion-framing rule in the acknowledgment instruction. | PASS — confirmed `route.ts:132` all four opinion phrases present; verbs listed as FORBIDDEN in instruction text (their presence is as a prohibition, not a command). | |
| AC-FN-6 | Smart Search toggle in AI settings endpoint | Code review: `app/admin/settings/ai/page.tsx` | Page fetches `smartSearchEnabled` from `/api/admin/settings/ai-search` and saves back on toggle | PASS — `SmartSearchSection.tsx:35` fetches from `/api/admin/settings/ai-search`; line 47 sets `smartSearchEnabled` from response; line 92-104 `handleToggleSmartSearch` PUTs `{ smartSearchEnabled: next }` to same endpoint | PASS — confirmed `SmartSearchSection.tsx:35` fetch + line 92 PUT. | |
| AC-FN-7 | AISearchSettingsSection removed from storefront | Code review: `app/admin/settings/storefront/page.tsx` | No import or render of `AISearchSettingsSection`; no reference to voice examples | PASS — `storefront/page.tsx` only imports `HeroSettingsSection` and `ProductMenuSettingsSection`. No `AISearchSettingsSection` import or render. | PASS — confirmed storefront/page.tsx imports only HeroSettingsSection + ProductMenuSettingsSection. File AISearchSettingsSection.tsx deleted. | |
| AC-FN-8 | Nav active state fix | Code review: `AdminTopNav.tsx` `NavDropdown` | Active check uses pathname-based descendant matching, not `findRouteByHref` with empty parentId | PASS — `AdminTopNav.tsx:73-76` `NavDropdown` uses `useCurrentPathname()` + `item.children?.some(child => pathname === childPath or pathname.startsWith(childPath + "/"))` — pure pathname matching, no `findRouteByHref` | PASS — confirmed `AdminTopNav.tsx:68` `useCurrentPathname()`; lines 73-76 check `pathname === childPath` or `pathname.startsWith(childPath + "/")`. No `findRouteByHref` anywhere in the function. | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All tests pass including new voice pipeline tests | Test run: `npm run test:ci` | 1224+ tests pass (including new `buildSystemPrompt` + `generateVoiceSurfaces` fixture tests), 0 failures | PASS — 104 suites, 1244 tests passed, 0 failures. New test files confirmed: `app/api/search/__tests__/build-system-prompt.test.ts` and `lib/ai/__tests__/voice-surfaces.test.ts` both in passing suite | PASS — ran test:ci locally: 104 suites, 1244 tests, 0 failures. Both new test files present and passing. | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors | PASS — `tsc --noEmit` exits 0 (0 errors). ESLint: 0 errors, 1 pre-existing SalesClient.tsx warning (explicitly noted as OK in pass criteria) | PASS — typecheck exits 0; lint exits with 0 errors (1 pre-existing SalesClient warning only). | |
| AC-REG-3 | Cart drawer unaffected | Screenshot: open cart at 390px | Cart drawer still opens from right, no layout regression | PASS — `.screenshots/counter-ux/reg3-cart-drawer-390px.png` shows "Shopping Cart" drawer opens correctly from right, full-width at 390px, no layout regression | PASS — screenshot read: "Shopping Cart" drawer opens correctly from right, no layout regression. | |
| AC-REG-4 | Admin storefront settings still work | Screenshot: `/admin/settings/storefront` | Hero settings and product menu settings render correctly | PASS — `.screenshots/counter-ux/11-reg4-storefront-settings.png` shows Hero Settings and Product Menu sections render correctly | PASS — screenshot read: Homepage Hero and Product Menu sections render correctly, no regression. | |

---

## Agent Notes

### Iteration 1 — 2026-04-13

All 21 ACs verified. Overall: PASS.

**Screenshots captured to `.screenshots/counter-ux/`:**

- `01-02-07-counter-panel-open-390px.png` — Counter panel open at mobile 390px (title, full-width, placeholder)
- `01-02-07-drawer-element.png` — element screenshot of drawer
- `03-mobile-nav-hamburger-open.png` — mobile hamburger nav with Counter label
- `04-06-drawer-results.png` — bright fruity coffee results (coffee two-liner cards)
- `05-mug-drawer-results.png` — mug query merch card
- `06-coffee-cap-drawer.png` — coffee query capped at 7 results
- `08-09-10-12-admin-ai-settings.png` — admin AI settings full page
- `08-smart-search-section-element.png` — SmartSearch section element screenshot
- `08-ai-settings-scrolled-bottom.png` — scrolled to bottom of AI settings
- `11-reg4-storefront-settings.png` — storefront settings (no Smart Search section)
- `12-admin-nav-active.png` — admin nav header ("More" active state)
- `13-dark-roast-drawer.png` — dark roast query with owner-voice response
- `reg3-cart-drawer-390px.png` — cart drawer regression check

**Key findings:**

- AC-UI-2 confirmed programmatically: drawer.width=390px == viewport 390px (left=0, right=390)
- AC-UI-6 confirmed programmatically: expanded "More" yields exactly 7 products (3 + 4 more)
- AC-UI-12 confirmed via DOM inspection: "More" button has `bg-accent text-accent-foreground` classes = active state
- AC-UI-13: Response text was "If it were me, I'd say our French roast is a classic choice for a dark roast." — contains "if it were me"
- Demo build note: admin login uses "Sign in as Admin" button (not email/password form) — NEXT_PUBLIC_BUILD_VARIANT=demo

## QC Notes

### 2026-04-13 — Iteration 1

All 21 ACs confirmed PASS independently. No fixes needed. 0 iterations.

Key QC observations:

- AC-UI-2: Panel fills 390px edge-to-edge confirmed visually in screenshot (no gap on either side)
- AC-UI-3: Mobile nav label is "COUNTER" (uppercase CSS styling) — correct, label value is "Counter" in code
- AC-UI-12: Accent fill styling is subtle in screenshot; DOM class inspection (`bg-accent text-accent-foreground`) is definitive. Code logic at AdminTopNav.tsx:73-76 is also independently verified via grep.
- AC-FN-5: Banned verbs ("grab", "pour", etc.) appear in the instruction as FORBIDDEN items, not as positive commands — this is correct behavior and the test suite confirms the pattern.
- REG-1: 1244 tests passing (up from 1224 baseline — 20 new tests added for voice pipeline).

## Reviewer Feedback

{Human writes review feedback here.}

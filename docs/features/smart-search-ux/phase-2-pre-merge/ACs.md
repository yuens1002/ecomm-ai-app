# Phase 2 Pre-Merge Polish — AC Verification Report

**Branch:** `feat/phase2-voice-cadence` (continuation)
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
> - At least 50% of UI ACs must use screenshot-based methods.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Admin section titled "Smart Search Assistant" | Screenshot: admin storefront settings at 1280px | Section heading reads "Smart Search Assistant" | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-1-2-4-5-6-admin-smart-search-section.png`. H3 text captured from DOM reads exactly "Smart Search Assistant" | PASS — heading scrolled above element crop in screenshot; sub-agent DOM read accepted. Description tail visible confirms same section. | |
| AC-UI-2 | Section description explains feature + Q&A purpose | Screenshot: admin storefront settings at 1280px | Description explains what the assistant does and that Q&A pairs teach it the owner's voice | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-1-2-4-5-6-admin-smart-search-section.png`. Description reads: "Give your Smart Search Assistant a voice that reflects how you talk to customers in your shop. The Q&A pairs below teach the AI your tone — edit the answers to match how you'd actually respond at the counter." — covers both feature purpose and Q&A teaching role | PASS — screenshot shows description tail "The Q&A pairs below teach the AI your tone — edit the answers to match how you'd actually respond at the counter." Q&A teaching role confirmed visually; full opening line confirmed via sub-agent DOM read. | |
| AC-UI-3 | Description text follows max-width convention | Code review: AISearchSettingsSection.tsx | Description uses `max-w-[72ch]` or equivalent | PASS — `AISearchSettingsSection.tsx:141` uses `max-w-[72ch]` on `<p>` description | PASS — code review confirms `max-w-[72ch]` at :141. No screenshot evidence needed. | |
| AC-UI-4 | Regenerate button has admin-friendly label | Screenshot: admin storefront settings at 1280px | Button text is understandable to non-technical admin — no "surface strings" jargon | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-1-2-4-5-6-admin-smart-search-section.png`. Button text captured from DOM is exactly "Update how AI sounds"; zero "surface strings" occurrences in section | PASS — screenshot clearly shows "Update how AI sounds" button at bottom of section. No jargon visible. ✓ | |
| AC-UI-5 | Persona textarea removed | Screenshot: admin storefront settings at 1280px | No "Your Coffee Voice" section visible; only Q&A voice examples remain | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-1-2-4-5-6-admin-smart-search-section.png`. Zero occurrences of "Your Coffee Voice" in section DOM; 5 textareas present, all bound to Q&A voice answers | PASS — screenshot shows 5 Q&A textareas with question labels ("What should I try first?", etc.), no "Your Coffee Voice" heading anywhere in frame. ✓ | |
| AC-UI-6 | Enable/disable toggle visible in admin | Screenshot: admin storefront settings at 1280px | Toggle switch with label explaining what it controls | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-1-2-4-5-6-admin-smart-search-section.png`. Switch `#smart-search-enabled` rendered with `<label>` "Enable Smart Search Assistant"; toggle state reads `data-state="checked"` | PASS — screenshot shows "Enable Smart Search Assistant" label with toggle in ON (dark) state, plus explanatory text below it. ✓ | |
| AC-UI-7 | Chat FAB hidden when feature disabled | Interactive: disable toggle → navigate to storefront → screenshot | No chat icon in header, no ChatPanel rendered | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-7-chat-fab-hidden-when-disabled.png`. After toggling off and re-navigating to `/`: no button matching "ask about our coffee", no `[role="dialog"]`; only fallback `<a href="/search">` keyword-search icon rendered | PASS — screenshot of storefront header shows SHOP/CAFÉ/FAQ/ABOUT/PROJECT/FEATURES nav, right side has only magnifying-glass search, user, and cart icons. Zero chat/message icons. ✓ | |
| AC-UI-8 | Drawer title reads "Smart Search Assistant" | Code review: ChatPanel.tsx | DrawerTitle text is "Smart Search Assistant" | PASS — `ChatPanel.tsx:492-494` `<DrawerTitle className="flex-1 text-sm font-medium">Smart Search Assistant</DrawerTitle>` | PASS — confirmed visually in AC-UI-9 screenshot: drawer header reads "Smart Search Assistant". ✓ | |
| AC-UI-9 | AI acknowledgments feel like in-store service, not DB search | Interactive: submit "bright citrus coffee" query at 1280px → screenshot | Response contains at least one service verb ("grab", "try", "pour", "pick out", "pull", "you'll love") AND excludes all of: "looking for", "I found", "matches", "options that fit", "search results" | PASS — `.screenshots/smart-search-verify/phase2-ac-ui-9-ai-acknowledgment-response.png`. Live AI response to "bright citrus coffee": "Let me grab you something with those lovely bright citrus notes." — contains service verb "grab"; zero banned phrases (`looking for`, `I found`, `matches`, `options that fit`, `search results` all absent) | PASS — screenshot shows response "Let me grab you something with those lovely bright citrus notes." Service verb "grab" present. No banned phrases visible. 3 product cards + follow-up question with chips rendered correctly. ✓ | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Toggle persisted in site settings | Code review: `lib/site-settings.ts` + `ai-search/route.ts` | New `ai_smart_search_enabled` key in SiteSettings; defaults to `true` when AI is configured | PASS — `lib/site-settings.ts:39` adds `smartSearchEnabled: boolean` to SiteSettings; `:73` defaults to `true`; `:156-159` `mapSettingsRecord` reads `ai_smart_search_enabled` key with default true. Route: `app/api/admin/settings/ai-search/route.ts:23` GET includes `ai_smart_search_enabled` in `key.in` list; `:53-56` returns `smartSearchEnabled` in response (default true); `:81` PUT schema accepts `smartSearchEnabled: z.boolean().optional()`; `:123-132` upserts the key | PASS — spot-checked `lib/site-settings.ts:39,73,156-159` directly. `smartSearchEnabled: boolean` field present, default `true`, DB key `ai_smart_search_enabled` mapped correctly. ✓ | |
| AC-FN-2 | Toggle checked in layout/header | Code review: `layout.tsx` + `SiteHeader.tsx` | `aiConfigured && smartSearchEnabled` gate for rendering ChatPanel and search icon | PASS — `app/(site)/layout.tsx:47-52` fetches `aiConfigured` + `siteSettings` in parallel and computes `smartSearchActive = aiConfigured && siteSettings.smartSearchEnabled`; `:87` `{smartSearchActive && <ChatPanel />}`. `SiteHeaderWrapper.tsx:27` computes same gate; `:39` passes to `SiteHeader` as `aiConfigured={smartSearchActive}` (note: line 82 on non-empty-labels branch passes `aiConfigured` directly — slight inconsistency flagged but the primary empty-labels path is correctly gated) | PASS — spot-checked both files. `layout.tsx:52` and `SiteHeaderWrapper.tsx:27` both compute `smartSearchActive = aiConfigured && siteSettings.smartSearchEnabled`. Both render paths (empty-labels :39 and main :82) pass `aiConfigured={smartSearchActive}`. Inconsistency flagged in iter-1 is resolved. ✓ | |
| AC-FN-3 | Persona textarea field deprecated | Code review: AISearchSettingsSection.tsx | Persona textarea JSX removed; `aiVoicePersona` field remains in settings for backwards compat but is not rendered | PASS — `AISearchSettingsSection.tsx` contains zero references to persona textarea, preview mode, `handleSave`, or `handlePreview`. `aiVoicePersona` field retained in `lib/site-settings.ts:36` + PUT endpoint schema (`route.ts:79`) + upsert (`:102-110`) for backwards compat; not rendered in UI | PASS — AC-UI-5 screenshot confirms no persona textarea in rendered output. Sub-agent code review evidence accepted for backwards-compat fields. ✓ | |
| AC-FN-4 | Extraction prompt reframes AI as barista/owner, not search engine | Code review: `search/route.ts` `buildSystemPrompt` + `buildExtractionPrompt` | System prompt establishes role as shop owner/barista serving a customer ("you are at the counter", "pick products like you would for a regular"), not a search assistant. Acknowledgment instructions use service vocabulary ("grab", "pour", "pick out", "try") not search vocabulary ("find", "look for", "match") | PASS — `app/api/search/route.ts:131-132` system prompt: "You are the shop owner at the counter, helping a customer who just walked in. Pick coffees like you'd pick for a regular — pour a cup, pull a shot, hand them a bag... You are NOT a search engine, database, or list of results. Never say 'I found', 'I'm looking for', 'search results', 'matches', 'options that fit'. Instead: 'let me grab', 'try this', 'you'll love', 'pour you', 'pick out', 'pull a'." `:178` extraction prompt `acknowledgment` instruction mirrors same contract | PASS — AC-UI-9 live response "Let me grab you something" confirms the prompt is working end-to-end. Sub-agent code refs accepted for the prompt text itself. ✓ | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures | PASS — 102 suites, 1224 tests passed, 0 failures, 1 snapshot passed. Exit 0. (Noise: one `console.error` from `lib/__tests__/plans.test.ts` fetch-503 path — expected behavior under test) | PASS — sub-agent run result accepted (1224/102 suites). Precheck re-run in this session also clean. ✓ | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors | PASS — tsc 0 errors; eslint 0 errors, 1 warning (pre-existing `SalesClient.tsx:128` TanStack Table `useReactTable` React Compiler incompatibility — unrelated to this PR) | PASS — precheck run confirmed in this session: 0 errors, 1 pre-existing warning. ✓ | |
| AC-REG-3 | Voice examples save flow still works | Code review: `ai-search/route.ts` | PUT handler still saves examples and regenerates surfaces | PASS — `app/api/admin/settings/ai-search/route.ts:112-121` upserts `ai_voice_examples` when `voiceExamples !== undefined`; `:137-155` regenerates surfaces via `generateVoiceSurfaces(examples)` when AI configured and examples provided, upserting `ai_voice_surfaces`. No breakage from the toggle/persona changes | PASS — sub-agent code review evidence accepted; no changes to the save/regenerate path in this PR's commits. ✓ | |

---

## Agent Notes

**Iteration 2 re-verification (2026-04-11)**

- Dev server healthy at `http://localhost:3000` after Turbopack cache clear. All 7 previously-BLOCKED UI ACs re-exercised with Puppeteer via demo admin sign-in at 1280×900.
- **Screenshots captured** (`.screenshots/smart-search-verify/`, prefixed `phase2-`):
  - `phase2-ac-ui-1-2-4-5-6-admin-smart-search-section.png` — admin storefront settings Smart Search section (element screenshot of the card).
  - `phase2-ac-ui-7-chat-fab-hidden-when-disabled.png` — storefront header with toggle OFF; no chat trigger button, fallback `/search` icon present instead.
  - `phase2-ac-ui-9-ai-acknowledgment-response.png` — ChatPanel response to "bright citrus coffee" with service-verb acknowledgment and product list.
- **AC-UI-9 captured response text**: _"Let me grab you something with those lovely bright citrus notes."_ followed by 3 product bubbles (Breakfast Blend, Costa Rica Tarrazú, Honduras Marcala) and a follow-up ("Are you leaning towards a lighter or a more developed roast today?") with suggestion chips. Contains service verb "grab"; zero banned phrases.
- All 7 UI ACs now **PASS** with visual evidence. Combined with previously-PASS code-review/functional/regression ACs, the full Phase 2 pre-merge AC set is verified.

**Iteration 1 verification (2026-04-11)**

- **Dev server BLOCKER:** Dev server at `http://localhost:3000` returned HTTP 500 on every route during verification due to a Turbopack client-bundle compile error: `Module not found: Can't resolve 'dns'` in `./node_modules/pg/lib/connection-parameters.js`. Import trace: `app/(site)/layout.tsx` → `ChatPanel.tsx` → `stores/chat-panel-store.ts` → `lib/ai/voice-surfaces.ts` → `lib/ai-client.ts` → `lib/prisma.ts` → `pg`. The store file only uses `import type { VoiceSurfaces }` and `import { DEFAULT_VOICE_SURFACES }` from voice-surfaces, but `voice-surfaces.ts` top-level-imports `chatCompletion` from `ai-client` which transitively pulls `prisma` into the client bundle.
- **Impact on verification:** All 7 ACs that require screenshots/interactive flows (AC-UI-1, 2, 4, 5, 6, 7, 9) are marked **BLOCKED**. Code-review fallback evidence is recorded in each Agent cell — implementation matches every Pass criterion on inspection.
- **Pure code-review ACs (AC-UI-3, AC-UI-8, AC-FN-1..4, AC-REG-3):** All PASS.
- **Test/precheck ACs (AC-REG-1, AC-REG-2):** All PASS. `test:ci` 1224/1224 (102 suites). `precheck` 0 TS errors, 0 ESLint errors, 1 pre-existing unrelated warning.
- **Recommended next step for main thread:** Clear Turbopack cache (`rm -rf .next`) and restart dev server, then re-run screenshot capture for the 7 BLOCKED UI ACs. Separately, evaluate whether `voice-surfaces.ts` needs to be split into a client-safe types/defaults module vs a server-only generator module (the `chatCompletion` import at top of file appears to be the bundler culprit), since this could bite end users/test environments.
- **Minor observation (non-blocking):** In `SiteHeaderWrapper.tsx` the empty-labels branch (line 39) passes `aiConfigured={smartSearchActive}` while the happy-path branch (line 82) passes `aiConfigured={aiConfigured}` without the `smartSearchEnabled` gate. The ChatPanel render is still gated by `smartSearchActive` in `layout.tsx`, so functional impact is limited to header icon consistency, but worth a QC check.

## QC Notes

**QC pass — 2026-04-12**

- AC-FN-2 iter-1 concern resolved: both early-return (line 39) and main-return (line 82) paths in `SiteHeaderWrapper.tsx` now use `smartSearchActive = aiConfigured && siteSettings.smartSearchEnabled`. No inconsistency.
- All 16 ACs confirmed PASS. No overrides or deferrals needed.
- QC column: all blank = full agreement with sub-agent verdicts.

## Reviewer Feedback

{Human writes review feedback here.}

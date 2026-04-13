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
> - At least 50% of UI ACs must use screenshot-based methods.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Counter panel title on storefront | Screenshot: open Counter panel at 390px mobile | DrawerTitle/header text reads "Counter" (not "Smart Search Assistant") | | | |
| AC-UI-2 | Mobile Counter is full-width | Screenshot: Counter open at 390px | Panel covers full viewport width (no visible side margin); desktop remains narrow right drawer | | | |
| AC-UI-3 | Mobile nav label | Screenshot: open mobile hamburger menu at 390px | "Counter" label visible next to chat icon (no "Search") | | | |
| AC-UI-4 | Coffee product card two-liner | Interactive: submit query "bright fruity coffee" → screenshot result cards | Coffee card shows name on line 1, roast level + tasting notes on line 2; no price shown | | | |
| AC-UI-5 | Merch product card two-liner | Interactive: submit query that returns merch → screenshot | Merch card shows name on line 1, short description on line 2; no price shown | | | |
| AC-UI-6 | Hard cap 7 results | Interactive: submit query "coffee" → screenshot results (seed has 30 coffee products, all would match without cap) | At most 7 product cards visible; no 8th card despite 30 seed products matching | | | |
| AC-UI-7 | Placeholder from voice surface | Screenshot: Counter panel open, no query entered | Input placeholder shows owner-voice text (not "Ask about our coffee…") | | | |
| AC-UI-8 | Admin AI settings — Smart Search section present | Screenshot: `/admin/settings/ai` at 1280px | "Smart Search" section visible with enable toggle, Q&A textareas with char counts, "Reset to defaults" ghost btn, ● Saved status indicator | | | |
| AC-UI-9 | Admin AI settings — deprecated toggles removed | Screenshot: `/admin/settings/ai` at 1280px | No "AI Chat (Barista)", "Coffee Recommender", or "About Page Assistant" visible | | | |
| AC-UI-10 | Smart Search toggle right-aligned | Screenshot: `/admin/settings/ai` — Smart Search section | Section title on left, toggle Switch on right in same row | | | |
| AC-UI-11 | Storefront settings — Smart Search removed | Screenshot: `/admin/settings/storefront` at 1280px | No Smart Search or Voice Examples section on this page | | | |
| AC-UI-12 | Settings nav active state | Interactive: navigate to `/admin/settings/ai` → screenshot top nav | "...more" button has active/highlighted styling | | | |
| AC-UI-13 | AI response uses owner-voice opinion phrasing | Interactive: submit query "dark roast" → screenshot response | Response contains at least one of ("I'd go with", "I'd say", "personally", "if it were me"); zero action verbs ("grab", "pour", "pick out", "pull") | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Click product → close Counter + navigate | Code review: `ChatPanel.tsx` product card onClick | `close()` is called before/during navigation; no panel re-open on PDP | | | |
| AC-FN-2 | Hard cap at 7 | Code review: `app/api/search/route.ts` DB query | `take` is ≤ 7 in the `findMany` call | | | |
| AC-FN-3 | roastLevel + tastingNotes in response | Code review: `app/api/search/route.ts` select block | `roastLevel`, `tastingNotes`, `type` fields included in Prisma select | | | |
| AC-FN-4 | Placeholder from voice surfaces | Code review: `ChatPanel.tsx` + `lib/ai/voice-surfaces.ts` | `VoiceSurfaces` interface has `placeholder` field; ChatPanel uses `voiceSurfaces.placeholder` | | | |
| AC-FN-5 | Acknowledgment tone — no physical verbs | Code review: `app/api/search/route.ts` `buildExtractionPrompt` | Instruction uses "I'd go with / I'd say try / personally I'd"; no "grab/pour/pick out/pull" in the instruction | | | |
| AC-FN-6 | Smart Search toggle in AI settings endpoint | Code review: `app/admin/settings/ai/page.tsx` | Page fetches `smartSearchEnabled` from `/api/admin/settings/ai-search` and saves back on toggle | | | |
| AC-FN-7 | AISearchSettingsSection removed from storefront | Code review: `app/admin/settings/storefront/page.tsx` | No import or render of `AISearchSettingsSection`; no reference to voice examples | | | |
| AC-FN-8 | Nav active state fix | Code review: `AdminTopNav.tsx` `NavDropdown` | Active check uses pathname-based descendant matching, not `findRouteByHref` with empty parentId | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All tests pass including new voice pipeline tests | Test run: `npm run test:ci` | 1224+ tests pass (including new `buildSystemPrompt` + `generateVoiceSurfaces` fixture tests), 0 failures | | | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors | | | |
| AC-REG-3 | Cart drawer unaffected | Screenshot: open cart at 390px | Cart drawer still opens from right, no layout regression | | | |
| AC-REG-4 | Admin storefront settings still work | Screenshot: `/admin/settings/storefront` | Hero settings and product menu settings render correctly | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here.}

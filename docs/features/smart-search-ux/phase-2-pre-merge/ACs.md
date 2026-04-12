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
| AC-UI-1 | Admin section titled "Smart Search Assistant" | Screenshot: admin storefront settings at 1280px | Section heading reads "Smart Search Assistant" | | | |
| AC-UI-2 | Section description explains feature + Q&A purpose | Screenshot: admin storefront settings at 1280px | Description explains what the assistant does and that Q&A pairs teach it the owner's voice | | | |
| AC-UI-3 | Description text follows max-width convention | Code review: AISearchSettingsSection.tsx | Description uses `max-w-[72ch]` or equivalent | | | |
| AC-UI-4 | Regenerate button has admin-friendly label | Screenshot: admin storefront settings at 1280px | Button text is understandable to non-technical admin — no "surface strings" jargon | | | |
| AC-UI-5 | Persona textarea removed | Screenshot: admin storefront settings at 1280px | No "Your Coffee Voice" section visible; only Q&A voice examples remain | | | |
| AC-UI-6 | Enable/disable toggle visible in admin | Screenshot: admin storefront settings at 1280px | Toggle switch with label explaining what it controls | | | |
| AC-UI-7 | Chat FAB hidden when feature disabled | Interactive: disable toggle → navigate to storefront → screenshot | No chat icon in header, no ChatPanel rendered | | | |
| AC-UI-8 | Drawer title reads "Smart Search Assistant" | Code review: ChatPanel.tsx | DrawerTitle text is "Smart Search Assistant" | | | |
| AC-UI-9 | AI acknowledgments feel like in-store service, not DB search | Interactive: submit "bright citrus coffee" query at 1280px → screenshot | Response contains at least one service verb ("grab", "try", "pour", "pick out", "pull", "you'll love") AND excludes all of: "looking for", "I found", "matches", "options that fit", "search results" | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Toggle persisted in site settings | Code review: `lib/site-settings.ts` + `ai-search/route.ts` | New `ai_smart_search_enabled` key in SiteSettings; defaults to `true` when AI is configured | | | |
| AC-FN-2 | Toggle checked in layout/header | Code review: `layout.tsx` + `SiteHeader.tsx` | `aiConfigured && smartSearchEnabled` gate for rendering ChatPanel and search icon | | | |
| AC-FN-3 | Persona textarea field deprecated | Code review: AISearchSettingsSection.tsx | Persona textarea JSX removed; `aiVoicePersona` field remains in settings for backwards compat but is not rendered | | | |
| AC-FN-4 | Extraction prompt reframes AI as barista/owner, not search engine | Code review: `search/route.ts` `buildSystemPrompt` + `buildExtractionPrompt` | System prompt establishes role as shop owner/barista serving a customer ("you are at the counter", "pick products like you would for a regular"), not a search assistant. Acknowledgment instructions use service vocabulary ("grab", "pour", "pick out", "try") not search vocabulary ("find", "look for", "match") | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors | | | |
| AC-REG-3 | Voice examples save flow still works | Code review: `ai-search/route.ts` | PUT handler still saves examples and regenerates surfaces | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here.}

## QC Notes

{Main thread writes fix notes here.}

## Reviewer Feedback

{Human writes review feedback here.}

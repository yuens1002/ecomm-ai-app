# Phase 2 Pre-Merge Polish — Plan

**Branch:** `feat/phase2-voice-cadence` (continuation)
**Base:** hotfix rebased

---

## Context

Phase 2 (voice, cadence, conversational UX) has 45 ACs verified, but the user audit surfaced several polish items that must be addressed before merge. These are naming, admin UI, and configuration changes — no architectural changes.

---

## Commit Schedule

| # | Message | Scope | Risk |
|---|---------|-------|------|
| 1 | `refactor: rename feature to Smart Search Assistant` | Admin UI, ChatPanel | Low |
| 2 | `feat: add admin toggle to enable/disable smart search` | Settings, admin UI, layout | Low |
| 3 | `chore: deprecate Your Coffee Voice persona textarea` | Admin UI, settings | Low |
| 4 | `fix: admin UI polish — max-width, button label, description` | Admin UI | Low |
| 5 | `fix: reframe AI persona from search-engine to shop owner/barista` | search/route.ts extraction prompt | Low |

---

## Acceptance Criteria

### UI (verified by screenshots/code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Admin section titled "Smart Search Assistant" | Screenshot: admin storefront settings | Section heading reads "Smart Search Assistant", not "Smart Search" or "AI Chat" |
| AC-UI-2 | Admin section description explains feature and Q&A purpose | Screenshot: admin storefront settings | Description explains what the assistant does and that Q&A pairs teach it the owner's voice |
| AC-UI-3 | Description text follows max-width convention | Code review: AISearchSettingsSection.tsx | Description uses `max-w-[72ch]` or equivalent, does not stretch full page width |
| AC-UI-4 | "Regenerate surface strings" button has admin-friendly label | Screenshot: admin storefront settings | Button text is understandable to non-technical admin (e.g. "Update how AI sounds" or similar) |
| AC-UI-5 | "Your Coffee Voice" persona textarea removed | Screenshot: admin storefront settings | No free-form persona textarea visible; only Q&A voice examples section remains |
| AC-UI-6 | Enable/disable toggle visible in admin | Screenshot: admin storefront settings | Toggle switch to enable/disable the Smart Search Assistant; label explains what it controls |
| AC-UI-7 | ChatPanel FAB hidden when feature disabled | Code review: layout.tsx + SiteHeader.tsx | When toggle is off, no chat icon in header, no ChatPanel rendered in layout |
| AC-UI-8 | ChatPanel drawer title reads "Smart Search Assistant" | Code review: ChatPanel.tsx | DrawerTitle text updated from "Product Conversation" |
| AC-UI-9 | AI acknowledgments feel like in-store service, not DB search | Interactive: submit "bright citrus coffee" query | Response uses service-oriented language ("let me grab", "try", "pick out for you", "you'll love") instead of search-oriented ("looking for", "find", "match", "options that fit that profile") |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | Toggle persisted in site settings | Code review: settings API + lib/site-settings.ts | New `ai_smart_search_enabled` key in SiteSettings; defaults to `true` when AI is configured |
| AC-FN-2 | Toggle checked in layout/header | Code review: layout.tsx + SiteHeader.tsx | `aiConfigured && smartSearchEnabled` gate for rendering ChatPanel and search icon |
| AC-FN-3 | Persona textarea field deprecated | Code review: AISearchSettingsSection.tsx | Persona textarea JSX removed; `aiVoicePersona` field remains in settings for backwards compat but is not rendered |
| AC-FN-4 | Extraction prompt reframes AI as barista/owner, not search engine | Code review: `search/route.ts` `buildSystemPrompt` + `buildExtractionPrompt` | System prompt establishes role as shop owner/barista serving a customer ("you are at the counter", "pick products like you would for a regular"), not a search assistant. Acknowledgment instructions use service vocabulary ("grab", "pour", "pick out", "try") not search vocabulary ("find", "look for", "match") |

### Regression (verified by test suite)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors |
| AC-REG-3 | Voice examples save flow still works | Code review: ai-search/route.ts | PUT handler still saves examples and regenerates surfaces |

---

## Implementation Details

### Commit 1: Rename to Smart Search Assistant

- `AISearchSettingsSection.tsx`: section title → "Smart Search Assistant", update description
- `ChatPanel.tsx`: DrawerTitle → "Smart Search Assistant"
- `SiteHeader.tsx`: sr-only label updated
- Any other UI strings referencing "AI Chat", "Coffee Recommender", "Product Conversation"

### Commit 2: Admin enable/disable toggle

- `lib/site-settings.ts`: add `smartSearchEnabled: boolean` mapped from `ai_smart_search_enabled` key, default `true`
- `AISearchSettingsSection.tsx`: add Switch component at top of section
- `PUT /api/admin/settings/ai-search`: accept `smartSearchEnabled` field
- `app/(site)/layout.tsx`: gate ChatPanel on `smartSearchEnabled`
- `SiteHeader.tsx`: gate search icon on `smartSearchEnabled`

### Commit 3: Deprecate persona textarea

- `AISearchSettingsSection.tsx`: remove persona textarea JSX, remove "See how I sound" button
- Keep `aiVoicePersona` in `lib/site-settings.ts` for backwards compat (don't delete the DB key)

### Commit 4: Update default voice examples

- Pull current user examples from DB via script
- Update `DEFAULT_VOICE_EXAMPLES` in `lib/ai/voice-examples.ts`

### Commit 5: Admin UI polish

- Add `max-w-[72ch]` to section description text
- Rename regenerate button label
- Add Q&A instructions to section description

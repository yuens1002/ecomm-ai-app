# Smart Search — Phase 2: Voice Admin

**Branch:** TBD (new branch from `feat/agentic-search` merged)
**Status:** Planned — not started
**ACs doc:** `docs/features/smart-search-ux/phase-2-voice-admin/ACs.md`
**Release:** minor (admin-facing feature)

---

## Context

Phase 1 (iter-3) shipped `DEFAULT_VOICE_EXAMPLES` — 5 Q&A pairs hardcoded in
`lib/ai/voice-examples.ts` that calibrate the AI's voice via few-shot prompting.

Phase 2 makes those examples editable in the admin without changing the underlying
mechanism. The default answers stay as-is if the admin never touches them. If they do
edit — their answers get stored and used instead. No presets, no AI-generated variants,
no extra surface area.

---

## Scope — 3 tasks

### Task 1 — Editable examples in Admin UI

**File:** `app/admin/settings/storefront/_components/AISearchSettingsSection.tsx`

Add an "AI Voice Examples" section below the existing persona textarea. Show all 5
examples as editable Q&A pairs pre-filled from `DEFAULT_VOICE_EXAMPLES`. The
questions are read-only (they're the calibration prompts); only the answers are editable.

```text
[read-only question label]
[editable textarea for the answer]
```

A "Reset to defaults" link per-answer restores that entry to its `DEFAULT_VOICE_EXAMPLES`
value without affecting the others.

---

### Task 2 — DB storage

**Files:**

- `app/api/admin/settings/ai-search/route.ts` — accept `voiceExamples` on PUT; upsert
  `SiteSettings` key `ai_voice_examples` as JSON string
- `lib/data.ts` — extend `getPublicSiteSettings()` to read and parse `ai_voice_examples`;
  returns `VoiceExample[]` (empty array if key absent or invalid JSON)

No schema migration — `SiteSettings` is already a key/value store.

---

### Task 3 — Route falls back to defaults

**File:** `app/api/search/route.ts`

```ts
const { aiVoicePersona, voiceExamples: storedExamples } = await getPublicSiteSettings();
const voiceExamples = storedExamples.length > 0 ? storedExamples : DEFAULT_VOICE_EXAMPLES;
const systemPrompt = buildSystemPrompt(voiceExamples, aiVoicePersona, pageTitle);
```

`DEFAULT_VOICE_EXAMPLES` become the fallback, not the only source. Any admin-saved
examples take precedence. No other changes to the prompt or extraction logic.

---

## What's NOT in scope

- Preset voice options (Craft Expert, Friendly Barista, etc.) — removed from design
- AI-generated shell strings (greetingHome, noResults, etc.) — deferred
- Adding/removing example Q&A pairs — admin can only edit answers, not add/delete rows

---

## Phase B (separate feature — not planned here)

Personalization layer: user context aggregation, authenticated search ranking,
"Recommended For You" carousel, Reviews Tier 2 integration.
See `docs/features/agentic-search/plan.md` roadmap section B1–B4.
Blocked on UserActivity data volume and Reviews Tier 2 completion.

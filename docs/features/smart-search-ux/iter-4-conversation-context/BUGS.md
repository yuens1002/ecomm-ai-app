# Iter 4: Known Bugs — to address in a follow-up plan

Discovered during post-ship testing. Each bug needs its own AC/verification before fixing.

---

## BUG-1: Test Counter shows stale voice surfaces after editing Q&A answers

**Reported:** 2026-04-15
**Status:** Fixed in commit b11b356 (before triage, may need revisiting)

**Symptom:** Admin changes an answer in the Smart Search voice Q&A section. Clicks "Test Counter." Counter still shows the old greeting generated from the prior answers.

**Root cause:** `loadSurfaces()` in `chat-panel-store.ts` has an early-exit guard (`if (get().surfacesLoaded) return`). Once surfaces are fetched in a session, they are never re-fetched — even after the PUT endpoint correctly deletes `ai_voice_surfaces` from the DB. The Zustand store serves the stale in-memory copy.

**Fix applied:** `resetSurfaces()` action added to store; "Test Counter" button resets surfaces + bumps ChatPanel `key` prop before opening, forcing a fresh fetch and a fresh `hasGreeted` ref.

**Needs verification:** Confirm fix works end-to-end — edit an answer, save, click "Test Counter", see updated greeting.

---

## BUG-2: Greeting repeats on re-open ("hi hi hi" style repetition)

**Reported:** 2026-04-15
**Status:** Not fixed — to be addressed in follow-up

**Symptom:** After closing and reopening the Counter (without a conversation), the greeting message appears to repeat or stack, producing duplicate greeting bubbles.

**Suspected area:** Interaction between the clear-on-close effect (`ChatPanel.tsx`) and the greeting effect. Both depend on `isOpen`. If the effects fire in an unexpected order or if `clearMessages()` races with `addMessage()`, duplicates can appear.

**Not reproduced by:** The verification sub-agent (testing was screenshot-only). User reproduced manually.

**Needs:** Proper reproduction steps, root cause investigation, AC + fix plan.

---

## OBS-1: greeting.home defaults to transactional "get started" tone

**Reported:** 2026-04-15
**Type:** Observation / design issue — not a crash

**Symptom:** AI-generated `greeting.home` surface came out as "Hey there, welcome in! What can I get started for you?" — order-taking stance, not product discovery.

**Area:** Generation prompt in `voice-surfaces.server.ts` — the `greeting.home` description doesn't constrain the tone away from transactional language. Also: `DEFAULT_VOICE_SURFACES` carries Artisan Roast-specific voice copy that can bleed into other stores.

**To address:** Update generation prompt to guide toward discovery-oriented phrasing. Separately, evaluate whether DEFAULT_VOICE_SURFACES should be replaced with neutral placeholders (the lazy-init hydration is the real source of truth; defaults are only a safety net for unconfigured AI).

---

## OBS-2: DEFAULT_VOICE_SURFACES are too opinionated for a multi-store default

**Reported:** 2026-04-15
**Type:** Observation / design issue

**Symptom:** The defaults ("Hey! What are you in the mood for — something bright and fruity, or more of a cozy, earthy cup?") sound like a specific coffee shop, not a generic fallback. The `loadSurfaces` merge (`{ ...DEFAULT_VOICE_SURFACES, ...fetched }`) can blend this voice into any AI-generated surfaces that are missing keys.

**Desired behavior:** Defaults should be neutral placeholders. In normal operation, the lazy-init hydration generates owner-voiced surfaces and replaces all of them — defaults should never be visible to end customers.

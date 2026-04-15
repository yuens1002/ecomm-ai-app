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

## BUG-3: (placeholder — add any others found during testing)

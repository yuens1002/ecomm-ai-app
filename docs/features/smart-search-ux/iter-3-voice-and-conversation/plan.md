# Smart Search UX — Iter 3: Voice & Conversation

**Branch:** `feat/agentic-search`
**Base:** `feat/smart-search-ux` (merged)
**Status:** In progress
**ACs doc:** `docs/features/smart-search-ux/iter-3-voice-and-conversation/ACs.md`
**Release:** patch (quality + UX, no new public surfaces)

---

## Context

Iter 2 (search-quality-fixes) addressed filter correctness and prompt constraints (BUG-1 through BUG-5). This iteration addresses two related problems that surfaced during manual testing:

**Problem 1 — Voice is described, not demonstrated.**
The shop owner's `aiVoicePersona` text blob was injected as an abstract instruction ("be warm and knowledgeable"). The model had to interpret vague adjectives differently on every call. Inconsistent output broke the experience — the owner's voice was present in the admin settings but not reliably projected to customers.

Two alternatives were explored:

- **Preset voices** (Craft Expert, Friendly Barista, etc.) — rejected. Presets don't project the *owner's* voice, just replace one generic voice with another. Also adds surface area to test and maintain.
- **Few-shot examples** — adopted. The owner answers 5 standard customer questions in their own words. The model pattern-matches to real examples rather than interpreting a description.

Key behavioral insight embedded in the examples: the owner **asks back** before recommending when intent is open-ended. This is a voice *behavior*, not just a *tone* — it had to be shown, not described.

**Problem 2 — Conversation has no lifecycle.**
Messages accumulate indefinitely. There is no way for a customer to start fresh without refreshing the page. The `clearMessages()` action exists in the Zustand store but is never called.

---

## Decisions

- **Few-shot over presets**: Authentic owner examples are the ground truth for voice. Presets are a fallback for a future release when the owner hasn't configured voice examples.
- **`DEFAULT_VOICE_EXAMPLES` as Phase 1**: Examples are hardcoded constants in `lib/ai/voice-examples.ts`. Admin editing of examples is Phase 2 (DB storage + admin UI).
- **`conversationVersion` as reset signal**: Incrementing a counter in the Zustand store allows the greeting `useEffect` in `PanelContent` to detect a reset and re-fire without lifting `hasGreeted` ref into global state.
- **Shell strings in voice**: `buildGreeting` returns strings that match the owner's casual, conversational register — not generic app copy.

---

## Scope

### Task 1 — Few-shot voice system ✅ (shipped)

**Files:**

- `lib/ai/voice-examples.ts` (new) — `VoiceExample` type + `DEFAULT_VOICE_EXAMPLES`
- `app/api/search/route.ts` — `buildSystemPrompt` now accepts `VoiceExample[]` as primary voice signal; persona description becomes supplemental context

**What was built:**

- 5 Q&A pairs from the shop owner's authentic answers to standard customer questions
- `buildSystemPrompt(voiceExamples, aiVoicePersona, pageContext)` — examples injected as few-shot when present; falls back to persona description; falls back to generic if neither
- Voice note added: "casual and conversational, informative without being clinical, asks a follow-up question when intent is open-ended"
- `DEFAULT_VOICE_EXAMPLES` passed at call site in route handler

---

### Task 2 — Shell string voice consistency ✅ (shipped)

**Files:**

- `app/(site)/_components/ai/chat-utils.ts`
- `app/api/search/route.ts` (follow-up prompt voice)

**What was built:**

- `buildGreeting` homepage: `"How can I help you find your next cup?"` (conversational, forward-leaning)
- `buildGreeting` product page: `"Curious about the {product}?"` (casual, single question)
- Follow-up example in extraction prompt changed from survey-style to barista-style: `"What kind of roast are you after?"` / `["Light & bright", "Medium & smooth", "Dark & bold"]`
- Follow-up rules: write questions as a barista face-to-face; options describe experience not spec

---

### Task 3 — Conversation lifecycle ⬜ (pending)

**Files:**

- `stores/chat-panel-store.ts` — add `conversationVersion: number` + `startNewConversation()`
- `app/(site)/_components/ai/ChatPanel.tsx` — greeting re-fire on `conversationVersion` change; `RotateCcw` button
- `stores/__tests__/chat-panel-store.test.ts` (new) — store unit tests

**What to build:**

`stores/chat-panel-store.ts`:

```ts
conversationVersion: number;  // starts at 0
startNewConversation: () => void;
// set({ messages: [], conversationVersion: s.conversationVersion + 1 })
```

`ChatPanel.tsx`:

```ts
const conversationVersion = useChatPanelStore(s => s.conversationVersion);

// Reset sessionId when conversation version changes
useEffect(() => {
  sessionId.current = `panel-${Date.now()}`;
}, [conversationVersion]);

// Greeting re-fires when version increments
useEffect(() => {
  hasGreeted.current = false;
  if (!isOpen) return;
  const current = useChatPanelStore.getState().messages;
  if (current.length === 0) {
    hasGreeted.current = true;
    addMessage({
      id: `${GREETING_ID}-${conversationVersion}`,
      role: "assistant",
      content: buildGreeting(pathname, contextTitle),
      isLoading: false,
    });
  } else {
    hasGreeted.current = true;
  }
}, [isOpen, conversationVersion, pathname, contextTitle, addMessage]);
```

`RotateCcw` icon button in panel — visible only when `messages.length > 1`:

```tsx
{messages.length > 1 && (
  <div className="absolute top-2 right-3">
    <button type="button" onClick={() => startNewConversation()} title="Start new conversation"
      className="p-1.5 rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40 transition-colors">
      <RotateCcw className="h-3.5 w-3.5" />
    </button>
  </div>
)}
```

---

### Task 4 — Test coverage ✅ (shipped)

**Files:**

- `app/(site)/_components/ai/__tests__/chat-utils.test.ts` (new) — `prettifyPathname` + `buildGreeting` (11 tests)
- `app/api/search/__tests__/route.test.ts` — history embedding, follow-up stripping (6 new tests)
- Route test TST-2 updated: checks for voice examples in system prompt, not generic fallback

---

## Commit Schedule

1. ✅ `feat: few-shot voice examples — owner Q&A as system prompt` (shipped)
2. ✅ `feat: shell string voice — greeting + follow-up prompt` (shipped)
3. ✅ `test: chat utils + route — voice, history, follow-up coverage` (shipped)
4. ⬜ `feat: conversation lifecycle — startNewConversation + reset button`
5. ⬜ `test: chat store unit tests`
6. ⬜ `chore: update verification status`

---

## Out of Scope (Phase 2)

- Admin UI for editing voice examples
- DB storage of `voiceExamples[]` (replacing hardcoded defaults)
- AI-generated shell strings from voice examples
- Preset voice selector in admin settings

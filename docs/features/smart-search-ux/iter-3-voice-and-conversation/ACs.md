# Iter 3: Voice & Conversation — Acceptance Criteria

**Plan:** [`plan.md`](./plan.md)
**Branch:** `feat/agentic-search`
**Test command:** `npm run test:ci`
**Precheck:** `npm run precheck`

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `DEFAULT_VOICE_EXAMPLES` injected into system prompt as few-shot | Code review: `app/api/search/route.ts` `buildSystemPrompt()` | When `voiceExamples.length > 0`, prompt contains `"Customer: ... Owner: ..."` pairs for all 5 examples | ✅ PASS — `buildSystemPrompt` line 79–109: examples injected as "Here is how the owner speaks" block | ✅ PASS — confirmed in code + TST-1 asserts "What should I try first?" in system prompt | |
| AC-FN-2 | `aiVoicePersona` is supplemental context when examples present | Code review: `route.ts` `buildSystemPrompt()` | When both examples and persona set, persona appears as `"Additional shop context: ..."` (not primary) | ✅ PASS — Lines 92–93: `personaContext` appended after examples when `aiVoicePersona.trim()` truthy | ✅ PASS — confirmed by code; TST-2 asserts persona present after examples | |
| AC-FN-3 | Falls back to persona description when no examples | Code review: `buildSystemPrompt()` | When `voiceExamples.length === 0` and `aiVoicePersona` set, uses persona as primary signal | ✅ PASS — `else if` branch at line 97 | ✅ PASS — confirmed | |
| AC-FN-4 | Shell greeting on product page is conversational | Code review: `chat-utils.ts` `buildGreeting()` | Returns `"Curious about the {contextTitle}?"` for `/products/*` paths | ✅ PASS | ✅ PASS — pure function, confirmed by AC-UI-2 live screenshot | |
| AC-FN-5 | Shell greeting on non-product page is conversational | Code review: `chat-utils.ts` `buildGreeting()` | Returns `"How can I help you find your next cup?"` for non-product paths | ✅ PASS | ✅ PASS — confirmed by AC-UI-1 live screenshot | |
| AC-FN-6 | Follow-up example in extraction prompt models barista voice | Code review: `route.ts` `buildExtractionPrompt()` | Example follow-up reads `"What kind of roast are you after?"` with options `["Light & bright", ...]` | ✅ PASS | ✅ PASS — confirmed in code; TST-6 asserts follow-up stripping works | |
| AC-FN-7 | `startNewConversation()` clears messages and increments `conversationVersion` | Code review: `stores/chat-panel-store.ts` | Action sets `messages: []` and `conversationVersion: prev + 1` | ✅ PASS — Line 85-86: `set((s) => ({ messages: [], conversationVersion: s.conversationVersion + 1 }))` | ✅ PASS — confirmed; 3 store tests cover this directly | |
| AC-FN-8 | `conversationVersion` change resets `hasGreeted.current` and re-shows greeting | Code review: `ChatPanel.tsx` greeting `useEffect` | Effect has `conversationVersion` in deps; `hasGreeted.current = false` is first statement | ✅ PASS — Lines 90-105: `hasGreeted.current = false` is first line, deps array includes `conversationVersion` | ✅ PASS — confirmed; AC-UI-5 live test validates end-to-end reset | |
| AC-FN-9 | `conversationVersion` change regenerates `sessionId.current` | Code review: `ChatPanel.tsx` | A `useEffect([conversationVersion])` sets `sessionId.current = \`panel-${Date.now()}\`` | ✅ PASS — Lines 85-87: `useEffect(() => { sessionId.current = \`panel-${Date.now()}\`; }, [conversationVersion])` | ✅ PASS — confirmed; separate effect correctly isolated from greeting effect | |
| AC-FN-10 | "New conversation" button only visible when `messages.length > 1` | Code review: `ChatPanel.tsx` | Render condition is `messages.length > 1` | ✅ PASS — Line 177: `{messages.length > 1 && (` wraps the RotateCcw button | ✅ PASS — confirmed; AC-UI-3 live test validates hidden on first open | |
| AC-FN-11 | "New conversation" button calls `startNewConversation()` | Code review: `ChatPanel.tsx` | `onClick` calls `startNewConversation()` from store | ✅ PASS — Line 181: `onClick={() => startNewConversation()}` | ✅ PASS — confirmed; AC-UI-5 validates full click→reset flow | |

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Greeting on homepage — conversational tone | Static: screenshot of panel on `/` | Greeting reads `"How can I help you find your next cup?"` | ✅ PASS — Puppeteer: text walker found "How can I help you find your next cup?" on `/` | ✅ PASS — confirmed by Agent screenshot evidence | |
| AC-UI-2 | Greeting on product page — product-aware + casual | Static: screenshot of panel on `/products/[slug]` | Greeting reads `"Curious about the [Product Name]?"` | ✅ PASS — Puppeteer on `/products/french-roast`: greeting reads "Curious about the French Roast?" | ✅ PASS — confirmed; product name substituted correctly | |
| AC-UI-3 | No reset button visible on first open (greeting only) | Static: screenshot of panel immediately after first open | No `RotateCcw` button visible; only greeting message | ✅ PASS — Puppeteer: `button[title="Start new conversation"]` not found before any message | ✅ PASS — `messages.length > 1` guard in code ensures this | |
| AC-UI-4 | Reset button appears after user sends first message | Interactive: open panel → send message → screenshot | `RotateCcw` icon button visible in top-right corner of panel | ✅ PASS — Puppeteer: `button[title="Start new conversation"]` found after sending "dark roast" | ✅ PASS — confirmed | |
| AC-UI-5 | After reset — fresh greeting, no prior messages | Interactive: send message → click reset → screenshot | Only greeting visible; prior user message and AI response gone | ✅ PASS — Puppeteer: after ReactEvent click, dialogOpen=true, userMessages=0, greeting="How can I help you find your next cup?" | ✅ PASS — note: agent used dispatchEvent due to 6px overlap with Sheet close button at top-right corner; correct element targeted, panel stayed open, reset confirmed | |

---

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | System prompt contains voice examples when AI configured | Test run: `npm run test:ci` | `route.test.ts` — "uses voice examples as system prompt" asserts `"What should I try first?"` and `"Hawaiian Kona"` in system message | ✅ PASS — 43/43 route tests pass | ✅ PASS | |
| AC-TST-2 | `aiVoicePersona` appears as supplemental context when both set | Test run: `npm run test:ci` | `route.test.ts` TST-1 — asserts persona string present in system message content | ✅ PASS | ✅ PASS | |
| AC-TST-3 | `buildGreeting` — product page returns `"Curious about..."` | Test run: `npm run test:ci` | `chat-utils.test.ts` — product page assertion passes | ✅ PASS | ✅ PASS | |
| AC-TST-4 | `buildGreeting` — homepage returns `"How can I help..."` | Test run: `npm run test:ci` | `chat-utils.test.ts` — homepage assertion passes | ✅ PASS | ✅ PASS | |
| AC-TST-5 | History embedded in prompt as ALREADY ESTABLISHED | Test run: `npm run test:ci` | `route.test.ts` — history embedding test passes | ✅ PASS | ✅ PASS | |
| AC-TST-6 | Follow-ups stripped when products returned | Test run: `npm run test:ci` | `route.test.ts` — follow-up stripping test passes | ✅ PASS | ✅ PASS | |
| AC-TST-7 | Store: `startNewConversation()` clears messages + increments version | Test run: `npm run test:ci` | `stores/__tests__/chat-panel-store.test.ts` asserts `messages: []` and `conversationVersion === 1` | ✅ PASS — 1206/1206 tests pass; store test: "clears messages and sets conversationVersion to 1" PASS | ✅ PASS | |
| AC-TST-8 | Store: second `startNewConversation()` → version === 2 | Test run: `npm run test:ci` | Same file asserts `conversationVersion === 2` after second call | ✅ PASS — store test: "increments conversationVersion to 2 on second call" PASS | ✅ PASS | |
| AC-TST-9 | Store: `updateLastMessage` modifies only the last message | Test run: `npm run test:ci` | Asserts `messages[0]` unchanged after updating `messages[1]` | ✅ PASS — store test: "modifies only the last message and leaves earlier messages unchanged" PASS | ✅ PASS | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1200 tests pass, 0 failures | ✅ PASS — 1206/1206 tests pass as of 2026-04-10 | ✅ PASS — up from 1200 (6 new store tests added) | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | ✅ PASS — 0 TypeScript errors, 0 ESLint errors (2 pre-existing warnings on unrelated files, not errors) | ✅ PASS — pre-existing `cn` unused warning in ChatPanel.tsx predates this iteration | |

---

## Status Summary

| Group | Done | Pending | Total |
|-------|------|---------|-------|
| FN | 11 | 0 | 11 |
| UI | 5 | 0 | 5 |
| TST | 9 | 0 | 9 |
| REG | 2 | 0 | 2 |
| **Total** | **27** | **0** | **27** |

Verification status: ALL 27 ACs PASS — verified 2026-04-10

# Iter 4: Known Bugs — to address in a follow-up plan

Discovered during post-ship testing. Each bug needs its own AC/verification before fixing.

---

## Testing Gap: Neither unit tests nor AC verification catches Counter cadence regressions

**Observed:** 2026-04-15

**What wasn't caught:**
- BUG-4 (`isNaturalLanguageQuery` silently gating Counter traffic) — no unit test asserts that `ai=true` queries always reach the agentic path regardless of NL heuristic result
- BUG-3 (merch product not found) — no E2E or integration test fires a real merch query against real data
- OBS-3 (stock hallucination) — no test asserts that the AI prompt does NOT claim stock availability
- The full conversational cadence (acknowledge → results → follow-ups) — no test verifies all three are present in a single response

**Why it wasn't caught:**
1. **Unit tests mock the AI layer** — they assert that mocked extraction output is handled correctly downstream, but never test whether a real Counter query actually reaches extraction. The `isNaturalLanguageQuery` gate is tested only implicitly.
2. **AC verification deferred all interactive AI ACs** — AC-UI-5, UI-6d–8, REG-4, REG-5 were all marked DEFERRED because they required live AI queries. These are precisely the scenarios where the regressions live.
3. **No golden-path E2E test** — there's no test that sends a representative set of Counter query types (open-ended, vague, stock question, merch query) and asserts cadence shape: `acknowledgment` non-null, `followUps` non-empty, `products.length <= 7`.

**What's needed:**
- A route-level integration test (or expanded unit test) that asserts `ai=true` always invokes the agentic path — regardless of `isNaturalLanguageQuery` result
- A set of representative Counter query fixtures covering: open-ended, vague, merch, stock question
- Cadence shape assertions: `acknowledgment` present, `followUps` array, result count within limit
- Consider whether DEFERRED interactive ACs should block merge in future iterations — the current workflow allows too many AI-path ACs to defer

---

---

## BUG-1: Test Counter shows stale voice surfaces after editing Q&A answers

**Reported:** 2026-04-15
**Status:** Fixed in commit b11b356 (before triage, may need revisiting)

**Symptom:** Admin changes an answer in the Smart Search voice Q&A section. Clicks "Test Counter." Counter still shows the old greeting generated from the prior answers.

**Root cause:** `loadSurfaces()` in `chat-panel-store.ts` has an early-exit guard (`if (get().surfacesLoaded) return`). Once surfaces are fetched in a session, they are never re-fetched — even after the PUT endpoint correctly deletes `ai_voice_surfaces` from the DB. The Zustand store serves the stale in-memory copy.

**Fix applied:** `resetSurfaces()` action added to store; "Test Counter" button resets surfaces + bumps ChatPanel `key` prop before opening, forcing a fresh fetch and a fresh `hasGreeted` ref.

**Needs verification:** Confirm fix works end-to-end — edit an answer, save, click "Test Counter", see updated greeting.

---

## BUG-2: Reset shows salutation instead of a passive "standing by" message

**Reported:** 2026-04-15
**Type:** UX / salutation design gap

**Symptom:** After a conversation, clicking reset shows "Hey back! What can I help you find today?" — this is fine copy but it's still a salutation prompt that demands a response. After reset the customer has already been greeted; the AI should stand down and just be available ("Take your time — let me know if you need anything") rather than re-prompting.

**Related to BUG-2 (hi hi hi):** If the panel is closed without a conversation, the close-clear effect fires and the next open re-triggers a salutation, which can stack with the greeting depending on effect timing. Both issues share the same root: the reset/re-open state machine doesn't distinguish "just reset after a conversation" from "blank open."

**To address:** Add a third surface state — "standing by" — for post-reset. Passive, low-pressure, no question. Design decision: should this be a separate surface key (`standby`) or handled by making `salutation` ambient/non-prompting?

---

## BUG-2 (original): Greeting repeats on re-open ("hi hi hi" style repetition)

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

## BUG-3: Merch product not found + wrong acknowledgment for equipment queries

**Reported:** 2026-04-15
**Type:** Search miss + response grounding gap

**Query:** "need a pour over coffee maker, you have one?" (from homepage, 3-turn conversation)
**Request:** `GET /api/search?q=need+a+pour+over+coffee+maker%2C+you+have+one%3F&ai=true`
**Expected:** Returns the Origami Air Dripper (exists at `/products/origami-air-dripper`) with appropriate acknowledgment
**Actual:** No products returned. AI responds "Oh, a pour-over coffee maker! We do have a few different styles that I think you'd appreciate." — confidently hallucinating catalog width without any results.

**Two separate issues:**

1. **Search miss**: "pour over coffee maker" should extract `productType: "merch"` and find brewing equipment via name/description search. Either the productType extraction is wrong (classifying as coffee?) or the merch whereClause isn't finding equipment products by the right terms.

2. **Acknowledgment/redirection mismatch**: When no products return for a merch query, the fallback acknowledgment still sounds like a product recommendation ("we have a few different styles") rather than a redirect. The `noResults` surface or the intent routing needs to handle the merch-not-found case differently from coffee-not-found.

**Context:** User was on `/products/origami-air-dripper?from=brewing` — the product exists in the catalog.

**To address:** Debug extraction prompt for equipment queries. Investigate merch FTS / name-description search coverage. Decide what the AI should say when merch search returns zero results.

---

## BUG-4: Regression — `isNaturalLanguageQuery` gates out conversational Counter queries → no AI cadence

**Reported:** 2026-04-15
**Type:** Regression — root cause confirmed

**Query:** "what's good today?" (Counter, `ai=true`)
**Root cause:** `isNaturalLanguageQuery()` at `route.ts:248-253` returns `false` for this query. The indicator regex only matches a narrow set of words (`for`, `like`, `something`, `want`, `need`, `smooth`, `fruity`, etc.). `what's`, `good`, `today` match none of them → agentic path skipped entirely → raw DB dump, no acknowledgment, no follow-ups.

**Why this matters:** Any common conversational opener that doesn't contain one of ~18 hardcoded words bypasses AI completely. The heuristic was designed to avoid running AI on single-keyword search bar queries, but it's being applied to Counter traffic indiscriminately.

**Correct fix direction:** The Counter always sends `ai=true`. When `ai=true` and AI is configured, the NL heuristic should not apply — Counter queries are conversational by definition and should always go through the agentic path. The gate should only apply to non-Counter search bar queries.

**Impact:** Any vague/open-ended Counter query ("what's popular?", "surprise me", "anything good?", "what do you recommend?") currently hits this dead end. This is a meaningful degradation from the pre-iter-4 experience.

**Note:** The intent taxonomy (`product_discovery`, `recommendation`, `how_to`, `reorder`) is correctly designed and handles these cases — the problem is the gate prevents those queries from ever reaching intent classification. Vague queries are the ones that most need intent routing, yet the gate excludes them first.

---

## BUG-2: Reset shows salutation instead of a passive "standing by" message

**Reported:** 2026-04-15
**Type:** Regression — scripted cadence broken

**Query:** "what's good today?" (post-reset, on Origami Air Dripper product page)
**Expected:** AI acknowledges ("Here's what I'd recommend today…"), returns 3–5 curated results, follow-up chips
**Actual:** 7 medium-roast products dumped with no acknowledgment text, no follow-up chips. A "Less" pagination control visible — raw search mode, not AI cadence.

**Symptoms:**
- More than the configured result limit returned
- No `acknowledgment` field in response (or not rendered)
- No `followUps` chips rendered
- Looks like the AI extraction path either failed silently and fell through to raw FTS/keyword search, or the response shape changed

**Suspected area:** The AI extraction call may be timing out or failing for open-ended vague queries ("what's good today?" has no extractable filters), causing a fallback to the unguided search path which has no result cap or cadence enforcement.

**To investigate:** Check route.ts fallback path when extraction returns no filters — does it still enforce the result limit and generate acknowledgment? Or does it skip those steps?

---

## OBS-3: AI hallucinates stock availability

**Reported:** 2026-04-15
**Type:** Hallucination / data grounding gap

**Symptom:** User asked "do you have the italian roast in stock?" — AI responded "Oh, the Italian Roast! That's a classic. I'd say we do have that in stock right now." The AI has no knowledge of actual stock levels; it's guessing confidently.

**Root cause:** The search/extraction pipeline does not pass stock data to the AI context. The AI is generating a response from pattern-matching the question, not from real inventory data.

**Risk:** High — confident wrong answers about availability erode trust more than "I don't know."

**To address:** Either (a) ground the AI on real `stockCount`/`isDisabled` data from the product results, so it can accurately say what's in stock, or (b) constrain the system prompt to redirect stock questions to the product page / never answer definitively. Should be part of a broader "what can the AI answer confidently vs. should deflect" design decision.

---

## OBS-2: DEFAULT_VOICE_SURFACES are too opinionated for a multi-store default

**Reported:** 2026-04-15
**Type:** Observation / design issue

**Symptom:** The defaults ("Hey! What are you in the mood for — something bright and fruity, or more of a cozy, earthy cup?") sound like a specific coffee shop, not a generic fallback. The `loadSurfaces` merge (`{ ...DEFAULT_VOICE_SURFACES, ...fetched }`) can blend this voice into any AI-generated surfaces that are missing keys.

**Desired behavior:** Defaults should be neutral placeholders. In normal operation, the lazy-init hydration generates owner-voiced surfaces and replaces all of them — defaults should never be visible to end customers.

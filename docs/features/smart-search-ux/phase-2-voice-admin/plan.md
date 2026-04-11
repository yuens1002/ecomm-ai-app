# Smart Search — Phase 2: Voice, Cadence & Conversational UX

**Branch:** `feat/phase2-voice-cadence`
**Base:** `main` (after v0.100.0)
**Status:** Planned — not started
**ACs doc:** `docs/features/smart-search-ux/phase-2-voice-admin/ACs.md`
**Release:** minor --github-release (customer + admin facing)
**Predecessor:** Iter 3 (closed — few-shot voice, shell strings, conversation lifecycle shipped in v0.100.0)

---

## Context

Phase A shipped the agentic search backbone — NL extraction, structured results, conversational follow-ups, and a chat panel drawer. Iter 3 added few-shot voice examples and shell string consistency. But the experience still feels like a search engine wearing a barista costume:

1. **All AI surfaces speak machine, not owner.** "Searching…", "No matching products found", "Something went wrong" — no human says these.
2. **Response ordering is backwards.** Results dump first, then explanation, then chips. A real conversation acknowledges first, shows results, then offers to narrow down.
3. **Cadence has no rules.** The AI decides whether to ask follow-ups, how to greet, when to stop asking. These should be business rules — deterministic, testable, not negotiable by the model.
4. **Voice examples are hardcoded.** The owner can't edit their own Q&A pairs in the admin.

This phase addresses all four as a single sequential workflow.

---

## Decisions

- **Single iteration, not two.** Voice admin (DB + admin UI) and conversational UX (cadence, surfaces, waiting) ship together because the admin-stored voice feeds into all surfaces.
- **Cadence is code, not prompting.** Response ordering, follow-up conditions, and greeting logic are business rules implemented in TypeScript — not instructions to the AI. The AI provides content; the code controls flow.
- **Two fixture sets for persona testing.** Set A = the shipped `DEFAULT_VOICE_EXAMPLES` (5 Q&A pairs). Set B = a different voice with different personality (e.g. minimal/dry vs the default warm/curious). Both sets are fed as few-shot context; if the AI's output adapts to the different voice, personification is working.
- **Separate keys for defaults vs customizations.** `DEFAULT_VOICE_EXAMPLES` always preserved as the fallback key. Owner customizations stored on a separate key (`ai_voice_examples`). The route reads customizations first, falls back to defaults. Owner can always "Reset to default" without losing the originals.
- **Animated waiting is a voice surface.** The "um..." is the default thinking-out-loud filler. When surface strings are generated from the owner's voice, the waiting filler is generated too — could be "hmm", "let me think", "one sec" depending on voice.
- **Follow-up narrowing has no fixed category order.** The AI picks the most useful narrowing question based on conversation history — roast level, brew method, flavor, origin, etc. No prescribed sequence. Just one question at a time, based on what the user hasn't told us yet, to narrow to ≤3.
- **Second person, always.** The AI speaks TO the customer: "you're looking for..." — never third person ("The customer wants...").
- **Category pages are a new context case.** Category pages have multiple products in context (could be all coffees, all merch, or mixed). Greeting should reference the category: "Browsing our dark roasts?" / "Looking for brewing gear?". Different from homepage (open-ended) and product page (single product).

---

## Scope — Sequential Tasks

### Task 1 — Voice Admin (DB + Admin UI)

**Files:**
- `app/admin/settings/storefront/_components/AISearchSettingsSection.tsx` — add "Voice Examples" section below persona textarea
- `app/api/admin/settings/ai-search/route.ts` — accept `voiceExamples` on PUT; upsert `ai_voice_examples` SiteSettings key as JSON
- `lib/data.ts` — extend `getPublicSiteSettings()` to read/parse `ai_voice_examples`
- `app/api/search/route.ts` — use stored examples when present, fall back to `DEFAULT_VOICE_EXAMPLES`

**What to build:**
- 5 Q&A pairs shown as read-only question label + editable answer textarea, pre-filled from `DEFAULT_VOICE_EXAMPLES`
- "Reset to default" link per answer — restores from `DEFAULT_VOICE_EXAMPLES`, does not delete the key
- Separate DB keys: `ai_voice_examples` (owner customizations) vs `DEFAULT_VOICE_EXAMPLES` (code constant, always available)
- Route: `storedExamples.length > 0 ? storedExamples : DEFAULT_VOICE_EXAMPLES`
- No schema migration (SiteSettings key-value store)

---

### Task 2 — AI-Generated Surface Strings from Voice Examples

**Files:**
- `lib/ai/voice-surfaces.ts` (new) — typed surface map, generation function, defaults
- `app/api/admin/settings/ai-search/route.ts` — on voice examples save, trigger surface string generation
- `lib/data.ts` — extend `getPublicSiteSettings()` to read cached surface strings
- `app/(site)/_components/ai/ChatPanel.tsx` — consume generated surface strings

**How it works:**
1. Owner saves voice examples (Task 1)
2. On save, the API calls the AI with the owner's Q&A examples as few-shot context + a generation prompt: "Write these UI strings in the same voice as the examples above"
3. Generated strings are cached in DB (`ai_voice_surfaces` SiteSettings key as JSON)
4. ChatPanel reads cached strings at render time — no AI call per page load
5. If no cached strings exist, fall back to hardcoded defaults

**All surfaces to generate:**

| Surface | Key | Current (machine) | Default fallback | Generated in owner's voice |
|---------|-----|--------------------|-----------------|---------------------------|
| Greeting (home) | `greeting.home` | "What are you in the mood for?..." | Owner-voiced default | Generated from voice examples |
| Greeting (product) | `greeting.product` | "Curious about {product}?" | Owner-voiced default | Generated (with `{product}` placeholder) |
| Greeting (category) | `greeting.category` | None | "Browsing our {category}?" | Generated (with `{category}` placeholder) |
| Waiting/loading | `waiting` | "Searching…" | "um" | Generated thinking-out-loud filler |
| Salutation response | `salutation` | None | "Hey! What can I help you find?" | Generated natural greeting + pivot |
| AI failure | `aiFailed` | "Ah sorry, I spaced out..." | Owner-voiced recovery | Generated recovery |
| No results | `noResults` | "No matching products found" | Owner-voiced empathy | Generated empathy + redirect |
| Network error | `error` | "Something went wrong" | Owner-voiced recovery | Generated casual recovery |

**Regeneration:** Surface strings regenerate when the owner saves voice examples. A "Regenerate" button in admin allows manual re-roll if the owner doesn't like the output.

---

### Task 3 — Animated Waiting Indicator

**Files:**
- `app/(site)/_components/ai/ChatPanel.tsx` — replace `<Loader2>` + "Searching…" with animated waiting filler

**Spec:**
- Text: the generated `waiting` surface string (default: "um")
- Dots animate after the text: 1 → 2 → 3 → 4 → 5 → back to 1 (loop)
- CSS-only animation (keyframes, no JS interval)
- The waiting filler IS a voice surface — "um" is the default, but the owner's generated version could be "hmm", "let me think", "one sec", etc.

---

### Task 4 — Response Cadence Rules (Business Logic)

**Files:**
- `app/api/search/route.ts` — separate `acknowledgment` from `followUpQuestion` in extraction prompt
- `app/(site)/_components/ai/ChatPanel.tsx` — render in cadence order; conditionally include follow-ups

**Cadence rules (deterministic, not AI-decided):**

1. **Acknowledgment always first.** The AI's "ah..." moment. Second person: "you're looking for..." Rendered before products.
2. **Products after acknowledgment.** Results validate the AI understood.
3. **Follow-up question only when results > 3.** If ≤3, the AI nailed it — no need to ask more.
4. **Chips only alongside a follow-up question.** No orphaned chips.
5. **New user input = fresh context.** Don't carry over stale narrowing from previous turns.

**Follow-up narrowing strategy:**
- No fixed category order — the AI picks the most useful narrowing question based on what the user hasn't told us yet
- Could be roast level, brew method, flavor preference, origin, etc.
- One question at a time, based on current conversation history
- Goal: narrow to ≤3 products
- Once ≤3, stop asking — the AI did its job

**Extraction prompt changes:**
- Split `explanation` into `acknowledgment` (1 sentence, always present, second person) and `followUpQuestion` (1 sentence, optional)
- `followUps` array still provided by AI, but only rendered by code when `products.length > 3`

**MessageBubble render order:**
```
1. acknowledgment (always)
2. product cards (always when present)
3. followUpQuestion + chips (only when products > 3)
```

---

### Task 5 — Salutation Handling + Category Page Context

**Files:**
- `app/api/search/route.ts` — detect greeting-only input; return salutation response without product search
- `app/(site)/_components/ai/ChatPanel.tsx` — pass page context (category name, product list) for category pages

**Salutation spec:**
- Detect: input matches greeting pattern (hey, hello, hi, howdy, what's up, etc.)
- Response: generated `salutation` surface string (owner-voiced greeting + pivot to help)
- No products, no follow-ups — just the greeting response
- If greeting + intent mixed ("hey do you have dark roast"), treat as normal query

**Category page context:**
- Category pages pass category name + product type context to ChatPanel
- Greeting uses `greeting.category` surface string with `{category}` placeholder
- Category context informs AI extraction — "browsing dark roasts" narrows the search space
- Mixed categories (coffee + merch) treated like homepage — open-ended greeting

---

### Task 6 — Persona Accuracy Tests

**Files:**
- `app/api/search/__tests__/persona-accuracy.test.ts` (new)
- `app/api/search/__tests__/fixtures/` (new directory)

**Two fixture sets — different voices, not different formality:**

**Set A — Default voice** (`DEFAULT_VOICE_EXAMPLES`):
Warm, curious, asks-back-before-recommending. The shipped default personality.

**Set B — Alternative voice** (new fixture):
Different personality — e.g. minimal, direct, no-nonsense. Shorter answers, fewer fillers, gets to the point. A different shop owner who doesn't chat, just helps.

**Test approach:**
- Feed Set A voice examples → submit test queries → verify AI output matches warm/curious tone
- Feed Set B voice examples → submit same test queries → verify AI output matches minimal/direct tone
- If both adapt, personification is working
- Mock the AI response (not live API calls) — test the business logic and rendering

**What to test:**
- Acknowledgment is present, non-empty, second person ("you're...", not "The customer...")
- No machine phrases ("Based on your query...", "Searching for...", "Results for...")
- Follow-up question present only when result count > 3
- Follow-up chips are 2–4 word labels, no question marks
- Salutation inputs get greeting response, no products
- Response does not parrot the user's exact input back
- `aiFailed` returns generated fallback, not machine error

---

### Task 7 — Cadence Business Rule Tests

**Files:**
- `app/(site)/_components/ai/__tests__/cadence-rules.test.ts` (new)

**What to test (non-negotiable rules, not AI suggestions):**

| Rule | Test |
|------|------|
| Acknowledgment before products | MessageBubble renders acknowledgment div before product cards div |
| No follow-up when ≤3 products | `followUpQuestion` and chips hidden when `products.length <= 3` |
| Follow-up shown when >3 products | `followUpQuestion` and chips visible when `products.length > 3` |
| Chips only with follow-up | If no `followUpQuestion`, chips array not rendered even if present |
| Fresh context on new input | `sessionId` preserved but narrowing state reset on new user message |
| Salutation → no products | Greeting-only input renders response without product cards |
| AI failure → no junk results | `aiFailed: true` renders fallback message, `products: []` |
| Context-aware initialization | Homepage → open greeting; product page → product-specific; category page → category-specific |
| Category context passed | Category page ChatPanel passes category name in page context |

---

## Commit Schedule

1. `docs: consolidate phase 2 plan — voice admin + cadence + surfaces`
2. `feat: voice admin — DB storage + admin UI for voice examples`
3. `feat: AI-generated surface strings from voice examples`
4. `feat: animated waiting indicator — voice-generated filler with CSS animation`
5. `feat: response cadence rules — acknowledgment → products → follow-up`
6. `feat: salutation handling + category page context`
7. `test: persona accuracy — two voice fixture sets`
8. `test: cadence business rules — render order + conditional visibility`
9. `chore: update verification status`

---

## Out of Scope

- Preset voice selector — removed from design permanently
- Per-user personalization (Phase B — platform tier)

# Phase 2: Voice, Cadence & Conversational UX — Acceptance Criteria

**Branch:** `feat/phase2-voice-cadence`
**Plan:** `docs/features/smart-search-ux/phase-2-voice-admin/plan.md`

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Voice Examples section in admin AI settings | Screenshot: admin storefront settings page | 5 Q&A pairs visible — read-only question labels, editable answer textareas, pre-filled with defaults | | | |
| AC-UI-2 | "Reset to default" per voice example answer | Interactive: edit an answer, click reset | Answer reverts to `DEFAULT_VOICE_EXAMPLES` value; other answers unchanged; default key untouched | | | |
| AC-UI-3 | "Regenerate" button for surface strings | Screenshot: admin AI settings, below voice examples | Button visible; clicking regenerates all surface strings from current voice examples | | | |
| AC-UI-4 | Animated waiting indicator uses voice surface | Interactive: submit query in chat panel | Generated waiting filler (default: "um") with dots animating 1→5 in a loop; no spinner icon, no "Searching…" | | | |
| AC-UI-5 | Acknowledgment renders before products | Interactive: submit query returning products | Acknowledgment text (second person, "you're...") appears above product cards | | | |
| AC-UI-6 | Products render after acknowledgment | Interactive: same query as AC-UI-5 | Product cards appear below acknowledgment, above any follow-up | | | |
| AC-UI-7 | Follow-up + chips shown only when >3 products | Interactive: submit open-ended query returning >3 products | Follow-up question + chip badges visible below products | | | |
| AC-UI-8 | No follow-up or chips when ≤3 products | Interactive: submit specific query returning ≤3 | No follow-up question, no chips — just acknowledgment + products | | | |
| AC-UI-9 | Salutation gets natural response, no products | Interactive: type "hey" or "hello" | Generated salutation surface string shown, no product cards, no chips | | | |
| AC-UI-10 | AI failure shows generated fallback | Interactive: trigger AI failure | Generated `aiFailed` surface string shown, no product cards | | | |
| AC-UI-11 | No results shows generated message | Interactive: submit query with no matches | Generated `noResults` surface string, no machine text | | | |
| AC-UI-12 | Drawer title reads "Product Conversation" | Screenshot: panel open | Title text is "Product Conversation", not "Product Search" | | | |
| AC-UI-13 | Category page greeting references category | Interactive: open panel on a category page | Greeting uses `greeting.category` with category name, not homepage greeting | | | |
| AC-UI-14 | Homepage greeting is open-ended | Interactive: open panel on homepage | Greeting is open-ended discovery prompt, not category-specific | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | Voice examples stored on separate key from defaults | Code review: `ai-search/route.ts` PUT handler | Owner customizations stored as `ai_voice_examples`; `DEFAULT_VOICE_EXAMPLES` constant in code is untouched | | | |
| AC-FN-2 | Stored examples used when present, defaults as fallback | Code review: `search/route.ts` | `storedExamples.length > 0 ? storedExamples : DEFAULT_VOICE_EXAMPLES` | | | |
| AC-FN-3 | Surface strings generated on voice examples save | Code review: `ai-search/route.ts` PUT handler | AI called with voice examples as few-shot + generation prompt; result cached as `ai_voice_surfaces` | | | |
| AC-FN-4 | Surface strings cached, no AI call per page load | Code review: `ChatPanel.tsx` + `getPublicSiteSettings()` | ChatPanel reads cached strings from settings; no `chatCompletion` call at render time | | | |
| AC-FN-5 | Extraction prompt has separate acknowledgment and followUpQuestion | Code review: `search/route.ts` → `buildExtractionPrompt` | JSON schema has `acknowledgment` (always, second person) and `followUpQuestion` (optional) as separate fields | | | |
| AC-FN-6 | Follow-up rendering gated on product count in code | Code review: `ChatPanel.tsx` → `MessageBubble` | `followUpQuestion` + chips rendered only when `products.length > 3`; AI does not decide visibility | | | |
| AC-FN-7 | Salutation detection in route handler | Code review: `search/route.ts` | Greeting-only input detected by pattern; returns generated `salutation` surface string, no product query | | | |
| AC-FN-8 | Mixed greeting + intent treated as normal query | Code review: `search/route.ts` | "hey do you have dark roast" triggers full AI extraction, not salutation-only path | | | |
| AC-FN-9 | Waiting indicator uses generated surface string | Code review: `ChatPanel.tsx` | Loading state reads `waiting` key from cached surface strings, falls back to "um" | | | |
| AC-FN-10 | Follow-up narrowing is context-aware, no fixed order | Code review: `search/route.ts` → extraction prompt | Prompt instructs AI to pick narrowing question based on what user hasn't specified yet; no prescribed category sequence | | | |
| AC-FN-11 | Category page passes context to ChatPanel | Code review: `ChatPanel.tsx` + page context hook | Category name and product type available in `pageContext`; used for greeting selection | | | |
| AC-FN-12 | Acknowledgment uses second person | Code review: extraction prompt | Prompt specifies "speak directly to the customer: you're, you'd, your — never third person" | | | |

---

## Test Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | Persona accuracy — default voice (Set A) | Test run: `npm run test:ci` | Default voice examples produce warm/curious acknowledgments; second person throughout | | | |
| AC-TST-2 | Persona accuracy — alternative voice (Set B) | Test run: `npm run test:ci` | Alternative voice examples produce different tone (e.g. minimal/direct); confirms AI adapts to voice input | | | |
| AC-TST-3 | Personification comparison — Set A vs Set B | Test run: `npm run test:ci` | Same test queries produce measurably different output style between Set A and Set B; personification is working | | | |
| AC-TST-4 | Cadence rule: acknowledgment before products | Test run: `npm run test:ci` | MessageBubble test asserts acknowledgment div precedes product cards div in DOM order | | | |
| AC-TST-5 | Cadence rule: no follow-up when ≤3 products | Test run: `npm run test:ci` | MessageBubble with `products.length <= 3` does not render followUpQuestion or chips | | | |
| AC-TST-6 | Cadence rule: follow-up shown when >3 products | Test run: `npm run test:ci` | MessageBubble with `products.length > 3` renders followUpQuestion + chips | | | |
| AC-TST-7 | Cadence rule: chips only with follow-up | Test run: `npm run test:ci` | If `followUpQuestion` is empty/null, chips not rendered even if `followUps` array is non-empty | | | |
| AC-TST-8 | Cadence rule: AI failure → no junk results | Test run: `npm run test:ci` | `aiFailed: true` renders generated fallback, products array is empty | | | |
| AC-TST-9 | Salutation → no products | Test run: `npm run test:ci` | Greeting-only input returns salutation response without product cards | | | |
| AC-TST-10 | Follow-up chips: 2–4 word labels, no question marks | Test run: `npm run test:ci` | All fixture followUp entries are ≤4 words, contain no `?` character | | | |
| AC-TST-11 | No parroting — response doesn't repeat user input | Test run: `npm run test:ci` | Acknowledgment text does not contain the user's exact input string | | | |
| AC-TST-12 | Second person only — no third person | Test run: `npm run test:ci` | Acknowledgment does not contain "The customer", "The user", "They want" | | | |
| AC-TST-13 | Context-aware initialization | Test run: `npm run test:ci` | Homepage → open greeting; product page → product-specific greeting; category page → category-specific greeting | | | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1182+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Chat panel opens/closes without scroll issues | Interactive: open panel, close panel, scroll page | No double scrollbar, no stale pointer-events, page scrolls normally after close | | | |
| AC-REG-4 | Product images display in chat results | Interactive: submit query returning products | All product cards show images, no blank thumbnails | | | |
| AC-REG-5 | Admin AI settings page renders without errors | Screenshot: admin storefront settings | Existing persona textarea + new voice examples section both visible and functional | | | |
| AC-REG-6 | Context-aware conversation initialization | Interactive: navigate homepage → open panel; navigate product page → open panel; navigate category page → open panel | Each page type shows appropriate context-specific greeting | | | |

# Counter Iter-5: Context Grounding & Cadence Hardening — AC Verification Report

**Branch:** `feat/counter-iter5`
**Commits:** 5
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

> Screenshot/Interactive/Exercise are the default. At least 50% must use screenshot-based methods. Dev server: `http://localhost:3000`, Gemini configured.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Category page Counter query — scoped results + price sort | Interactive: Counter on `/categories/central-america`, ask "what's the most expensive coffee from here?" → screenshot | Products returned are Central America category only; sorted price-descending; no zero-results surface | | | |
| AC-UI-2 | Vague Counter query — full cadence | Interactive: Counter on homepage, ask "what's good today?" → screenshot | Acknowledgment bubble visible above products; follow-up chips visible; result count ≤ 7; no pagination control | | | |
| AC-UI-3 | Merch equipment query — correct path | Interactive: Counter on `/products/origami-air-dripper`, ask "do you have a pour over coffee maker?" → screenshot | Origami Air Dripper in results OR a no-results message that doesn't assert catalog width ("we have a few styles") | | | |
| AC-UI-4 | Stock question — deflection | Interactive: ask "do you have the Italian Roast in stock?" → screenshot | Response does NOT contain "we have that in stock" or similar assertion; redirects to product page | | | |
| AC-UI-5 | Greeting — no location language | Interactive: fresh Counter open on homepage → screenshot | Greeting does not contain "welcome in", "come on in", "step up", or any physical-space implication | | | |
| AC-UI-6 | Session greeting awareness — subsequent open shows standby | Interactive: open Counter, close without typing, re-open → screenshot | Second open shows the `standby` surface (passive "I'm here" copy), NOT the same salutation as first open | | | |
| AC-UI-7 | Reset shows standby, not salutation | Interactive: start a conversation, click reset → screenshot | Post-reset message is passive standby copy, not a prompting salutation | | | |
| AC-UI-8 | First open is still context-aware | Interactive: fresh Counter on `/products/origami-air-dripper` → screenshot | First-open greeting references the product, not generic homepage greeting | | | |
| AC-UI-9 | Skeleton while surfaces load | Screenshot: open Counter immediately after `resetSurfaces()` (before load completes) | A skeleton loading state is visible in the message area, not a blank panel or hardcoded default text | | | |
| AC-UI-10 | Cadence: ≤3 results → no follow-up chips | Interactive: submit a highly specific query that returns 1-3 results → screenshot | No follow-up chips rendered below results | | | |
| AC-UI-11 | Cadence: ≥4 results → follow-up chips shown | Interactive: submit a vague query returning 4+ results → screenshot | Follow-up chips rendered | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `from=categories/{slug}` pre-scopes `whereClause` | Code review: `app/api/search/route.ts` → `pageFrom` parse → `whereClause.categories` set | When `from` matches `categories/{slug}`, `whereClause.categories = { some: { slug } }` added before extraction | | | |
| AC-FN-2 | App-side price sort applied post-query | Code review: `app/api/search/route.ts` → after Prisma results, before response | When `filtersExtracted.sortBy === "price_desc"`, products sorted by min variant price desc; `"price_asc"` sorts asc | | | |
| AC-FN-3 | Cadence enforcement — `products.length <= 3` clears followUps | Code review: `app/api/search/route.ts` → after products resolved | Server zeroes out `followUps` and `followUpQuestion` when result count is 1–3 | | | |
| AC-FN-4 | Cadence fallback when `agenticData === null` and `forceAI` | Code review: `app/api/search/route.ts` → `forceAI && !agenticData` branch | Response includes `acknowledgment` from `aiFailed` voice surface; client renders Counter UI, not raw pagination | | | |
| AC-FN-5 | Merch equipment examples in extraction prompt | Code review: `buildExtractionPrompt()` in `app/api/search/route.ts` | `productType: "merch"` description explicitly includes: pour-over drippers, moka pot, grinder, kettle, Aeropress, filters, brewing gear | | | |
| AC-FN-6 | Stock deflection in system prompt guardrails | Code review: `buildSystemPrompt()` → `guardrailSection` | Contains: "Never state or imply stock levels. If asked about availability, redirect to the product page." | | | |
| AC-FN-7 | Banned search-style phrases in both prompts | Code review: `buildSystemPrompt()` roleSection + `buildExtractionPrompt()` acknowledgment rules | Both contain explicit ban on: "find", "matching", "nothing matching", "I can't think of", "I'm not sure", "I don't have" | | | |
| AC-FN-8 | `greeting.home` generation prompt avoids location/transactional language | Code review: `lib/ai/voice-surfaces.server.ts` → generation prompt | `greeting.home` description includes: "no 'welcome in', 'come on in', 'get started', or physical-space references" | | | |
| AC-FN-9 | `standby` key in `VoiceSurfaces` + generation prompt | Code review: `lib/ai/voice-surfaces.server.ts` + `lib/store/chat-panel-store.ts` types | `VoiceSurfaces` interface has `standby: string`; generation prompt includes `standby` key with passive "I'm here" guidance | | | |
| AC-FN-10 | `DEFAULT_VOICE_SURFACES` is neutral (no Artisan Roast copy) | Code review: `lib/ai/voice-surfaces.ts` | No proper nouns, no store-specific phrasing; all values are generic non-committal placeholders | | | |
| AC-FN-11 | `sessionGreeted` in Zustand store | Code review: `lib/store/chat-panel-store.ts` | Store has `sessionGreeted: boolean` (default false); `resetSurfaces()` resets it to false | | | |
| AC-FN-12 | Greeting effect uses `sessionGreeted` from store, not React ref | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → greeting `useEffect` | `hasGreeted` ref is removed; `sessionGreeted` from store drives the branch logic | | | |
| AC-FN-13 | Subsequent open (sessionGreeted=true) shows `standby`, not `salutation` | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → greeting effect `else` branch | When `sessionGreeted === true` and messages empty: `voiceSurfaces.standby` is added, not `voiceSurfaces.salutation` | | | |
| AC-FN-14 | `handleReset` uses `standby` surface | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → `handleReset` | `handleReset` inserts `voiceSurfaces.standby`, not `voiceSurfaces.salutation` | | | |
| AC-FN-15 | Eager surface regen triggered after Q&A save | Code review: `app/admin/settings/ai/_components/SmartSearchSection.tsx` → save handler | After PUT succeeds, `POST /api/admin/settings/ai-search/regenerate-surfaces` called async, then `resetSurfaces()` | | | |
| AC-FN-16 | ChatPanel renders skeleton while `voiceSurfaces === null` | Code review: `app/(site)/_components/ai/ChatPanel.tsx` → message list render | When `isOpen && voiceSurfaces === null && messages.length === 0`, skeleton bubble renders | | | |

## Test Coverage Acceptance Criteria

> Fixture-intent rule: full input→route path tested. AC-TST-10 through AC-TST-12 run via `npm run test:integration` (local only, dev server required, excluded from `test:ci`).

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | `ai=true` always reaches agentic path regardless of NL heuristic | Test run: `npm run test:ci` | Test asserts `extractAgenticFilters` called when `ai=true&q=xyz`; NOT called when `ai=false&q=xyz` | | | |
| AC-TST-2 | Open-ended Counter query returns `acknowledgment` in response | Test run: `npm run test:ci` | Mocked extraction with `acknowledgment: "..."` → response JSON has `acknowledgment` non-null | | | |
| AC-TST-3 | Category slug from `from` param scopes Prisma `where` | Test run: `npm run test:ci` | With `from=categories/central-america`, Prisma mock asserts `where.categories = { some: { slug: "central-america" } }` | | | |
| AC-TST-4 | `products.length <= 3` zeroes followUps in route response | Test run: `npm run test:ci` | Mocked extraction + 2 Prisma products → response `followUps` is `[]` | | | |
| AC-TST-5 | `products.length >= 4` allows followUps through | Test run: `npm run test:ci` | Mocked extraction with followUps + 5 Prisma products → response `followUps` non-empty | | | |
| AC-TST-6 | `buildSystemPrompt` contains stock deflection rule | Test run: `npm run test:ci` | `build-system-prompt.test.ts` asserts output contains "never state or imply stock" (case-insensitive) | | | |
| AC-TST-7 | Both prompts ban search-oriented language | Test run: `npm run test:ci` | Tests assert prompts contain "nothing matching", "I can't think of", "I'm not sure" in banned-phrase lists | | | |
| AC-TST-8 | `buildExtractionPrompt` includes merch equipment examples | Test run: `npm run test:ci` | Test asserts prompt contains "pour-over" and "brewing gear" in `merch` description | | | |
| AC-TST-9 | `buildSystemPrompt` with `pageContext` includes context section | Test run: `npm run test:ci` | Output contains context string when pageContext provided; absent when not provided | | | |
| AC-TST-10 | Integration scaffold exists and runs | Test run: `npm run test:integration` | Script runs against `localhost:3000`; `__tests__/integration/` excluded from `test:ci`; Jest config confirmed | | | |
| AC-TST-11 | Intent classification — canonical query fixtures pass | Test run: `npm run test:integration` | "how do I brew a pour over?" → `intent: "how_to"`, `products: []`; "reorder last month's bag" → `intent: "reorder"`, `products: []`; "something fruity and light" → `intent: "product_discovery"`, `acknowledgment` non-null | | | |
| AC-TST-12 | Cadence shape — full round-trip fixtures | Test run: `npm run test:integration` | "what's good today?" → `acknowledgment` non-null, `products.length <= 7`; category page query → products non-empty, in category | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1261+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Non-category Counter queries unaffected | Interactive: Counter on homepage, submit any query | No category pre-scope applied; absence of `from=categories/` handled gracefully | | | |
| AC-REG-4 | Product page first-open greeting still fires (context-aware) | Interactive: fresh Counter on `/products/origami-air-dripper` | First-open greeting references product; `sessionGreeted` transitions to true | | | |
| AC-REG-5 | Coffee queries with specific filters still work | Interactive: ask "I want a light Ethiopian with floral notes" → screenshot | Products filtered correctly by origin/roast/flavor; acknowledgment present; correct cadence | | | |

---

## Agent Notes

_(Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.)_

## QC Notes

_(Main thread writes fix notes here: what failed, what was changed, re-verification results.)_

## Reviewer Feedback

_(Human writes review feedback here. Items marked for revision go back into the iteration loop.)_

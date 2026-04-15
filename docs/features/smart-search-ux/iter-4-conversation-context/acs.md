# Iter 4: Conversation Context & Multi-Product Search — AC Verification Report

**Branch:** `feat/conversation-context`
**Commits:** 1a, 1b, 1c, 2, 3, 4, 9, 9b, 9c, 9d, 10, 10b, 11, 12b, 14
**Iterations:** TBD

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-0a | Counter shows skeleton while surfaces load | Screenshot: Counter open immediately after hard refresh (empty cache) | Skeleton visible in greeting area — no TS fallback text flash before real voice arrives; input field is empty (no placeholder) | | | |
| AC-UI-0b | Counter greeting matches Q&A voice after init | Interactive: open Counter fresh (no cached surfaces) — wait for init — screenshot | Greeting text is consistent with the persona from DEFAULT_VOICE_EXAMPLES — not generic AI-assistant copy | | | |
| AC-UI-1 | Counter shows salutation on re-open — no repeated greeting | Interactive: open Counter, close, reopen (same session with no conversation) | Short in-character `salutation` surface shown — no "Hey!" opener, no full greeting replay | | | |
| AC-UI-2 | Reset shows salutation — no greeting re-injected | Interactive: open Counter, have a conversation, click reset | Messages cleared, `salutation` surface shown as sole message — no repeated greeting | | | |
| AC-UI-3 | Input placeholder removed — empty input field | Code review: `app/(site)/_components/ai/ChatPanel.tsx` | No placeholder text on the text input — `placeholder` prop absent or empty string; hardcoded "what are you after today?" string gone | | | |
| AC-UI-4 | First-open greeting carries personality — one-time per session | Screenshot: fresh session Counter open | Full `greeting.home/product/category` surface shown once; re-opens and resets do not re-greet | | | |
| AC-UI-5 | Conversation memory — follow-up narrows prior context | Interactive: type "something fruity" → submit → type "single origin?" → screenshot | Second response understands "fruity single origin" — returns fruity single-origin coffees | | | |
| AC-UI-6b | "Test Counter" button visible in admin Smart Search settings | Screenshot: admin `/admin/settings/ai` page | Button labeled "Test Counter" (or equivalent) visible in Smart Search Assistant section | | | |
| AC-UI-6c | Clicking "Test Counter" opens Counter drawer in admin context | Interactive: click "Test Counter" button → screenshot | Counter drawer opens showing greeting — no navigation away from admin settings page | | | |
| AC-UI-6d | Counter in admin preview uses store-specific vocabulary (grounded RAG) | Interactive: open admin Counter → type "something fruity" → screenshot response | Acknowledgment or product names contain tasting notes/terms from the store's actual catalog (not generic AI copy); at least one product returned matches a real catalog entry | | | |
| AC-UI-7 | Domain-aware intent resolution | Interactive: type "looking for a gift for my mom, something approachable" → screenshot | Returns smooth/balanced coffees (not zero results); follow-up chips use recipient context ("She loves bold" / "Something smooth") not generic roast labels | | | |
| AC-UI-7b | Non-coffee query returns relevant products | Interactive: type "do you have mugs?" on homepage → screenshot | Returns merch products matching the query, not coffee — extraction pipeline product-type-aware | | | |
| AC-UI-8 | Follow-up chips never lead to zero results | Interactive: click each chip returned after a query → screenshot after each | Every chip click returns at least 1 product — no "nothing matches" after chip narrowing | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-0a | Lazy init fires on first Counter open | Code review: `app/api/settings/voice-surfaces/route.ts` | When `ai_voice_surfaces` absent from DB and AI configured: calls `generateVoiceSurfaces`, upserts result to `ai_voice_surfaces`, returns generated surfaces — not TS fallback | | | |
| AC-FN-0b | Lazy init uses stored examples or defaults | Code review: `app/api/settings/voice-surfaces/route.ts` | Reads `ai_voice_examples` from DB first; falls back to `DEFAULT_VOICE_EXAMPLES` if absent | | | |
| AC-FN-0c | Surfaces not regenerated eagerly in PUT | Code review: `app/api/admin/settings/ai-search/route.ts` | PUT handler no longer calls `generateVoiceSurfaces` directly; instead deletes `ai_voice_surfaces` when `voiceExamples` field is present in payload and surfaces currently exist in DB | | | |
| AC-FN-0d | Delete-on-change only when surfaces exist | Code review: `app/api/admin/settings/ai-search/route.ts` | Delete is conditional — only after confirming the record exists; no-op on fresh installs | | | |
| AC-FN-0e | Seed does not write `ai_voice_surfaces` | Code review: `prisma/seed/settings.ts` | No `ai_voice_surfaces` key seeded — only `ai_voice_examples`; lazy init is the sole writer of surfaces | | | |
| AC-FN-1 | Conversation history passed to extraction prompt | Code review: `app/api/search/route.ts` + `app/(site)/_components/ai/ChatPanel.tsx` | Prior user/assistant turns included in AI extraction call | | | |
| AC-FN-2 | History limited to last 5 turns | Code review: `app/api/search/route.ts` | Only last 5 turns sent to avoid token bloat | | | |
| AC-FN-3 | Re-open with no conversation shows salutation | Code review: `app/(site)/_components/ai/ChatPanel.tsx` | When panel opens and `messages.length === 0` (after reset or session close), `voiceSurfaces.salutation` is shown as sole message — no full greeting | | | |
| AC-FN-4 | Reset handler shows salutation — not greeting | Code review: `app/(site)/_components/ai/ChatPanel.tsx` handleReset | `handleReset` clears messages, then adds `voiceSurfaces.salutation` as sole message; does not call `getContextGreeting()` | | | |
| AC-FN-5 | Extraction prompt handles non-coffee products | Code review: `app/api/search/route.ts` buildExtractionPrompt | Prompt includes merch product types; `filtersExtracted` has a `productType` field | | | |
| AC-FN-6 | Prisma query handles merch filters | Code review: `app/api/search/route.ts` whereClause | When `productType` is MERCH, search uses name/description matching without coffee-specific filters; `type: ProductType.COFFEE` absent from whereClause | | | |
| AC-FN-7 | Follow-up chips pre-validated server-side | Code review: `app/api/search/route.ts` response builder | Before returning followUps to client, each chip is tested against the catalog; chips returning 0 products are filtered out | | | |

---

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | `GET /api/settings/voice-surfaces` — lazy init: calls `generateVoiceSurfaces` and upserts when no record exists and AI is configured | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts `generateVoiceSurfaces` mock called once and `prisma.siteSettings.upsert` called with `{ where: { key: "ai_voice_surfaces" } }` when `findUnique` returns null and `isAIConfigured` returns true | | | |
| AC-TST-2 | `GET /api/settings/voice-surfaces` — cached path: returns DB value without calling `generateVoiceSurfaces` | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts `generateVoiceSurfaces` mock never called and response body matches stored JSON | | | |
| AC-TST-3 | `GET /api/settings/voice-surfaces` — falls back to `DEFAULT_VOICE_EXAMPLES` when `ai_voice_examples` absent | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts `generateVoiceSurfaces` called with `DEFAULT_VOICE_EXAMPLES` when `ai_voice_examples` findUnique returns null | | | |
| AC-TST-4 | `GET /api/settings/voice-surfaces` — falls back to `DEFAULT_VOICE_SURFACES` when AI not configured | Test run: `npm run test:ci` | `app/api/settings/voice-surfaces/__tests__/route.test.ts` asserts response deep-equals `DEFAULT_VOICE_SURFACES` and `upsert` never called when `isAIConfigured` returns false | | | |
| AC-TST-5 | `PUT /api/admin/settings/ai-search` — cache bust: deletes `ai_voice_surfaces` when `voiceExamples` in payload and record exists | Test run: `npm run test:ci` | `app/api/admin/settings/ai-search/__tests__/route.test.ts` asserts `prisma.siteSettings.delete` called with `{ where: { key: "ai_voice_surfaces" } }` and `generateVoiceSurfaces` NOT called | | | |
| AC-TST-6 | `PUT /api/admin/settings/ai-search` — cache bust is no-op when `ai_voice_surfaces` does not exist | Test run: `npm run test:ci` | `app/api/admin/settings/ai-search/__tests__/route.test.ts` asserts delete not called when `findUnique({ where: { key: "ai_voice_surfaces" } })` returns null | | | |
| AC-TST-7 | `GET /api/search` — conversation history injected into `chatCompletion` messages when `history` param is non-empty | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `chatCompletionMock` called with `messages` array containing prior user message text from `history` param | | | |
| AC-TST-8 | `GET /api/search` — history capped at 5 turns | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts history segment of `chatCompletionMock` call has ≤ 10 messages when a 7-turn `history` array is passed | | | |
| AC-TST-9 | `GET /api/search` — `how_to` intent: no DB query, `products` empty | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `productFindManyMock` never called and `data.products` equals `[]` when extraction returns `intent: "how_to"` | | | |
| AC-TST-10 | `GET /api/search` — `reorder` intent: in-character redirect, `products` empty | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `data.products` equals `[]` and `data.acknowledgment` contains `"account"` when extraction returns `intent: "reorder"` | | | |
| AC-TST-11 | `GET /api/search` — merch query omits `type: COFFEE` and coffee-specific filters | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `productFindManyMock` called without `.where.type === "COFFEE"` and without `.where.categories` when extraction returns `productType: "merch"` | | | |
| AC-TST-12 | `GET /api/search` — result reconciliation: `recommendedProductName` product sorted to index 0 | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `data.products[0].name` equals `recommendedProductName` from extraction when that product appears in DB results | | | |
| AC-TST-13 | `buildSystemPrompt()` — domain knowledge section present: contains origin-to-flavor and experiential-term mappings | Test run: `npm run test:ci` | `app/api/search/__tests__/build-system-prompt.test.ts` asserts `buildSystemPrompt([], "")` output contains `"Ethiopia"` and `"approachable"` | | | |
| AC-TST-14 | `GET /api/search` — salutation query: `isSalutation: true`, empty products, acknowledgment from salutation surface | Test run: `npm run test:ci` | `app/api/search/__tests__/route.test.ts` asserts `data.isSalutation === true`, `data.products` equals `[]`, acknowledgment matches `aiVoiceSurfaces.salutation` when `q=hey&ai=true` | | | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 1216+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck passes clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors | | | |
| AC-REG-3 | Roast-level keyword queries still work | Code review: `app/api/search/route.ts` | "dark roast" → category filter still applied correctly | | | |
| AC-REG-4 | Single-turn coffee queries still work | Interactive: type "something bold for French press" → screenshot | Returns appropriate dark/bold coffees with correct acknowledgment and follow-ups | | | |
| AC-REG-5 | Salutation detection still works | Interactive: type "hey" → screenshot | Returns salutation surface string, no products | | | |

---

## Agent Notes

_Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken._

## QC Notes

_Main thread writes fix notes here: what failed, what was changed, re-verification results._

## Reviewer Feedback

_Human writes review feedback here. Items marked for revision go back into the iteration loop._

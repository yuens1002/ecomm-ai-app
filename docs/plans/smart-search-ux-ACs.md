# Smart Search UX — Acceptance Criteria

**Branch:** `feat/smart-search-ux`
**Plan:** `docs/features/smart-search-ux/plan.md`
**Dev server:** `http://localhost:3000`
**Test command:** `npm run test:ci`
**Precheck:** `npm run precheck`

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | SmartSearchIcon in desktop header — when AI configured | Static: screenshot `http://localhost:3000` at 1280×800 | SmartSearchIcon visible in header; no separate keyword Search icon alongside it | | | |
| AC-UI-2 | Traditional Search icon in desktop header — when AI NOT configured | Static: screenshot `http://localhost:3000` at 1280×800 (AI keys unset) | Standard Search icon visible in header linking to `/search`; no SmartSearchIcon present | | | |
| AC-UI-3 | One search icon in mobile sheet — correct icon per AI config | Interactive: open hamburger menu at 375×812 → screenshot (both AI-on and AI-off states) | AI configured: SmartSearchIcon only; AI not configured: keyword Search link only; never both | | | |
| AC-UI-4 | Chat panel opens — desktop, SmartSearchIcon click | Interactive: click SmartSearchIcon at 1280×800 → screenshot | Panel visible on right side; main content area narrows to ~75%; panel shows header, input, and context strip | | | |
| AC-UI-5 | Desktop layout: panel is full-height alongside header + content | Static: screenshot with panel open at 1280×800 | Panel column spans from top of page to bottom (alongside header row AND content row); border-l separates panel from left column | | | |
| AC-UI-6 | Desktop panel animated reflow | Interactive: click SmartSearchIcon → screenshot after transition | Panel occupies ~25% viewport width; main content occupies ~75%; no layout jump | | | |
| AC-UI-7 | Mobile panel opens at bottom — SmartSearchIcon click | Interactive: click SmartSearchIcon at 375×812 → screenshot | Panel appears at bottom 25dvh; page content visible above; panel has input and context strip | | | |
| AC-UI-8 | Context strip — PDP page | Interactive: navigate to any product page → open panel → screenshot | Context strip shows product icon and product name in small muted text at panel bottom | | | |
| AC-UI-9 | Panel — user message bubble | Interactive: open panel → type "fruity Ethiopian for a V60" → submit → screenshot | Right-aligned pill bubble with query text visible in panel message area | | | |
| AC-UI-10 | Panel — AI response card with explanation + products | Interactive: same query → screenshot after response loads | Assistant card shows SmartSearchIcon, explanation text, follow-up chips, and product cards | | | |
| AC-UI-11 | Panel — follow-up chips send next query | Interactive: click a follow-up chip after initial result | New user message bubble with chip text appears; new AI response card loads | | | |
| AC-UI-12 | Panel — empty/no-results state | Interactive: submit query that returns 0 products → screenshot | Friendly no-results message visible; no broken layout | | | |
| AC-UI-13 | Panel — persists across navigation | Interactive: open panel → submit query → click product link → screenshot on new page | Panel still open on new page; previous messages visible in panel | | | |
| AC-UI-14 | Panel — close button collapses panel | Interactive: open panel → click × → screenshot | Panel collapses; left column reflows back to full width; no panel border visible | | | |
| AC-UI-15 | Admin — AI Search settings section visible when AI configured | Static: screenshot `/admin/settings/storefront` (with AI keys set) | "Smart Search" or "AI Search" section visible with Voice Persona textarea and "Reframe with AI" button | | | |
| AC-UI-16 | Admin — voice persona reframe flow | Interactive: enter text → click "Reframe with AI" → screenshot after response | AI-reframed version shown in preview panel; "Use this" and "Try again" buttons visible | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `SiteSettings` has `aiVoicePersona` (no enable toggle, no spotlight field) | Code review: `lib/site-settings.ts` | `aiVoicePersona: string` present; no `aiSearchEnabled` or `aiSearchHomepageSpotlight`; `mapSettingsRecord` maps `ai_voice_persona` | | | |
| AC-FN-2 | Feature gated by `isAIConfigured()` — no separate toggle | Code review: `app/(site)/layout.tsx`, `app/(site)/_components/layout/SiteHeaderWrapper.tsx` | Both call `isAIConfigured()` to gate the feature; no reference to `aiSearchEnabled` | | | |
| AC-FN-3 | One search icon — mutually exclusive by AI config | Code review: `app/(site)/_components/layout/SiteHeader.tsx` | Conditional renders SmartSearchIcon (toggles panel) when `aiConfigured`, or `<Search>` link to `/search` when not — never both; no Dialog imports or JSX | | | |
| AC-FN-4 | SmartSearchIcon toggles panel — no navigation | Code review: `app/(site)/_components/layout/SiteHeader.tsx` | SmartSearchIcon button has `onClick` calling store `toggle()`; no `Link` wrapper, no `href` | | | |
| AC-FN-5 | Chat panel store: `isOpen`, `messages`, `pageContext` fields | Code review: `stores/chat-panel-store.ts` | All three fields in store interface; `open`, `close`, `toggle`, `setPageContext` actions present | | | |
| AC-FN-6 | Panel persists across route changes | Code review: `app/(site)/layout.tsx` | `ChatPanel` mounted once in layout (not per-page); store not reset on navigation | | | |
| AC-FN-7 | Panel is full-height sticky column alongside left column | Code review: `app/(site)/layout.tsx` | Outer wrapper is `flex min-h-screen`; panel aside has `sticky top-0 h-screen`; left column is `flex-1 min-w-0 flex flex-col` containing header + main + footer | | | |
| AC-FN-8 | Context strip reads `pageContext` from store | Code review: `app/(site)/_components/ai/ChatPanel.tsx` | Context strip renders `{pageContext.icon} {pageContext.title}` when set; falls back to prettified pathname when null | | | |
| AC-FN-9 | Panel passes `ai=true` to search API | Code review: `app/(site)/_components/ai/ChatPanel.tsx` | Search call includes `ai=true` query param | | | |
| AC-FN-10 | `ai=true` accepted by search API | Code review: `app/api/search/route.ts` | `forceAI = searchParams.get("ai") === "true"` | | | |
| AC-FN-11 | Extended `FiltersExtracted` has `isOrganic`, `processing`, `variety`, `priceMaxCents`, `priceMinCents`, `sortBy` | Code review: `app/api/search/route.ts` | All 6 new fields in interface; validation/normalization for each; Prisma whereClause updated | | | |
| AC-FN-12 | `sortBy` maps to `orderBy` clause | Code review: `app/api/search/route.ts` | `newest` → `createdAt desc`, `price_asc` → price ascending, `top_rated` → `averageRating desc` | | | |
| AC-FN-13 | Text search OR clause covers `processing`, `variety`, `altitude` | Code review: `app/api/search/route.ts` | OR arrays in keyword and token branches include `processing`, `variety`, `altitude` | | | |
| AC-FN-14 | Voice persona injected into system prompt; default when empty | Code review: `app/api/search/route.ts` | `aiVoicePersona.trim()` condition present; non-empty → persona prefix; empty → default warm persona | | | |
| AC-FN-15 | Admin reframe endpoint is auth-gated | Code review: `app/api/admin/reframe-voice-persona/route.ts` | Session check present; non-admin returns 401/403; Zod validates `rawPersona` | | | |
| AC-FN-16 | `SmartSearchIcon` is a custom SVG — not a lucide import | Code review: `components/shared/icons/SmartSearchIcon.tsx` | File contains inline SVG path(s), not a re-export of a lucide component | | | |

---

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-TST-1 | Search route — voice persona prepended to system prompt when set | Test run: `npx jest --ci "app/api/search"` | Test asserts `chatCompletionMock` called with messages[0].content containing the persona string | | | |
| AC-TST-2 | Search route — default persona used when `aiVoicePersona` is empty | Test run: `npx jest --ci "app/api/search"` | Test asserts `chatCompletionMock` system message contains default persona text | | | |
| AC-TST-3 | Search route — `ai=true` forces extraction; keyword query without it does not | Test run: `npx jest --ci "app/api/search"` | Two tests: `?q=ethiopia&ai=true` → `chatCompletionMock` called; `?q=ethiopia` → not called | | | |
| AC-TST-4 | Search route — `isOrganic=true` filter applied when extracted | Test run: `npx jest --ci "app/api/search"` | Test asserts `productFindManyMock` called with `where.isOrganic = true` | | | |
| AC-TST-5 | Search route — `priceMaxCents` filter applied to `purchaseOptions.priceInCents` | Test run: `npx jest --ci "app/api/search"` | Test asserts `where.variants.some.purchaseOptions.some.priceInCents.lte` set correctly | | | |
| AC-TST-6 | Reframe endpoint — returns 401 for unauthenticated request | Test run: `npx jest --ci "app/api/admin/reframe-voice-persona"` | Test asserts response status 401 when auth returns null | | | |
| AC-TST-7 | Reframe endpoint — calls `chatCompletion` and returns `reframedPersona` | Test run: `npx jest --ci "app/api/admin/reframe-voice-persona"` | Test asserts `chatCompletionMock` called; response JSON contains `reframedPersona` string | | | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | All existing tests pass | Test run: `npm run test:ci` | 24+ tests pass, 0 failures | | | |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-3 | Homepage renders without smart search spotlight section | Static: screenshot `http://localhost:3000` at 1280×800 | Hero → recommendations → featured products; no extra AI section; SmartSearchIcon visible in header | | | |
| AC-REG-4 | `/search` page still functional | Static: screenshot `/search?q=ethiopia` at 1280×800 | Search bar at top, results below; page renders correctly (used as keyword fallback when AI not configured) | | | |

---

## Agent Notes
_Filled by verification sub-agent during `/ac-verify`_

## QC Notes
_Filled by main thread after reading sub-agent report_

## Reviewer Feedback
_Filled by human during final review_

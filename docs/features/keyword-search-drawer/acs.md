# Keyword Search Drawer — AC Verification Report

**Branch:** `feat/keyword-search-drawer`
**Commits:** 0 (planning)
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

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Search trigger replaces `/search` link in site header (desktop + mobile sheet nav) | Screenshot: header at md+ and mobile sheet open | Trigger renders; clicking it opens the drawer (not navigating to `/search`) | | | |
| AC-UI-2 | Drawer empty state shows search input + chip row + curated products section | Screenshot: drawer open, no query, desktop | Input visible, autofocus; up to 6 chips render; curated products grid visible | | | |
| AC-UI-3 | Drawer fullscreen on mobile (`<md`) | Screenshot: drawer open at 375px viewport | Drawer fills viewport, no peek of underlying page | | | |
| AC-UI-4 | Drawer top-anchored on desktop (`≥md`) with backdrop blur | Screenshot: drawer open at 1280px viewport | Drawer ≤80vh, anchored from top, underlying page visible behind blurred backdrop | | | |
| AC-UI-5 | Typing query → results render with fade-in animation | Interactive: type "ethiopia" → screenshot mid-fade | Result cards appear with `animate-in fade-in-0` (or stagger); no count text shown above results | | | |
| AC-UI-6 | Zero-results state shows "No results found for 'X'" + curated products | Interactive: type "zzzzz" → screenshot | Heading reads `No results found for "zzzzz"`; chips still visible; curated products section present below | | | |
| AC-UI-7 | "air dripper" returns the Origami Air Dripper merch as top result | Interactive: type "air dripper" → screenshot | Origami Air Dripper appears in top 3; no purely-coffee spurious matches dominate | | | |
| AC-UI-8 | Fuzzy match: "Yirgachefe" (1 typo) returns Ethiopia Yirgacheffe | Interactive: type "Yirgachefe" → screenshot | Ethiopia Yirgacheffe appears in top results despite typo | | | |
| AC-UI-9 | Chip click navigates to category page | Interactive: click any chip → screenshot landing | Navigates to `/categories/{slug}`; drawer closes |  | | |
| AC-UI-10 | Admin nav has "Search" item under Settings (between Commerce and Shipping) | Screenshot: admin sidebar Settings group expanded | Item visible in correct order; clicking navigates to `/admin/settings/search`; active-state highlighting works (per `docs/navigation/README.md`) | | | |
| AC-UI-11 | Admin Search page renders three fields: heading input, top-categories multi-select, curated category single-select | Screenshot: `/admin/settings/search` desktop | All three fields render with labels and helper text; matches CLAUDE.md admin conventions (flat card, `space-y-12`, `max-w-[72ch]` inputs) | | | |
| AC-UI-12 | Chips section heading text input | Interactive: type a custom heading (e.g. "Browse"), Save → reopen drawer → screenshot drawer header above chips | Heading shown above the chip row reflects the input value (replaces default "Top Categories"); empty value rejected with inline error | | | |
| AC-UI-13 | Top Categories multi-select with chip-and-delete UX | Interactive: open multi-select, pick 3 categories → screenshot showing chips render with × delete buttons inline | Each selected category appears as a chip; × removes it from selection | | | |
| AC-UI-14 | Top Categories: 6-cap UX | Interactive: select 6 categories, attempt 7th → screenshot | Add affordance disabled at 6; "6 / 6 selected" hint visible; selecting 7th is impossible from UI | | | |
| AC-UI-15 | Curated category single-select dropdown | Interactive: open dropdown → screenshot showing existing categories (including hidden `isVisible: false` ones) | Dropdown is searchable; both visible and hidden categories listed; can be set to "None" / cleared | | | |
| AC-UI-16 | Any existing category can be used as curated, regardless of menu visibility | Exercise: create category without label association (won't appear in menu), set as curated, refresh storefront → screenshot drawer | Category's products show in curated section even though category is not in menu; categories with label associations also work | | | |
| AC-UI-17 | Drawer open/close animation is smooth (slide + fade, ≤200ms) | Interactive: open + close drawer → screenshot mid-animation | Drawer slides into view from top (or fades), no jank, no layout shift on open | | | |
| AC-UI-18 | Initial loading skeleton while index fetches | Screenshot: drawer first-open before `/api/search/index` resolves | Skeleton shows for chip row + curated products grid; replaced by real content within 1s on warm cache | | | |
| AC-UI-19 | Error state when index fetch fails | Exercise: simulate 500 from `/api/search/index` → screenshot | Friendly message ("Search is temporarily unavailable") replaces the curated grid; chips still navigable as fallback | | | |
| AC-UI-20 | Microcopy is clean and non-AI ("Search products...", not "Ask anything…") | Code review + screenshot: drawer input placeholder | Placeholder reads `Search products…` (or admin-configurable equivalent); no agentic-era language anywhere | | | |
| AC-UI-21 | Admin "Save" feedback (toast on success, error on failure) | Interactive: change settings, click Save → screenshot toast | Sonner toast confirms save; error toast on validation failure (e.g. >6 categories) | | | |
| AC-UI-22 | First-time empty admin state — drawer when no settings configured | Screenshot: drawer with `searchDrawerChipCategories: []` and `searchDrawerCuratedCategory: null` | Empty state hint: "Configure search drawer in admin settings →" link to admin (only visible to admin users); for customers, drawer renders with input only, no broken sections | | | |
| AC-UI-23 | Drawer body matches design references (`.screenshots/keyword-search-drawer/general-layout.png` desktop, `mobike.png` mobile) | Screenshot comparison: drawer at desktop + mobile | Headers, spacing, chip wrapping, section hierarchy match the design references; matches CLAUDE.md admin UI conventions where applicable (`space-y-12` major, `space-y-6` minor) | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `GET /api/search/index` returns catalog with all product types (coffee + merch) | Code review: `app/api/search/index/route.ts` — no `type:` filter | Response includes both `COFFEE` and `MERCH` products | | | |
| AC-FN-2 | Client-side search runs on every keystroke without debounce | Code review: `useSearchIndex.ts` + drawer input handler | `onChange` directly invokes MiniSearch `.search()`; no `setTimeout` / debounce around it | | | |
| AC-FN-3 | MiniSearch configured with field weights (name > tasting notes > description) | Code review: `useSearchIndex.ts` MiniSearch options | `boost: { name: 3, tastingNotes: 2, description: 1 }` (or equivalent) | | | |
| AC-FN-4 | MiniSearch fuzzy matching enabled | Code review: `useSearchIndex.ts` search call | `.search(q, { fuzzy: 0.2, prefix: true })` | | | |
| AC-FN-5 | UserActivity logging is debounced ~500ms after last keystroke | Code review: `useSearchAnalytics.ts` | `setTimeout`/debounce ~500ms before POST to activity endpoint | | | |
| AC-FN-6 | Drawer doesn't update URL while open | Code review: `SearchDrawer.tsx` + input handler | No `router.push` / `useSearchParams.set` calls in keystroke path | | | |
| AC-FN-7 | Admin Zod schema rejects >6 chip categories | Code review: `app/api/admin/search-drawer-settings/route.ts` PUT validation | Zod `.array(z.string()).max(6)` returns 400 with >6 items | | | |
| AC-FN-8 | Legacy `/api/search` includes merch (no `type: COFFEE` hardcode) | Code review: `app/api/search/route.ts:18` | Initial whereClause has no `type` filter; `roast` URL param still scopes to coffee categories | | | |
| AC-FN-9 | Legacy `/api/search` returns honest no-results when query has FTS-zero in roast pattern | Code review: `app/api/search/route.ts` roast-pattern branch | When `remainingQuery.length > 0` but `ftsIds.length === 0`, return empty results — not the entire roast category | | | |
| AC-FN-10 | Drawer empty + no-results states reuse same `CuratedProducts` component | Code review: component imports | Single source of truth for the products section | | | |
| AC-FN-11 | aria-live region announces results count or no-results message | Code review: `SearchResults.tsx` / `SearchNoResults.tsx` | Container has `aria-live="polite"` and content updates on query change | | | |
| AC-FN-12 | Drawer focus management: autofocus input on open, Escape closes, return focus to trigger | Code review: `SearchDrawer.tsx` | Radix Dialog defaults satisfy this; `autoFocus` on input | | | |
| AC-FN-13 | Chips heading text input validates length (Zod min 1 max 60) | Code review: `app/api/admin/search-drawer-settings/route.ts` PUT validation | Zod `z.string().min(1).max(60)` on `search_drawer_chips_heading`; empty string returns 400 | | | |
| AC-FN-14 | Admin Search route registered per `docs/navigation/README.md` | Code review: `lib/navigation/route-registry.ts` (admin.settings.search entry) + `lib/config/admin-nav.ts` (Settings children, between Commerce and Shipping) | Route registry has `id: "admin.settings.search"`, `pathname: "/admin/settings/search"`, `parentId: "admin.settings"`, `isNavigable: true`; admin-nav has `{ label: "Search", href: "/admin/settings/search" }` in both occurrences | | | |
| AC-FN-15 | Chips heading defaults to "Top Categories" when unset; curated section header derives from picked category's display name | Code review: `lib/site-settings.ts` `defaultSettings` + drawer rendering of curated section | When DB has no `search_drawer_chips_heading` row, settings object returns `"Top Categories"`; curated section heading = `category.name` from the picked category (no separate setting) | | | |
| AC-FN-16 | Seed uses `upsert + update: { value }` for the three search drawer settings (reseed restores demo defaults) | Code review: `prisma/seed/settings.ts` | Three new `prisma.siteSettings.upsert({ where, update: { value: ... }, create })` blocks for the three keys; reseed overwrites whatever admin set, restoring the demo showcase | | | |
| AC-FN-17 | Seed adds 5 missing demo categories with `upsert + update: {}` (admin catalog work preserved) | Code review: `prisma/seed/categories.ts` | New entries for `fruity-floral`, `cold-brew-blends`, `drinkware`, `central-america`, `staff-picks` use the existing categories-seed pattern — products attached and labels assigned by admin survive reseed | | | |
| AC-FN-18 | `PUT /api/admin/search-drawer-settings` is not blocked by demo-mode guards | Code review: `app/api/admin/search-drawer-settings/route.ts` | Endpoint uses `requireAdminApi()` only; no `requireNotDemo()` (or equivalent demo-block helper) is invoked; demo build admins can write to these settings | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | MiniSearch hook returns expected results for fixture catalog | Test: `useSearchIndex.test.ts` — fixture with 5–10 mixed products; assert "air dripper" returns merch first; "Yirgachefe" returns the right coffee | Tests pass; assertions cover field-weight + fuzzy paths | | | |
| AC-TST-2 | `/api/search/index` route returns valid response shape | Test: `app/api/search/index/__tests__/route.test.ts` — mocked Prisma, assert response shape includes both COFFEE and MERCH products | Test passes; shape matches the documented contract | | | |
| AC-TST-3 | Legacy `/api/search` returns merch when query matches | Test: `app/api/search/__tests__/route.test.ts` — query "dripper", mocked Prisma returns mixed types, assert merch in results | Test passes | | | |
| AC-TST-4 | Legacy `/api/search` returns empty when roast pattern + 0 FTS hits | Test: query "light roast xyz" with mocked FTS returning empty, assert response.products is empty (not full category) | Test passes | | | |
| AC-TST-5 | Admin Zod schema test: rejects 7+ chip categories | Test: `app/api/admin/search-drawer-settings/__tests__/route.test.ts` — PUT with 7 categories returns 400 | Test passes | | | |
| AC-TST-6 | Admin GET/PUT roundtrip persists all three settings | Test: `app/api/admin/search-drawer-settings/__tests__/route.test.ts` — PUT with valid payload, GET returns the same; heading validation rejects empty + >60 chars | Test passes | | | |
| AC-TST-7 | Reseed restores demo defaults for search settings | Test or smoke: set heading to `"Browse"` via PUT, run seed script, GET → heading is `"Top Categories"` (back to default) | Test passes; reseed overwrites admin change with seed default | | | |
| AC-TST-8 | Reseed preserves admin's catalog work on the new categories | Test or smoke: attach products to `staff-picks` via Menu Builder, run seed script, query category products → still attached | Test passes; admin catalog edits survive reseed because categories use `update: {}` | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` clean | CLI: run precheck | TS 0 errors; ESLint 0 errors (existing TanStack Table warning is pre-existing, not blocking) | | | |
| AC-REG-2 | `npm run test:ci` all green | CLI: run tests | All test suites pass; tests added by this PR pass | | | |
| AC-REG-3 | Storefront homepage unchanged | Screenshot: `/` desktop + mobile | Hero, recommendations, featured all render as before | | | |
| AC-REG-4 | Existing `/search?q=...` deep-link still renders results | Interactive: visit `/search?q=ethiopia` directly → screenshot | Server-rendered results page works; merch now included where applicable | | | |
| AC-REG-5 | Cart, checkout, PDP, category pages unaffected | Code review + smoke test | No new `import` regressions; no behavioral changes outside search surface | | | |
| AC-REG-6 | No LLM / AI API calls during typical browse session | Inspect dev tools network tab during search session | Zero requests to `/api/search` agentic path or any AI provider | | | |

---

## Verification notes

**Test fixtures (for AC-TST-1):**

A small in-test catalog mimicking real Artisan Roast products:

| Product | Type | Tasting Notes | Origin | Roast |
|---|---|---|---|---|
| Ethiopia Yirgacheffe | COFFEE | Floral, Citrus, Bergamot | Ethiopia | Light |
| Tanzania Peaberry | COFFEE | Black Currant, Citrus, Winey | Tanzania | Medium |
| Origami Air Dripper | MERCH | (none) | (none) | (none) |
| Aeropress | MERCH | (none) | (none) | (none) |
| Sumatra Mandheling | COFFEE | Earthy, Cedar, Dark Chocolate | Sumatra | Dark |

Test queries to assert against:

- `"air dripper"` → top result is Origami Air Dripper
- `"Yirgachefe"` → top result is Ethiopia Yirgacheffe (fuzzy match)
- `"citrus"` → returns coffees with Citrus tasting notes (field-weighted)
- `"zzzzz"` → returns empty array

**Manual UX queries (for UI ACs 7, 8 + general baseline):**

The full set of baseline tracking queries from the conversation 2026-04-25 — verify each behaves correctly post-implementation:

| Query | Expected |
|---|---|
| `"air dripper"` | Origami Air Dripper #1 |
| `"aeropress"` | Aeropress merch matches |
| `"Yirgachefe"` (typo) | Ethiopia Yirgacheffe match |
| `"good"` | Some results (no longer 0 due to over-aggressive stop-words; MiniSearch handles this differently) |
| `"light roast XYZ"` (no XYZ match) | "No results for X in light roast" — drawer shows fallback products; legacy route returns empty |
| `"fruity"` | Light roasts with fruity tasting notes, ranked by name/notes hits |
| `"ethiopia"` | Coffees from Ethiopia |
| `"decaf"` | Decaf products surfaced |

(Sort, pagination, price-range, faceted filtering — explicitly out of scope; not asserted.)

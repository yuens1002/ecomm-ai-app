# Keyword Search Drawer v2 — AC Verification Report

**Branch:** `feat/keyword-search-drawer` (continued from v1)
**Commits:** TBD
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
| AC-UI-1 | Drawer uses vaul `direction="right"` (slides in from right, like cart drawer) | Screenshot: drawer open at 1280x900 | Drawer anchored to right edge, slides in from right with vaul animation, dimmed backdrop on left ~20% of viewport | | | |
| AC-UI-2 | Drawer width: 100% on mobile, 80% on md+; height 100vh always | Screenshot: drawer open at 375 + 1280 viewports | Mobile fills entire screen; desktop fills right 80%, leaves 20% page peek visible behind blurred backdrop | | | |
| AC-UI-3 | Top row: search input + reset × + `MoveRight` arrow (→) anchor button, no border-bottom divider | Screenshot: drawer open empty state | Search input on left with placeholder "Search products…"; × visible on right end of input only when query non-empty; move-right arrow close button on right edge of drawer, vertically centered with the input row; no horizontal divider line below the row | | | |
| AC-UI-4 | × inside input clears query | Interactive: type "ethiopia", click × inside input → screenshot | Query cleared, empty state body returns | | | |
| AC-UI-5 | `MoveRight` arrow anchor closes drawer | Interactive: click move-right arrow on drawer right edge → screenshot | Drawer closes (slides out to the right) | | | |
| AC-UI-6 | Empty state: chips with label name as heading + curated products via ProductCard | Screenshot: drawer open at 1280x900 | "Top Categories" heading (from label name) + 6 chips + "Staff Picks" heading + 6 ProductCard components with **product images visible** | | | |
| AC-UI-7 | Search results state — chips persist + result cards | Interactive: type "ethiopia" → screenshot | Chips still visible above results; result cards via ProductCard with images | | | |
| AC-UI-8 | Chip click filters body, drawer stays open, no URL change | Interactive: click "Single Origin" chip → screenshot | Drawer stays open; body shows Single Origin's products via ProductCard; URL unchanged; chip visually highlighted as active | | | |
| AC-UI-9 | Chip click clears active query | Interactive: type "ethiopia", then click "Drinkware" chip → screenshot | Query input clears; body shows Drinkware products; Drinkware chip highlighted | | | |
| AC-UI-10 | Type after chip active clears chip | Interactive: click "Drinkware" chip, then type "ethiopia" → screenshot | Drinkware chip deselects; body shows search results for "ethiopia" | | | |
| AC-UI-11 | Click active chip a second time deselects, returns to empty state | Interactive: click "Drinkware" twice → screenshot | After second click: chip deselected, body shows empty state (chips + curated) | | | |
| AC-UI-12 | No-results state: chips persist + "No results" + curated fallback (with images) | Interactive: type "zzzzzz" → screenshot | Chips visible; "No results found for 'zzzzzz'" message; curated products section with ProductCards (images visible) below | | | |
| AC-UI-13 | Product images render in all card contexts (curated, chip-active, results) | Screenshot at each state | ProductCard renders product images consistently — no blank gray placeholders for products that have variant images in DB | | | |
| AC-UI-14 | Admin Search page: 2 sections, no Save button | Screenshot: `/admin/settings/search` desktop | Section 1 "Search drawer chips" + Section 2 "Curated products"; no Save button anywhere | | | |
| AC-UI-15 | Admin section 1: label single-select + read-only chip preview | Screenshot: section 1 expanded | Label dropdown defaulted to 1st label by `order`; below it, chip-styled preview buttons (matching storefront chip style, slightly muted, non-clickable) showing that label's categories | | | |
| AC-UI-16 | Admin section 1 form copy | Code review + screenshot | Title "Search drawer chips" + description "Use Menu Builder to add or select an existing label to showcase categories." | | | |
| AC-UI-17 | Admin section 2: curated category single-select with default | Screenshot: section 2 | Single-select Combobox; defaulted to 1st category by `order`; description "Select a product category to show as the default or when no search is found." | | | |
| AC-UI-18 | Auto-save: changing label silently persists, no toast | Interactive: change label dropdown → no toast appears, but `GET /api/admin/settings/search-drawer` returns the new value | Field updates instantly (optimistic); subsequent GET returns the new value; no toast | | | |
| AC-UI-19 | Auto-save: changing curated category silently persists | Interactive: change curated dropdown → next storefront drawer open shows the new curated section | Same silent behavior for curated category | | | |
| AC-UI-20 | Auto-save failure: silent rollback to prior value | Exercise: simulate 500 from PUT → screenshot field state | Field reverts to prior value silently (no error toast). Subtle inline indicator (e.g. red border briefly) optional | | | |
| AC-UI-21 | Empty-state admin: no labels in DB | Exercise: delete all CategoryLabels (test DB) → screenshot section 1 | Section 1 shows "No labels yet — create one in Menu Builder" + link to `/admin/product-menu` instead of dropdown | | | |
| AC-UI-22 | Empty-state admin: no categories in DB | Exercise: delete all Categories → screenshot section 2 | Section 2 shows "No categories yet — create one in Menu Builder" hint instead of dropdown | | | |
| AC-UI-23 | Demo seed: "Top Categories" label exists with 6 demo categories, hidden from menu | Exercise: fresh `npm run seed` → query DB + check storefront menu | CategoryLabel with name "Top Categories" exists with `isVisible: false`, has 6 CategoryLabelCategory rows linking to single-origin, fruity-floral, medium-roast, cold-brew-blends, drinkware, central-america. Storefront product menu does NOT show "Top Categories" as a nav group | | | |
| AC-UI-24 | Hidden label still drives search drawer chips | Screenshot: storefront drawer empty state | Drawer shows "Top Categories" heading + 6 chips even though the label is `isVisible: false` (search drawer reads label by id without filtering on visibility) | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `getSearchDrawerConfig` fetches by CategoryLabel id (any visibility), returns categories in label's category-order | Code review: `lib/data.ts` | Function reads `search_drawer_chip_label` (id), queries `categoryLabel.findUnique({ where: { id }, include: { categories: { ...orderBy: { order: "asc" } } } })` — **no `isVisible` filter** so hidden labels work for search; returns chips list ordered correctly | | | |
| AC-FN-2 | `chipsHeading` derives from label.name (no separate setting) | Code review: `lib/data.ts` config returns `chipsHeading: label.name` | Config response shape unchanged; `chipsHeading` field populated from selected label's name | | | |
| AC-FN-3 | Curated category default = 1st by `order` | Code review: settings page + `getSearchDrawerConfig` fallback | When `search_drawer_curated_category` row missing or empty, falls back to 1st category by `order: asc` | | | |
| AC-FN-4 | Chip default selection = 1st label by `order` | Code review: settings page + config fallback | When `search_drawer_chip_label` row missing or empty, falls back to 1st CategoryLabel by `order: asc` | | | |
| AC-FN-5 | When admin's chosen label is deleted, drawer falls back to 1st label silently | Code review: getSearchDrawerConfig handles missing label gracefully | If `categoryLabel.findUnique({ where: { id } })` returns null, fallback to 1st by order; no crash, no error in UI | | | |
| AC-FN-6 | Admin PUT validates Zod schema (non-empty IDs/slugs) | Code review: `app/api/admin/settings/search-drawer/route.ts` | Zod `chipLabelId: z.string().min(1).optional()` and `curatedCategorySlug: z.string().min(1).optional()` for partial updates; rejects empty strings | | | |
| AC-FN-7 | Admin PUT supports partial updates (auto-save sends only changed field) | Code review + interactive | PUT body with only `chipLabelId` works; PUT body with only `curatedCategorySlug` works; unchanged settings remain in DB | | | |
| AC-FN-8 | Drawer chip click sets `activeChipSlug` in store, clears query | Code review: `store.ts` + `CuratedCategoryChips.tsx` + `SearchDrawer.tsx` | `useSearchDrawerStore` has `activeChipSlug` + `setActiveChipSlug`; chip onClick handler sets it AND clears local query state in SearchDrawer | | | |
| AC-FN-9 | Drawer typing clears `activeChipSlug` | Code review: `SearchDrawer.tsx` input onChange | When `e.target.value !== ""`, `setActiveChipSlug(null)` is called | | | |
| AC-FN-10 | Chip-active state filters MiniSearch index by `primaryCategory.slug === activeChipSlug` (no network call) | Code review: SearchDrawer body | Category products derived via `useMemo` from already-loaded products array; no extra fetch | | | |
| AC-FN-11 | Drawer uses vaul `direction="right"` | Code review: SearchDrawer.tsx | `<Drawer direction="right">` (or shadcn drawer wrapper with same prop) | | | |
| AC-FN-12 | Drawer doesn't render Save button or Sonner toast on settings change | Code review: SearchSettingsForm.tsx | No `<Button>...Save...</Button>`; no `toast({})` calls in the change handler success path | | | |
| AC-FN-13 | ProductCard component used for curated + category + results display | Code review: imports in CuratedProducts.tsx + SearchDrawer.tsx ResultsOrNoResults | All three render `<ProductCard product={...} />` with no inline `<Image>` or `<div className="aspect-square bg-muted">` placeholders | | | |

## Test Coverage Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-TST-1 | Existing v1 tests still pass | `npm run test:ci` | All 1161 v1 tests + any new v2 tests pass | | | |
| AC-TST-2 | `getSearchDrawerConfig` unit test: returns label.name as heading | Test: `lib/data.test.ts` (or similar) — mock label + categories, assert config.chipsHeading === label.name | Test passes | | | |
| AC-TST-3 | Admin PUT partial update test | Test: `app/api/admin/settings/search-drawer/__tests__/route.test.ts` — PUT only chipLabelId, GET returns chipLabelId updated + curatedCategorySlug unchanged | Test passes | | | |
| AC-TST-4 | Admin PUT validates label id non-empty | Test: same suite — PUT empty chipLabelId returns 400 | Test passes | | | |
| AC-TST-5 | Drawer chip click + typing toggle test | Test: `SearchDrawer.test.tsx` (or store test) — simulate chip click → activeChipSlug set, query="" ; simulate typing → activeChipSlug=null | Test passes | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | `npm run precheck` clean | CLI: precheck | TS 0 errors; ESLint 0 errors (1 pre-existing TanStack Table warning allowed) | | | |
| AC-REG-2 | `npm run test:ci` all green | CLI: tests | All test suites pass | | | |
| AC-REG-3 | Migration applied cleanly: deprecated rows dropped, new rows seeded | Exercise: run migration + reseed → DB query | `search_drawer_chips_heading` and `search_drawer_chip_categories` rows absent; `search_drawer_chip_label` row present with valid CategoryLabel.id | | | |
| AC-REG-4 | Cart drawer still works (we share the vaul primitive) | Interactive smoke: open cart drawer → screenshot | Cart drawer unchanged from before this iteration | | | |
| AC-REG-5 | Storefront homepage / category pages / PDPs unaffected | Code review + smoke | No edits outside admin/search/v2 surface; ProductCard component itself unchanged (we're just consuming it) | | | |
| AC-REG-6 | No new LLM/AI API calls | Network tab inspection | Zero calls to AI providers; only `/api/search/index` + `/api/track-activity` | | | |

---

## Iteration history

(Will be filled as iterations occur during implementation.)

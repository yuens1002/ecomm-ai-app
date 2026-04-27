# Search Drawer — Nitpicks Queue

Durable list of polish / scale items surfaced during the post-launch review of `feat/keyword-search-drawer` (v0.102.0) and the v0.103.0 polish patch (PR #348). Each entry exists so a future revisit inherits the reasoning rather than the absence of a fix.

> Items 5 and 6 are scale-dependent and explicitly **out of scope** for the target catalog size (≤ ~200 products). Their full analysis lives in [`docs/architecture/SEARCH-ARCHITECTURE.md`](../../architecture/SEARCH-ARCHITECTURE.md#scale-envelope) under "Scale envelope". They're listed here as cross-references so the queue stays a single source of truth.

---

## Status legend

- 🟢 **Shipped** — landed in the version noted
- 🟡 **Open** — not started; revisit on signal
- ⚪ **Deferred — out of scope at target scale** — analysis complete, won't ship until trigger
- ❌ **Won't fix** — closed, with reason

---

## Open items

### 1. Extract `<Chip>` to `components/ui/chip.tsx` 🟢 Shipped — v0.103.0 (PR #348)

`<Chip>` codifies the chip design language as a reusable `cva` component (mirrors `components/ui/badge.tsx`). Migrated `CuratedCategoryChips` and admin `LabelSelect` preview. Review brew-method pills NOT migrated — they intentionally use a different active treatment.

### 2. Diversify seed tasting-note keywords ❌ Won't fix

Partially shipped in v0.102.3 (PR #346): `findTasteCategories` now matches `tastingNotes` only and adds basic roast-aware gating. F&F ∩ Medium Roast dropped 86% → 77%. Pushing overlap further requires diversifying actual `tastingNotes` arrays in `prisma/seed/products.ts` — that's data character, not a bug. **Closed as won't-fix.**

### 3. Chip-active product load gets the staggered fade-in 🟢 Shipped — v0.103.0 (PR #348)

Reuses the homepage `<ScrollReveal>` component (same pattern `<FeaturedProducts>` uses for its product cards). Re-keyed on the active chip slug so it re-fires on every chip change.

### 4. "Show more" / paginated reveal for search results 🟡 Open

[`useSearchIndex.ts`](../../../app/\(site\)/_components/search/hooks/useSearchIndex.ts) caps results at `SEARCH_LIMIT = 10`. As the catalog grows past the demo's 30-ish products, the cap will hide relevant matches AND the initial paint will load all 10 mini-card images at once.

**Approach when revisited:**
- Bump `SEARCH_LIMIT` (e.g. 30 or remove cap)
- Render first 7 results immediately
- `<button>Show {N - 7} more</button>` reveals the rest in place (or paginate per-7)
- Watch for: animation re-trigger when more reveals (re-key strategy or AnimatePresence-style), keyboard a11y (focus the first new card or scroll into view), and analytics (track "show more" clicks)

**Revisit signal:** catalog grows past the demo size, or user research shows search-result truncation hurting discovery.

### 5. `/api/search/index` unbounded `findMany` ⚪ Deferred — out of scope at target scale

[`app/api/search/index/route.ts`](../../../app/api/search/index/route.ts) returns every enabled product with no upper limit. Acceptable at the ≤ 200 product target given the 60 s cache + 300 s SWR. Full analysis + revisit triggers + correct mitigation in [`SEARCH-ARCHITECTURE.md`](../../architecture/SEARCH-ARCHITECTURE.md#deferred--apisearchindex-returns-the-full-enabled-catalog).

### 6. `getSearchDrawerConfig` still sits on the site page render path ⚪ Deferred — out of scope at target scale

`getSearchDrawerConfig` is called during site layout/page rendering, but its underlying work was wrapped in `unstable_cache` in PR #343 with a 60 s TTL plus tag-based invalidation, so it usually serves cached data and only re-executes on cache miss / revalidation. Splitting curated-products into a client-triggered endpoint is overkill at the target scale. Full analysis + revisit triggers + correct mitigation in [`SEARCH-ARCHITECTURE.md`](../../architecture/SEARCH-ARCHITECTURE.md#deferred--getsearchdrawerconfig-underlying-query-graph-not-yet-split).

### 7. Drawer query state not cleared on close 🟢 Shipped — v0.103.0 (PR #348)

`query` moved from component-local state into the Zustand store; `close()` now clears `query` alongside `activeChipSlug` and `isOpen`.

### 8. Admin auto-save silent rollback has no error surface 🟢 Shipped — v0.103.0 (PR #348)

`SearchSettingsForm.tsx` `autoSave` now shows a transient "Couldn't save — try again" inline hint that auto-clears after 4 s or on the next successful save.

### 9. Multi-category dimension on search results — group results by category, render each as a titled carousel 🟡 Open

Instead of a single ranked grid of mini-cards, present typed-search and chip-filter results as multiple titled sections, one per category that the matching products span. Reference: homepage [`<FeaturedProducts>`](../../../app/\(site\)/_components/product/FeaturedProducts.tsx) — titled section with horizontal carousel.

**Example:** Type "ethiopia" → result set includes 5 coffees that collectively touch Africa, Single Origin, Light Roast, Fruity & Floral. Render: "Africa" carousel + "Single Origin" carousel + "Light Roast" carousel + "Fruity & Floral" carousel, each with its products. Each product appears under every category it's attached to (a coffee can show in multiple carousels).

**UX questions for the patch:**
- Max categories to show?
- Sort order of category sections (by product count? by `category.order`? by relevance to query)?
- Dedup signal — if every category contains the same 5 products, do we collapse into one section?
- Use existing `<ScrollCarousel>` or `<ImageCarousel>` from `components/shared/media/`?

**Stretch:** chip-active state could also use this layout — the active chip's products grouped by their secondary categories, creating a "browse-this-category-cross-cut-by-its-related-categories" experience.

**Revisit signal:** catalog and category coverage grow to the point where a single ranked grid feels reductive, or user research surfaces "I want to browse by dimension" as a need.

### 10. Storefront chip order doesn't match Menu Builder category list order 🟡 Open

When admin reorders / adds / removes categories under the chip-label via Menu Builder, the storefront drawer chips don't reflect the change for up to 60 s.

**Cause:** [`app/(site)/layout.tsx`](../../../app/\(site\)/layout.tsx)'s `getCachedSearchDrawerConfig` is wrapped in `unstable_cache(... tags: ["search-drawer-config"], revalidate: 60)`. The admin **Search Settings** PUT route invalidates the tag, but **Menu Builder** server actions that mutate `CategoryLabelCategory` (in `app/admin/product-menu/actions/...`) do NOT call `revalidateTag("search-drawer-config")`. Both surfaces query with the same `orderBy: { order: "asc" }` on the join table — so the ordering logic is fine; only the cache-invalidation surface is incomplete.

**Fix:** in any Menu Builder action that writes to `CategoryLabelCategory` for a label currently referenced by `search_drawer_chip_label`, also fire `revalidateTag("search-drawer-config")`. Keep the SiteSettings lookup cheap (read once at action entry).

**Planned for:** v0.103.1 patch (separate from PR #348).

### 11. Mobile menu Sheet doesn't close on same-pathname link click 🟢 Shipped — v0.103.0 (PR #348)

Mirrored the search-drawer pattern: event-delegated `onClick` handler on `SheetContent` that calls `setIsMobileMenuOpen(false)` whenever any anchor inside is clicked. That delegated click handling is the close mechanism now, covering both same-pathname and cross-route link clicks. The reopen-menu-after-search-dismissed feature was removed in the same pass — its dependence on a pathname-change signal made it mis-fire on same-pathname navigations.

### 12. Same-category, different product order between search drawer chip and storefront category page 🟡 Open

Confirmed via user comparison (same TOTAL count of products on `/single-origin` and the Single Origin chip filter, but different ordering visible above the fold).

**Cause:** neither query has an explicit `orderBy`, both fall back to Prisma's implementation-defined default which can differ between contexts.

**Surfaces:**
- [`lib/data.ts`](../../../lib/data.ts) `getProductsByCategorySlug` has `where: { categories: { some: { category: { slug } } } }` with no `orderBy`
- [`app/api/search/index/route.ts`](../../../app/api/search/index/route.ts) has `where: { isDisabled: false }` with no `orderBy` on the outer `findMany`

**Fix:** add the same explicit `orderBy` to both — recommend `[{ isFeatured: "desc" }, { name: "asc" }]` (featured first, then alphabetical).

**Planned for:** v0.103.1 patch (separate from PR #348).

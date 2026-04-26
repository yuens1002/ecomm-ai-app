# Performance Decisions

Decisions about scale-dependent or measurement-gated optimizations that we've **deliberately deferred** rather than shipped prophylactically. Each entry exists so a future engineer revisiting the area inherits the reasoning, not just the absence of a fix.

Each entry follows: **Decision**, **Context**, **Trade-offs**, **Revisit triggers**, and (where relevant) **Correct mitigation when triggered**.

---

## Search drawer — `/api/search/index` returns the full enabled catalog (load-once + client-side MiniSearch)

- **Decision** — Keep the load-once-then-search-locally architecture. Don't introduce a `take` cap (would silently hide products from search), don't migrate to server-side search yet.

- **Context** — Demo catalog is ~30 products. The endpoint at [`app/api/search/index/route.ts`](../../app/api/search/index/route.ts) returns the full enabled catalog with the `productCardIncludes`-shaped payload, cached `public, max-age=60, stale-while-revalidate=300`. The drawer's [`useSearchIndex`](../../app/(site)/_components/search/hooks/useSearchIndex.ts) hook builds a MiniSearch index in the browser with these field weights:

  - `name` × 4
  - `tastingNotes` × 2
  - `categoryNames` × 2 (all attached categories — primary + secondary, per v0.102.0)
  - `origin` × 1.5
  - `description` × 1

  Descriptions ARE searched today, alongside category names and tasting notes — every keystroke runs against the in-memory index in 0 ms.

- **Trade-offs** — At 500+ products this single-fetch payload grows linearly into KB territory and starts to matter on slow connections. A naive `take` cap would be the **wrong** mitigation: products beyond the cap would be unsearchable by name, description, or any other field — silent data loss from the user's perspective.

- **Revisit triggers**

  - Catalog grows past ~150 products, OR
  - Bundle / load profiling shows the drawer's index fetch on the critical path, OR
  - We open multi-tenant where one heavy tenant inflates everyone's session payload.

- **Correct mitigation when triggered** — Migrate the drawer from "load full catalog + MiniSearch" to "send query → server FTS → ranked results". The codebase already ships [`app/api/search/route.ts`](../../app/api/search/route.ts) using Postgres `tsvector` + `ts_rank`, which inherently searches `name`, `description`, `tastingNotes`, and category names. The drawer would need:

  - Debounced typing → POST query to the FTS endpoint
  - Server returns top-N products (e.g. 20)
  - Render through the existing mini-card pipeline
  - Curated and chip-active grids continue to fetch their own focused datasets — chip-active becomes a category-slug fetch instead of an in-memory filter

  Trade-off: every keystroke now hits the server (~50–150 ms RTT) instead of a 0 ms in-memory search; debounce + server-side caching mitigate. Description matching is preserved by the existing FTS implementation.

- **Why we don't ship this prophylactically** — Real engineering effort (~1 day), changes the UX latency profile (network RTT vs 0 ms), and the demo simply doesn't need it.

---

## Search drawer — `getSearchDrawerConfig` underlying query graph not yet split

- **Decision** — The `unstable_cache` wrap landed in PR #343 (60 s TTL, tag `search-drawer-config`, admin PUT calls `revalidateTag` on save). Don't further split the curated-products fetch into a client-triggered endpoint at this time.

- **Context** — [`app/(site)/layout.tsx`](../../app/(site)/layout.tsx) runs `getCachedSearchDrawerConfig()` on every storefront render. Cache hits are cheap. Cache misses (1× per 60 s per Vercel edge node, plus admin saves that bust the tag) hit Prisma for ~3 queries + a 6-product `findMany` with `productCardIncludes`. The full implementation lives in [`lib/data.ts`](../../lib/data.ts) under `getSearchDrawerConfig`.

- **Trade-offs** — Splitting `curatedProducts` out into a client-triggered endpoint avoids layout-time DB work for visitors who never open the drawer. Costs: a network round-trip when they do open it, plus a loading state in the drawer's curated section.

- **Revisit triggers**

  - p99 storefront page TTFB is dominated by this cache miss in production traces, OR
  - Admin saves cause noticeable cache stampede (multiple visitors arrive within the same revalidation window), OR
  - Curated-products payload grows materially.

- **Correct mitigation when triggered** — Move `curatedProducts` out of `getSearchDrawerConfig` into a dedicated endpoint (e.g. `/api/search-drawer/curated`) fetched client-side on first drawer open, with its own cache tag. Drawer renders chips immediately (config payload shrinks to chip metadata + setting refs), curated grid renders after the round-trip with a skeleton in place.

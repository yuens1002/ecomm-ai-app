# Product Menu Builder Breakout (Product Menu Only)

## Scope & Assumptions

- Focus: product menu (labels -> categories -> products). Site navigation menus are out of scope.
- Products are read-only here (name + first-image thumbnail when available).
- Typical volume is small (dozens of categories), so simple filter/combobox search is sufficient.
- Changes are staged in session memory; persist only after explicit confirm. Show unsaved delta and 5-minute idle warning.
- Orphan handling: deleting categories should present orphaned products; delete category associations only, never the products.

## Label Requirements

- Create single label.
- Future: bulk create (agentic flow to generate an entire product menu).
- Rename.
- Toggle visibility: per-label, multi-select, and per-menu surface toggle (header/mobile/footer flags or equivalent).
- View member categories.
- Add associations: attach one or many categories to a label.
- Duplicate: copy a label (clone member categories and their product memberships).
- Ordering: default to creation order; support manual reorder and auto A→Z sorting.
- Delete: single or multi delete; remove all member associations with it.

## Category Requirements

- Create single category under a label.
- Rename.
- View member products.
- Add associations: attach one or many products to a category.
- Visibility toggles: single or multi categories.
- Duplicate: copy a category with its product memberships.
- Product ordering within a category: default to creation order; manual reorder.
- Delete product associations: single or multi detach from a category.
- Delete categories: single or multi; remove category-product associations; warn/preview orphaned products.

## Product Requirements (read-only)

- Display name and first-image preview if available.
- Optional lightweight search/filter by name (combobox UI is acceptable).

## Session & Persistence Flow

- All edits apply to in-memory draft state.
- User explicitly commits draft to DB.
- Show unsaved changes indicator; after 5 minutes idle, highlight delta vs DB.

## Backend Gaps To Plan

- Visibility flags per label and category, and per-menu-surface toggles (header/mobile/footer equivalents) unless already covered.
- Label duplication (including categories + products) and category duplication (including products).
- Category-level product attach/detach endpoints (bulk) and product ordering within a category.
- Label/category multi-delete with cascade of associations only (no product deletes).
- Draft session model or API to stage changes prior to commit.

## Nice-to-Haves

- Auto A→Z sort actions for labels and for products within a category.
- Simple name filter across labels/categories/products.

## Open Questions

- Do visibility flags reuse existing page/menu flags or need new fields for product menu surfaces?
- Should label/category duplication also duplicate visibility/order or reset to defaults?
- For draft state: server-held draft vs client-only diff? Needs decision before backend work.

## Backend Audit (current vs needed)

### What already exists

- Labels: list/create with unique name, icon; reorder; rename; delete; attach/detach category (single); reorder categories within a label; auto-sort categories A→Z.
- Categories: list/create with slug; rename/update slug; replace label assignments; delete (removes label joins and product joins).
- Products: list/read; create/update with `categoryIds` (replaces all links); delete.

### Gaps per element

- Labels: no visibility flags (per label or per menu surface); no bulk attach/detach categories; no bulk delete; no duplicate/clone; no auto-sort for labels; no multi-select visibility toggle.
- Categories: no visibility flags; no product ordering within category; no bulk attach/detach products; no duplicate/clone; no orphan preview helper when deleting; no bulk delete; no per-category enable/disable.
- Products (read-only here): no thumbnail helper field; no product-order field per category join.

### Session / draft model (unsaved changes)

- Today every endpoint writes directly to DB; no draft or session concept; no diff API; no idle/unsaved tracking.
- Needed: draft workspace that accumulates label/category/product-link edits, plus endpoints to commit/discard and to fetch diff vs DB. Options: server-side draft records (recommended) or client-only diff (lighter but less robust).

### Proposed backend additions

- Data model: add visibility flags on labels/categories (and optional per-surface flags if distinct from page/menu flags); add `order` on products-within-category join table if ordering is required.
- Endpoints:
  - Label: bulk attach/detach categories; bulk delete; duplicate (clone with categories+products); toggle visibility (single/multi); optional auto-sort labels A→Z.
  - Category: bulk attach/detach products; reorder products within a category; duplicate (clone with products); toggle visibility (single/multi); bulk delete with orphan-product preview payload.
  - Draft flow: create/fetch draft, mutate draft (same operations as above but scoped to draft), get diff, commit draft, discard draft; idle timestamp ping for “unsaved for 5 minutes” indicator.
- Helpers: product list endpoint that returns `thumbnailUrl` (first image) to avoid extra queries; orphan preview endpoint when category delete is requested.

## Concrete DB changes (proposal)

- CategoryLabel: add `isVisible` Boolean @default(true); optional per-surface booleans if product menu needs separate header/mobile/footer visibility (e.g., `showInHeaderMenu`, `showInMobileMenu`, `showInFooterMenu`).
- Category: add `isVisible` Boolean @default(true); optional per-surface booleans mirroring labels if needed.
- CategoriesOnProducts: add `order` Int @default(0) to store product order within a category.
- Drafts (new table): `ProductMenuDraft` with fields `id`, `userId`, `status` enum (ACTIVE|COMMITTED|DISCARDED), `payload` Json (labels/categories/products/order/visibility), `createdAt`, `updatedAt`, `expiresAt` (for idle cleanup). Optional `sourceSnapshotVersion` if we want optimistic locking.
- Indexes: keep existing uniques; add composite index on CategoriesOnProducts `(categoryId, order)` for ordering; consider `(labelId, isVisible)` and `(categoryId, isVisible)` for menu reads if visibility filters often.

## Concrete endpoint changes (proposal)

### Label endpoints

- `GET /api/admin/category-labels` — extend payload with visibility fields.
- `POST /api/admin/category-labels` — accept visibility fields.
- `PUT /api/admin/category-labels/:id` — allow name/icon/visibility updates.
- `POST /api/admin/category-labels/reorder` — unchanged.
- New: `POST /api/admin/category-labels/bulk-delete { labelIds }` — remove labels and their category joins.
- New: `POST /api/admin/category-labels/:id/bulk-attach { categoryIds, position }` — attach many categories; optional position modes: prepend (default), append, or after `afterCategoryId`.
- New: `POST /api/admin/category-labels/:id/bulk-detach { categoryIds }` — detach many.
- New: `POST /api/admin/category-labels/:id/duplicate { name?, copyVisibility?: boolean, copyOrder?: boolean }` — clone label with its category members (and their products if requested via category clone helper).
- New: `POST /api/admin/category-labels/auto-sort` — sort labels A→Z (separate from existing per-label category auto-sort).
- New: `POST /api/admin/category-labels/visibility` — bulk toggle `{ items: [{ id, isVisible, showInHeaderMenu?, showInMobileMenu?, showInFooterMenu? }] }`.

### Category endpoints

- `GET /api/admin/categories` — extend payload with visibility fields; include ordered product IDs if present.
- `POST /api/admin/categories` — accept visibility fields; optional initial `productIds` with order.
- `PUT /api/admin/categories/:id` — allow name/slug/visibility updates; optional replace labelIds; optional replace ordered productIds.
- `DELETE /api/admin/categories/:id` — keep; add optional `preview=true` to return orphaned products without deleting.
- New: `POST /api/admin/categories/bulk-delete { categoryIds, previewOnly?: boolean }` — returns orphaned products map; when not preview, deletes categories and detaches products.
- New: `POST /api/admin/categories/:id/products/bulk-attach { productIds, position }` — attach multiple; supports ordered insertion.
- New: `POST /api/admin/categories/:id/products/bulk-detach { productIds }` — detach multiple.
- New: `POST /api/admin/categories/:id/products/reorder { productIds }` — reorder already-attached products.
- New: `POST /api/admin/categories/:id/duplicate { name?, slug?, copyVisibility?: boolean, copyOrder?: boolean }` — clone category with products.
- New: `POST /api/admin/categories/visibility` — bulk toggle visibility fields.

### Product helpers (read-only)

- `GET /api/admin/products` — add `thumbnailUrl` from first image; optionally return categories with order if requested (for draft UI).
- No write changes needed for menu builder aside from honoring ordered `categoryIds` if we expose a path; prefer category-centric attach to avoid replacing all links.

### Draft/session flow endpoints

- `POST /api/admin/product-menu-drafts` — create or fetch active draft for user (optionally supply base snapshot version to detect drift).
- `GET /api/admin/product-menu-drafts/:id` — return payload + diff vs DB (labels/categories/products/order/visibility).
- `POST /api/admin/product-menu-drafts/:id/operations` — apply operations to draft (same shapes as live endpoints but scoped to draft payload, not DB).
- `POST /api/admin/product-menu-drafts/:id/commit` — validate, apply to DB, mark draft committed; return new snapshot version.
- `POST /api/admin/product-menu-drafts/:id/discard` — drop draft and return DB state.
- `POST /api/admin/product-menu-drafts/:id/ping` — update `updatedAt` for idle tracking; respond with unsaved delta summary for 5-minute warning.

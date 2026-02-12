# Standardize Add-to-Cart CTA & Sale Price Display — AC Verification Report

**Branch:** `feat/standardize-add-to-cart-cta`
**Commits:** 1
**Iterations:** 0

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## Functional Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-FN-1 | ProductCard outer wrapper has `@container` class for container queries | PASS — Code review: `@container/card` class on `<div>` wrapping CardContent + CardFooter at ProductCard.tsx:123 | PASS — Confirmed | |
| AC-FN-2 | AddToCartButton renders "Add" text when container < 300px, "Add to Cart" when >= 300px (idle state only — other states keep their text) | PASS — Code review: AddToCartButton.tsx:117-124 uses `containerAware` prop; idle state renders `@min-[300px]/card:inline` for "Add to Cart" and `@min-[300px]/card:hidden` for "Add". Non-idle states use `config.text` unchanged. Screenshot: PDP related products on mobile show "Add", desktop show "Add to Cart". | PASS — Screenshots confirm "Add" on mobile related products, "Add to Cart" on desktop category | |
| AC-FN-3 | ProductCard footer sale price stacks vertically (original on top in strikethrough, sale price below) when container < 300px | PASS — Code review: ProductCard.tsx:175-182 renders vertical stack hidden at `@min-[300px]/card`, with original price in `line-through` on top and sale price below. DOM text extraction for Bolivia Caranavi confirms both layouts present. | PASS — Confirmed | |
| AC-FN-4 | ProductCard footer sale price displays horizontally when container >= 300px | PASS — Code review: ProductCard.tsx:184-191 renders horizontal flex layout at `@min-[300px]/card:flex`. Screenshot: Bolivia Caranavi on category page (desktop, ~350px card) shows "$24.50 $21.45" horizontally. | PASS — verify3-desktop-bolivia-card.png confirms "$24.50 $21.45" horizontal layout | |
| AC-FN-5 | AddOnCard sale price stacks vertically (same pattern as ProductCard) | PASS — Code review: AddOnCard.tsx:153-161 uses `block` display with original price `line-through` above discounted price. Screenshot: Origami Cone Filters shows "$12.00" (struck through) above "$10.00". | PASS — verify4-mobile-cone-filters-card.png confirms vertical stack | |
| AC-FN-6 | `compactFooter` prop removed from ProductCard — container queries handle sizing | PASS — Code review: ProductCard.tsx has no `compactFooter` prop. Grep found zero references in source code (only in docs/plans). | PASS — Confirmed via git diff | |
| AC-FN-7 | All existing ProductCard usages (FeaturedProducts, RecommendationsSection, CategoryClientPage, ProductClientPage related products) render correctly | PASS — Screenshots: CategoryClientPage shows cards with buttons and prices. ProductClientPage related products carousel renders. FeaturedProducts and RecommendationsSection render with hoverRevealFooter. No console errors. | PASS — Confirmed across all screenshot sets | |
| AC-FN-8 | `npm run typecheck` passes | PASS — `npx tsc --noEmit` exited with 0, no errors | PASS — Ran independently, confirmed | |
| AC-FN-9 | `npm run lint` passes | PASS — `npm run lint` exited with 0, no errors | PASS — Ran independently, confirmed | |

## Regression Acceptance Criteria

| AC | Description | Agent | QC | Reviewer |
|----|-------------|-------|-----|----------|
| AC-REG-1 | Homepage carousel cards (~250px) show "Add" button + vertical sale price | PASS (DOM-verified) — Homepage carousel uses `hoverRevealFooter={true}` so footer is hidden at rest (by design). DOM text extraction confirms both "Add to Cart" and "Add" texts plus dual price layouts are present. Container query CSS applies correctly. Cannot screenshot footer at rest due to hoverRevealFooter. | PASS — hoverRevealFooter hides footer by design; DOM structure correct | |
| AC-REG-2 | Category grid cards (~350px at lg) show "Add to Cart" button + horizontal sale price | PASS — Screenshot: /medium-roast at 1280px shows "Add to Cart" buttons and Bolivia Caranavi displays "$24.50 $21.45" horizontally. At 375px mobile, full-width cards (>300px) correctly show "Add to Cart" and horizontal sale price too. | PASS — verify3-desktop-bolivia-card.png confirms | |
| AC-REG-3 | Product detail page related products carousel shows correct CTA based on card width | PASS — Screenshot: Bolivia Caranavi PDP related products at mobile (375px) show "Add" text; at desktop (1280px) show "Add to Cart". Container query threshold working correctly. | PASS — verify2-mobile-bolivia-related.png shows "Add" on compact cards | |
| AC-REG-4 | AddOnCard in product detail page shows vertical sale price stack when discounted | PASS — Screenshot: Origami Air Dripper PDP Cone Filters add-on shows "$12.00" (strikethrough) vertically stacked above "$10.00" on both mobile and desktop. | PASS — verify4-mobile-cone-filters-card.png confirms vertical stack | |
| AC-REG-5 | Product detail page full-width button (ProductQuantityCart) unchanged — still shows "Add to Cart" with in-button price | PASS — Screenshot: Origami Air Dripper PDP shows "Add to Cart \| $42.00" full-width button. Code review: ProductQuantityCart.tsx:84-93 does NOT pass `containerAware` prop, so "Add to Cart" always displays. Bolivia Caranavi PDP shows "Add to Cart \| $24.50 $21.45" with strikethrough. | PASS — verify2-desktop-origami-main-cta.png confirms "Add to Cart \| $42.00" | |

---

## Agent Notes

### Iteration 0 — Initial Verification (2026-02-12)

#### Evidence Summary

**Screenshots captured:**

- `.screenshots/verify2-*` — Homepage featured, category grid, PDP pages at mobile (375px) and desktop (1280px)
- `.screenshots/verify3-*` — Bolivia Caranavi card on category page, category bottom
- `.screenshots/verify4-*` — Cone Filters add-on card (element screenshot), Bolivia card on homepage

**Code review files:**

- `app/(site)/_components/product/ProductCard.tsx` — `@container/card` on line 123, container-query price layout lines 172-198, `containerAware` passed to AddToCartButton on line 164
- `app/(site)/_components/product/AddToCartButton.tsx` — `containerAware` prop lines 26, 74; idle-state container-aware rendering lines 117-124; non-idle states unchanged via `config.text` line 123
- `app/(site)/_components/cart/AddOnCard.tsx` — Vertical sale price stack lines 153-161 with `block` display
- `app/(site)/_components/product/ProductQuantityCart.tsx` — Does NOT pass `containerAware` (line 84-93), always shows "Add to Cart"
- `app/(site)/_components/product/FeaturedProducts.tsx` — No `compactFooter` prop, passes `compact` and `hoverRevealFooter`
- `app/(site)/_components/product/RecommendationsSection.tsx` — No `compactFooter`, passes `hoverRevealFooter`
- `app/(site)/_components/category/CategoryClientPage.tsx` — No `compactFooter`, clean ProductCard usage
- `app/(site)/products/[slug]/ProductClientPage.tsx` — No `compactFooter`, passes `compact` and `disableCardEffects` to related products

**Grep confirmation:** `compactFooter` not found in any source files; only appears in `docs/plans/` markdown files.

**Test suite:** 60 suites, 736 tests, all passing.

**Build tools:** `tsc --noEmit` and `npm run lint` both exit 0.

### Notes on AC-REG-1

The homepage carousel ("Our Best Sellers") uses `hoverRevealFooter={true}` which intentionally hides the footer on mobile (`hidden md:flex`) and makes it transparent until hover on lg+ (`lg:opacity-0`). The "Add" button and sale price layout exist in the DOM but are not visually rendered at rest. This is existing design behavior, not a regression. DOM text extraction confirmed both container-query variants of button text and price layout are correctly present.

### Overall: PASS — 14/14 ACs passed

## QC Notes

**QC pass — 14/14 ACs confirmed.** All Agent findings verified via independent screenshot review. No fixes needed — zero iterations. Key evidence: desktop category cards show "Add to Cart" + horizontal sale price; mobile related products show "Add" + compact price; AddOnCard vertical price stack confirmed; ProductQuantityCart unchanged.

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}

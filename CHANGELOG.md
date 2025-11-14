# Changelog

## 0.6.0 - 2025-11-14

- **Shopping Cart (Phase 1)**: Implemented full shopping cart functionality with Zustand state management and localStorage persistence
  - Created cart store with add/remove/update/clear operations and computed totals
  - Special handling for subscriptions (replace instead of increment quantity)
  - Cart drawer UI with product images, variant details, quantity controls, and subtotal
  - Hydration-safe cart badge in header
  - Client-side persistence (survives page refresh, lost on localStorage clear)
- Architecture: Refactored cart logic into dedicated `ShoppingCart` component (separation of concerns from `SiteHeader`)
- Integration: Wired `ProductCard`, `ProductClientPage`, and `FeaturedProducts` to use cart store
- Checkout button placeholder (disabled, ready for Phase 2 Stripe integration)

## 0.5.3 - 2025-11-14

- Security: patched moderate vulnerability by upgrading transitive `js-yaml` (npm audit fix). No breaking changes.
- Mobile menu: revamped using shadcn Sheet (left-aligned title, icon-only Home shortcut, improved hierarchy & spacing, accessible focus and description).
- Breadcrumbs: truthful category context (load all product categories; use `from` only when linked; robust searchParams handling).
- Product cards: full-card focus ring, keyboard navigation improvements, prevent accidental navigation on Add to Cart, refined hover scaling.
- Lint/IDE: typed `params` & `searchParams` as Promises to remove false `await` warnings in server components.
- Theming: hero CTA button now uses theme tokens (removed hardcoded `bg-white text-primary`).
- Housekeeping: ignore npm audit report artifacts; minor accessibility enhancements (screen-reader menu description).

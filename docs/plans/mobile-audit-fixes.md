# Mobile Audit Fix Plan

## Context

A full mobile audit at 375x812 (iPhone SE) identified 22 UI issues across the public-facing site. Screenshots are in `.screenshots/mobile-audit2/`. This plan covers all fixes on the `feat/mobile-audit` branch, organized into 7 commits from low-risk data changes to the complex shared order/subscription component.

---

## Commit Schedule

| # | Message | Issues | Risk |
|---|---------|--------|------|
| 0 | `docs: add plan for mobile audit fixes` | — | — |
| 1 | `fix: update seed data headings` | FTR-2, HP-3 | Low |
| 2 | `fix: navbar reorder and mobile menu full-width` | NAV-1, NAV-2, MM-1 | Medium |
| 3 | `fix: footer vertical spacing rhythm` | FTR-1 | Low |
| 4 | `fix: page layout adjustments for mobile` | AF-1, AF-2, HP-4, NU-1, FAQ-1, FAQ-2 | Low |
| 5 | `fix: carousel fonts and product card mobile adjustments` | HP-1, HP-5, PDP-1, PDP-2, PDP-3 | Medium |
| 6 | `fix: account tabs and subscription card improvements` | ACCT-1, ACCT-2, SUB-2, SUB-3, SUB-4 | Medium |
| 7 | `refactor: shared mobile card for orders and subscriptions` | ORD-1, SUB-1 | High |

---

## Acceptance Criteria (28 total)

### UI (verified by screenshots at 375x812 + desktop spot-check)

- AC-UI-1: Navbar shows `hamburger | logo-icon | search account cart` at xs; logo text hidden below sm
- AC-UI-2: Navbar height visibly shorter on xs vs current
- AC-UI-3: Mobile menu drawer is full-width at xs, 320px at sm+
- AC-UI-4: Footer "Quick Links" and "Shop" sections have matching vertical gap between heading and first item
- AC-UI-5: Footer shows "Follow Us" (not duplicate "Stay Connected") for social section
- AC-UI-6: Homepage featured carousel heading reads "Our Best Sellers"
- AC-UI-7: Homepage "Trending Now" icon is top-aligned with heading text (not vertically centered)
- AC-UI-8: App Features page title is smaller; section headers are centered
- AC-UI-9: FAQ page has no sticky header; category filter renders as dropdown at xs, buttons at sm+
- AC-UI-10: FAQ page has consistent x-padding matching other site pages
- AC-UI-11: Newsletter unsubscribe card sits near top of page, not vertically centered
- AC-UI-12: Carousel product cards (homepage + PDP "You Might Also Like") use smaller font set (text-base title, text-xs notes)
- AC-UI-13: Merch carousel cards show 2-line truncated description where tasting notes would be
- AC-UI-14: PDP "Save on Bundles" cards fully capture content with proper inter-slide padding
- AC-UI-15: PDP "You Might Also Like" Add to Cart button is centered
- AC-UI-16: PDP vertical spacing between CTA and BEST FOR is consistent regardless of Certified Organic badge presence
- AC-UI-17: Account tab bar is single-row horizontal scroll with smaller padding; subscriptions icon is `Repeat` not `Package`
- AC-UI-18: Subscription ID is truncated to last 8 chars (matching order history format)
- AC-UI-19: Subscription actions (skip, manage, cancel) are in a dropdown menu; in-place shipping edit remains
- AC-UI-20: Subscription current period shows header and dates on separate lines
- AC-UI-21: Order history mobile card: `status — date | ⋮`, order ID in outline button, items list with consistent dividers, ship-to as plain text (no border), price omitted
- AC-UI-22: Subscription mobile card: same layout as order history but ID is plain text (not a button)

### Functional (verified by code review)

- AC-FN-1: `compact` prop on ProductCard controls title (`text-base`) and notes (`text-xs`) sizing without breaking non-compact callers
- AC-FN-2: Seed data changes persist after `npm run seed` (settings.ts updated for both headings)
- AC-FN-3: MobileRecordCard accepts `type: "order" | "subscription"` and conditionally renders ID as button (order) or text (subscription)
- AC-FN-4: Shared `record-utils.ts` exports status helpers used by both OrdersPageClient and SubscriptionsTab

### Regression (verified by screenshot + desktop spot-check)

- AC-REG-1: Desktop navbar layout unchanged (logo text visible, full nav)
- AC-REG-2: Desktop PDP layout unchanged (horizontal details + sales side-by-side)
- AC-REG-3: Desktop order history table layout unchanged
- AC-REG-4: Desktop subscription card layout unchanged
- AC-REG-5: All footer links remain functional
- AC-REG-6: FAQ accordion expand/collapse still works

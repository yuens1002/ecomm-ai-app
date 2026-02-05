# Add to Cart UX Improvement

> **Branch:** `feat/add-to-cart-ux`
> **Status:** In Progress

## Overview

Improving the shopping experience across: signed-in users, guest checkout, subscriptions, and one-time purchases.

## User Decisions

| Issue | Decision |
|-------|----------|
| Add to Cart Feedback | **Optimistic Transform** with cart-aware destination |
| ProductCard Layout | **Omit price** in sm breakpoint carousels only |
| QTY Selector | **Numeric input field** replacing +/- stepper |
| Buy Now | **Cart-empty fast path** - direct to Stripe checkout |

## First-Time Buyer Experience

**Goal:** Get users to checkout FAST when they're ready to buy.

### Transform Logic (Cart-Aware)

| Cart State | After "Added ✓" | Click Action |
|------------|-----------------|--------------|
| **Empty** (just added 1 item) | "Buy Now" | Direct to Stripe checkout |
| **Has items** (added to existing) | "Checkout Now" | Open cart drawer |

### User Flow: First-Time Buyer

```text
User (new) → Browse → Card "Add to Cart" → "Adding..." → "Added ✓"
  → (cart was empty) → "Buy Now" → Click → Direct to Stripe Checkout
  → Complete purchase in 3 clicks!
```

### User Flow: Repeat Buyer / Multi-item

```text
User → Card "Add to Cart" → "Adding..." → "Added ✓"
  → (cart has items) → "Checkout Now" → Click → Cart Drawer opens
  → Review items → "Proceed to Checkout" → Stripe
```

## Floating Add to Cart Button (Mobile)

**Problem:** On product page at xs-sm breakpoints, inline Add to Cart may scroll out of view.

**Solution:** Floating icon button at bottom-right that:

- Appears only when inline button is NOT visible (Intersection Observer)
- Same transform experience: tap → "Adding" spinner → checkmark → "Buy Now"/"Checkout Now"
- Icon-only design: ShoppingCart → Loader2 → Check → Zap/ArrowRight

```text
┌─────────────────────────────┐
│  Product Page (scrolled)    │
│                             │
│  ...product details...      │
│                             │
│                        [🛒] │  ← Floating button (bottom-right)
└─────────────────────────────┘
```

## Implementation Details

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed implementation plan.

## Testing Checklist

**Transform Pattern:**

- [ ] **First-time buyer:** Add to cart (empty cart) → shows "Buy Now" → direct to Stripe
- [ ] **Multi-item:** Add to cart (has items) → shows "Checkout Now" → opens drawer
- [ ] Add to cart from ProductCard, verify all transform states
- [ ] Add to cart from ProductPage, verify all transform states
- [ ] Button reverts to "Add to Cart" after timeout (8s)

**Floating Button (Mobile):**

- [ ] Floating button appears when scrolled past inline button (xs-sm only)
- [ ] Floating button hidden when inline button visible
- [ ] Floating button has same transform experience as inline
- [ ] Touch target is adequate (56x56px minimum)

**QTY Input:**

- [ ] QTY input accepts valid numbers (1 to stock)
- [ ] QTY input rejects invalid values (0, negative, > stock)
- [ ] QTY input clamps on blur

**Recommendations Fallback:**

- [ ] Empty category → shows fallback recommendations
- [ ] Fallback empty → section hidden entirely
- [ ] Fallback excludes current product

**Responsive:**

- [ ] Price hidden at sm breakpoint in carousels
- [ ] Price visible at md+ in carousels
- [ ] All UI elements functional at all breakpoints

# Plan: Enable Stripe Promotion Codes at Checkout

## Context

Discount codes/coupons is the #1 gap in `docs/internal/feature-gap-analysis.md` — every competitor (Shopify, WooCommerce, BigCommerce, Squarespace, Square) offers this natively. Artisan Roast uses Stripe Checkout, which supports promotion codes via a single flag: `allow_promotion_codes: true`. This adds a promo code input field directly in Stripe's hosted checkout page — Stripe handles validation, expiration, and redemption limits.

**Approach**: Toggle in Commerce Settings + link to Stripe Dashboard for code management. No custom coupon CRUD — Stripe Dashboard already does this well. The backend plumbing captures discount data from completed sessions and stores it on Order records for display and reporting.

**Critical fix included**: The current order creation calculates shipping as `sessionAmountTotal - totalItemCost`. When Stripe applies a promo code, `sessionAmountTotal` is reduced but `totalItemCost` stays at full price, making shipping go **negative**. This must be fixed to correctly isolate shipping from discount.

---

## Scope

- **1 new file**: API route for promo codes setting
- **1 migration**: Add discount fields to Order model
- **5 modified files**: app-settings, commerce page, both checkout routes, adapter, order creation, webhook handler, order detail page
- **0 new UI components**: Reuses existing `SettingsSection`, `SettingsField`, `Switch` patterns

---

## Step 1: Add `commerce.allowPromoCodes` Setting

**Modified file**: `lib/config/app-settings.ts`

- Add `ALLOW_PROMO_CODES: "commerce.allowPromoCodes"` to `APP_SETTINGS_KEYS`
- Add `getAllowPromoCodes(): Promise<boolean>` — reads from SiteSettings, returns `setting?.value === "true"`, default `false`
- Add `setAllowPromoCodes(value: boolean): Promise<void>` — upserts `"true"` / `"false"`

## Step 2: Add API Route for the Setting

**New file**: `app/api/admin/settings/promo-codes/route.ts`

Follow the exact pattern from `app/api/admin/settings/weight-unit/route.ts`:

- `GET` — `requireAdmin()`, call `getAllowPromoCodes()`, return `{ enabled: boolean }`
- `PUT` — `requireAdmin()`, validate body has `enabled: boolean`, call `setAllowPromoCodes()`, return `{ success: true, enabled }`

## Step 3: Add Toggle + Stripe Link to Commerce Settings Page

**Modified file**: `app/admin/settings/commerce/page.tsx`

Add a new `SettingsSection` below the existing Weight Display section:

- Title: "Promotion Codes"
- Description: "Allow customers to enter promotion codes during checkout"
- `SettingsField<boolean>` with `Switch` toggle (copy pattern from `marketing/page.tsx` lines 22-42)
  - Endpoint: `/api/admin/settings/promo-codes`
  - Field: `enabled`
  - Auto-save on toggle
- Below the toggle: helper text with external link to `https://dashboard.stripe.com/coupons`
  - Text: "Create and manage promotion codes in your Stripe Dashboard"
  - Opens in new tab (`target="_blank"`)

## Step 4: Pass `allow_promotion_codes` in Checkout Session Creation

**Modified file**: `app/api/checkout/route.ts`

- Import `getAllowPromoCodes` from `lib/config/app-settings`
- Before the `stripe.checkout.sessions.create()` call (~line 303), read the setting:
  ```ts
  const allowPromoCodes = await getAllowPromoCodes();
  ```
- Spread into session params:
  ```ts
  ...(allowPromoCodes && { allow_promotion_codes: true }),
  ```

**Modified file**: `app/api/checkout/redirect/route.ts`

- Same change at ~line 170

## Step 5: Add Discount Fields to Order Model

**Modified file**: `prisma/schema.prisma` (Order model, after `totalInCents`)

```prisma
discountAmountInCents Int      @default(0)
promoCode             String?
```

- `discountAmountInCents` — the discount applied in cents (0 when no promo used)
- `promoCode` — the customer-facing promotion code string (null when no promo used)

Run: `npx prisma migrate dev --name add-order-discount-fields`

## Step 6: Extract Discount Data from Stripe Session

**Modified file**: `lib/payments/types.ts` — `NormalizedCheckoutEvent` interface

- Add `discountAmountInCents: number` field

**Modified file**: `lib/payments/stripe/adapter.ts` — `normalizeCheckoutSession()`

- Extract discount amount: `session.total_details?.amount_discount || 0`
- Add to returned object: `discountAmountInCents`

## Step 7: Pass Discount Through Order Creation Pipeline

**Modified file**: `lib/orders/types.ts` — `CreateOrdersFromCheckoutParams`

- Add `discountAmountInCents: number`

**Modified file**: `app/api/webhooks/stripe/handlers/checkout-session-completed.ts`

- Pass `discountAmountInCents: normalizedCheckout.discountAmountInCents` to `createOrdersFromCheckout()`

**Modified file**: `lib/orders/create-order.ts`

- Destructure `discountAmountInCents` from params
- **Fix shipping calculation** (line ~71):
  ```ts
  // Before (BROKEN with discounts):
  const shippingCostInCents = sessionAmountTotal - totalItemCost;

  // After (correct):
  const shippingCostInCents = sessionAmountTotal + discountAmountInCents - totalItemCost;
  ```
  Rationale: `sessionAmountTotal` already has the discount subtracted by Stripe. Adding discount back recovers the pre-discount total, then subtracting item costs isolates shipping.
- Pass `discountAmountInCents` into `createSingleOrder()` — apply to the one-time order (or the only order if subscription-only)
- In `createSingleOrder`: write `discountAmountInCents` to `prisma.order.create({ data })`

## Step 8: Show Discount in Customer Order Detail

**Modified file**: `app/(site)/orders/[orderId]/OrderDetailClient.tsx`

- Fix shipping calculation (line ~70):
  ```ts
  // Before: shipping = order.totalInCents - subtotal
  // After:
  const discount = order.discountAmountInCents ?? 0;
  const shipping = order.totalInCents + discount - subtotal;
  ```
- Add discount row between Subtotal and Shipping (conditionally, only when `discount > 0`):
  ```
  Discount (SUMMER15):  -$5.00   ← green text
  ```
- Show `order.promoCode` next to "Discount" label if present

---

## Acceptance Criteria

### Admin UI

- **AC-ADMIN-1**: Commerce Settings page shows a "Promotion Codes" section with a Switch toggle, defaulting to off.
- **AC-ADMIN-2**: Toggling the switch auto-saves and persists across page reloads.
- **AC-ADMIN-3**: A "Stripe Dashboard" link is visible below the toggle, opening `https://dashboard.stripe.com/coupons` in a new tab.

### Checkout

- **AC-CHECKOUT-1**: When toggle is OFF, Stripe Checkout does NOT show a promotion code input field.
- **AC-CHECKOUT-2**: When toggle is ON, Stripe Checkout shows a promotion code input field. Entering a valid code applies the discount.
- **AC-CHECKOUT-3**: Both checkout routes (JSON API and redirect) respect the toggle.

### Order Recording

- **AC-ORDER-1**: When a promo code is used, the Order record has `discountAmountInCents > 0` matching the Stripe discount.
- **AC-ORDER-2**: `order.totalInCents` reflects the discounted amount (what customer actually paid, including shipping).
- **AC-ORDER-3**: Shipping cost is correctly isolated — never goes negative when a promo code is applied.

### Order Display

- **AC-DISPLAY-1**: Customer order detail page shows Subtotal, Discount (green, negative), Shipping, and Total — all with correct amounts.
- **AC-DISPLAY-2**: When no promo code was used, the Discount row does not appear (no layout change for existing orders).
- **AC-DISPLAY-3**: If `promoCode` is stored, it is shown next to the "Discount" label.

### Regression

- **AC-REG-1**: Existing orders (no discount) display identically to before — shipping calculation unchanged when `discountAmountInCents` is 0.
- **AC-REG-2**: Checkout works normally when toggle is OFF (no behavioral change).
- **AC-REG-3**: `npm run precheck` passes.
- **AC-REG-4**: `npm run test:ci` passes.

---

## Commit Schedule

1. `feat: add promo codes setting and commerce page toggle` — Steps 1-3 (setting, API route, commerce page UI)
2. `feat: pass allow_promotion_codes to Stripe Checkout` — Step 4 (both checkout routes)
3. `feat: add discount fields to Order model` — Step 5 (schema + migration)
4. `feat: capture and store discount data from Stripe sessions` — Steps 6-7 (adapter, types, webhook, order creation + shipping fix)
5. `feat: show discount breakdown in customer order detail` — Step 8 (order detail page)

---

## Files Modified

| # | File | Change |
|---|------|--------|
| 1 | `lib/config/app-settings.ts` | Add getter/setter for promo codes setting |
| 2 | `app/api/admin/settings/promo-codes/route.ts` | **New** — API route for toggle |
| 3 | `app/admin/settings/commerce/page.tsx` | Add Promotion Codes section with Switch + Stripe link |
| 4 | `app/api/checkout/route.ts` | Conditionally pass `allow_promotion_codes: true` |
| 5 | `app/api/checkout/redirect/route.ts` | Same |
| 6 | `prisma/schema.prisma` | Add `discountAmountInCents`, `promoCode` to Order |
| 7 | `lib/payments/types.ts` | Add `discountAmountInCents` to NormalizedCheckoutEvent |
| 8 | `lib/payments/stripe/adapter.ts` | Extract discount from Stripe session |
| 9 | `lib/orders/types.ts` | Add `discountAmountInCents` to CreateOrdersFromCheckoutParams |
| 10 | `lib/orders/create-order.ts` | Fix shipping calc, store discount on order |
| 11 | `app/api/webhooks/stripe/handlers/checkout-session-completed.ts` | Pass discount to order creation |
| 12 | `app/(site)/orders/[orderId]/OrderDetailClient.tsx` | Show discount in order detail breakdown |

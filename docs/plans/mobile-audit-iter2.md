# Mobile Audit Iteration 2 — Reviewer Feedback Fixes

**Branch:** `feat/mobile-audit`
**Base:** continues on existing branch (already has 9 commits from iteration 1)

---

## Context

The reviewer completed a manual pass on all 28 ACs from iteration 1. 7 ACs failed, 2 new ACs were added, and the subscription desktop card needs a full redesign. This plan addresses all reviewer feedback from the ACs doc.

---

## Commit Schedule

| # | Message | ACs | Risk |
|---|---------|-----|------|
| 1 | `fix: center navbar logo and reorder icons` | AC-UI-1, AC-UI-1a, AC-REG-1 | Medium |
| 2 | `fix: footer heading-to-content spacing consistency` | AC-UI-4 | Low |
| 3 | `fix: trending now description alignment and FAQ padding` | AC-UI-7, AC-UI-10 | Low |
| 4 | `fix: account tab bar clipping and spacing` | AC-UI-17 | Low |
| 5 | `fix: mobile record card improvements` | AC-UI-20, AC-UI-21, AC-FN-5 | Medium |
| 6 | `refactor: subscription card uses mobile layout at all breakpoints` | AC-FN-6, AC-REG-8 | Medium |
| 7 | `fix: PDP carousel slides and price visibility` | AC-UI-14, AC-UI-15a | Low |

---

## Acceptance Criteria

### UI

- AC-UI-1: (fix) Logo centered on navbar; search visible on all breakpoints; icon order is Search, Account, Cart
- AC-UI-1a: (new) Navbar layout, alignment, and icon order consistent across all breakpoints
- AC-UI-4: (fix) Footer Quick Links and Shop heading-to-first-item gap matches at all breakpoints and when stacked
- AC-UI-7: (fix) Trending Now description left-aligned to the icon above (not indented under heading)
- AC-UI-10: (fix) FAQ page has consistent x-padding matching other site pages
- AC-UI-14: (fix) PDP "Save on Bundles" tighter spacing between slides
- AC-UI-15a: (new) PDP "You Might Also Like" 1.5 slides per frame, shows both CTA and price
- AC-UI-17: (fix) Account tab bar not clipped on left, adequate spacing between tabs
- AC-UI-20: (fix) Subscription mobile card shows price, delivery cadence, and current period
- AC-UI-21: (fix) No divider between order cards on mobile

### Functional

- AC-FN-5: MobileRecordCard accepts optional `price`, `deliverySchedule`, `currentPeriod` props
- AC-FN-6: Subscription desktop card removed; MobileRecordCard used at all breakpoints in 2-col grid at md+

### Regression

- AC-REG-1: (fix) Desktop navbar has nav links left-aligned, centered logo, icons right - all links still functional
- AC-REG-7: Desktop order history table unchanged
- AC-REG-8: Subscription Manage button and status notices still work

---

## Commit 1: Navbar Centering + Icon Reorder (AC-UI-1, AC-UI-1a, AC-REG-1)

**File:** `app/(site)/_components/layout/SiteHeader.tsx`

### Layout: Flex to Grid

Replace the flex container (line 198) with a CSS grid that naturally centers the logo:

```tsx
// Before
<div className="... flex items-center gap-3 sm:gap-6 md:gap-12">

// After
<div className="... grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6 md:gap-12">
```

- `grid-cols-[1fr_auto_1fr]`: left and right columns share equal space, center column sizes to logo content - logo is dead center
- Left cell: hamburger (mobile) + nav links (desktop), left-aligned
- Center cell: logo, `justify-self-center`
- Right cell: search + account + cart, `justify-self-end`

### Left Cell (hamburger + nav)

Wrap the hamburger Sheet trigger and desktop NavigationMenu in one cell:

```tsx
<div className="flex items-center gap-3 sm:gap-6">
  {/* Hamburger - mobile/tablet only (md:hidden) */}
  <Sheet>...</Sheet>
  {/* Desktop nav - left-aligned (hidden below md) */}
  <div className="hidden md:flex items-center">
    <NavigationMenu>...</NavigationMenu>
  </div>
</div>
```

Desktop nav moves from its own `flex-1 justify-center` div into the left cell, becoming left-aligned.

### Center Cell (logo)

Add `justify-self-center` to the existing logo Link.

### Right Cell (icons reordered)

```tsx
<div className="flex items-center gap-4 justify-self-end">
  {/* Search - REMOVE hidden sm:flex -> visible on all breakpoints */}
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon">  {/* no more hidden sm:flex */}
        <Search className="h-5 w-5" />
      </Button>
    </DialogTrigger>
    ...
  </Dialog>

  {/* Account - MOVED BEFORE Cart */}
  {user ? <UserMenu /> : <SignInButton />}

  {/* Cart - NOW LAST */}
  <ShoppingCart />
</div>
```

---

## Commit 2: Footer Spacing (AC-UI-4)

**File:** `app/(site)/_components/layout/SiteFooter.tsx`

Wrap Quick Links in `space-y-4` to match FooterCategories structure:

```tsx
// Before (line 268)
<div className="">
  <h3>...</h3>
  <ul className="mt-4 space-y-2">

// After
<div className="space-y-4">
  <h3>...</h3>
  <ul className="space-y-2">  {/* remove mt-4, parent space-y-4 handles it */}
```

---

## Commit 3: Trending Now + FAQ (AC-UI-7, AC-UI-10)

### AC-UI-7 - Description alignment

**File:** `app/(site)/_components/product/RecommendationsSection.tsx`

Move description `<p>` outside the icon+heading flex row so it starts at the left edge:

```tsx
// Before (lines 124-160)
<div className="flex items-start gap-3">
  <div className="mt-1 shrink-0"><TrendingUp /></div>
  <div>
    <h2>heading</h2>
    <p>description</p>  {/* indented - aligned with heading text */}
  </div>
</div>

// After
<div>
  <div className="flex items-start gap-3">
    <div className="mt-1 shrink-0"><TrendingUp /></div>
    <h2>heading</h2>
  </div>
  <p className="text-sm text-muted-foreground mt-1">description</p>  {/* left edge */}
</div>
```

### AC-UI-10 - FAQ padding

**File:** `app/(site)/_components/content/FaqPageContent.tsx`

```tsx
// Before (line 116)
<div className={`mx-auto ${className}`}>

// After
<div className={`mx-auto px-4 sm:px-8 ${className}`}>
```

---

## Commit 4: Tab Bar (AC-UI-17)

**File:** `app/(site)/account/AccountPageClient.tsx`

### Fix left clipping - add inset padding

```tsx
// Before (line 94)
<TabsList className="flex w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">

// After
<TabsList className="flex w-full overflow-x-auto [&::-webkit-scrollbar]:hidden px-1">
```

### Increase tab spacing

All 6 TabsTriggers: `px-2 sm:px-3` -> `px-3 sm:px-4`

---

## Commit 5: MobileRecordCard Improvements (AC-UI-20, AC-UI-21, AC-FN-5)

**File:** `app/(site)/_components/account/MobileRecordCard.tsx`

### 1. New optional props

```tsx
interface MobileRecordCardProps {
  // ... existing ...
  price?: string;              // "$21.85 / every month"
  deliverySchedule?: string;   // "Every month"
  currentPeriod?: string;      // "Feb 9, 2026 - Mar 9, 2026"
}
```

### 2. Halve card top/bottom padding

```tsx
// Before
<CardContent className="p-4 space-y-3">

// After
<CardContent className="p-2 space-y-3">
```

### 3. Remove ALL body section dividers

Remove `border-t border-border` from every section div inside the card body. No dividers between sections at all.

### 4. Add Details section

After Items, render if any detail prop is provided:

```tsx
{(price || deliverySchedule || currentPeriod) && (
  <div className="py-1.5">
    <SectionHeader>Details</SectionHeader>
    <div className="mt-0.5 text-sm space-y-0.5">
      {price && <p>{price}</p>}
      {deliverySchedule && <p className="text-muted-foreground">{deliverySchedule}</p>}
      {currentPeriod && <p className="text-muted-foreground">{currentPeriod}</p>}
    </div>
  </div>
)}
```

### 5. Restructure header per reviewer feedback

```
date ----- [status | dots]
```

Date on the left, status badge + pipe + dots on the right, `justify-between`.

### Remove divider between order cards on mobile

**File:** `app/(site)/orders/OrdersPageClient.tsx`

```tsx
// Before (line 354)
<div className="divide-y">

// After - only divide on desktop
<div className="lg:divide-y space-y-3 lg:space-y-0">
```

---

## Commit 6: Subscription Card - Mobile Layout Everywhere (AC-FN-6, AC-REG-8)

**File:** `app/(site)/account/tabs/SubscriptionsTab.tsx`

### Remove desktop Card

Delete the `<Card className="hidden lg:block">` section (lines 352-568) and the `<div className="lg:hidden">` wrapper.

### Use MobileRecordCard at all breakpoints in 2-col grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {localSubscriptions.map((subscription) => (
    <div key={subscription.id} className="space-y-2">
      <MobileRecordCard
        type="subscription"
        status={subscription.status}
        date={subscription.createdAt}
        displayId={...}
        items={...}
        shipping={...}
        actions={...}
        actionsLoading={...}
        price={`${formatPrice(subscription.priceInCents)}${...schedule suffix}`}
        deliverySchedule={subscription.deliverySchedule || undefined}
        currentPeriod={`${format(start)} - ${format(end)}`}
      />

      {/* Status notices */}
      {subscription.cancelAtPeriodEnd && <CancelWarning />}
      {subscription.status === "PAUSED" && subscription.pausedUntil && <PauseNotice />}

      {/* Manage button */}
      {subscription.status !== "CANCELED" && <ManageButton />}

      {/* Canceled date */}
      {subscription.canceledAt && <CanceledDate />}
    </div>
  ))}
</div>
```

Clean up unused imports from the deleted desktop card.

---

## Commit 7: PDP Carousel (AC-UI-14, AC-UI-15a)

**File:** `app/(site)/products/[slug]/ProductClientPage.tsx`

### AC-UI-14 - Tighter bundle gap

```tsx
// Before (line 505)
<ScrollCarousel slidesPerView={1.2} gap="gap-3">
// After
<ScrollCarousel slidesPerView={1.2} gap="gap-2">
```

### AC-UI-15a - 1.5 slides, show price

```tsx
// Before: mobile 1.2 slides
if (windowWidth < 768) return 1.2;
// After: mobile 1.5 slides
if (windowWidth < 768) return 1.5;
```

Remove `hidePriceOnMobile` from related product cards:

```tsx
// Before
<ProductCard compact compactFooter hidePriceOnMobile disableCardEffects />
// After
<ProductCard compact compactFooter disableCardEffects />
```

---

## Files Changed (9 modified, 0 new)

| File | Commit | ACs |
|------|--------|-----|
| `app/(site)/_components/layout/SiteHeader.tsx` | 1 | AC-UI-1, AC-UI-1a, AC-REG-1 |
| `app/(site)/_components/layout/SiteFooter.tsx` | 2 | AC-UI-4 |
| `app/(site)/_components/product/RecommendationsSection.tsx` | 3 | AC-UI-7 |
| `app/(site)/_components/content/FaqPageContent.tsx` | 3 | AC-UI-10 |
| `app/(site)/account/AccountPageClient.tsx` | 4 | AC-UI-17 |
| `app/(site)/_components/account/MobileRecordCard.tsx` | 5 | AC-UI-20, AC-UI-21, AC-FN-5 |
| `app/(site)/orders/OrdersPageClient.tsx` | 5 | AC-UI-21 |
| `app/(site)/account/tabs/SubscriptionsTab.tsx` | 6 | AC-FN-6, AC-REG-8 |
| `app/(site)/products/[slug]/ProductClientPage.tsx` | 7 | AC-UI-14, AC-UI-15a |

---

## Out of Scope

- **Navbar icon menus freeze bug** - noted as "unrelated" by reviewer; tracked separately
- **Subscription Edit Address dialog** - stays as-is (triggered from actions dropdown)

---

## Verification & Workflow Loop

After plan approval:
1. Commit plan to branch
2. Update `verification-status.json` to `"implementing"` with `acs_total: 15`
3. Extract ACs into `docs/plans/mobile-audit-fixes-ACs-iter-2.md`

After implementation:
1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent - sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail -> fix -> re-verify ALL ACs
6. When all pass -> hand off ACs doc to human -> human fills **Reviewer** column

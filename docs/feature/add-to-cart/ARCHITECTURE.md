# Add to Cart UX - Architecture

## New Files to Create

| File | Purpose |
|------|---------|
| `hooks/useAddToCartWithFeedback.ts` | State machine hook for button transitions |
| `app/(site)/_components/product/AddToCartButton.tsx` | Reusable transform button component |
| `app/(site)/_components/product/QuantityInput.tsx` | Numeric input replacing +/- stepper |
| `app/(site)/_components/product/FloatingAddToCartButton.tsx` | Mobile floating icon button |

## Files to Modify

| File | Changes |
|------|---------|
| `app/(site)/_components/product/ProductCard.tsx` | Remove price, use AddToCartButton |
| `app/(site)/_components/product/ProductQuantityCart.tsx` | Use QuantityInput + AddToCartButton |
| `app/(site)/_components/product/ProductSelectionsSection.tsx` | Pass-through button state props |
| `app/(site)/products/[slug]/ProductClientPage.tsx` | Integrate hook + recommendations fallback |
| `app/api/recommendations/route.ts` | Add `exclude` param |

## Phase 1: Foundation Components

### 1.1 Create `hooks/useAddToCartWithFeedback.ts`

```typescript
type ButtonState = 'idle' | 'adding' | 'added' | 'buy-now' | 'checkout-now';

interface UseAddToCartOptions {
  addedDuration?: number;        // ms to show "Added" (default: 1200)
  actionReadyDuration?: number;  // ms before reverting to idle (default: 8000)
}

interface UseAddToCartReturn {
  buttonState: ButtonState;
  handleAddToCart: (item: CartItemInput, quantity?: number) => void;
  handleActionClick: () => void;  // Buy Now or Checkout Now
  reset: () => void;
}
```

**State machine (cart-aware):**

```text
idle → adding → added → [cart check] → buy-now OR checkout-now → idle
                              ↓
              getTotalItems() === quantity just added?
                    yes → buy-now (direct checkout)
                    no  → checkout-now (open drawer)
```

**Implementation notes:**

- Use `useState` for buttonState
- Use `useRef` for timeout cleanup (prevent memory leaks)
- Check `getTotalItems()` after adding to determine next state
- **buy-now:** Call `/api/checkout` directly (reuse pattern from `app/(site)/_components/ai/AiHelperModal.tsx:65-137`)
- **checkout-now:** Call `setCartOpen(true)` to open cart drawer

### 1.2 Create `app/(site)/_components/product/QuantityInput.tsx`

```typescript
interface QuantityInputProps {
  value: number;
  min?: number;      // default: 1
  max?: number;      // default: 99 or stockQuantity
  onChange: (qty: number) => void;
  disabled?: boolean;
  className?: string;
}
```

**Implementation:**

- Native `<input type="number">` with custom styling
- Match height of existing ButtonGroup (h-14)
- Hide browser spinners with CSS
- Clamp value on blur
- Optional: debounce onChange (300ms)

**Styling:**

```css
/* Hide default spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
```

## Phase 2: Transform Button Component

### 2.1 Create `app/(site)/_components/product/AddToCartButton.tsx`

```typescript
interface AddToCartButtonProps {
  buttonState: ButtonState;
  onAddToCart: () => void;
  onActionClick: () => void;  // Buy Now or Checkout Now
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'lg';
  isProcessing?: boolean;  // Show spinner during checkout redirect
}
```

**Button states display:**

| State | Text | Icon | Style |
|-------|------|------|-------|
| `idle` | "Add to Cart" | ShoppingCart | default |
| `adding` | "Adding..." | Loader2 (spin) | default |
| `added` | "Added!" | Check | green bg |
| `buy-now` | "Buy Now" | Zap | accent/urgent |
| `checkout-now` | "Checkout Now" | ArrowRight | accent |

**Animation approach:** CSS transitions (Tailwind)

- `transition-all duration-200` for smooth changes
- Brief green background on `added` state (1.2s)
- `buy-now` has subtle pulse animation to draw attention
- Text swap with opacity transition

## Phase 3: ProductCard Update

### 3.1 Modify `app/(site)/_components/product/ProductCard.tsx`

**Current (lines 100-131):**

```tsx
<CardFooter className="pb-8 flex items-center justify-between">
  <Button onClick={...}>Add to Cart</Button>
  <div><p className="text-lg font-bold">${displayPrice}</p></div>
</CardFooter>
```

**After (conditional price based on context):**

```tsx
<CardFooter className="pb-8">
  <AddToCartButton
    buttonState={buttonState}
    onAddToCart={handleAdd}
    onActionClick={handleActionClick}
    className="w-full"
  />
  {/* Price shown on md+ OR when not in carousel */}
  {!hidePrice && (
    <p className="hidden md:block text-lg font-bold text-primary mt-2 text-center">
      ${displayPrice}
    </p>
  )}
</CardFooter>
```

**New prop:** `hidePrice?: boolean` - passed from carousel parent at sm breakpoint

**Changes:**

1. Import `useAddToCartWithFeedback` hook
2. Import `AddToCartButton` component
3. Add `hidePrice` prop (default false)
4. Price hidden at sm in carousels, shown elsewhere
5. Replace Button with AddToCartButton
6. Handle `buy-now` vs `checkout-now` action

## Phase 4: Product Page Update

### 4.1 Modify `app/(site)/_components/product/ProductQuantityCart.tsx`

**Current layout:** `grid-cols-[1fr_2fr]` with ButtonGroup (+/-) + Button

**New layout:** `grid-cols-[auto_1fr]` with QuantityInput + AddToCartButton

**New props:**

```typescript
interface ProductQuantityCartProps {
  // ... existing
  buttonState?: ButtonState;
  onCheckoutClick?: () => void;
}
```

### 4.2 Modify `app/(site)/_components/product/ProductSelectionsSection.tsx`

Pass-through `buttonState` and `onCheckoutClick` to ProductQuantityCart.

### 4.3 Modify `app/(site)/products/[slug]/ProductClientPage.tsx`

1. **Integrate hook:**

   ```typescript
   const { buttonState, handleAddToCart, handleCheckoutClick } = useAddToCartWithFeedback();
   ```

2. **Pass to ProductSelectionsSection:**

   ```tsx
   <ProductSelectionsSection
     buttonState={buttonState}
     onCheckoutClick={handleCheckoutClick}
     // ... other props
   />
   ```

3. **Add recommendations fallback** (when relatedProducts empty):

   ```typescript
   const [fallbackProducts, setFallbackProducts] = useState([]);

   useEffect(() => {
     if (relatedProducts.length === 0) {
       fetch(`/api/recommendations?limit=4&exclude=${product.id}`)
         .then(res => res.json())
         .then(data => setFallbackProducts(data.products || []));
     }
   }, [relatedProducts.length, product.id]);
   ```

## Phase 5: Floating Add to Cart Button (Mobile)

### 5.1 Create `app/(site)/_components/product/FloatingAddToCartButton.tsx`

**Visibility logic:** Use Intersection Observer on inline button

```typescript
interface FloatingAddToCartButtonProps {
  inlineButtonRef: RefObject<HTMLElement>;  // Watch this element
  buttonState: ButtonState;
  onAddToCart: () => void;
  onActionClick: () => void;
  disabled?: boolean;
}
```

**Implementation:**

- Fixed position: `fixed bottom-4 right-4 z-40`
- Only visible at `sm:hidden` AND when inline button NOT in viewport
- Icon-only circular button (56x56px touch target)
- Same transform states as inline button
- Subtle shadow and backdrop blur for visibility

**Icon states:**

| State | Icon | Style |
|-------|------|-------|
| `idle` | ShoppingCart | default |
| `adding` | Loader2 (spin) | default |
| `added` | Check | green |
| `buy-now` | Zap | accent pulse |
| `checkout-now` | ArrowRight | accent |

### 5.2 Integrate in ProductClientPage

```tsx
// Add ref to inline button
const inlineButtonRef = useRef<HTMLDivElement>(null);

// Render floating button (mobile only)
<FloatingAddToCartButton
  inlineButtonRef={inlineButtonRef}
  buttonState={buttonState}
  onAddToCart={handleAddToCart}
  onActionClick={handleActionClick}
  disabled={!hasSelectedPurchaseOption}
/>
```

## Phase 6: Empty Recommendations Fallback

### Problem

"You might also like" section on product page can be empty when:

- Product is only one in its category
- All other products in category are disabled
- Category has no other COFFEE type products

**Current behavior:** Empty carousel renders (bad UX)

### Solution

Fallback chain:

1. Try category-based related products (current)
2. If empty → fetch from `/api/recommendations?limit=4&exclude={productId}`
3. If still empty → hide section entirely

### 6.1 Modify `app/(site)/products/[slug]/ProductClientPage.tsx`

```typescript
const [fallbackProducts, setFallbackProducts] = useState<RelatedProduct[]>([]);
const [loadingFallback, setLoadingFallback] = useState(false);

// Fetch fallback when related products empty
useEffect(() => {
  if (relatedProducts.length === 0 && !loadingFallback && !fallbackProducts.length) {
    setLoadingFallback(true);
    fetch(`/api/recommendations?limit=4&exclude=${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.products?.length) {
          setFallbackProducts(data.products);
        }
      })
      .finally(() => setLoadingFallback(false));
  }
}, [relatedProducts.length, product.id]);

// Use fallback if available
const displayProducts = relatedProducts.length > 0 ? relatedProducts : fallbackProducts;

// Hide section if no products at all
{displayProducts.length > 0 && (
  <section>
    <h2>You might also like</h2>
    <ScrollCarousel>...</ScrollCarousel>
  </section>
)}
```

### 6.2 Modify `app/api/recommendations/route.ts`

Add optional `exclude` query parameter:

```typescript
const exclude = searchParams.get("exclude");

// In prisma query:
where: {
  // ... existing conditions
  ...(exclude && { id: { not: exclude } })
}
```

## Implementation Order with UI Validation Loop

Each phase follows this workflow:

```text
┌─────────────────────────────────────────────────────────┐
│  1. Code changes                                        │
│  2. npm run precheck && npm run test:ci                 │
│  3. /ui-verify --before (if UI changes)                 │
│  4. Manual visual check / screenshots                   │
│  5. /ui-verify --after --compare                        │
│  6. Fix issues → repeat 2-5                             │
│  7. Commit when all checks pass                         │
└─────────────────────────────────────────────────────────┘
```

**Implementation phases:**

```text
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   ↓         ↓         ↓         ↓         ↓         ↓
 hooks    button    card      page     floating   recs
 + input  component update    update   button    fallback
```

**Estimated commits:**

1. `feat: add useAddToCartWithFeedback hook and QuantityInput component`
2. `feat: add AddToCartButton with cart-aware transform states`
3. `refactor: update ProductCard with transform pattern and conditional price`
4. `refactor: update ProductPage components for transform pattern`
5. `feat: add floating add-to-cart button for mobile`
6. `feat: add recommendations fallback for empty related products`

## User Flow Documentation

### First-Time Buyer (Cart Empty) - FAST PATH

```text
User → Card "Add to Cart" → "Adding..." → "Added!" (1.2s)
    → "Buy Now" → Click → Direct to Stripe Checkout
    → Complete purchase in 3 clicks!
```

### Returning Buyer (Cart Has Items)

```text
User → Card "Add to Cart" → "Adding..." → "Added!" (1.2s)
    → "Checkout Now" → Click → Cart drawer opens
    → Review items → "Proceed to Checkout" → Stripe
```

### Full Purchase (from ProductPage)

```text
User → Product Page → Select variant → Set quantity (input)
    → "Add to Cart" → "Adding..." → "Added!"
    → [cart empty] "Buy Now" OR [cart has items] "Checkout Now"
    → Click → Stripe OR Cart drawer
```

### Guest vs Signed-in

| Flow | Guest | Signed In |
|------|-------|-----------|
| One-time (Buy Now) | Direct to Stripe | Direct to Stripe |
| One-time (Checkout Now) | Cart → Stripe | Cart → Stripe |
| Subscription | Redirect to sign-in | Full flow |
| Cart persistence | localStorage | localStorage |

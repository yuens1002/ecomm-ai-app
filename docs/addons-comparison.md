# Add-ons Feature: Target Design vs Current Implementation

## Visual Comparison

### 🔵 mini carousel (Target)

```text
┌─────────────────────────────────────────┐
│        You May Also Like                │
├─────────────────────────────────────────┤
│                                         │
│       ┌─────────────────────┐          │
│       │                     │          │
│       │   [Product Image]   │          │
│       │                     │          │
│       └─────────────────────┘          │
│                                         │
│         Add-on Product Title            │
│                                         │
│     ADD | $27  $21.60                   │
│     └───────────────┘                   │
│                                         │
│         ● ○ ○ ○                         │
└─────────────────────────────────────────┘
```

**Key Features:**

- ✅ Carousel (one product at a time)
- ✅ Vertical card layout
- ✅ Compact design
- ✅ Inline pricing with strikethrough
- ✅ Dot navigation
- ✅ "You May Also Like" heading

---

### ⚪ Current Implementation

```text
┌─────────────────────────────────────────┐
│      Complete Your Order                │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┬─────────────┐            │
│  │  [IMG]   │  Sample Mug │            │
│  │  32x32   │  Standard   │            │
│  │          │  A nice mug │            │
│  │          │  $12.00     │            │
│  │          │  [Add +]    │            │
│  └──────────┴─────────────┘            │
│                                         │
│  ┌──────────┬─────────────┐            │
│  │  [IMG]   │  Sticker    │            │
│  │  32x32   │  Small      │            │
│  │          │  A sticker  │            │
│  │          │  $8.00      │            │
│  │          │  [Add +]    │            │
│  └──────────┴─────────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

**Current Features:**

- ❌ Grid layout (shows all at once)
- ✅ Horizontal card layout
- ⚠️ More detailed (may be too busy)
- ✅ Discount pricing shown
- ❌ No navigation needed (all visible)

---

## Feature Matrix

| Feature              | Target Design          | Current               | Need to Change?   |
| -------------------- | ---------------------- | --------------------- | ----------------- |
| **Layout**           | Carousel (1 at a time) | Grid (all visible)    | ✅ Yes → Carousel |
| **Card Style**       | Vertical compact       | Horizontal detailed   | ✅ Yes → Vertical |
| **Image Size**       | Large (square)         | Small (32x32)         | ✅ Yes → Larger   |
| **Pricing**          | Inline: "ADD \| $X $Y" | Separate price line   | ✅ Yes → Inline   |
| **Description**      | Product name only      | Name + variant + desc | ⚠️ Simplify       |
| **Navigation**       | Dots                   | None                  | ✅ Add dots       |
| **Heading**          | "You May Also Like"    | "Complete Your Order" | ⚠️ Update copy    |
| **Discount Display** | Show both prices       | Show discount %       | ✅ Both prices    |

---

## Implementation Changes

### 1. AddOnCard Component

**Current Structure:**

```tsx

<Card> // Horizontal layout
  <CardContent className="flex flex-row">
    <Image 32x32 />
    <div>
      <h3>{product.name}</h3>
      <p>{variant.name}</p>
      <p className="text-muted">{description}</p>
      <div>
        {hasDiscount && <span className="line-through">{regularPrice}</span>}
        <span>{displayPrice}</span>
      </div>
      <Button><Plus />Add</Button>
    </div>
  </CardContent>
</Card>
```

**Target Structure:**

```tsx

<Card>
  {" "}
  // Vertical layout, centered
  <CardContent className="flex flex-col items-center p-6">
    <Image className="w-full aspect-square rounded-lg mb-4" />
    <h3 className="text-lg font-semibold mb-3 text-center">{product.name}</h3>
    <Button variant="outline" className="w-full">
      ADD |
      {hasDiscount && (
        <span className="line-through ml-2">${originalPrice}</span>
      )}
      <span className="ml-2 font-bold">${displayPrice}</span>
    </Button>
  </CardContent>
</Card>
```

**Changes:**

- Switch flex-row → flex-col
- Image: 32x32 → full width square
- Remove variant name (unless critical)
- Remove description (keep simple)
- Button includes pricing inline
- Center-align content

---

### 2. ProductClientPage Add-ons Section

**Current:**

```typescript

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {addOns.map((addOn) => (
    <AddOnCard key={...} addOn={addOn} />
  ))}
</div>
```

**Target:**

```typescript

<Carousel
  mode="products"
  items={addOns}
  renderItem={(addOn) => (
    <AddOnCard addOn={addOn} onAddToCart={() => handleAddOnToCart(addOn)} />
  )}
  itemWidth="max-w-sm"
  showDots={true}
  dotsPosition="bottom"
/>
```

**Changes:**

- Replace grid with Carousel
- One card visible at a time
- Add dot navigation
- Max width constraint (don't span full screen)

---

### 3. Heading & Copy

**Current:** "Complete Your Order"  
**Target:** "You May Also Like"

**Recommendation:** Use target design  
**Alternative Options:**

- "Perfect Pairings"
- "Customers Also Bought"
- "Complete Your Coffee Setup"

**Implementation:**

```tsx

<h2 className="text-3xl font-bold text-center text-text-base mb-8">
  You May Also Like
</h2>
```

---

## Mobile Considerations

### Target Mobile Design

- Same carousel pattern
- Card takes most of screen width
- Dots still visible below
- Swipe gestures (future enhancement)

### Our Mobile Strategy

- Card width: `max-w-sm` (prevents too wide on mobile)
- Center content
- Dots remain below card
- Touch-friendly dot size (already implemented in CarouselDots)

---

## Accessibility

### Current State ✅

- CarouselDots has aria-labels
- Keyboard navigation (click dots)
- Focus states on buttons

### Enhancements Needed ⚠️

- Add keyboard arrow support (← →)
- Announce current slide (aria-live)
- Skip to next/previous links

---

## Performance

### Grid Approach (Current)

- **Pros:** All cards rendered, no navigation needed
- **Cons:** Large DOM if many add-ons, more layout shifts

### Carousel Approach (Target)

- **Pros:** Only 1 card rendered at a time, cleaner DOM
- **Cons:** User must navigate to see all options

### Optimization Strategy

- Lazy load images (Next.js Image default)
- Preload adjacent slides (future)
- Animate only transform (no layout changes)

---

## Data Flow

No changes needed - server action already fetches add-ons:

```typescript

// Server side (page.tsx)
const addOns = await getProductAddOns(product.id);

// Client side (ProductClientPage.tsx)
<Carousel items={addOns} ... />
```

---

## Testing Plan

### Visual Regression

- [ ] Add-ons appear as carousel (not grid)
- [ ] Card is vertical (image top, info below)
- [ ] Pricing shows inline: "ADD | $X $Y"
- [ ] Dots navigation visible
- [ ] Mobile: Card width appropriate

### Functional

- [ ] Clicking dot changes visible add-on
- [ ] ADD button adds correct product to cart
- [ ] Discount pricing calculated correctly
- [ ] Works with 1 add-on (no dots)
- [ ] Works with 0 add-ons (section hidden)

### Accessibility

- [ ] Keyboard: Tab to dots, Enter to select
- [ ] Screen reader announces current slide
- [ ] Focus visible on interactive elements

---

## Migration Steps

1. ✅ Create `docs/product-carousel-design.md`
2. ✅ Create `docs/addons-comparison.md` (this file)
3. ⏳ Update `Carousel` component to support products mode
4. ⏳ Redesign `AddOnCard` component (vertical, compact)
5. ⏳ Update `ProductClientPage` (grid → carousel)
6. ⏳ Update copy "Complete Your Order" → "You May Also Like"
7. ⏳ Test across devices
8. ⏳ Update tests

---

## Open Questions

1. **Variant display?** - Reference design shows primary variant only. Do we need to show variant name?
2. **Multiple add-ons per product?** - Current: one add-on per product. Future: multiple variants?
3. **Auto-advance carousel?** - Should it auto-rotate or wait for user interaction?
4. **Limit add-ons count?** - Show top 3-4, or all configured add-ons?

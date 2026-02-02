# ProductCarousel Component Design

## Overview

A reusable carousel component for displaying products with consistent styling and navigation. Built to support the add-ons feature (Blue Bottle pattern) while remaining flexible for other use cases.

---

## Current State: ImageCarousel

**File:** `components/app-components/ImageCarousel.tsx`

### Current Features

- Simple image carousel with dots navigation
- Aspect ratio control (`4/3`, `16/9`, `square`)
- Single active image display
- CarouselDots component for pagination
- Fallback icon support

### Current Props

```typescript

interface ImageCarouselProps {
  images: Array<{ url: string; alt?: string }>;
  aspectRatio?: "4/3" | "16/9" | "square";
  className?: string;
  fallbackIcon?: React.ReactNode;
  defaultAlt?: string;
}
```

### Limitations for Product Add-ons

- ❌ Only displays images (no product cards)
- ❌ No custom content rendering
- ❌ No action buttons per slide
- ❌ Fixed aspect ratio (products need flexible height)

---

## Proposed Enhancement: ProductCarousel

### Design Goals

1. **Reusable** - Support both add-ons AND other product carousels (related products, featured, etc.)
2. **Flexible** - Accept any card component as children
3. **Consistent** - Use same CarouselDots navigation pattern
4. **Blue Bottle-like** - One card at a time with smooth navigation

### New Component Interface

```typescript

interface ProductCarouselProps<T> {
  // Data & rendering
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;

  // Layout & styling
  itemWidth?: "full" | "auto" | string; // e.g., "300px", "max-w-sm"
  className?: string;

  // Navigation
  showDots?: boolean;
  dotsPosition?: "bottom" | "top";

  // Empty state
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}
```

### Usage Examples

#### 1. Add-ons Carousel (Blue Bottle Pattern)

```typescript

<ProductCarousel
  items={addOns}
  renderItem={(addOn) => (
    <AddOnCard
      addOn={addOn}
      weightUnit="g"
      onAddToCart={() => handleAddOnToCart(addOn)}
    />
  )}
  itemWidth="max-w-sm"
  showDots={true}
  dotsPosition="bottom"
/>
```

**Result:**

- One AddOnCard visible at a time
- Centered on screen
- Dots navigation below card
- Matches Blue Bottle UX

---

#### 2. Related Products (Current Use Case)

```typescript

<ProductCarousel
  items={relatedProducts}
  renderItem={(product) => (
    <ProductCard product={product} disableCardEffects={true} />
  )}
  itemWidth="max-w-sm"
  showDots={true}
/>
```

**Result:**

- One ProductCard at a time
- Same navigation pattern
- Consistent with add-ons carousel

---

#### 3. Multi-item Carousel (Optional Future)

```typescript

<ProductCarousel
  items={products}
  renderItem={(product) => <ProductCard product={product} />}
  itemWidth="300px"
  visibleItems={3} // Show 3 at once (future enhancement)
  showDots={false}
  showArrows={true}
/>
```

---

## Implementation Strategy

### Option A: Extend ImageCarousel (Recommended)

**Pros:**

- ✅ Reuses existing CarouselDots
- ✅ Maintains animation patterns
- ✅ Smaller diff, easier review

**Cons:**

- ⚠️ Name becomes confusing (not just images)
- ⚠️ Need to maintain backward compatibility

**Approach:**

1. Rename `ImageCarousel` → `Carousel` (generic)
2. Add `children` or `renderItem` prop
3. Keep image-specific logic as default behavior
4. Update all existing usages

---

### Option B: New ProductCarousel Component

**Pros:**

- ✅ Clear purpose and naming
- ✅ No breaking changes to ImageCarousel
- ✅ Cleaner separation of concerns

**Cons:**

- ⚠️ Code duplication (dots, navigation logic)
- ⚠️ Need to extract shared logic

**Approach:**

1. Create `components/app-components/ProductCarousel.tsx`
2. Extract navigation logic to shared hook: `useCarouselNavigation`
3. Both ImageCarousel and ProductCarousel use the hook
4. Share CarouselDots component

---

## Recommended Approach: Option A (Extend)

### File Structure

```tsx
components/app-components/
  ├── Carousel.tsx              # Renamed from ImageCarousel
  ├── CarouselDots.tsx          # Existing, no changes
  └── ImageCarousel.tsx         # Deprecated wrapper (for backward compat)
```

### Enhanced Carousel Component

```typescript

"use client";

import { useState, ReactNode } from "react";
import Image from "next/image";
import { CarouselDots } from "./CarouselDots";

// Generic version - supports both images and custom content
interface BaseCarouselProps {
  className?: string;
  showDots?: boolean;
  dotsPosition?: "top" | "bottom";
  dotsClassName?: string;
}

// Image carousel mode (backward compatible)
interface ImageCarouselMode extends BaseCarouselProps {
  mode: "images";
  images: Array<{ url: string; alt?: string }>;
  aspectRatio?: "4/3" | "16/9" | "square";
  fallbackIcon?: ReactNode;
  defaultAlt?: string;
}

// Product carousel mode (new)
interface ProductCarouselMode<T> extends BaseCarouselProps {
  mode: "products";
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemWidth?: string; // e.g., "max-w-sm", "300px"
}

type CarouselProps<T> = ImageCarouselMode | ProductCarouselMode<T>;

export function Carousel<T>(props: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    className = "",
    showDots = true,
    dotsPosition = "bottom",
    dotsClassName = "",
  } = props;

  // Image mode (legacy)
  if (props.mode === "images") {
    const { images, aspectRatio = "4/3", fallbackIcon } = props;
    const hasImages = images && images.length > 0;

    const aspectRatioClass = {
      "4/3": "aspect-4/3",
      "16/9": "aspect-video",
      square: "aspect-square",
    }[aspectRatio];

    if (!hasImages) {
      return (
        <div className={`${aspectRatioClass} rounded-lg bg-muted flex items-center justify-center ${className}`}>
          {fallbackIcon}
        </div>
      );
    }

    return (
      <div className={`relative ${aspectRatioClass} rounded-lg overflow-hidden ${className}`}>
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || props.defaultAlt || "Image"}
          fill
          className="object-cover"
        />
        {showDots && images.length > 1 && (
          <CarouselDots
            total={images.length}
            currentIndex={currentIndex}
            onDotClick={setCurrentIndex}
            className={`absolute ${dotsPosition === "top" ? "top-4" : "bottom-4"} left-1/2 -translate-x-1/2 ${dotsClassName}`}
          />
        )}
      </div>
    );
  }

  // Product mode (new)
  const { items, renderItem, itemWidth = "max-w-sm" } = props;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Product card container */}
      <div className={`w-full ${itemWidth} mx-auto`}>
        {renderItem(items[currentIndex], currentIndex)}
      </div>

      {/* Navigation dots */}
      {showDots && items.length > 1 && (
        <CarouselDots
          total={items.length}
          currentIndex={currentIndex}
          onDotClick={setCurrentIndex}
          className={`${dotsPosition === "top" ? "mb-6" : "mt-6"} ${dotsClassName}`}
        />
      )}
    </div>
  );
}

// Backward compatibility wrapper
export function ImageCarousel(props: Omit<ImageCarouselMode, "mode">) {
  return <Carousel {...props} mode="images" />;
}
```

---

## Migration Plan

### Phase 1: Create Enhanced Carousel ✅

- Implement mode-based Carousel component
- Keep ImageCarousel as wrapper
- No breaking changes

### Phase 2: Update Add-ons ✅

- Use new Carousel in ProductClientPage
- Replace grid with carousel for add-ons
- Add CarouselDots navigation

### Phase 3: Gradual Migration (Optional)

- Update other image carousels to use new component
- Eventually deprecate ImageCarousel wrapper

---

## Testing Checklist

- [ ] Add-ons carousel displays one card at a time
- [ ] Navigation dots update correctly
- [ ] Clicking dots changes active card
- [ ] Responsive on mobile (card width adjusts)
- [ ] Works with 1 item (no dots shown)
- [ ] Works with 0 items (renders nothing)
- [ ] Existing ImageCarousel usages still work
- [ ] CarouselDots animations smooth

---

## Open Questions

1. **Keyboard navigation?** - Should we add arrow key support?
2. **Auto-advance?** - Timer to automatically cycle through items?
3. **Swipe gestures?** - Mobile swipe to navigate?
4. **Multi-visible items?** - Future: show 2-3 cards at once on desktop?

---

## References

- Blue Bottle add-ons pattern: <https://bluebottlecoffee.com/us/eng/product/hayes-valley-espresso>
- Existing ImageCarousel: `components/app-components/ImageCarousel.tsx`
- CarouselDots: `components/app-components/CarouselDots.tsx`

# CategoryMenuColumns Component

## Overview

Self-balancing 3-column menu component for displaying category labels and their associated categories. Automatically redistributes content across columns to maintain visual balance when items expand or collapse.

## Algorithm

### Balancing Strategy

Uses a **greedy algorithm** to distribute label groups across 3 columns:

1. **Weight Calculation**: Each label group has a weight based on visible items:

```text
   Weight = 1 (label header)
          + visible_categories_count
          + 1 (if "...more/less" link present)
```

1. **Distribution**: For each label group in order:
   - Calculate its current weight (based on expanded/collapsed state)
   - Add it to the column with the smallest current total weight
   - Update that column's total weight

2. **Rebalancing**: Whenever a user clicks "...more" or "...less":
   - Expansion states update
   - Weight recalculation triggers
   - All labels redistribute across columns
   - Visual balance maintained

## Features

- ✅ **Self-balancing**: Columns automatically adjust to similar heights
- ✅ **Expandable labels**: Show first 7 items, expand to see all
- ✅ **Responsive**: Works in header, footer, mobile menus
- ✅ **Accessible**: ARIA labels for screen readers
- ✅ **Truncation**: Long label/category names truncate with ellipsis
- ✅ **Customizable**: Props for styling and limits

## Usage

### Basic Example

```typescript

import CategoryMenuColumns from "@/components/app-components/CategoryMenuColumns";

// In your component
const categoryGroups = {
  "BY ROAST LEVEL": [
    { name: "Light Roast", slug: "light-roast" },
    { name: "Medium Roast", slug: "medium-roast" },
    { name: "Dark Roast", slug: "dark-roast" },
  ],
  "BY TASTE PROFILE": [
    { name: "Nutty & Chocolatey", slug: "nutty-chocolatey" },
    { name: "Fruity & Floral", slug: "fruity-floral" },
    { name: "Spicy & Earthy", slug: "spicy-earthy" },
  ],
  ORIGINS: [
    { name: "Central America", slug: "central-america" },
    { name: "Islands", slug: "islands" },
    { name: "Africa", slug: "africa" },
    { name: "Asia", slug: "asia" },
    { name: "South America", slug: "south-america" },
  ],
};

<CategoryMenuColumns categoryGroups={categoryGroups} />;
```

### In Footer

```tsx

<CategoryMenuColumns
  categoryGroups={categoryGroups}
  maxInitialCategories={7}
  className="grid grid-cols-3 gap-x-6 gap-y-4"
/>
```

### In Mobile Menu (Single Column)

```tsx

<CategoryMenuColumns
  categoryGroups={categoryGroups}
  className="grid grid-cols-1 gap-y-6"
  linkClassName="text-base hover:text-primary"
/>
```

### In Header Dropdown

```tsx

<CategoryMenuColumns
  categoryGroups={categoryGroups}
  maxInitialCategories={5}
  className="grid grid-cols-3 gap-x-8 gap-y-6"
/>
```

## Props

| Prop                   | Type                         | Default                        | Description                           |
| ---------------------- | ---------------------------- | ------------------------------ | ------------------------------------- |
| `categoryGroups`       | `Record<string, Category[]>` | **Required**                   | Label-to-categories mapping           |
| `maxInitialCategories` | `number`                     | `7`                            | Max categories shown before "...more" |
| `className`            | `string`                     | `"grid grid-cols-3..."`        | Container grid classes                |
| `linkClassName`        | `string`                     | `"text-sm hover:underline..."` | Category link classes                 |
| `labelClassName`       | `string`                     | `"text-xs font-bold..."`       | Label header classes                  |

## Edge Cases Handled

### 1. Empty or Missing Data

```tsx

// Empty groups object - renders nothing
<CategoryMenuColumns categoryGroups={{}} />;

// Label with no categories - not rendered (violates "label + ≥1 category" rule)
categoryGroups = {
  "Empty Label": [], // This won't appear
};
```

### 2. Unbalanced Category Counts

```json

// Scenario: Label A has 2 categories, Label B has 20 categories
// Solution: Greedy algorithm places heavy labels first, spreads lighter ones
categoryGroups = {
  "Light Group": [cat1, cat2],           // Goes to column 1
  "Heavy Group": [cat1...cat20],         // Goes to column 1 (collapsed)
  "Medium Group": [cat1...cat8],         // Goes to column 2
};
// Result: Columns balance visually despite different category counts
```

### 3. All Labels Expanded

```text

// All labels show full category lists
// Columns remain balanced by total weight
// May result in very tall columns (expected behavior)
```

### 4. Single Label with Many Categories

```json

categoryGroups = {
  "Only Label": [cat1, cat2, ..., cat50], // Shows first 7 + "...more"
};
// Result: All content in column 1, columns 2 & 3 empty
```

### 5. Rapid Expand/Collapse

```text

// User clicks "...more" on multiple labels quickly
// React state batches updates, useMemo prevents excessive recalculations
// Smooth rebalancing without flicker
```

### 6. Long Label/Category Names

```json

categoryGroups = {
  "BY ROAST LEVEL AND PROCESSING METHOD": [...], // Truncates with ellipsis
  "Coffee Categories": [
    { name: "Extra Dark French Roast for Espresso", slug: "..." }, // Truncates
  ],
};
// Result: `truncate` class ensures single-line display with ellipsis
```

### 7. Dynamic Data Updates

```text

// Categories added/removed in database
// Component receives new categoryGroups prop
// useMemo recalculates distribution
// Columns rebalance automatically
```

## Integration Points

### Replace FooterCategories

```typescript

// Before (in SiteFooter.tsx)
import FooterCategories from "./FooterCategories";

// After
import CategoryMenuColumns from "./CategoryMenuColumns";

// In footer component
<CategoryMenuColumns
  categoryGroups={categoryGroups}
  linkClassName="text-sm hover:underline hover:text-primary transition-colors truncate block"
/>;
```

### Use in SiteHeader Desktop Dropdown

```tsx

// In SiteHeader.tsx NavigationMenuContent
<NavigationMenuContent>
  <div className="w-[600px] p-6 h-[330px] overflow-y-auto">
    <CategoryMenuColumns
      categoryGroups={categoryGroups}
      maxInitialCategories={5}
    />
  </div>
</NavigationMenuContent>
```

### Use in Mobile Sheet Menu

```tsx

// In SiteHeader.tsx Sheet
<Sheet>
  <SheetContent>
    <CategoryMenuColumns
      categoryGroups={categoryGroups}
      className="grid grid-cols-1 gap-y-6"
    />
  </SheetContent>
</Sheet>
```

## Testing Scenarios

### Visual Balance Test

1. Open menu with mixed label sizes (some with 2 categories, some with 10+)
2. Verify columns have similar visual height
3. Click "...more" on tallest label
4. Verify columns rebalance smoothly

### Expansion Behavior Test

1. Click "...more" on a label in column 1
2. Observe that label may move to column 2 or 3 if needed for balance
3. Click "...less"
4. Observe rebalancing back

### Edge Case Test

```typescript

// Create test data with extremes
const testData = {
  Tiny: [{ name: "A", slug: "a" }],
  Small: [
    { name: "B", slug: "b" },
    { name: "C", slug: "c" },
  ],
  Large: Array.from({ length: 15 }, (_, i) => ({
    name: `Cat ${i}`,
    slug: `cat-${i}`,
  })),
};
```

## Performance Considerations

- **useMemo**: Distribution calculation only runs when dependencies change
- **Greedy algorithm**: O(n) complexity where n = number of label groups
- **Typical case**: 3-10 labels → instant recalculation (< 1ms)
- **Worst case**: 100 labels → still fast due to simple arithmetic

## Accessibility

- ✅ `aria-expanded` on expand/collapse buttons
- ✅ `aria-label` describes action ("Show more categories in Origins")
- ✅ Semantic HTML (`<ul>`, `<li>`, proper heading hierarchy)
- ✅ Keyboard navigable (native `<button>` and `<Link>` components)

## Future Enhancements

1. **Animation**: Smooth transitions when labels move between columns
2. **Persistence**: Remember expansion states in localStorage
3. **Search**: Filter categories within expanded labels
4. **Icons**: Support label icons next to headers
5. **Custom expand limit**: Per-label override for maxInitialCategories

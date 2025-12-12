# CategoryMenuColumns: Sequential vs Weight-Balanced

## Two Approaches Compared

### 🔢 Sequential Distribution (Current Implementation)

**File:** `CategoryMenuColumns.tsx`

#### Algorithm

```
1. Flatten all labels + categories into sequential list:
   [Label1, Cat1, Cat2, ...more, Label2, Cat1, Cat2, ...]

2. Count total items (e.g., 30)

3. Divide evenly:
   - itemsPerColumn = Math.ceil(30 / 3) = 10
   - Column 1: items[0-9]    (10 items)
   - Column 2: items[10-19]  (10 items)
   - Column 3: items[20-29]  (10 items)

4. Result: Columns differ by ≤1 item
```

#### Pros ✅

- **Strict equality**: Columns always have same item count (±1)
- **Prevents orphans**: Never shows label without at least one category
- **Predictable**: Simple math, easy to understand
- **Fair distribution**: Every item treated equally

#### Cons ⚠️

- **May split label groups**: A label and its categories might be in different columns
- **Less semantic**: Breaks logical grouping for mathematical equality
- **Visual confusion**: Reader might see "ORIGINS" header in column 2 but most categories in column 3

#### Best for:

- Strict requirement: "columns must have equal counts"
- Data with similar-sized groups
- When splitting groups is acceptable

---

### ⚖️ Weight-Balanced Distribution (Saved Version)

**File:** `CategoryMenuColumns.WEIGHT_BALANCED.tsx`

#### Algorithm

```
1. Calculate weight for each label group:
   Weight = 1 (header) + visible_categories + 1 (if ...more link)

   Example:
   - "BY ROAST" (3 cats) = 1 + 3 = 4
   - "ORIGINS" (10 cats collapsed, showing 7) = 1 + 7 + 1 = 9

2. Use greedy algorithm:
   - Start with 3 empty columns
   - For each label group:
     * Find column with smallest total weight
     * Add entire group to that column
     * Update column's weight

3. Result: Visual heights balanced, label groups stay together
```

#### Pros ✅

- **Keeps groups together**: Label and all its categories in same column
- **Better semantics**: Maintains logical relationships
- **Visual balance**: Columns look similar in height
- **Reader-friendly**: No confusing split groups

#### Cons ⚠️

- **Unequal item counts**: Column 1 might have 15 items, Column 2 has 9
- **Complex algorithm**: Greedy approach, harder to predict
- **Dynamic rebalancing**: Expanding one label can move entire groups between columns

#### Best for:

- Visual aesthetics priority
- Mixed group sizes (some labels with 2 cats, others with 15)
- When semantic grouping matters

---

## Side-by-Side Example

### Test Data

```typescript
{
  "BY ROAST LEVEL": [Light, Medium, Dark],              // 3 categories
  "ORIGINS": [Central, Islands, Africa, ...],           // 10 categories
  "BLENDS": [Espresso, Filter, Cold Brew],              // 3 categories
  "COLLECTIONS": [New, Micro, Seasonal, ...]            // 8 categories
}
```

### Sequential Result (Item counts: 10, 10, 9)

```
Column 1 (10 items):          Column 2 (10 items):          Column 3 (9 items):
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ BY ROAST LEVEL  │           │ Central America │           │ ...more         │
│ - Light Roast   │           │ Islands         │           │ BLENDS          │
│ - Medium Roast  │           │ Africa          │           │ - Espresso      │
│ - Dark Roast    │           │ Asia            │           │ - Filter        │
│ ORIGINS         │           │ South America   │           │ - Cold Brew     │
│ ...more         │    │ Caribbean       │           │ COLLECTIONS     │
│ - [first 5]     │           │ Pacific         │           │ - [first 3]     │
│                 │           │ Middle East     │           │                 │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

**Note:** "ORIGINS" label in Column 1, but most categories in Column 2!

### Weight-Balanced Result (Item counts: 12, 11, 6)

```
Column 1 (12 items):          Column 2 (11 items):          Column 3 (6 items):
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ BY ROAST LEVEL  │           │ COLLECTIONS     │           │ BLENDS          │
│ - Light Roast   │           │ - New Arrivals  │           │ - Espresso      │
│ - Medium Roast  │           │ - Micro Lot     │           │ - Filter        │
│ - Dark Roast    │           │ - Seasonal      │           │ - Cold Brew     │
│ ORIGINS         │           │ - Best Sellers  │           └─────────────────┘
│ ...more         │           │ - Limited Ed    │
│ - [first 7]     │           │ - Award Winners │
│                 │           │ - Organic       │
│                 │           │ - Single Origin │
└─────────────────┘           └─────────────────┘
```

**Note:** Each label group stays together. Visually balanced despite unequal counts.

---

## Decision Guide

### Choose **Sequential** if:

- ✅ Requirement: "Columns must have equal item counts"
- ✅ Data has mostly similar-sized groups
- ✅ Splitting groups across columns is acceptable
- ✅ You want simple, predictable behavior

### Choose **Weight-Balanced** if:

- ✅ Visual balance is more important than exact counts
- ✅ Data has mixed group sizes (some tiny, some huge)
- ✅ Keeping label groups together is important for UX
- ✅ You want groups to stay semantically intact

### Hybrid Approach (Future)?

Possible enhancement: Sequential distribution but with "no-split" rule:

- Divide items sequentially
- If a label group would split, move entire group to next column
- Accept slight count imbalance to preserve groups
- Best of both worlds?

---

## Testing Checklist

### Test Scenario 1: Even Distribution

**Data:** 3 labels, each with 5 categories

- [ ] Sequential: Each column has ~5 items
- [ ] Weight-Balanced: Each column has ~5 items
- **Result:** Both perform similarly ✅

### Test Scenario 2: One Large Group

**Data:** Label A (2 cats), Label B (20 cats), Label C (3 cats)

- [ ] Sequential: Label B splits across columns
- [ ] Weight-Balanced: Label B stays in one column (collapsed)
- **Result:** Weight-Balanced better for semantics ✅

### Test Scenario 3: Expansion Behavior

**Data:** Expand a label with 15 categories

- [ ] Sequential: Items redistribute evenly, groups may split
- [ ] Weight-Balanced: Entire group may move to lighter column
- **Result:** Choose based on preference 🤔

### Test Scenario 4: Real Production Data

- [ ] Use actual category/label data from database
- [ ] Test with different expansion states
- [ ] Get user feedback on readability
- **Result:** Let real data decide! 📊

---

## Recommendation

**Start with Sequential** (current implementation) because:

1. Meets your stated requirement: "columns differ by ≤1"
2. Prevents orphaned labels (label with no categories showing)
3. Simpler algorithm, easier to maintain
4. Predictable behavior for users

**Switch to Weight-Balanced** if:

- Users complain about split label groups
- Visual balance becomes more important than count equality
- You discover readability issues in production

**Both versions are saved:**

- `CategoryMenuColumns.tsx` = Sequential (current)
- `CategoryMenuColumns.WEIGHT_BALANCED.tsx` = Weight-balanced (saved)

Easy to swap if needed! 🔄

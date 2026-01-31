# Refactor: Separate Level (Depth) from Kind (Entity Type)

## Problem

Current code conflates hierarchy depth with entity type:

```typescript

// FlatMenuRow uses "level" to mean entity type
type FlatLabelRow = { level: "label"; ... }
type FlatCategoryRow = { level: "category"; ... }

// useMultiEntityDnd hardcodes entity types as levels
export type EntityLevel = "label" | "category";
dragLevel: EntityLevel | null;
isDraggingLabel: hierarchyState.dragLevel === "label",
```

This breaks if we need to add a parent level above labels (e.g., "menu" or "section") or insert levels between existing ones.

## Correct Concepts (Already Exist)

In `types/identity-registry.ts`:
```typescript

export type EntityIdentity = {
  readonly kind: string;    // Entity type: "label", "category", "product"
  readonly depth: number;   // Hierarchy position: 0, 1, 2, ...
  // ...
};
```

In `types/builder-state.ts`:
```typescript

export type SelectedEntityKind = "label" | "category" | "product";
```

## What Needs to Change

### 1. FlatMenuRow Types (`MenuTableView.types.ts`)

**Before:**
```json

type FlatLabelRow = { level: "label"; ... }
```

**After:**
```json

type FlatLabelRow = {
  kind: "label";
  depth: 0;
  ...
}
```

### 2. useMultiEntityDnd

**Before:**
```json

type EntityLevel = "label" | "category";
dragLevel: EntityLevel | null;
if (row.level === "label") { ... }
isDraggingLabel: dragLevel === "label",
```

**After:**
```json

dragKind: EntityKind | null;
dragDepth: number | null;
if (row.kind === "label") { ... }  // or use depth for level-based logic
isDraggingLabel: dragKind === "label",
```

### 3. Drop Validation Logic

Make parent-child relationships configurable rather than hardcoded:

```typescript

// Current: hardcoded checks
if (targetKind === "label" && dragLevel === "category") { ... }

// Future: configurable hierarchy rules
const hierarchyRules = {
  label: { canContain: ["category"], depth: 0 },
  category: { canContain: ["product"], depth: 1 },
  product: { canContain: [], depth: 2 },
};
```

### 4. Type Guards

**Before:**
```typescript

function isLabelRow(row: FlatMenuRow): row is FlatLabelRow {
  return row.level === "label";
}
```

**After:**
```typescript

function isLabelRow(row: FlatMenuRow): row is FlatLabelRow {
  return row.kind === "label";
}
```

## Files Affected

1. `menu-builder/components/table-views/MenuTableView.types.ts` - FlatMenuRow types
2. `hooks/dnd/useMultiEntityDnd.ts` - EntityLevel type, dragLevel state
3. `hooks/dnd/useDnDEligibility.ts` - level checks
4. `hooks/useFlattenedMenuRows.ts` - row generation
5. `hooks/useIdentityRegistry.ts` - already correct, uses kind + depth
6. Components using `row.level` checks

## Migration Strategy

1. Add `kind` and `depth` fields to FlatMenuRow (keep `level` temporarily)
2. Update consumers to use `kind` instead of `level`
3. Update DnD hooks to use `kind` for entity type, `depth` for hierarchy
4. Remove deprecated `level` field
5. Make hierarchy rules configurable for future extensibility

## Future Extensibility

With this refactor, adding a new hierarchy level becomes straightforward:

```json

// Adding "section" above labels
type FlatSectionRow = {
  kind: "section";
  depth: 0;
  ...
}

type FlatLabelRow = {
  kind: "label";
  depth: 1;  // Was 0, now 1
  ...
}
```

The DnD and validation logic would automatically work based on depth comparisons and configurable rules.

# Context Menu Handlers Audit

**Purpose:** Identify duplicated handler patterns across table views for potential consolidation.

**Date:** 2026-01-25

---

## Current Hook Status

### ✅ Already Consolidated (4 hooks)

| Hook | Purpose | Used By |
|------|---------|---------|
| `useContextRowHighlight` | Row highlighting on context menu open | All 5 views |
| `useMoveHandlers` | Move up/down with reorder | AllLabelsTableView, LabelTableView, MenuTableView (labels) |
| `useBulkAction` | Bulk operation executor | AllLabelsTableView, AllCategoriesTableView, MenuTableView (labels) |
| `useDeleteConfirmation` | Delete dialog state | AllLabelsTableView, AllCategoriesTableView, LabelTableView, MenuTableView |

---

## Remaining Duplicated Patterns

### 1. Clone Handlers

| View | Handler | Bulk? | Lines |
|------|---------|-------|-------|
| AllLabelsTableView | `handleContextClone` | ✅ via `executeBulkAction` | 8 |
| AllCategoriesTableView | `handleContextClone` | ✅ via `executeBulkAction` | 8 |
| MenuTableView | `handleLabelContextClone` | ✅ via `executeLabelBulkAction` | 8 |
| MenuTableView | `handleCategoryContextClone` | ❌ single | 10 |
| LabelTableView | `handleContextClone` | ❌ single | 10 |

**Pattern:**

```typescript

// Bulk version (3 views)
const handleContextClone = useCallback(
  async (entityId: string) => {
    await executeBulkAction(entityId, (id) => cloneEntity({ id }), {
      successMessage: (count) => count > 1 ? `${count} entities cloned` : "Entity cloned",
      errorMessage: "Some entities could not be cloned",
    });
  },
  [executeBulkAction, cloneEntity]
);

// Single version (2 views)
const handleContextClone = useCallback(
  async (entityId: string) => {
    const result = await cloneEntity({ id: entityId });
    if (result.ok) {
      toast({ title: "Entity cloned" });
    } else {
      toast({ title: "Error", description: "Could not clone", variant: "destructive" });
    }
  },
  [cloneEntity, toast]
);
```

**Consolidation:** Could extend `useBulkAction` to handle single-item fallback, or create `useContextClone` hook.

---

### 2. Visibility Toggle Handlers

| View | Handler | Bulk? | Lines |
|------|---------|-------|-------|
| AllLabelsTableView | `handleContextVisibilityToggle` | ✅ | 12 |
| AllCategoriesTableView | `handleContextVisibilityToggle` | ✅ | 12 |
| MenuTableView | `handleLabelContextVisibility` | ❌ | 8 |
| MenuTableView | `handleCategoryContextVisibility` | ❌ | 8 |
| LabelTableView | `handleContextVisibility` | ❌ | 8 |
| CategoryTableView | `handleContextVisibility` | ❌ (no-op) | 5 |

**Pattern:**

```typescript

// Bulk version (All* views)
const handleContextVisibilityToggle = useCallback(
  async (entityId: string, visible: boolean) => {
    const targetIds = getTargetIds(entityId);
    if (targetIds.length === 1) {
      await handleVisibilitySave(entityId, visible);
    } else {
      await Promise.all(targetIds.map((id) => updateEntity(id, { isVisible: visible })));
      toast({ title: `${targetIds.length} entities ${visible ? "shown" : "hidden"}` });
    }
  },
  [getTargetIds, handleVisibilitySave, updateEntity, toast]
);

// Single version
const handleContextVisibility = useCallback(
  async (entityId: string, visible: boolean) => {
    const result = await updateEntity(entityId, { isVisible: visible });
    if (!result.ok) {
      toast({ title: "Error", description: "Could not update visibility", variant: "destructive" });
    }
  },
  [updateEntity, toast]
);
```

**Consolidation:** Could create `useContextVisibility` hook with optional bulk support.

---

### 3. Remove Handlers (Detach from Parent)

| View | Handler | Parent Context | Lines |
|------|---------|----------------|-------|
| LabelTableView | `handleContextRemove` | `currentLabelId` | 10 |
| CategoryTableView | `handleContextRemove` | `currentCategoryId` | 10 |

**Pattern:**

```typescript

const handleContextRemove = useCallback(
  async (childId: string) => {
    if (!currentParentId) return;
    const result = await detachChild(currentParentId, childId);
    if (result.ok) {
      toast({ title: "Removed from parent" });
    } else {
      toast({ title: "Error", description: "Could not remove", variant: "destructive" });
    }
  },
  [currentParentId, detachChild, toast]
);
```

**Consolidation:** Could create `useContextRemove` hook with parent context.

---

### 4. Move To Handlers (Detach + Attach)

| View | Handler | Entity | Lines |
|------|---------|--------|-------|
| LabelTableView | `handleMoveTo` | Category | 25 |
| MenuTableView | `handleCategoryMoveTo` | Category | 25 |
| CategoryTableView | `handleMoveTo` | Product | 20 |

**Pattern for categories:**

```typescript

const handleMoveTo = useCallback(
  async (entityId: string, toParentId: string) => {
    if (!currentParentId) return;
    const entity = entities.find((e) => e.id === entityId);
    const toParent = parents.find((p) => p.id === toParentId);

    const detachResult = await detach(currentParentId, entityId);
    if (!detachResult.ok) {
      toast({ title: "Move failed", description: "Failed to remove", variant: "destructive" });
      return;
    }

    const attachResult = await attach(toParentId, entityId);
    if (!attachResult.ok) {
      await attach(currentParentId, entityId); // revert
      toast({ title: "Move failed", description: "Failed to add", variant: "destructive" });
      return;
    }

    toast({
      title: "Moved",
      description: `Moved "${entity?.name}" to "${toParent?.name}"`,
    });
  },
  [currentParentId, entities, parents, attach, detach, toast]
);
```

**Consolidation:** Could create `useContextMoveTo` hook. LabelTableView and MenuTableView share same pattern for categories.

---

### 5. Relationship Toggle Handlers (Manage Categories/Labels Submenu)

| View | Handler | Relationship | Lines |
|------|---------|--------------|-------|
| AllLabelsTableView | `handleCategoryToggle` | Label ↔ Category | 12 |
| AllCategoriesTableView | `handleLabelToggle` | Category ↔ Label | 12 |
| CategoryTableView | `handleCategoryToggle` | Product ↔ Category | 15 |

**Pattern:**

```typescript

const handleRelationshipToggle = useCallback(
  async (entityId: string, relatedId: string, shouldAttach: boolean) => {
    if (shouldAttach) {
      const result = await attach(entityId, relatedId);
      if (!result.ok) {
        toast({ title: "Error", description: "Could not add", variant: "destructive" });
      }
    } else {
      const result = await detach(entityId, relatedId);
      if (!result.ok) {
        toast({ title: "Error", description: "Could not remove", variant: "destructive" });
      }
    }
  },
  [attach, detach, toast]
);
```

**Consolidation:** Could create `useRelationshipToggle` hook.

---

### 6. Category Move Up/Down in Menu View (Special Case)

| View | Handler | Notes |
|------|---------|-------|
| MenuTableView | `handleCategoryMoveUp` | Requires parentLabelId at call time |
| MenuTableView | `handleCategoryMoveDown` | Requires parentLabelId at call time |

**Pattern:**

```typescript

const handleCategoryMoveUp = useCallback(
  async (categoryId: string, parentLabelId: string) => {
    const parentLabel = visibleLabels.find((l) => l.id === parentLabelId);
    if (!parentLabel) return;
    const categoryIds = parentLabel.categories.slice().sort((a, b) => a.order - b.order).map((c) => c.id);
    const index = categoryIds.indexOf(categoryId);
    if (index <= 0) return;
    [categoryIds[index - 1], categoryIds[index]] = [categoryIds[index], categoryIds[index - 1]];
    await reorderCategoriesInLabel(parentLabelId, categoryIds);
  },
  [visibleLabels, reorderCategoriesInLabel]
);
```

**Consolidation:** This is hierarchical-specific. Could create `useChildMoveHandlers` but low ROI since only used in MenuTableView.

---

## Recommended Consolidation Priority

### High Priority (Good ROI)

1. **`useContextVisibility`** - 5 implementations, ~50 lines total
   - Combine single and bulk variants
   - Option for undo support integration

2. **`useRelationshipToggle`** - 3 implementations, ~39 lines total
   - Generic attach/detach toggle
   - Used in manage-categories/labels submenus

### Medium Priority

1. **`useContextClone`** - 5 implementations, ~44 lines total
   - Could extend `useBulkAction` to handle single item
   - OR create dedicated hook

2. **`useContextRemove`** - 2 implementations, ~20 lines total
   - Simple detach pattern with parent context
   - Small win but clean abstraction

### Low Priority

1. **`useContextMoveTo`** - 3 implementations, ~70 lines total
   - More complex, different signatures for products vs categories
   - May not be worth abstracting

2. **Category move in hierarchy** - 2 implementations, ~30 lines total
   - Only used in MenuTableView
   - Keep view-specific

---

## Summary Table

| Handler Type | Views Using | Current Lines | Potential Savings |
|--------------|-------------|---------------|-------------------|
| Clone | 5 | ~44 | ~25 |
| Visibility | 5 | ~53 | ~30 |
| Remove | 2 | ~20 | ~10 |
| Move To | 3 | ~70 | ~40 |
| Relationship Toggle | 3 | ~39 | ~25 |
| Child Move (hierarchy) | 1 | ~30 | 0 (keep as-is) |

**Total potential savings:** ~130 lines + improved maintainability

---

## Implementation Notes

### For `useContextVisibility`

```typescript

type UseContextVisibilityOptions = {
  updateEntity: (id: string, data: { isVisible: boolean }) => Promise<{ ok: boolean }>;
  getTargetIds?: (id: string) => string[];  // For bulk support
  handleVisibilitySave?: (id: string, visible: boolean) => Promise<void>;  // For undo support
};
```

### For `useRelationshipToggle`

```typescript

type UseRelationshipToggleOptions = {
  attach: (primaryId: string, relatedId: string) => Promise<{ ok: boolean }>;
  detach: (primaryId: string, relatedId: string) => Promise<{ ok: boolean }>;
  entityLabel?: string;  // For toast messages
};
```

---

**Next Steps:**

1. Decide which hooks to implement based on priority
2. Write tests first (TDD)
3. Implement hooks in `hooks/context-menu/`
4. Migrate views one at a time

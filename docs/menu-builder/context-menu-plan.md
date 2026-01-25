# Context Menu Infrastructure - Implementation Plan

**Branch:** `feat/context-menu`
**Target Version:** v0.67.0
**Status:** Planning Complete

---

## Overview

Add right-click context menus to table views for mobile DnD operations and quick actions. Uses shadcn's `ContextMenu` component. Context-based action availability (view + entity determines which actions appear).

---

## Design Decisions

1. **No visual trigger** - Right-click (desktop) / long-press (mobile) on rows only
2. **Context-based actions** - Actions vary by view AND entity type
3. **Single component** - `RowContextMenu` handles all entities
4. **Extends shadcn** - Uses `ContextMenu`, `ContextMenuSub`, `ContextMenuShortcut`
5. **Visibility uses Switch** - Inline switch component showing current state

---

## Actions by View & Entity

### Label

| View | Actions |
|------|---------|
| **Menu view** | Clone, Remove*, Delete, Move Up, Move Down |
| **All-Labels view** | Clone, Visibility (switch), Delete, Move Up, Move Down |

*Remove in menu view = `isVisible: false` (removes from menu)

### Category

| View | Actions |
|------|---------|
| **Menu view** | Clone, Visibility, Delete, Move Up, Move Down, Move to → |
| **Label view** | Clone, Remove, Visibility, Delete, Move Up, Move Down, Move to → |
| **All-Categories view** | Clone, Remove, Visibility, Delete, Move Up, Move Down, Move to → |

### Product

| View | Actions |
|------|---------|
| **Category view** | Visibility, Remove, Move Up, Move Down, Move to → |

---

## Action Components

| Action | Component | Notes |
|--------|-----------|-------|
| Clone | `ContextMenuItem` | + `ContextMenuShortcut` |
| Remove | `ContextMenuItem` | + `ContextMenuShortcut` |
| Delete | `ContextMenuItem` | Destructive styling |
| Visibility | `ContextMenuItem` | Contains `Switch` component |
| Move Up | `ContextMenuItem` | + `ContextMenuShortcut`, disabled at top |
| Move Down | `ContextMenuItem` | + `ContextMenuShortcut`, disabled at bottom |
| Move to | `ContextMenuSub` | Submenu with target picker |

---

## Keyboard Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Clone | `⌘D` | `Ctrl+D` |
| Remove | `⌫` | `Backspace` |
| Delete | `⌘⌫` | `Ctrl+Backspace` |
| Move Up | `⌥↑` | `Alt+↑` |
| Move Down | `⌥↓` | `Alt+↓` |

---

## Disabled States

| Condition | Disabled Actions |
|-----------|------------------|
| No selection | All actions |
| Mixed entity types | Clone, Move to |
| At top of list | Move Up |
| At bottom of list | Move Down |
| Multi-select | Move Up, Move Down |

---

## Bulk Selection

When multiple items selected:
- Bulk-compatible actions operate on all selected
- Labels reflect plurality ("Delete 3 categories")
- Move Up/Down hidden (single item only)

| Action | Bulk Support |
|--------|--------------|
| Clone | ✅ |
| Visibility | ✅ |
| Remove | ✅ |
| Delete | ✅ |
| Move Up/Down | ❌ |
| Move to | ✅ |

---

## New Server Actions Needed

| Action | File | Status |
|--------|------|--------|
| `reorderLabel` | `actions/labels.ts` | 🆕 Move Up/Down |
| `reorderCategory` | `actions/categories.ts` | 🆕 Move Up/Down |
| `reorderProduct` | `actions/products.ts` | 🆕 Move Up/Down |
| `moveProductToCategory` | `actions/products.ts` | 🆕 Move to |

*Note: `moveCategoryToLabel` already exists for cross-boundary DnD*

---

## Implementation Phases

### Phase 1: Setup & Server Actions
- [ ] Verify shadcn context-menu installed
- [ ] Create `reorderLabel` action (move up/down by adjusting order field)
- [ ] Create `reorderCategory` action
- [ ] Create `reorderProduct` action
- [ ] Create `moveProductToCategory` action
- [ ] Add to `useProductMenuMutations`

**Validation:**
- [ ] Server actions work via direct calls
- [ ] Order field updates correctly
- [ ] SWR revalidates after mutation

### Phase 2: RowContextMenu Component
- [ ] Create `RowContextMenu.tsx` in `shared/cells/`
- [ ] Props: `entityKind`, `viewType`, `entityId`, `isVisible`, `position`
- [ ] Map view+entity to available actions
- [ ] Render with shadcn ContextMenu primitives
- [ ] Add Switch for visibility action
- [ ] Add ContextMenuSub for "Move to" with picker

**Validation:**
- [ ] Menu renders on right-click
- [ ] Correct actions shown per view/entity
- [ ] Shortcuts displayed correctly
- [ ] Disabled states work
- [ ] Switch toggles visibility

### Phase 3: Table View Integration
- [ ] Add to `AllLabelsTableView`
- [ ] Add to `AllCategoriesTableView`
- [ ] Add to `MenuTableView`
- [ ] Add to `LabelTableView`
- [ ] Add to `CategoryTableView`

**Validation:**
- [ ] Context menu works in all views
- [ ] Actions execute correctly
- [ ] Undo/redo integration works
- [ ] Toast notifications show

### Phase 4: Polish
- [ ] Mobile long-press support
- [ ] Keyboard navigation in menu
- [ ] Focus management
- [ ] Accessibility (ARIA)
- [ ] Update ROADMAP.md section 2.2

**Validation:**
- [ ] Works on touch devices
- [ ] No accessibility warnings
- [ ] Documentation updated

---

## Files

### New Files
- `menu-builder/components/table-views/shared/cells/RowContextMenu.tsx`

### Modified Files
- `actions/labels.ts` (reorderLabel)
- `actions/categories.ts` (reorderCategory)
- `actions/products.ts` (reorderProduct, moveProductToCategory)
- `hooks/useProductMenuMutations.ts`
- `AllLabelsTableView.tsx`
- `AllCategoriesTableView.tsx`
- `MenuTableView.tsx`
- `LabelTableView.tsx`
- `CategoryTableView.tsx`

---

## Dependencies

- `@radix-ui/react-context-menu` (via shadcn)

---

## Implementation Details

### Architecture: Entity+View Pattern

The `ViewEntityKey` pattern (`${ViewType}:${SelectedEntityKind}`) is **correct and necessary**:

```typescript
const CONTEXT_MENU_CONFIG: Record<ViewEntityKey, ContextMenuActionId[]> = {
  "menu:label": ["clone", "remove", "delete", "move-up", "move-down"],
  "all-labels:label": ["clone", "visibility", "manage-categories", "delete", "move-up", "move-down"],
  "label:category": ["clone", "remove", "visibility", "delete", "move-up", "move-down", "move-to"],
  // ...
};
```

**Why not per-view only:**
- MenuTableView has hierarchical entities (labels + categories) needing different menus per level
- Label view can have categories attached - different actions needed
- Category view manages products - different entity = different actions

---

### Selection vs Context Behavior

**Key distinction:** Context menu operates on the **right-clicked item**, not the selection.

| Scenario | Behavior |
|----------|----------|
| Right-click item NOT in selection | Single-item mode on clicked item |
| Right-click item IN selection (count=1) | Single-item mode (identical to above) |
| Right-click item IN selection (count>1) | Bulk mode on all selected items |

**Implementation:**
```typescript
// Bulk mode detection
const isBulkMode = isInSelection && selectedCount > 1;
const showCount = isBulkMode; // Only show counts when bulk
```

---

### Context Row Highlighting

When context menu opens, highlight the right-clicked row distinctly from selection.

**TableRow props:**
```typescript
isSelected?: boolean;      // Selection highlight (primary border, accent bg)
isContextRow?: boolean;    // Context menu highlight (muted border, muted bg)
```

**Styling (in TableRow.tsx):**
```typescript
isSelected
  ? "border-l-primary bg-accent/50"
  : isContextRow
    ? "border-l-muted-foreground bg-muted/60"
    : "border-l-transparent"
```

**Usage in table view:**
```tsx
const [contextRowId, setContextRowId] = useState<string | null>(null);

<RowContextMenu onOpenChange={(open) => setContextRowId(open ? item.id : null)}>
  <TableRow isContextRow={contextRowId === item.id} ... />
</RowContextMenu>
```

---

### Mixed Selection Handling

When selection contains mixed entity types, show disabled menu with explanation.

**Detection:**
```typescript
const isMixedSelection = actionableRoots.length > 0 && !isSameKind;
```

**Disabled menu UI:**
```tsx
{isMixedSelection && isInSelection && (
  <ContextMenuContent>
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
      <AlertTriangle className="size-4" />
      <span>Mixed selection</span>
    </div>
    <p className="px-2 pb-2 text-xs text-muted-foreground">
      Select items of the same type for bulk actions
    </p>
    <ContextMenuSeparator />
    {/* All actions rendered as disabled */}
  </ContextMenuContent>
)}
```

---

### Bulk Mode Action Filtering

Actions define whether they support bulk operations. Non-bulk actions are **hidden** (not disabled) in bulk mode.

**Action definition:**
```typescript
const CONTEXT_MENU_ACTIONS: Record<ContextMenuActionId, ContextMenuAction> = {
  clone: { id: "clone", label: "Clone", icon: Copy, supportsBulk: true },
  "move-up": { id: "move-up", label: "Move Up", icon: ArrowUp, supportsBulk: false },
  "manage-categories": { id: "manage-categories", label: "Categories", icon: ListChecks, supportsBulk: false },
  // ...
};
```

**Filtering:**
```typescript
const actionIds = isBulkMode
  ? allActionIds.filter((id) => CONTEXT_MENU_ACTIONS[id].supportsBulk)
  : allActionIds;
```

---

### Bulk Mode Label Formatting

Show counts in labels when in bulk mode:

```typescript
const renderLabel = (label: string) => {
  if (showCount) {
    return `${label} (${bulkCount})`;
  }
  return label;
};

// Header when bulk:
<ContextMenuLabel className="text-xs font-normal text-muted-foreground">
  {bulkCount} {bulkCount === 1 ? entityLabel : entityLabelPlural} selected
</ContextMenuLabel>
```

---

### Categories Submenu (for Labels)

Two sections: "Added" and "Available", using shared CheckboxListContent component.

**Sectioning logic:**
```typescript
const addedCategories = categoryTargets
  .filter((c) => attachedCategoryIds.includes(c.id))
  .sort((a, b) => a.name.localeCompare(b.name));

const availableCategories = categoryTargets
  .filter((c) => !attachedCategoryIds.includes(c.id))
  .sort((a, b) => a.name.localeCompare(b.name));
```

**Rendering:**
```tsx
<ContextMenuSub>
  <ContextMenuSubTrigger className="gap-2">
    <ListChecks className="size-4" />
    Categories
  </ContextMenuSubTrigger>
  <ContextMenuSubContent className="w-56 p-0">
    <CheckboxListContent
      variant="context-menu"
      sections={[
        { label: "Added", items: addedCategories.map(...) },
        { label: "Available", items: availableCategories.map(...) },
      ]}
      onItemToggle={(categoryId, checked) => onCategoryToggle?.(categoryId, checked)}
    />
  </ContextMenuSubContent>
</ContextMenuSub>
```

---

### Shared CheckboxListContent Component

Reusable component for both dropdown and context menu checkbox lists.

**Location:** `menu-builder/components/shared/CheckboxListContent.tsx`

**Props:**
```typescript
type CheckboxListContentProps = {
  variant: "dropdown" | "context-menu";
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sections: CheckboxListSection[];
  onItemToggle: (itemId: string, checked: boolean) => void | Promise<void>;
  emptyMessage?: string;
};
```

**Width control:** Set on container (`ContextMenuSubContent` or `DropdownMenuContent`), not on CheckboxListContent.

---

### Keyboard Shortcut Display

Use `<Kbd>` component instead of `ContextMenuShortcut`:

```tsx
import { Kbd } from "@/components/ui/kbd";

<ContextMenuItem>
  <Icon className="size-4" />
  {label}
  {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
</ContextMenuItem>
```

**Shortcut formatting (platform-aware):**
```typescript
function formatKbd(kbd: string[] | undefined, isMac: boolean): string | undefined {
  if (!kbd || kbd.length === 0) return undefined;
  return kbd
    .map((key) => {
      if (key === "⌘" && !isMac) return "Ctrl";
      if (key === "Alt") return isMac ? "⌥" : "Alt";
      if (key === "Shift") return isMac ? "⇧" : "Shift";
      return key;
    })
    .join(isMac ? "" : "+");
}
```

---

### Icon and Spacing Conventions

**ContextMenuItem:** Has `gap-2` built-in. Icons should NOT have `mr-2`.

**ContextMenuSubTrigger:** Does NOT have gap. Add `className="gap-2"`.

```tsx
// Regular item - gap-2 built-in
<ContextMenuItem>
  <Icon className="size-4" />
  Label
</ContextMenuItem>

// Sub trigger - needs explicit gap
<ContextMenuSubTrigger className="gap-2">
  <Icon className="size-4" />
  Label
</ContextMenuSubTrigger>
```

---

### Action Grouping

Actions are grouped with separators:
1. **Main actions** (clone, visibility, remove, manage-categories)
2. **Move actions** (move-up, move-down, move-to)
3. **Delete action** (destructive, always last)

```typescript
const mainActions = actionIds.filter(
  (id) => !["move-up", "move-down", "move-to", "delete"].includes(id)
);
const moveActions = actionIds.filter((id) =>
  ["move-up", "move-down", "move-to"].includes(id)
);
const deleteAction = actionIds.includes("delete") ? ["delete"] : [];
```

---

### Position-Based Disabling

Move Up disabled when `isFirst`, Move Down disabled when `isLast`:

```tsx
<ContextMenuItem disabled={!onMoveUp || isFirst}>
  <ArrowUp className="size-4" />
  Move Up
</ContextMenuItem>
```

---

### Props Required from Table Views

Each table view must provide these props to RowContextMenu:

| Prop | Type | Purpose |
|------|------|---------|
| `entityKind` | `SelectedEntityKind` | Which entity type |
| `viewType` | `ViewType` | Which view |
| `entityId` | `string` | ID of right-clicked item |
| `isVisible` | `boolean` | Current visibility state |
| `isFirst` | `boolean` | Position for Move Up |
| `isLast` | `boolean` | Position for Move Down |
| `selectedCount` | `number` | For bulk mode detection |
| `isInSelection` | `boolean` | Whether item is selected |
| `isMixedSelection` | `boolean` | Whether selection has mixed types |
| `moveToTargets?` | `MoveTarget[]` | Targets for Move To submenu |
| `currentParentId?` | `string` | Exclude from move targets |
| `categoryTargets?` | `CategoryTarget[]` | For manage-categories (labels) |
| `attachedCategoryIds?` | `string[]` | Current categories (labels) |
| `onOpenChange` | `(open: boolean) => void` | For context row highlight |
| `onClone?` | `() => void` | Callback |
| `onVisibilityToggle?` | `(visible: boolean) => void` | Callback |
| `onRemove?` | `() => void` | Callback |
| `onDelete?` | `() => void` | Callback |
| `onMoveUp?` | `() => void` | Callback |
| `onMoveDown?` | `() => void` | Callback |
| `onMoveTo?` | `(targetId: string) => void` | Callback |
| `onCategoryToggle?` | `(catId: string, attached: boolean) => void` | Callback |

---

### Files Modified

| File | Changes |
|------|---------|
| `RowContextMenu.tsx` | Core component with all above patterns |
| `TableRow.tsx` | Added `isContextRow` prop |
| `AllLabelsTableView.tsx` | First integration with bulk mode |
| `CheckboxListContent.tsx` | New shared component |
| `DropdownContent.tsx` | Now wraps CheckboxListContent |

---

**Created:** 2026-01-24
**Updated:** 2026-01-25

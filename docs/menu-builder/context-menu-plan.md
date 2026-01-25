# Context Menu Infrastructure - Implementation Plan

**Branch:** `feat/context-menu` → merged to `unify-menu-builder`
**Target Version:** v0.71.0
**Status:** Phase 3 Complete, Phase 4 Pending

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

**Action Order:** manage-* → clone → remove → visibility → move-* → delete

### Label

| View | Actions |
|------|---------|
| **Menu view** | Clone, Remove*, Move Up, Move Down, Delete |
| **All-Labels view** | Categories →, Clone, Visibility, Move Up, Move Down, Delete |

*Remove in menu view = `isVisible: false` (removes from menu)

### Category

| View | Actions |
|------|---------|
| **Menu view** | Clone, Visibility, Move Up, Move Down, Move To → |
| **Label view** | Clone, Remove, Visibility, Move Up, Move Down, Move To → |
| **All-Categories view** | Labels →, Clone, Visibility, Delete |

*Note: Category in Menu/Label views has no Delete (prevents accidental deletion)*
*Note: All-Categories has no Remove/Move (many-to-many with labels, table sorting)*

### Product

| View | Actions |
|------|---------|
| **Category view** | Categories →, Remove, Move Up, Move Down |

*Note: Products have no Move To, Visibility, Clone, or Delete in context menu*

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

### Phase 1: Setup & Server Actions ✅ COMPLETE
- [x] Verify shadcn context-menu installed
- [x] Create `reorderLabel` action (uses existing reorderLabels)
- [x] Create `reorderCategory` action (uses existing)
- [x] Create `reorderProduct` action (uses existing)
- [x] Create `moveProductToCategory` action
- [x] Add to `useProductMenuMutations`

**Validation:**
- [x] Server actions work via direct calls
- [x] Order field updates correctly
- [x] SWR revalidates after mutation

### Phase 2: RowContextMenu Component ✅ COMPLETE
- [x] Create `RowContextMenu.tsx` in `shared/cells/`
- [x] Props: `entityKind`, `viewType`, `entityId`, `isVisible`, `position`
- [x] Map view+entity to available actions
- [x] Render with shadcn ContextMenu primitives
- [x] Add Switch for visibility action
- [x] Add ContextMenuSub for "Categories" (label entity)

**Validation:**
- [x] Menu renders on right-click
- [x] Correct actions shown per view/entity
- [x] Disabled states work
- [x] Switch toggles visibility

### Phase 3: Table View Integration ✅ COMPLETE
- [x] Add to `AllLabelsTableView`
- [x] Add to `AllCategoriesTableView`
- [x] Add to `MenuTableView`
- [x] Add to `LabelTableView`
- [x] Add to `CategoryTableView`

**Validation:**
- [x] Context menu works in all views
- [x] Actions execute correctly
- [x] Undo/redo integration works
- [x] Toast notifications show

### Phase 4: Polish ⏳ PENDING
- [x] Mobile long-press support (shadcn handles this)
- [ ] Keyboard shortcut hints in menu items
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
  // Action order: manage-* → clone → remove → visibility → move-* → delete
  "menu:label": ["clone", "remove", "move-up", "move-down", "delete"],
  "all-labels:label": ["manage-categories", "clone", "visibility", "move-up", "move-down", "delete"],
  "menu:category": ["clone", "visibility", "move-up", "move-down", "move-to"],
  "label:category": ["clone", "remove", "visibility", "move-up", "move-down", "move-to"],
  "all-categories:category": ["manage-labels", "clone", "visibility", "delete"],
  "category:product": ["manage-categories", "remove", "move-up", "move-down"],
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
  "manage-categories": { id: "manage-categories", label: "Categories", icon: FileSpreadsheet, supportsBulk: false },
  "manage-labels": { id: "manage-labels", label: "Labels", icon: Tags, supportsBulk: false },
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

### Relationship Management Submenus

Both `manage-categories` and `manage-labels` actions show submenus with:
- **Search bar** at top (sticky, filters results)
- **Added** section: items currently attached (checked)
- **Available** section: items not yet attached (unchecked)

**Icons:**
- `manage-categories`: `FileSpreadsheet` (matches nav icon)
- `manage-labels`: `Tags`

**Search state management:**
```typescript
// Search state resets when menu closes
const [categorySearch, setCategorySearch] = React.useState("");
const handleOpenChange = React.useCallback((open: boolean) => {
  if (!open) setCategorySearch("");
  onOpenChange?.(open);
}, [onOpenChange]);
```

**Sectioning with search filter:**
```typescript
const searchLower = categorySearch.toLowerCase();
const filteredCategories = categorySearch
  ? categoryTargets.filter((c) => c.name.toLowerCase().includes(searchLower))
  : categoryTargets;

const addedCategories = filteredCategories
  .filter((c) => attachedCategoryIds.includes(c.id))
  .sort((a, b) => a.name.localeCompare(b.name));
```

**Rendering:**
```tsx
<ContextMenuSub>
  <ContextMenuSubTrigger className="gap-2">
    <FileSpreadsheet className="size-4" />
    Categories
  </ContextMenuSubTrigger>
  <ContextMenuSubContent className="w-56 p-0">
    <CheckboxListContent
      variant="context-menu"
      searchable
      searchPlaceholder="Search categories..."
      searchValue={categorySearch}
      onSearchChange={setCategorySearch}
      sections={[
        { label: "Added", items: addedCategories.map(...) },
        { label: "Available", items: availableCategories.map(...) },
      ]}
      onItemToggle={(categoryId, checked) => onCategoryToggle?.(categoryId, checked)}
      emptyMessage="No categories found"
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
| `categoryTargets?` | `CategoryTarget[]` | For manage-categories (labels, products) |
| `attachedCategoryIds?` | `string[]` | Current categories (labels, products) |
| `labelTargets?` | `LabelTarget[]` | For manage-labels (categories) |
| `attachedLabelIds?` | `string[]` | Current labels (categories) |
| `onOpenChange` | `(open: boolean) => void` | For context row highlight |
| `onClone?` | `() => void` | Callback |
| `onVisibilityToggle?` | `(visible: boolean) => void` | Callback |
| `onRemove?` | `() => void` | Callback |
| `onDelete?` | `() => void` | Callback |
| `onMoveUp?` | `() => void` | Callback |
| `onMoveDown?` | `() => void` | Callback |
| `onMoveTo?` | `(targetId: string) => void` | Callback |
| `onCategoryToggle?` | `(catId: string, attached: boolean) => void` | Callback |
| `onLabelToggle?` | `(labelId: string, attached: boolean) => void` | Callback |

---

### Files Modified

| File | Changes |
|------|---------|
| `RowContextMenu.tsx` | Core component with all patterns, search in submenus |
| `TableRow.tsx` | Added `isContextRow` prop |
| `AllLabelsTableView.tsx` | Integration with manage-categories submenu |
| `AllCategoriesTableView.tsx` | Integration with manage-labels submenu |
| `CategoryTableView.tsx` | Integration with manage-categories for products |
| `MenuTableView.tsx` | Integration for labels and categories |
| `LabelTableView.tsx` | Integration for categories |
| `CheckboxListContent.tsx` | Shared component with search support |
| `DropdownContent.tsx` | Wrapper for CheckboxListContent |
| `action-bar/views.ts` | Removed "remove" from all-categories view |

---

**Created:** 2026-01-24
**Updated:** 2026-01-25

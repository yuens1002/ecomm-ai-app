# Menu Builder: Mobile Interactions & Range Selection Plan

**Created:** 2026-01-24
**Updated:** 2026-01-25
**Status:** Phase 1 Complete, Phase 2 In Progress
**Priority:** Low (mobile admin is edge case, AI features are priority)

---

## Overview

Mobile admin usage is not a common use case. This plan focuses on **minimal viable mobile support** - enough to "get by" without dedicated mobile UX.

**Core principle:** Context menu handles all mobile interactions (no dedicated Reorder Mode).

This document outlines:
1. **Range Selection** - Shift+click on desktop, long-press checkbox on both platforms
2. **Context Menus** - Right-click (desktop) + long-press row (mobile) with Move Up/Down
3. **Touch Target Compliance** - 44x44px minimum targets

**Explicitly deferred:**
- ~~Touch DnD with drag gesture~~
- ~~Dedicated Reorder Mode UI~~
- ~~@dnd-kit migration~~

---

## Feature 1: Range Selection

### Current State
- Single-click toggles individual row selection
- Cmd/Ctrl+click adds to selection (desktop only)
- No way to select a contiguous range of items
- No mobile equivalent for multi-select gestures

### Desktop: Shift+Click

**Behavior:**
1. User clicks row A (selected, becomes "anchor")
2. User Shift+clicks row B
3. All rows from A to B become selected (inclusive)
4. Anchor remains at A for subsequent Shift+clicks

**Edge Cases:**
- Shift+click with no prior selection → select from first visible row to clicked row
- Shift+click on already-selected row → no change (or deselect range?)
- Shift+click across collapsed sections → only select visible rows
- Shift+click in hierarchy → select visible rows regardless of parent/child

**Implementation:**

```typescript
// useContextSelectionModel.ts additions
type SelectionState = {
  selectedKeys: Set<string>;
  anchorKey: string | null;  // NEW: track range selection anchor
};

const handleRowClick = (key: string, event: MouseEvent) => {
  if (event.shiftKey && anchorKey) {
    // Range select from anchor to clicked row
    const range = getVisibleKeysBetween(anchorKey, key);
    setSelectedKeys(new Set([...selectedKeys, ...range]));
  } else if (event.metaKey || event.ctrlKey) {
    // Toggle individual (existing behavior)
    toggleSelection(key);
  } else {
    // Single select - set new anchor
    setSelectedKeys(new Set([key]));
    setAnchorKey(key);
  }
};
```

**Files to Modify:**
- `hooks/useContextSelectionModel.ts` - Add anchor tracking, range selection logic
- `hooks/useRowClickHandler.ts` - Pass shift/meta key state
- `menu-builder/components/table-views/shared/table/TableRow.tsx` - Forward click event

### Mobile & Desktop: Long-Press Checkbox for Range Selection

**Behavior:**
1. User taps/clicks checkbox A (selected, becomes anchor)
2. User **long-presses checkbox B** (500ms)
3. All visible rows from A to B immediately selected (no confirmation needed)
4. Toast feedback: "Selected 5 items"

**Why Long-Press on Checkbox?**
- **Inline gesture** - No extra buttons needed, action happens where user is already interacting
- **Clear intent** - Long-press on checkbox clearly signals "special selection behavior"
- **Works on both platforms** - Same gesture for desktop and mobile
- **Discoverable** - Tooltip on desktop: "Long-press to select range"

**Visual Feedback During Long-Press:**
- Checkbox shows progress indicator (circular fill or pulse animation)
- After 500ms, haptic feedback (mobile) + visual confirmation
- Range highlight previews which rows will be selected

**Scroll-Safe Implementation:**
- Cancel long-press if touch moves > 10px (user is scrolling)
- Uses same `useLongPress` hook with movement threshold
- See "Long-Press Detection (Scroll-Safe)" section below for implementation

**Implementation:**

```typescript
// CheckboxCell with long-press support
const CheckboxCell = ({ rowKey, isSelected, onSelect, onRangeSelect, anchorKey }) => {
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handlePointerDown = () => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      if (anchorKey && anchorKey !== rowKey) {
        onRangeSelect(anchorKey, rowKey);
      }
      setIsLongPressing(false);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      // Short press - normal toggle
      if (isLongPressing) {
        onSelect(rowKey);
      }
    }
    setIsLongPressing(false);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn(
        "touch-target",
        isLongPressing && "animate-pulse ring-2 ring-primary"
      )}
    >
      <Checkbox checked={isSelected} />
      {isLongPressing && <CircularProgress className="absolute" />}
    </div>
  );
};
```

**Tooltip (Desktop):**
```
[Checkbox hover tooltip]
"Click to select, long-press to select range"
-- or when anchor exists --
"Long-press to select range from [Anchor Name]"
```

**Fallback: "Select Range" Button (Optional)**

If long-press discoverability is a concern, add optional action bar button:
- Appears when 1+ items selected
- Shows on mobile only (desktop has Shift+click)
- Entering range mode highlights anchor row
- Toast: "Tap another checkbox to complete range"

---

## Feature 2: Context Menus (Right-Click + Long-Press)

### Current State
- No context menu implementation
- Right-click does nothing
- Long-press does nothing on mobile
- No way to reorder on mobile (HTML5 DnD doesn't work on touch)

### Implementation

**shadcn ContextMenu handles both platforms automatically:**
- **Desktop:** Right-click triggers menu
- **Mobile:** Long-press triggers menu (built into Radix UI)

No separate mobile implementation needed!

**Menu Items (per view):**
- Same actions as action bar, filtered by selection state
- **Move Up / Move Down** - Mobile alternative to drag-and-drop
- Example for all-labels: Move Up, Move Down, Clone, Toggle Visibility, Delete

**Implementation:**

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Wrap TableRow with ContextMenu - works on desktop AND mobile
<ContextMenu>
  <ContextMenuTrigger asChild>
    <TableRow ... />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={handleMoveUp} disabled={isFirstItem}>
      <ChevronUp className="mr-2 h-4 w-4" />
      Move Up
    </ContextMenuItem>
    <ContextMenuItem onClick={handleMoveDown} disabled={isLastItem}>
      <ChevronDown className="mr-2 h-4 w-4" />
      Move Down
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onClick={handleClone}>
      <Copy className="mr-2 h-4 w-4" />
      Clone
      <ContextMenuShortcut>D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem onClick={handleToggleVisibility}>
      <Eye className="mr-2 h-4 w-4" />
      Toggle Visibility
      <ContextMenuShortcut>V</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onClick={handleDelete} className="text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
      <ContextMenuShortcut>X</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**Move Up/Down Handlers:**
```typescript
const handleMoveUp = () => {
  const currentIndex = getRowIndex(rowKey);
  if (currentIndex > 0) {
    reorderItems(currentIndex, currentIndex - 1);
  }
};

const handleMoveDown = () => {
  const currentIndex = getRowIndex(rowKey);
  if (currentIndex < totalRows - 1) {
    reorderItems(currentIndex, currentIndex + 1);
  }
};
```

### Scroll Safety

shadcn/Radix ContextMenu handles scroll-vs-long-press detection automatically. The menu only triggers after the long-press threshold if the touch hasn't moved. No custom implementation needed.

---

## Feature 3: Touch Target Compliance

### Current State
- Some targets may be < 44x44px
- Row height varies (h-10 on desktop)

### Requirements (WCAG 2.5.5)
- Minimum touch target: 44x44px (CSS pixels)
- Spacing between targets: 8px minimum

### Audit Needed

| Element | Current Size | Mobile Size | Status |
|---------|-------------|-------------|--------|
| Checkbox | 16x16 | 20x20 | ⚠️ Needs wrapper |
| Drag handle | 24x24 | 24x24 | ⚠️ Needs padding |
| Visibility toggle | 36x20 | 36x20 | ⚠️ Needs wrapper |
| Chevron toggle | 16x16 | 16x16 | ⚠️ Needs wrapper |
| Row height | 40px | 40px | ⚠️ Increase to 48px |

### Implementation

```typescript
// Wrapper for small interactive elements on mobile
const TouchTarget = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("min-h-[44px] min-w-[44px] flex items-center justify-center", className)}>
    {children}
  </div>
);

// Usage
<TouchTarget>
  <Checkbox className="h-4 w-4" />
</TouchTarget>
```

**CSS Changes:**

```css
/* Table row height on mobile */
@media (max-width: 768px) {
  .table-row {
    min-height: 48px;
  }

  .touch-target {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

---

## Implementation Order

### Phase 1: Range Selection (Both Platforms) ✅ COMPLETE

1. ✅ Add anchor tracking to `useContextSelectionModel`
2. ✅ Implement Shift+click in `useRowClickHandler` (desktop)
3. ✅ Create `useLongPress` hook for checkbox long-press detection
   - Added `visualDelay` option (150ms default) to distinguish click from hold
   - Movement threshold cancels on scroll (10px default)
4. ✅ Update `CheckboxCell` with long-press support + visual feedback
   - Pulsing ring animation during long-press
5. ✅ Add `getKeysBetween(anchorKey, targetKey)` helper in selection model
6. ⏭️ Visual feedback for anchor row - deferred (not critical)
7. ✅ Works in AllCategoriesTableView and AllLabelsTableView

**Key Implementation Detail:** `selectableKeys` must match visual row order (sorted/pinned) for range selection to work correctly. See `selectableKeysOrder.test.tsx` for pattern documentation.

### Phase 2: Context Menus (includes Mobile Reorder) 🚧 IN PROGRESS

1. ✅ Created `RowContextMenu` component with shadcn ContextMenu
2. ✅ Integrated with AllLabelsTableView
3. ✅ Move Up / Move Down menu items implemented
4. ✅ Add to Categories/Labels actions with checkbox lists
5. 🚧 Expand to other table views
6. ⏳ Add keyboard shortcut hints to menu items
7. ⏳ Implement undo/redo for Move Up/Down

### Phase 3: Touch Targets (If Needed) ⏳ PENDING

1. Audit interactive elements for 44x44px compliance
2. Add `TouchTarget` wrapper component if needed
3. Increase mobile row height to 48px if needed
4. Test on actual mobile devices

**Note:** Phase 3 may be skipped if existing touch targets are adequate.

---

## Files Summary

### New Files
- `hooks/useLongPress.ts` - Scroll-safe long-press detection (for checkbox range selection only)

### Modified Files
- `hooks/useContextSelectionModel.ts` - Anchor tracking, range selection
- `hooks/useRowClickHandler.ts` - Shift key handling
- `menu-builder/components/table-views/shared/cells/CheckboxCell.tsx` - Long-press range selection
- `menu-builder/components/table-views/shared/table/TableRow.tsx` - Wrap with shadcn ContextMenu
- Table view components - Pass context menu props (row index, handlers)

---

## Acceptance Criteria

### Range Selection
- [x] Shift+click selects range on desktop
- [x] Long-press checkbox selects range (both platforms)
- [ ] Anchor row visually indicated (subtle highlight) - deferred
- [x] Long-press shows progress feedback (pulse/ring animation)
- [x] Range selection works in AllCategoriesTableView and AllLabelsTableView
- [ ] Toast confirms range selection count - not implemented

### Context Menus (includes Mobile Reorder)
- [x] Right-click shows context menu on desktop (AllLabelsTableView)
- [x] Long-press shows context menu on mobile (shadcn handles this)
- [x] Menu items for Move Up/Down, Add to Labels/Categories
- [x] **Move Up / Move Down** actions work for reordering
- [ ] Reorder persists to database with undo/redo - undo not yet
- [x] Actions execute correctly

### Touch Targets (Nice to Have)
- [ ] Interactive elements have adequate touch area
- [ ] Row height comfortable for touch
- [ ] No overlapping touch targets

---

## Open Questions

1. **Range selection across hierarchy levels?**
   - Option A: Only select visible rows (ignore collapsed children)
   - Option B: Select all descendants of selected parents
   - Recommendation: Option A (simpler, predictable)

2. **Reorder mode scope?**
   - Option A: Reorder within current parent only
   - Option B: Allow cross-boundary moves via picker
   - Recommendation: Option A for MVP

3. **Context menu on multi-select?**
   - Option A: Show menu for all selected items
   - Option B: Show menu for clicked item only
   - Recommendation: Option A (batch actions)

---

## References

- [FEATURE-SPEC.md - Touch Gestures](./FEATURE-SPEC.md#touch-gestures-mobile)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [@dnd-kit documentation](https://docs.dndkit.com/)
- [shadcn/ui Context Menu](https://ui.shadcn.com/docs/components/context-menu)

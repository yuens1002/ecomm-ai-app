# Menu Builder: Mobile Interactions & Range Selection Plan

**Created:** 2026-01-24
**Status:** Planning
**Priority:** Medium (UX enhancement)

---

## Overview

This document outlines the implementation plan for:
1. **Range Selection** - Shift+click on desktop, long-press on mobile
2. **Touch DnD** - Mobile-friendly drag-and-drop alternative
3. **Context Menus** - Long-press support for mobile
4. **Touch Target Compliance** - 44x44px minimum targets

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

### Mobile: Long-Press Range Selection

**Behavior:**
1. User taps row A (selected, becomes anchor)
2. User long-presses row B (500ms)
3. Range selection modal/toast appears: "Select 5 items from A to B?"
4. User confirms → range selected

**Alternative UX (simpler):**
1. User taps row A (selected)
2. User taps "Select Range" button in action bar (appears when 1 item selected)
3. User taps row B
4. All rows A to B selected

**Implementation:**

```typescript
// Mobile range selection mode
const [rangeSelectMode, setRangeSelectMode] = useState(false);

const handleRowTap = (key: string) => {
  if (rangeSelectMode && anchorKey) {
    const range = getVisibleKeysBetween(anchorKey, key);
    setSelectedKeys(new Set([...selectedKeys, ...range]));
    setRangeSelectMode(false);
  } else {
    // Normal tap behavior
    toggleSelection(key);
    setAnchorKey(key);
  }
};
```

**New UI Elements:**
- "Select Range" action button (appears when 1+ items selected, mobile only)
- Visual indicator showing range selection mode is active
- Toast: "Tap another row to select range"

---

## Feature 2: Touch Drag-and-Drop

### Current State
- HTML5 native DnD works on desktop
- HTML5 DnD does NOT work on touch devices
- Drag handles always visible on mobile but non-functional

### Options

| Option | Pros | Cons |
|--------|------|------|
| **@dnd-kit library** | Full touch support, accessibility, animations | Bundle size (~15kb), migration effort |
| **Reorder Mode** | Simple, no library | Different UX from desktop, more taps |
| **Touch polyfill** | Minimal changes | Janky, poor UX, deprecated |

### Recommended: Reorder Mode (MVP)

**Behavior:**
1. User taps "Reorder" button in action bar
2. Table enters reorder mode:
   - Drag handles become up/down arrow buttons
   - Checkboxes hidden
   - Row tap moves item up/down (or shows position picker)
3. User taps "Done" to exit reorder mode

**Visual Changes in Reorder Mode:**
```
Normal Mode:              Reorder Mode:
[☐] Label Name [≡]       [↑] Label Name [↓]
[☐] Category A [≡]       [↑] Category A [↓]
```

**Implementation:**

```typescript
// New state in MenuBuilderProvider or table view
const [isReorderMode, setIsReorderMode] = useState(false);

// Action bar shows "Reorder" button on mobile
const reorderAction = {
  id: "reorder-mode",
  icon: isReorderMode ? Check : ArrowUpDown,
  label: isReorderMode ? "Done" : "Reorder",
  tooltip: isReorderMode ? "Exit reorder mode" : "Enter reorder mode",
  kbd: [],
  disabled: () => false,
  onClick: () => setIsReorderMode(!isReorderMode),
  showOnMobile: true,
  hideOnDesktop: true,
};
```

**Files to Create:**
- `menu-builder/components/table-views/shared/cells/ReorderArrowsCell.tsx`

**Files to Modify:**
- `constants/action-bar/actions.ts` - Add reorder-mode action
- `constants/action-bar/views.ts` - Add to mobile-only actions
- `hooks/useContextSelectionModel.ts` - Disable selection in reorder mode
- Table view components - Conditionally render arrows vs drag handle

### Future: @dnd-kit Migration

If touch DnD with drag handles is required:
1. Install `@dnd-kit/core`, `@dnd-kit/sortable`
2. Replace HTML5 DnD implementation
3. Benefits: Touch support, keyboard DnD, better animations, accessibility

---

## Feature 3: Context Menus (Long-Press)

### Current State
- No context menu implementation
- Right-click does nothing
- Long-press does nothing on mobile

### Implementation

**Desktop:** Right-click on row → shows context menu
**Mobile:** Long-press on row (500ms) → shows bottom sheet

**Menu Items (per view):**
- Same actions as action bar, filtered by selection state
- Example for all-labels: Clone, Remove, Toggle Visibility, Delete

**Using shadcn/ui:**

```typescript
// Desktop: ContextMenu
<ContextMenu>
  <ContextMenuTrigger asChild>
    <TableRow ... />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={handleClone}>
      <Copy className="mr-2 h-4 w-4" />
      Clone
      <ContextMenuShortcut>D</ContextMenuShortcut>
    </ContextMenuItem>
    ...
  </ContextMenuContent>
</ContextMenu>

// Mobile: Sheet (bottom sheet)
<Sheet open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>{selectedCount} items selected</SheetTitle>
    </SheetHeader>
    <div className="grid gap-2 py-4">
      <Button variant="ghost" onClick={handleClone}>
        <Copy className="mr-2 h-4 w-4" /> Clone
      </Button>
      ...
    </div>
  </SheetContent>
</Sheet>
```

**Long-Press Detection:**

```typescript
const useLongPress = (callback: () => void, ms = 500) => {
  const timerRef = useRef<NodeJS.Timeout>();

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, ms);
  }, [callback, ms]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  };
};
```

**Files to Create:**
- `hooks/useLongPress.ts`
- `menu-builder/components/table-views/shared/ContextMenuWrapper.tsx`
- `menu-builder/components/table-views/shared/MobileActionSheet.tsx`

**Files to Modify:**
- `menu-builder/components/table-views/shared/table/TableRow.tsx` - Wrap with context menu

---

## Feature 4: Touch Target Compliance

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

### Phase 1: Range Selection (Desktop First)
1. Add anchor tracking to `useContextSelectionModel`
2. Implement Shift+click in `useRowClickHandler`
3. Add visual feedback for anchor row
4. Test across all 5 views

### Phase 2: Touch Targets
1. Audit all interactive elements
2. Add `TouchTarget` wrapper component
3. Increase mobile row height
4. Test on actual mobile devices

### Phase 3: Context Menus
1. Create `useLongPress` hook
2. Implement desktop right-click context menu
3. Implement mobile bottom sheet
4. Wire up action handlers from action bar config

### Phase 4: Mobile Range Selection
1. Add "Select Range" action button (mobile only)
2. Implement range selection mode
3. Add visual indicators and toast feedback

### Phase 5: Reorder Mode (Mobile DnD Alternative)
1. Add reorder-mode action
2. Create `ReorderArrowsCell` component
3. Implement move up/down logic
4. Test on mobile devices

---

## Files Summary

### New Files
- `hooks/useLongPress.ts`
- `hooks/useRangeSelection.ts` (or integrate into useContextSelectionModel)
- `menu-builder/components/table-views/shared/ContextMenuWrapper.tsx`
- `menu-builder/components/table-views/shared/MobileActionSheet.tsx`
- `menu-builder/components/table-views/shared/cells/ReorderArrowsCell.tsx`
- `components/ui/touch-target.tsx`

### Modified Files
- `hooks/useContextSelectionModel.ts` - Anchor tracking, range selection
- `hooks/useRowClickHandler.ts` - Shift/meta key handling
- `constants/action-bar/actions.ts` - Reorder mode action
- `constants/action-bar/views.ts` - Mobile-specific actions
- `menu-builder/components/table-views/shared/table/TableRow.tsx` - Context menu, touch targets
- `app/globals.css` - Mobile-specific styles

---

## Acceptance Criteria

### Range Selection
- [ ] Shift+click selects range on desktop
- [ ] Anchor row visually indicated
- [ ] Range selection works across all 5 views
- [ ] Mobile "Select Range" button works

### Touch DnD (Reorder Mode)
- [ ] "Reorder" button appears on mobile action bar
- [ ] Up/down arrows replace drag handles in reorder mode
- [ ] Reorder persists to database
- [ ] "Done" exits reorder mode

### Context Menus
- [ ] Right-click shows context menu on desktop
- [ ] Long-press shows bottom sheet on mobile
- [ ] Menu items match action bar for current view
- [ ] Actions execute correctly

### Touch Targets
- [ ] All interactive elements ≥ 44x44px on mobile
- [ ] Row height ≥ 48px on mobile
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

# Menu Builder: Mobile Interactions & Range Selection Plan

**Created:** 2026-01-24
**Status:** Planning
**Priority:** Medium (UX enhancement)

---

## Overview

This document outlines the implementation plan for:
1. **Range Selection** - Shift+click on desktop, long-press checkbox on both platforms
2. **Touch DnD** - Mobile-friendly drag-and-drop alternative (Reorder Mode)
3. **Context Menus** - Right-click (desktop) + long-press row (mobile)
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

**Long-Press Detection (Scroll-Safe):**

The key challenge: users scrolling might accidentally trigger long-press. Solution: **cancel if touch moves beyond threshold**.

```typescript
const useLongPress = (callback: () => void, ms = 500, moveThreshold = 10) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((e: TouchEvent | PointerEvent) => {
    // Record starting position
    const touch = 'touches' in e ? e.touches[0] : e;
    startPos.current = { x: touch.clientX, y: touch.clientY };

    timerRef.current = setTimeout(callback, ms);
  }, [callback, ms]);

  const move = useCallback((e: TouchEvent | PointerEvent) => {
    if (!startPos.current || !timerRef.current) return;

    const touch = 'touches' in e ? e.touches[0] : e;
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);

    // Cancel if moved beyond threshold (user is scrolling)
    if (dx > moveThreshold || dy > moveThreshold) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      startPos.current = null;
    }
  }, [moveThreshold]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    startPos.current = null;
  }, []);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: clear,
    onTouchCancel: clear,
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: clear,
    onPointerLeave: clear,
  };
};
```

**Scroll-Safe Behavior:**
- Timer starts on touch/pointer down
- If touch moves > 10px in any direction → timer cancelled (user is scrolling)
- If touch stays stationary for 500ms → callback fires
- Touch end/cancel always clears timer

**Additional Safeguards:**
- Context menu only triggers on rows, not during active scroll momentum
- Consider adding `touch-action: pan-y` to allow vertical scroll while preventing horizontal gestures
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

### Phase 1: Range Selection (Both Platforms)
1. Add anchor tracking to `useContextSelectionModel`
2. Implement Shift+click in `useRowClickHandler` (desktop)
3. Create `useLongPress` hook for checkbox long-press detection
4. Update `CheckboxCell` with long-press support + visual feedback
5. Add `getVisibleKeysBetween(anchorKey, targetKey)` helper
6. Add visual feedback for anchor row (subtle highlight)
7. Test across all 5 views on desktop and mobile

### Phase 2: Touch Targets
1. Audit all interactive elements for 44x44px compliance
2. Add `TouchTarget` wrapper component
3. Increase mobile row height to 48px
4. Ensure checkbox touch area is adequate for long-press
5. Test on actual mobile devices

### Phase 3: Context Menus
1. Implement desktop right-click context menu (ContextMenuWrapper)
2. Implement mobile long-press on row → bottom sheet (MobileActionSheet)
3. Wire up action handlers from action bar config
4. Add keyboard shortcut hints to desktop menu items

### Phase 4: Reorder Mode (Mobile DnD Alternative)
1. Add reorder-mode action (mobile-only action bar button)
2. Create `ReorderArrowsCell` component (up/down arrows)
3. Implement move up/down logic with undo/redo
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
- [ ] Long-press checkbox selects range (both platforms)
- [ ] Anchor row visually indicated (subtle highlight)
- [ ] Long-press shows progress feedback (pulse/ring animation)
- [ ] Range selection works across all 5 views
- [ ] Toast confirms range selection count

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

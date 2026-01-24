# Context Menu Infrastructure - Implementation Plan

**Branch:** `feat/context-menu`
**Target Version:** v0.67.0
**Status:** Planning

---

## Overview

Add right-click and three-dot context menus to table views, reusing existing action bar configuration for consistent behavior across all UI surfaces.

---

## Phase 1: Core Infrastructure

**Goal:** Build the foundational `ContextMenuCell` component

### 1.1 Create ContextMenuCell Component

**File:** `app/admin/(product-menu)/menu-builder/components/table-views/shared/cells/ContextMenuCell.tsx`

**Features:**
- Three-dot button (visible on row hover)
- Radix `DropdownMenu` for menu rendering
- Accepts `actionIds: string[]` prop
- Fetches action definitions from `ACTION_BAR_CONFIG`
- Renders menu items with:
  - Icon (from action definition)
  - Label (from action definition)
  - Keyboard shortcut hint (from `kbd` array)
  - Disabled state (from action's `disabled` function)

**Props Interface:**
```typescript
interface ContextMenuCellProps {
  actionIds: string[];
  entityId: string;
  entityKind: "label" | "category" | "product";
  isRowHovered: boolean;
  onAction: (actionId: string) => void;
}
```

### 1.2 Create useContextMenuActions Hook

**File:** `app/admin/(product-menu)/hooks/useContextMenuActions.ts`

**Purpose:** Bridge between VIEW_CONFIGS action IDs and ACTION_BAR_CONFIG definitions

**Features:**
- Accepts `actionIds: string[]` from VIEW_CONFIGS
- Returns hydrated action definitions with current disabled state
- Handles single-row vs bulk selection context
- Exposes `executeAction(actionId)` function

### Validation (Phase 1)
- [ ] ContextMenuCell renders three-dot button on hover
- [ ] Clicking three-dot opens Radix dropdown
- [ ] Menu items show icon, label, and keyboard hint
- [ ] Disabled items are visually muted and non-interactive
- [ ] Menu closes on item click or outside click
- [ ] Menu closes on Escape key

### Acceptance Criteria (Phase 1)
- Component is reusable across all table views
- No duplication of action definitions (single source in actions.ts)
- Keyboard hints formatted correctly (e.g., "⌘D" on Mac, "Ctrl+D" on Windows)
- TypeScript strict mode passes
- No accessibility warnings (ARIA labels, focus management)

---

## Phase 2: Right-Click Integration

**Goal:** Add right-click trigger to table rows

### 2.1 Add onContextMenu Handler to TableRow

**File:** `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/TableRow.tsx`

**Changes:**
- Add `onContextMenu` prop
- Prevent default browser context menu
- Position menu at cursor coordinates

### 2.2 Create Floating Context Menu

**Approach Options:**

**Option A: Portal + Absolute Positioning**
- Render menu in portal at cursor position
- Requires tracking mouse coordinates
- More complex but pixel-perfect positioning

**Option B: Radix ContextMenu Primitive**
- Use `@radix-ui/react-context-menu`
- Built-in right-click handling
- Cleaner API but may need additional dependency

**Recommendation:** Option B (Radix ContextMenu) - cleaner, battle-tested

### 2.3 Wire Right-Click to ContextMenuCell

**Files to Modify:**
- `AllLabelsTableView.tsx`
- `AllCategoriesTableView.tsx`

**Changes:**
- Wrap row content with Radix `ContextMenu.Root`
- Share menu content between three-dot and right-click triggers
- Ensure consistent behavior for both triggers

### Validation (Phase 2)
- [ ] Right-click on row opens context menu at cursor
- [ ] Right-click on row prevents browser default menu
- [ ] Menu content matches three-dot menu
- [ ] Only one menu open at a time (right-click closes previous)
- [ ] Right-click outside row closes menu

### Acceptance Criteria (Phase 2)
- Right-click works on all supported table views
- Touch devices: long-press opens context menu (if Radix supports)
- Menu position adjusts to stay within viewport
- Consistent with three-dot menu behavior

---

## Phase 3: Action Execution

**Goal:** Wire menu items to execute actual actions

### 3.1 Create executeContextAction Helper

**Location:** Could be in `useContextMenuActions.ts` or `action-bar/index.ts`

**Features:**
- Accepts action ID and context (entityId, entityKind, selectedIds)
- Calls action's `execute[view]` function
- Triggers appropriate effects (refresh, toast)
- Integrates with undo/redo system

### 3.2 Handle Selection Context

**Scenarios:**

1. **Single row right-click (row not selected):**
   - Execute action on that single row
   - Don't affect current selection

2. **Single row right-click (row IS selected):**
   - Execute action on ALL selected rows (bulk action)

3. **Three-dot click:**
   - Always execute on that specific row
   - OR: Match right-click behavior for consistency?

**Decision needed:** Confirm desired behavior with product/design

### 3.3 Integrate with Undo/Redo

**Changes:**
- Context menu actions use same `captureUndo` logic as action bar
- Toast notifications show for success/failure
- History stack updated appropriately

### Validation (Phase 3)
- [ ] Clone action creates duplicate item(s)
- [ ] Visibility toggle updates item visibility
- [ ] Remove action detaches item(s) from parent
- [ ] Undo reverses the action
- [ ] Toast shows success message
- [ ] SWR cache revalidates after mutation

### Acceptance Criteria (Phase 3)
- All context menu actions work identically to action bar buttons
- Undo/redo works for all context menu actions
- Error states handled gracefully (toast + no crash)
- Actions respect same disabled conditions as action bar

---

## Phase 4: Table View Integration

**Goal:** Add context menus to all applicable table views

### 4.1 AllLabelsTableView Integration

**Actions from VIEW_CONFIGS:**
```typescript
bulkContextMenu: ["visibility", "remove"]
```

**Changes:**
- Add `ContextMenuCell` to row
- Wire right-click handler
- Test all actions

### 4.2 AllCategoriesTableView Integration

**Actions from VIEW_CONFIGS:**
```typescript
rowContextMenu: ["clone"]
bulkContextMenu: ["clone", "visibility"]
```

**Changes:**
- Add `ContextMenuCell` to row
- Wire right-click handler
- Handle row vs bulk menu differentiation
- Test all actions

### 4.3 Future Views (Optional Scope)

- LabelTableView
- CategoryTableView
- MenuTableView (hierarchical - may need special handling)

### Validation (Phase 4)
- [ ] AllLabelsTableView: visibility toggle works
- [ ] AllLabelsTableView: remove works (with undo)
- [ ] AllCategoriesTableView: clone works (single + bulk)
- [ ] AllCategoriesTableView: visibility toggle works
- [ ] No regressions in existing functionality

### Acceptance Criteria (Phase 4)
- Context menus appear on all target table views
- Actions execute correctly for each view
- VIEW_CONFIGS is single source of truth for which actions appear
- No code duplication between table views

---

## Phase 5: Polish & Testing

**Goal:** Edge cases, accessibility, tests

### 5.1 Accessibility

- [ ] Menu is keyboard navigable (Arrow keys, Enter, Escape)
- [ ] Focus returns to trigger after menu closes
- [ ] Screen reader announces menu items
- [ ] ARIA attributes correct (role="menu", role="menuitem")

### 5.2 Edge Cases

- [ ] Long action labels truncate gracefully
- [ ] Menu repositions if near viewport edge
- [ ] Multiple rapid clicks don't cause issues
- [ ] Menu works during drag-and-drop (should be disabled?)
- [ ] Menu works with pinned rows

### 5.3 Unit Tests

**File:** `app/admin/(product-menu)/menu-builder/components/table-views/shared/cells/__tests__/ContextMenuCell.test.tsx`

**Tests:**
- Renders three-dot button
- Opens menu on click
- Renders correct actions for given actionIds
- Shows keyboard shortcuts
- Disables items when disabled function returns true
- Calls onAction with correct ID

### 5.4 Integration Tests

- Context menu + action execution
- Context menu + undo/redo
- Context menu + selection model

### Validation (Phase 5)
- [ ] All accessibility requirements met
- [ ] All edge cases handled
- [ ] Unit tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Acceptance Criteria (Phase 5)
- Lighthouse accessibility score maintained
- Test coverage for ContextMenuCell component
- Documentation updated (ARCHITECTURE.md, ROADMAP.md)
- Ready for code review

---

## Files Summary

### New Files
- `shared/cells/ContextMenuCell.tsx`
- `hooks/useContextMenuActions.ts`
- `shared/cells/__tests__/ContextMenuCell.test.tsx`

### Modified Files
- `shared/table/TableRow.tsx` (add onContextMenu)
- `AllLabelsTableView.tsx`
- `AllCategoriesTableView.tsx`
- `constants/view-configs.ts` (potentially add more action IDs)
- `docs/menu-builder/ROADMAP.md`
- `docs/menu-builder/ARCHITECTURE.md`

### Dependencies
- May need `@radix-ui/react-context-menu` (check if already installed)

---

## Open Questions

1. **Three-dot vs right-click behavior:** Should three-dot always act on single row, or match right-click (bulk when selected)?

2. **MenuTableView support:** Should hierarchical menu view get context menus? If so, different actions for labels vs categories?

3. **Touch support:** Long-press for context menu on mobile? Or three-dot only?

4. **During drag:** Should context menu be disabled while dragging?

---

## Timeline Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| Phase 1 | Core Infrastructure | 1 day |
| Phase 2 | Right-Click Integration | 0.5 day |
| Phase 3 | Action Execution | 1 day |
| Phase 4 | Table View Integration | 0.5 day |
| Phase 5 | Polish & Testing | 1 day |
| **Total** | | **4 days** |

---

## Success Metrics

- [ ] Context menus available on AllLabelsTableView and AllCategoriesTableView
- [ ] All actions work identically to action bar
- [ ] Undo/redo integration complete
- [ ] Keyboard shortcuts displayed in menu
- [ ] Accessibility requirements met
- [ ] Tests passing
- [ ] Documentation updated

---

**Created:** 2026-01-24
**Author:** Claude Code

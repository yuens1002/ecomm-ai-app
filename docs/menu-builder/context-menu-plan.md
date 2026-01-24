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

**Created:** 2026-01-24
**Updated:** 2026-01-24

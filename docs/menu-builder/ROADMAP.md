# Menu Builder - Development Roadmap

**Last Updated:** 2026-01-24
**Current Branch:** `unify-menu-builder`
**Current Version:** v0.67.0
**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅ (5/5 views) | Phase 3 In Progress 🚧

---

## Project Vision

Build a sophisticated admin interface for managing a 2-level menu hierarchy (Labels → Categories) with a config-driven, zero-conditional architecture. Products are managed at the Category level.

---

## Overall Progress

```(text)
Foundation  ████████████████████████ 100% ✅
Table Views ████████████████████████ 100% ✅
Advanced    ██████████████░░░░░░░░░  60% 🚧
─────────────────────────────────────────
Total       ████████████████████░░░  85%
```

### Recent Completions (v0.66.x - v0.67.x)
- ✅ IdentityRegistry architecture (unified row identity management)
- ✅ 2-level Menu View (Labels → Categories, products as count only)
- ✅ Same-level DnD with auto-collapse/expand behaviors
- ✅ Unified selection model with tri-state checkboxes
- ✅ Single-click expand+select behavior
- ✅ Duplicate label name validation with toast
- ✅ Updated naming convention ("New Label2", "Name copy2")
- ✅ Multi-select DnD with grouped entities ghost (v0.66.11-0.66.15)
- ✅ Cross-boundary DnD with motion animations (v0.66.11)
- ✅ Explicit selection model refactor (v0.66.16-0.66.19)
- ✅ Consolidated DnD hooks architecture (v0.66.20)
- ✅ Keyboard shortcuts with single-key Gmail/Slack style (v0.67.0)
- ✅ Help button (ConciergeBell) on all views (v0.67.0)
- ✅ Delete button with full undo/redo support (v0.67.0)

---

## Completed Work

### Phase 1: Foundation ✅ (Jan 3-13, 2026)

#### 1.1 Architecture (Jan 3-8)

- [x] Provider composition pattern (MenuBuilderProvider)
- [x] URL-backed navigation (useMenuBuilderState)
- [x] Config-driven action bar
- [x] Table view routing system (VIEW_CONFIGS + TableViewRenderer)
- [x] 67% reduction in action handler complexity

**Key Commits:**

- `0b2cc70` - Unified product-menu data access
- `83e3ef6` - Shipped All Categories table view (v0.59.0)

#### 1.2 Data Layer (Jan 8)

- [x] Centralized Prisma repositories (`data/categories.ts`, `data/labels.ts`)
- [x] DTO mapping with tests (ordering invariants guaranteed)
- [x] Shared helpers for admin API routes
- [x] 100% type safety (zero `any` types)

#### 1.3 First Table View (Jan 7-10)

- [x] AllCategoriesTableView (fully functional)
- [x] Shared table primitives (CheckboxCell, InlineNameEditor, VisibilityCell)
- [x] Inline editing with validation
- [x] Bulk selection and actions

#### 1.4 Action Bar Refactor (Jan 13)

- [x] Colocated action definitions (10 files → 5 files)
- [x] Explicit left/right layout in views.ts
- [x] Structural snapshot tests for regression detection
- [x] Inline overrides visible where used

**Key Commit:**

- `2a4745c` - Colocate action-bar config with explicit view layout (v0.61.0)

#### 1.5 Testing & Documentation

- [x] Jest tests (29 passing) for hooks, config, DTOs
- [x] Structural snapshot for action bar layout
- [x] Architecture documentation consolidated
- [x] Implementation guides

---

## Phase 2: Table Views ✅ COMPLETE

**Target:** Complete all 5 table views
**Timeline:** 4-6 weeks
**Current:** 5/5 views shipped (100%)

### 2.1 All Labels Table View ✅ COMPLETE (Jan 14, 2026)

**Complexity:** Low (reused AllCategories pattern)
**Effort:** 1-2 days
**Dependencies:** None

**Implemented Features:**

- [x] Created `AllLabelsTableView.tsx` component
- [x] Columns: Checkbox, Icon (center 48px), Label Name, Categories, Visibility, Drag Handle
- [x] Inline icon editing via `InlineIconCell` (IconPicker dialog)
- [x] Inline name editing via `InlineNameEditor`
- [x] Visibility toggle via `VisibilityCell` (switch variant)
- [x] Drag-and-drop row reordering (persists to DB)
- [x] Selection state management
- [x] Registered in TableViewRenderer

**Table Behavior:**

- **No column sorting** - Row order dictates DB label order via drag-drop
- **Single-click** - Toggles row selection (200ms delay to distinguish from double-click)
- **Double-click** - Navigates to label detail view
- **Drag handle** - Always visible on mobile, hover-only on desktop

**New Reusable Hooks Created:**

| Hook                    | Purpose                                                                      |
|-------------------------|------------------------------------------------------------------------------|
| `useDragReorder`        | Drag-and-drop row reordering with `getDragHandlers()` and `getDragClasses()` |
| `useInlineEditHandlers` | Name/icon/visibility save handlers with undo/redo                            |

**Enhanced Existing Hooks:**

| Hook                   | Enhancement                                                    |
|------------------------|----------------------------------------------------------------|
| `usePinnedRow`         | Built-in default sort by `order` field (descending)            |
| `useContextRowUiState` | `autoClearPinned` option for automatic cleanup                 |

**Enhanced Components:**

| Component          | Enhancement                                                                    |
|--------------------|--------------------------------------------------------------------------------|
| `TableRow`         | Built-in click/double-click handling via `onRowClick`/`onRowDoubleClick` props |
| `TableRow`         | `isHidden` prop for muted text styling on hidden/not visible rows              |
| `InlineNameEditor` | `isHidden` prop for muted text styling inheritance                             |

**Files Created:**

- `app/admin/(product-menu)/menu-builder/components/table-views/AllLabelsTableView.tsx`
- `app/admin/(product-menu)/hooks/useDragReorder.ts`
- `app/admin/(product-menu)/hooks/useInlineEditHandlers.ts`

**Files Modified:**

- `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/AllCategoriesTableView.tsx` (refactored to use new hooks)
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/TableRow.tsx`
- `app/admin/(product-menu)/hooks/usePinnedRow.ts`
- `app/admin/(product-menu)/hooks/useContextRowUiState.ts`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/columnWidthPresets.ts`

---

### 2.2 Context Menu Infrastructure ⏸️ NOT STARTED

**Complexity:** Medium (new pattern)
**Effort:** 1-2 days
**Dependencies:** None (can be done in parallel with 2.1)

**Tasks:**

- [ ] Create `ContextMenuCell.tsx` component
- [ ] Wire VIEW_CONFIGS action IDs to ACTION_BAR_CONFIG
- [ ] Add to AllCategoriesTableView
- [ ] Add to AllLabelsTableView
- [ ] Right-click and three-dot menu triggers
- [ ] Keyboard shortcut hints in menu items

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/components/table-views/shared/ContextMenuCell.tsx`

**Files to Modify:**

- `app/admin/(product-menu)/menu-builder/components/table-views/AllCategoriesTableView.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/AllLabelsTableView.tsx`

**Acceptance Criteria:**

- Context menus show correct actions per view
- Actions execute using existing ACTION_BAR_CONFIG logic
- Keyboard shortcuts shown in menu
- Works on both touch and mouse

---

### 2.3 Label View ✅ COMPLETE (Jan 17, 2026)

**Complexity:** Medium
**Effort:** 2-3 days
**Dependencies:** 2.1 (All Labels view should exist first)

**Implemented Features:**

- [x] Created `LabelTableView.tsx` component
- [x] Single-level table showing categories within selected label
- [x] Columns: Checkbox, Name, Added Order, Products, Visibility, Drag Handle
- [x] TanStack sortable columns (Name, Added Order)
- [x] Drag-and-drop category reordering (reuses `useDragReorder`)
- [x] Products column: comma-separated product names (read-only)
- [x] Single-click selects, double-click navigates to category view
- [x] Selection model for bulk remove with undo/redo
- [x] Column sort persists to database via `usePersistColumnSort` hook
- [x] Added `attachedAt` field to junction table for chronological tracking
- [x] Removed `sort-mode` action from action bar (replaced by column sorting)

**Table Behavior:**

- **Column sorting** - Name and Added Order are sortable (TanStack Table)
- **Sort indicators** - ↑/↓ prepended to label when sorted
- **DnD + Sort interaction** - Manual reorder clears column sort state
- **Single-click** - Toggles row selection (200ms delay)
- **Double-click** - Navigates to category view (for product management)
- **Drag handle** - Always visible on mobile, hover-only on desktop

**Schema Changes:**

- Added `createdAt` column to `CategoryLabelCategory` junction table
- Used as `attachedAt` for chronological Added Order ranking

**New Reusable Hooks Created:**

| Hook | Purpose |
|------|---------|
| `usePersistColumnSort` | Persist TanStack column sort order to database |

**Files Created:**

- `app/admin/(product-menu)/menu-builder/components/table-views/LabelTableView.tsx`
- `app/admin/(product-menu)/hooks/usePersistColumnSort.ts`
- `prisma/migrations/20260117114116_add_createdat_to_category_label_category/migration.sql`

**Files Modified:**

- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/columnWidthPresets.ts`
- `app/admin/(product-menu)/constants/action-bar/actions.ts` (added `captureUndo.label`)
- `app/admin/(product-menu)/constants/action-bar/views.ts` (removed `sort-mode`)
- `app/admin/(product-menu)/constants/action-bar/model.ts` (removed `sort-mode` ActionId)
- `app/admin/(product-menu)/constants/__tests__/action-bar-config.test.ts` (updated snapshot)
- `app/admin/(product-menu)/data/labels.ts` (include `attachedAt` in DTO)
- `app/admin/(product-menu)/types/menu.ts` (added `attachedAt` to schema)
- `app/admin/(product-menu)/menu-builder/components/table-views/CategoryTableView.tsx` (uses `usePersistColumnSort`)

---

### 2.4 Category View (Product Assignment) ✅ COMPLETE (Jan 15-16, 2026)

**Complexity:** Medium (simplified from original spec)
**Effort:** 2 days
**Dependencies:** 2.1 (reused AllLabels patterns)

**Implemented Features:**

- [x] Created `CategoryTableView.tsx` component
- [x] Shows products assigned to selected category
- [x] Columns: Checkbox, Product Name, Added Order, Visibility, Categories, Drag Handle
- [x] Sortable columns: Name (alphabetical), Added Order (chronological rank)
- [x] Single-click selects (200ms delay), double-click navigates to product detail
- [x] Drag-and-drop row reordering (resets column sort on manual reorder)
- [x] "Added to Categories" column showing cross-references (excludes current category)
- [x] Selection state management for bulk remove action

**Table Behavior:**

- **Column sorting** - Name and Added Order are sortable (TanStack Table)
- **Sort indicators** - ↑/↓ prepended to label, ↕ toggle icon on hover
- **DnD + Sort interaction** - Manual reorder clears column sort state
- **Single-click** - Toggles row selection (200ms delay)
- **Double-click** - Navigates to product detail view
- **Drag handle** - Always visible on mobile, hover-only on desktop

**Shared Infrastructure Created (v0.64.0-0.64.3):**

| Feature                   | Description                                                         |
|---------------------------|---------------------------------------------------------------------|
| `SortableHeaderCell`      | Reusable sortable column header with TanStack Table integration     |
| `columnWidthPresets`      | Single source of truth for column width, cell, and alignment config |
| `TableHeader` preset prop | Reads width/align from preset by column id                          |
| `TableCell` config prop   | Accepts preset entry for cell styling                               |

**Files Created:**

- `app/admin/(product-menu)/menu-builder/components/table-views/CategoryTableView.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/SortableHeaderCell.tsx`

**Files Modified:**

- `app/admin/(product-menu)/menu-builder/components/table-views/MenuTableRenderer.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/columnWidthPresets.ts`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/TableHeader.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/table/TableCell.tsx`
- `app/admin/(product-menu)/hooks/useDragReorder.ts` (added `onReorderComplete` callback)

**Key Commits:**

- `6ab7444` - feat: add Category Table View with sortable columns (v0.64.0)
- `96cab74` - refactor: consolidate column alignment into presets (v0.64.1)
- `a2743ff` - fix: icon vertical alignment and table view tweaks (v0.64.2)
- `94de810` - fix: standardize disabled button styling (v0.64.3)

**Deferred to Future:**

- [ ] Search/filter products (Phase 3.5)
- [ ] "Set as Primary" action (future enhancement)

---

### 2.5 Menu View (2-Level Hierarchy) ✅ COMPLETE (Jan 17-21, 2026)

**Complexity:** High
**Effort:** 5-7 days
**Dependencies:** 2.3, 2.4 (all patterns established)

**Implemented Features:**

- [x] Created `MenuTableView.tsx` component (simplified from folder structure)
- [x] 2-level expand/collapse (Labels → Categories only)
- [x] Products shown as count only (managed in Category Detail view)
- [x] Columns: Checkbox, Name (with chevron + indent), Categories count, Visibility, Products count, Drag Handle
- [x] Hierarchical indentation via `HierarchyNameCell` component (depth 0 = 0px, depth 1 = 24px)
- [x] ChevronToggleCell for expand/collapse interaction
- [x] Inline icon editing for labels via InlineIconCell
- [x] Inline name editing for labels via InlineNameEditor
- [x] Same-level drag-and-drop reordering with undo/redo
- [x] Expand All / Collapse All action bar buttons
- [x] Action bar state-aware disabling (expand-all disabled when all expanded, etc.)
- [x] Drag-hover auto-expand for category drag (500ms delay, flash animation)
- [x] Auto-collapse all labels when starting label drag
- [x] Chevron disabled during label drag
- [x] Single-click toggles both expand/collapse AND selection (with hierarchy cascade)
- [x] Indeterminate state doesn't collapse on click (keeps parent expanded to show selected children)

**Table Behavior:**

- **No column sorting** - Row order dictates hierarchy, controlled via DnD
- **Single-click on label** - Toggles expand/collapse AND selection (with hierarchy cascade)
- **Single-click on category** - Toggles selection
- **Double-click** - Navigates into label or category view
- **Expand/collapse** - Chevron click, row click, or action bar buttons
- **Drag handle** - Always visible on mobile, hover-only on desktop
- **Same-level DnD only** - Labels reorder among labels, categories within same label

**Architecture Decisions:**

1. **Manual rendering instead of TanStack Table** - Variable row types with different columns
2. **2-level hierarchy** - Products excluded from menu view (managed in Category Detail)
3. **IdentityRegistry pattern** - Unified row identity for selection, actions, and navigation
4. **Kind-prefixed keys** - `"label:id"`, `"category:labelId-catId"` for unique selection

**Key Hooks:**

| Hook | Purpose |
|------|---------|
| `useIdentityRegistry` / `buildMenuRegistry` | Build registry mapping keys to row identities |
| `useRowClickHandler` | Unified click handling (expand + selection) |
| `useContextSelectionModel` | Hierarchical selection with tri-state checkboxes |
| `useFlattenedMenuRows` | Transform hierarchy to flat row list |
| `useMenuTableDragReorder` | Hierarchical DnD with auto-expand |

**Files Created/Modified:**

- `app/admin/(product-menu)/menu-builder/components/table-views/MenuTableView.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/MenuTableView.types.ts`
- `app/admin/(product-menu)/hooks/useFlattenedMenuRows.ts`
- `app/admin/(product-menu)/hooks/useMenuTableDragReorder.ts`
- `app/admin/(product-menu)/hooks/useIdentityRegistry.ts`
- `app/admin/(product-menu)/hooks/useRowClickHandler.ts`
- `app/admin/(product-menu)/hooks/useContextSelectionModel.ts` (enhanced)
- `app/admin/(product-menu)/types/identity-registry.ts`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/cells/ChevronToggleCell.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/cells/HierarchyNameCell.tsx`

**Deferred to Phase 3:**

- [ ] Cross-boundary drag-and-drop (move categories between labels) - See section 3.6

---

## Phase 3: Advanced Features 🚧 IN PROGRESS

**Target:** Polish and power-user features
**Timeline:** 2-4 weeks
**Status:** 60% (undo/redo ✅, same-level DnD ✅, keyboard shortcuts ✅, help/delete buttons ✅)

### 3.1 Same-Level Drag-and-Drop ✅ COMPLETE

**Implemented Features:**

- [x] Native HTML5 DnD implementation (`useDragReorder`, `useMenuTableDragReorder`)
- [x] Visual feedback (drag state classes, drop position indicators)
- [x] Same-level constraint validation (prevent cross-level drops)
- [x] Optimistic updates with undo/redo support
- [x] Auto-collapse all labels when starting label drag
- [x] Chevron disabled during label drag
- [x] Hover-to-expand for category drag (500ms delay)
- [x] Flash animation on auto-expanded rows

**Files:**

- `app/admin/(product-menu)/hooks/useDragReorder.ts` (flat tables)
- `app/admin/(product-menu)/hooks/useMenuTableDragReorder.ts` (hierarchical menu table)

---

### 3.2 Keyboard Shortcuts ✅ COMPLETE (Jan 24, 2026)

**Implemented Features:**

- [x] `useKeyboardShortcuts` hook with global keydown listener
- [x] Single-key shortcuts (Gmail/Slack style) to avoid browser conflicts
- [x] Platform detection (Mac Cmd vs Win Ctrl) for future use
- [x] Shortcut map:
  - `N` - New item (label or category)
  - `D` - Duplicate selected
  - `R` - Remove selected
  - `X` - Delete permanently (all-labels, all-categories)
  - `V` - Toggle visibility
  - `E` - Expand all (menu view)
  - `C` - Collapse all (menu view)
  - `U` - Undo
  - `Shift+U` - Redo
  - `?` - Toggle help popover
- [x] Tooltips showing shortcuts (shadcn Kbd component)
- [x] Disabled when input/textarea/contenteditable focused
- [x] Disabled when modal/dialog is open
- [x] Respects action disabled state
- [x] Shifted character handling (? requires Shift but shortcut doesn't specify it)

**Help Button:**

- [x] ConciergeBell icon on all 5 views (always last on right)
- [x] View-specific help content via `help-content.ts`
- [x] Popover with bulleted tips
- [x] Keyboard shortcut (`?`) toggles popover via custom event

**Delete Button:**

- [x] Trash2 icon on all-labels and all-categories (2nd to last)
- [x] AlertDialog confirmation before permanent delete
- [x] Full undo/redo with `restoreLabel` and `restoreCategory` server actions
- [x] Recreates entities with all relationships on undo

**Accessibility:**

- [x] Disabled buttons use `aria-disabled` to remain tabbable

**Files Created:**

- `app/admin/(product-menu)/hooks/useKeyboardShortcuts.ts`
- `app/admin/(product-menu)/constants/help-content.ts`
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/HelpPopoverButton.tsx`
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/DeleteAlertButton.tsx`

**Files Modified:**

- `app/admin/(product-menu)/constants/action-bar/model.ts` (added help, delete IDs)
- `app/admin/(product-menu)/constants/action-bar/actions.ts` (single-key shortcuts, help/delete actions)
- `app/admin/(product-menu)/constants/action-bar/views.ts` (added help to all views, delete to all-labels/all-categories)
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/index.tsx` (render help/delete buttons)
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/ActionButton.tsx` (aria-disabled)
- `app/admin/(product-menu)/actions/labels.ts` (restoreLabel server action)
- `app/admin/(product-menu)/actions/categories.ts` (restoreCategory server action)
- `app/admin/(product-menu)/types/builder-state.ts` (deleteSelected action)

---

### 3.3 Undo/Redo System ✅ COMPLETE (Jan 15, 2026)

**Implemented Features:**

- [x] 10-operation stack per view (in-memory)
- [x] Declarative `captureUndo` field in action config
- [x] Toast notifications on undo/redo
- [x] Action types: create, update, delete, reorder, clone
- [x] View-scoped history (cleared on navigation)
- [x] Colocated undo logic with action definitions

**Key Commit:**

- `26546fb` - feat: declarative undo/redo system and menu builder fixes (v0.63.0)

**Architecture:**

- Undo capture logic defined in `ACTION_BAR_CONFIG` via `captureUndo` field
- Eliminated 100+ lines of conditional undo/redo logic
- History stack managed by `useUndoRedoStack` hook
- Actions automatically capture undo state based on config

**Files Created:**

- `app/admin/(product-menu)/hooks/useUndoRedoStack.ts`

**Files Modified:**

- `app/admin/(product-menu)/constants/action-bar/actions.ts` (added `captureUndo` to actions)

---

### 3.4 Clone Operations ⏸️

**Tasks:**

- [ ] Clone label with categories (deep clone)
- [ ] Clone category with products (references only)
- [ ] Name collision detection (auto-suffix with " (copy)")
- [ ] Preserve order and visibility settings
- [ ] Toast notifications on success

**Files to Modify:**

- `app/admin/(product-menu)/constants/action-bar-config.ts` (complete TODOs)
- `app/admin/(product-menu)/actions/product-menu-actions.ts` (add clone logic)

---

### 3.5 Search & Filter ⏸️

**Tasks:**

- [ ] Global search input in MenuActionBar
- [ ] Filter by name, slug, visibility
- [ ] Highlight matching text
- [ ] "Clear filters" button
- [ ] Filter state in URL params

---

### 3.6 Cross-Boundary Drag-and-Drop ✅ COMPLETE

**Complexity:** Medium (simplified from 3-level to 2-level)
**Effort:** 2-3 days
**Dependencies:** Menu View (2.5) complete ✅
**Completed:** Jan 21, 2026

**Overview:**
Dragging categories across label boundaries in Menu Table View:
- Move a **category** from one label to another

Note: Products are not shown in menu view (2-level hierarchy), so cross-boundary product moves are not applicable here.

**Implemented Features:**

1. **Drop validation (`getDropInfo` in useMenuTableDragReorder.ts):**
   - [x] Allow category drops on different labels (returns `dropType: 'move-to-label'`)
   - [x] Allow category drops ON label rows (move into that label)
   - [x] Label-to-label reordering unchanged (`dropType: 'reorder'`)

2. **Drop handling:**
   - [x] Detect cross-boundary vs same-parent drop via `dropType`
   - [x] Cross-boundary move: `detachCategory` + `attachCategory`
   - [x] Toast notification: "Moved [Category] to [Label]"

3. **Visual feedback:**
   - [x] White flash (2x blink) on valid cross-boundary drop targets
   - [x] Drop position indicator (border top/bottom) for all valid drops
   - [x] `dropType` exposed via `getDragClasses()` for styling differentiation

4. **Undo/redo support:**
   - [x] Cross-boundary moves are undoable (reverse detach/attach)
   - [x] Pushed to undo stack with `action: 'move:category-to-label'`

5. **Auto-expand on drag:**
   - [x] Collapsed labels expand immediately when dragging category over them
   - [x] Labels collapse when drag leaves their territory (label + descendants)
   - [x] Tracks `autoExpandedLabelRef` to know which label to collapse

**Files Modified:**

- `app/admin/(product-menu)/hooks/useMenuTableDragReorder.ts`
  - Added `getDropInfo()` returning `{ valid, dropType }`
  - Added `dropType: 'reorder' | 'move-to-label'` to DragState
  - Added `getLabelOwner()` for territory-based collapse logic
  - Added `onCollapseItem` callback option
- `app/admin/(product-menu)/menu-builder/components/table-views/MenuTableView.tsx`
  - Added `moveCategoryToLabel` function using detach/attach mutations
  - Added `animate-drop-target-flash` class for cross-boundary visual feedback
- `app/globals.css`
  - Added `animate-drop-target-flash` keyframes (white 2x blink)
  - Updated `animate-auto-expand-flash` to match (white 2x blink)

**Limitations (single-item only):**

- Only supports dragging ONE category at a time
- Multi-select drag is NOT supported (see section 3.7)

---

### 3.7 Multi-Select Drag-and-Drop ✅ COMPLETE

**Complexity:** High
**Effort:** 3-5 days
**Dependencies:** Cross-boundary DnD (3.6) complete ✅
**Completed:** Jan 21-24, 2026

**Overview:**
Dragging multiple selected items at once, moving them together to a new location or label.

**Implemented Features:**

1. **Drag initiation:**
   - [x] If dragged item is part of selection → drag ALL selected items
   - [x] If dragged item is NOT selected → drag only that item
   - [x] Visual: `GroupedEntitiesGhost` showing count badge

2. **Drop handling:**
   - [x] Same-parent reorder: Move all selected items to drop position (maintain relative order)
   - [x] Cross-boundary move: Move all selected categories to target label
   - [x] Batch moves via `batchMoveCategoriesToLabel` server action

3. **Constraints:**
   - [x] All selected items must be same kind (can't mix labels and categories)
   - [x] For categories: can be from different parent labels
   - [x] Labels: multi-select reorder only (no cross-boundary concept)
   - [x] DnD eligibility derived from selection model (`useDnDEligibility`)

4. **Visual feedback:**
   - [x] `GroupedEntitiesGhost` with count badge
   - [x] All selected rows get `isInDragSet` styling (opacity)
   - [x] Drop indicator on valid targets
   - [x] Intent-based cursor feedback (grab/not-allowed on mousedown only)

5. **Architecture (v0.66.20):**
   - [x] Consolidated DnD hooks: `useGroupedReorder` → `useSingleEntityDnd` / `useMultiEntityDnd`
   - [x] `useDnDEligibility` derives drag eligibility from selection state
   - [x] `useGroupedEntitiesGhost` for multi-drag ghost rendering

**Files Created/Modified:**

- `hooks/dnd/useGroupedReorder.ts` - Core shared DnD state management
- `hooks/dnd/useSingleEntityDnd.ts` - Flat table DnD (AllLabels, Category, Label views)
- `hooks/dnd/useMultiEntityDnd.ts` - Hierarchical DnD with cross-boundary moves
- `hooks/dnd/useDnDEligibility.ts` - Derives drag eligibility from selection
- `hooks/dnd/useGroupedEntitiesGhost.ts` - Multi-drag ghost rendering
- `hooks/dnd/multiSelectValidation.ts` - Validation utilities
- `table-views/shared/table/GroupedEntitiesGhost.tsx` - Ghost component

---

### 3.8 Refactor: Separate Level from Kind 📋 FUTURE

**Complexity:** Medium
**Effort:** 2-3 days
**Priority:** Technical debt (required before adding new hierarchy levels)

**Problem:**
Current code conflates hierarchy depth with entity type:
- `FlatMenuRow` uses `level: "label" | "category"` where `level` means entity type
- `useMultiEntityDnd` has `EntityLevel = "label" | "category"` hardcoded
- This breaks if we need to add levels above labels or between existing levels

**Already Have (identity-registry.ts):**
- `kind: string` - Entity type ("label", "category", "product")
- `depth: number` - Hierarchy position (0, 1, 2, ...)

**What Needs to Change:**
1. Rename `level` → `kind` in `FlatMenuRow` types
2. Add numeric `depth` field for hierarchy position
3. Update DnD hooks to use `kind` for entity type, `depth` for level logic
4. Make parent-child rules configurable

**See:** [refactor-level-vs-kind.md](./refactor-level-vs-kind.md) for detailed plan

---

### 3.9 Range Selection ⏸️ NOT STARTED

**Complexity:** Medium
**Effort:** 2-3 days
**Priority:** High (core UX feature)

**Problem:**
Currently no way to select a contiguous range of items. Users must click each item individually.

**Desktop: Shift+Click**
- Click row A (becomes "anchor")
- Shift+click row B
- All visible rows from A to B selected

**Both Platforms: Long-Press Checkbox**
- Tap/click checkbox A (selected, becomes anchor)
- Long-press checkbox B (500ms)
- All visible rows from A to B immediately selected
- Visual feedback: pulse animation during long-press, toast on completion

**Why Long-Press on Checkbox?**
- Inline gesture - no extra buttons needed
- Clear intent - long-press signals "special selection behavior"
- Works on both desktop and mobile
- Discoverable via tooltip

**Implementation:**
- Add `anchorKey` to selection state
- Create `useLongPress` hook for long-press detection
- Modify `CheckboxCell` with long-press support + visual feedback
- Modify `useRowClickHandler` to handle Shift+click (desktop)
- Add `getVisibleKeysBetween(anchorKey, targetKey)` helper

**Files to Modify:**
- `hooks/useContextSelectionModel.ts` - Anchor tracking, range logic
- `hooks/useRowClickHandler.ts` - Shift key handling
- `hooks/useLongPress.ts` - New hook for long-press detection
- `table-views/shared/cells/CheckboxCell.tsx` - Long-press support

**See:** [mobile-interactions-plan.md](./mobile-interactions-plan.md) for detailed plan

---

### 3.10 Mobile Interactions ⏸️ NOT STARTED

**Complexity:** Low-Medium
**Effort:** 2-3 days
**Priority:** Low (mobile admin is edge case, AI features are priority)

**Strategy:** Minimal viable mobile support via context menu. No dedicated mobile UI.

**Problem:**
- HTML5 DnD doesn't work on touch devices
- No context menu (right-click/long-press)

**Solution: Context Menu with Move Up/Down**
- **Desktop:** Right-click shows context menu
- **Mobile:** Long-press (500ms) shows bottom sheet
- Menu includes **Move Up / Move Down** for reordering (mobile DnD alternative)
- Same actions as action bar, no separate UI needed

**Explicitly Deferred:**
- ~~Touch DnD with drag gesture~~
- ~~Dedicated Reorder Mode with arrow buttons~~
- ~~@dnd-kit migration~~

**Files to Create:**
- `hooks/useLongPress.ts` - Scroll-safe long-press detection
- `components/table-views/shared/ContextMenuWrapper.tsx` - Desktop right-click
- `components/table-views/shared/MobileActionSheet.tsx` - Mobile bottom sheet

**Files to Modify:**
- `components/table-views/shared/table/TableRow.tsx` - Context menu wrapper

**See:** [mobile-interactions-plan.md](./mobile-interactions-plan.md) for detailed plan

---

## File Structure

```text
app/admin/(product-menu)/
├─ menu-builder/
│  ├─ MenuBuilderProvider.tsx       ✅
│  ├─ MenuBuilder.tsx               ✅
│  └─ components/
│     ├─ menu-action-bar/           ✅ (ActionButton, HelpPopoverButton, DeleteAlertButton)
│     └─ table-views/
│        ├─ TableViewRenderer.tsx   ✅
│        ├─ PlaceholderTableView.tsx ✅
│        ├─ AllCategoriesTableView.tsx ✅
│        ├─ AllLabelsTableView.tsx  ✅ (2.1)
│        ├─ LabelTableView.tsx      ✅ (2.3)
│        ├─ CategoryTableView.tsx   ✅ (2.4)
│        ├─ MenuTableView.tsx       ✅ (2.5 - 2-level hierarchy)
│        ├─ MenuTableView.types.ts  ✅ (FlatMenuRow discriminated union)
│        └─ shared/
│           ├─ table/               ✅ (TableRow, TableCell, TableHeader, SortableHeaderCell, columnWidthPresets)
│           ├─ cells/               ✅ (CheckboxCell, InlineNameEditor, InlineIconCell, VisibilityCell, ChevronToggleCell, HierarchyNameCell, DragHandleCell)
│           ├─ ContextMenuWrapper.tsx ⏸️ (3.10)
│           └─ MobileActionSheet.tsx  ⏸️ (3.10)
│
├─ hooks/
│  ├─ useMenuBuilderState.ts        ✅
│  ├─ useProductMenuData.ts         ✅
│  ├─ useProductMenuMutations.ts    ✅
│  ├─ useContextSelectionModel.ts   ✅ (enhanced: hierarchy support, tri-state checkboxes)
│  ├─ useContextRowUiState.ts       ✅ (enhanced: autoClearPinned option)
│  ├─ usePinnedRow.ts               ✅ (enhanced: built-in default sort)
│  ├─ useFlattenedMenuRows.ts       ✅ (hierarchy → flat row list)
│  ├─ useIdentityRegistry.ts        ✅ (buildFlatRegistry, buildMenuRegistry)
│  ├─ useRowClickHandler.ts         ✅ (unified click handling)
│  ├─ useActionHandler.ts           ✅ (clone/remove with visual order)
│  ├─ useInlineEditHandlers.ts      ✅ (name/icon/visibility with undo + duplicate validation)
│  ├─ useUndoRedoStack.ts           ✅ (declarative undo/redo system)
│  ├─ usePersistColumnSort.ts       ✅ (persist TanStack sort to DB)
│  ├─ useKeyboardShortcuts.ts       ✅ (global keyboard shortcuts)
│  ├─ useLongPress.ts               ⏸️ (3.10.2 - long-press detection)
│  ├─ useRangeSelection.ts          ⏸️ (3.9 - or integrated into useContextSelectionModel)
│  └─ dnd/                          ✅ (v0.66.20 consolidated architecture)
│     ├─ useGroupedReorder.ts       ✅ (core shared DnD state management)
│     ├─ useSingleEntityDnd.ts      ✅ (flat table DnD wrapper)
│     ├─ useMultiEntityDnd.ts       ✅ (hierarchical DnD with cross-boundary)
│     ├─ useDnDEligibility.ts       ✅ (derives eligibility from selection)
│     ├─ useGroupedEntitiesGhost.ts ✅ (multi-drag ghost rendering)
│     ├─ useThrottledCallback.ts    ✅ (throttle with flush support)
│     └─ multiSelectValidation.ts   ✅ (validation utilities)
│
├─ constants/
│  ├─ action-bar/                   ✅ (colocated config)
│  │  ├─ model.ts
│  │  ├─ shared.ts
│  │  ├─ actions.ts
│  │  ├─ views.ts
│  │  └─ index.ts
│  ├─ help-content.ts               ✅ (view-specific help text)
│  ├─ view-configs.ts               ✅
│  └─ dropdown-registry.ts          ✅
│
├─ actions/
│  ├─ utils.ts                      ✅ (naming conventions: "New Label2", "Name copy2")
│  ├─ labels.ts                     ✅
│  ├─ categories.ts                 ✅
│  └─ __tests__/                    ✅
│
├─ data/                            ✅
│  ├─ categories.ts
│  ├─ labels.ts
│  └─ __tests__/
│
└─ types/                           ✅
   ├─ builder-state.ts
   ├─ menu.ts
   ├─ category.ts
   └─ identity-registry.ts          ✅ (RowIdentity, IdentityRegistry, key utilities)
```

---

## Success Metrics

### Code Quality

- [x] 100% TypeScript type safety (no `any`)
- [x] 100% test coverage on core logic
- [x] Zero conditionals in UI (config-driven)
- [ ] All table views have tests
- [ ] E2E tests for critical user flows

### Performance

- [x] 67% reduction in cyclomatic complexity
- [x] 61% reduction in state management code
- [ ] Menu view handles 100+ items smoothly (<100ms render)
- [ ] Drag-and-drop has optimistic updates
- [ ] Search results return in <50ms

### User Experience

- [x] Inline editing works without page reload
- [ ] All 5 views functional
- [ ] Context menus on right-click
- [ ] Keyboard shortcuts for power users
- [ ] Undo/redo for mistake recovery
- [ ] Drag-and-drop for intuitive reordering

---

## Decision Log

### Jan 3, 2026: Config-Driven Architecture

**Decision:** Use split-config (ACTION_BAR_CONFIG + VIEW_CONFIGS) instead of unified mega-config
**Rationale:** Lower risk, incremental pathway, easier to reason about
**Impact:** 67% complexity reduction, easier testing

### Jan 8, 2026: Data Layer Unification

**Decision:** Centralize Prisma access in `data/` folder with DTO tests
**Rationale:** Prevent data access fragmentation, lock in ordering invariants
**Impact:** Single source of truth, easier debugging, guaranteed consistency

### Jan 10, 2026: Table View Priority

**Decision:** Ship views in order: AllLabels → Label → Category → Menu
**Rationale:** Builds complexity incrementally, reuses patterns, validates early
**Impact:** Faster time to first additional view, lower risk

### Jan 14, 2026: Reusable Table View Hooks

**Decision:** Extract common table view patterns into reusable hooks
**Rationale:** AllLabels and AllCategories shared significant boilerplate (click handling, drag-drop, inline edits with undo)
**Impact:**

- `useDragReorder` - Centralized drag-and-drop row reordering
- `useInlineEditHandlers` - Name/icon/visibility handlers with automatic undo/redo
- `usePinnedRow` enhanced with built-in default order sort
- `useContextRowUiState` enhanced with `autoClearPinned` option
- `TableRow` component now handles click/double-click timeout internally
- ~80 lines of boilerplate removed from each table view

### Jan 15, 2026: Declarative Undo/Redo System

**Decision:** Colocate undo capture logic with action definitions via `captureUndo` field
**Rationale:** Scattered conditional undo logic was hard to maintain and extend
**Impact:**

- Eliminated 100+ lines of conditional undo/redo logic in MenuActionBar
- Undo actions now defined alongside action handlers
- New actions automatically get undo support by adding `captureUndo` field
- History stack view-scoped (10 operations, cleared on navigation)

### Jan 15-16, 2026: Category Table View with Sortable Columns

**Decision:** Implement sortable columns using TanStack Table with DnD integration
**Rationale:** Category view needed both column sorting AND drag-drop reordering
**Impact:**

- Created `SortableHeaderCell` component for reusable sortable headers
- Added `onReorderComplete` callback to `useDragReorder` for sort reset
- Sort indicators (↑/↓) prepend to column label when sorted
- Toggle icon (↕) appears on hover for sortable columns

### Jan 16, 2026: Column Preset Consolidation

**Decision:** Single source of truth for column width, cell, and alignment config
**Rationale:** Alignment could be set in 3 places (header, preset, cell) causing confusion
**Impact:**

- Added `align` property to `ColumnWidthEntry` type
- `TableHeader` reads width/align from preset by column id
- `TableCell` accepts `config` prop for cell styling
- Simplified header column definitions to just `id` and `label`
- Eliminated redundant alignment props across all table views

### Jan 17, 2026: Label View Simplification

**Decision:** Single-level table with TanStack sorting instead of 2-level hierarchy with autoOrder mode
**Rationale:**
- 2-level hierarchy (categories → products) added complexity for little value
- autoOrder toggle is redundant when TanStack provides 5 sorting options
- Double-click to drill into category keeps product management in Category View
- Matches existing CategoryTableView pattern (reuse code)

**Impact:**

- Removed: 2-level expand/collapse, autoOrder mode, sort-mode action
- Added: TanStack sortable columns (Name, Added Order)
- Products shown as comma-separated list (read-only preview)
- Simpler implementation, consistent UX across views

### Jan 17, 2026: Reusable Column Sort Persist Hook

**Decision:** Extract column sort persistence into `usePersistColumnSort` hook
**Rationale:**
- Both LabelTableView and CategoryTableView needed identical logic
- Pattern: watch TanStack sorting state → persist to DB via mutation
- Guards against concurrent persists with a ref

**Impact:**

- Created `usePersistColumnSort.ts` hook
- Reduced duplication across table views
- Reusable for any table that needs sort-to-DB persistence
- Clear API: `{ sorting, contextId, table, onPersist }`

---

## Next Action

**Last Completed:** Keyboard Shortcuts & Action Buttons (v0.67.0) - Jan 24, 2026

### Recently Completed (v0.66.16-0.67.0)

- [x] Explicit selection model refactor
- [x] Multi-select DnD with grouped entities ghost
- [x] Cross-boundary batch moves
- [x] Consolidated DnD hooks: `useGroupedReorder` as shared core
- [x] Fixed AllLabelsTableView reorder positioning (`defaultSort: null`)
- [x] Intent-based cursor feedback (grab/not-allowed on mousedown)
- [x] Keyboard shortcuts with single-key Gmail/Slack style (N, D, R, X, V, E, C, U, Shift+U, ?)
- [x] Help button (ConciergeBell) on all 5 views
- [x] Delete button with AlertDialog + full undo/redo (restoreLabel, restoreCategory)
- [x] Accessible disabled buttons (aria-disabled for tabbability)

### Immediate Next Steps

1. **Range Selection (3.9)** - Shift+click on desktop, long-press checkbox on both
2. **Context Menus (3.10)** - Right-click + long-press with Move Up/Down
3. **Search & Filter (3.5)** - Global search in action bar

### Future Refactors

1. **Separate Level from Kind (3.8)** - Required before adding new hierarchy levels
   - See section 3.8 and [refactor-level-vs-kind.md](./refactor-level-vs-kind.md)

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System diagrams, source of truth table, config patterns
- [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) - How to add views/actions
- [FEATURE-SPEC.md](./FEATURE-SPEC.md) - Complete target vision (1,186 lines)
- [keyboard-shortcuts-and-action-buttons-plan.md](./keyboard-shortcuts-and-action-buttons-plan.md) - Keyboard shortcuts implementation
- [mobile-interactions-plan.md](./mobile-interactions-plan.md) - Range selection, touch DnD, context menus
- [archive/](./archive/) - Historical planning docs

---

## Getting Help

**Reference Implementations:**

- `CategoryTableView.tsx` is the **golden example** for table views with sortable columns + drag-and-drop
- `AllLabelsTableView.tsx` is the **golden example** for table views with drag-and-drop only
- `AllCategoriesTableView.tsx` is the **golden example** for table views with inline editing

**Reusable Components:**

- `SortableHeaderCell` - For sortable column headers with TanStack Table
- `columnWidthPresets` - Single source of truth for column config (width, cell, align)

**Reusable Hooks:**

| Hook | Purpose |
|------|---------|
| `useGroupedReorder` | Core shared DnD state management (throttled dragOver, drop handling) |
| `useSingleEntityDnd` | Flat table DnD wrapper (AllLabels, Category, Label views) |
| `useMultiEntityDnd` | Hierarchical DnD with cross-boundary moves and auto-expand |
| `useDnDEligibility` | Derives drag eligibility from selection state |
| `useGroupedEntitiesGhost` | Multi-drag ghost image with count badge |
| `useInlineEditHandlers` | Name/icon/visibility editing with undo + duplicate validation |
| `usePinnedRow` | Pinned newly-created rows with default sort |
| `useContextRowUiState` | Editing state with `autoClearPinned` option |
| `useUndoRedoStack` | View-scoped undo/redo with declarative capture |
| `usePersistColumnSort` | Persist TanStack column sort to database |
| `useIdentityRegistry` | Build row identity registries (flat or hierarchical) |
| `useRowClickHandler` | Unified click handling (selection + expand toggle) |
| `useContextSelectionModel` | Hierarchical selection with tri-state checkboxes |
| `useFlattenedMenuRows` | Transform hierarchy to flat row list for rendering |
| `useActionHandler` | Clone/remove operations with visual order preservation |

**Key Types:**

| Type | Purpose |
|------|---------|
| `RowIdentity` | Complete identity for any row (key, kind, entityId, depth, parent/child) |
| `IdentityRegistry` | Container with O(1) lookups for row identities |
| `FlatMenuRow` | Discriminated union for menu table rows (label \| category) |

**Ask Claude Code:**

- "Show me the MenuTableView implementation"
- "Explain how useMenuTableDragReorder works"
- "Help me implement cross-boundary DnD"

---

**Last Updated:** 2026-01-24
**Project Owner:** yuens1002

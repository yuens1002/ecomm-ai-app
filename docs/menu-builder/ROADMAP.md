# Menu Builder - Development Roadmap

**Last Updated:** 2026-01-13
**Current Branch:** `main` (merged from `unify-menu-builder`)
**Status:** Phase 1 Complete ✅ | Phase 2 In Progress 🚧

---

## Project Vision

Build a sophisticated admin interface for managing a 3-level product catalog hierarchy (Labels → Categories → Products) with a config-driven, zero-conditional architecture.

---

## Overall Progress

```
Foundation  ████████████████████████ 100% ✅
Table Views ████░░░░░░░░░░░░░░░░░░░  20% 🚧
Advanced    ░░░░░░░░░░░░░░░░░░░░░░░   0% ⏸️
─────────────────────────────────────────
Total       ████████░░░░░░░░░░░░░░░  40%
```

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

## Phase 2: Table Views 🚧 IN PROGRESS

**Target:** Complete all 5 table views
**Timeline:** 4-6 weeks
**Current:** 1/5 views shipped (20%)

### 2.1 All Labels Table View ⏸️ NOT STARTED

**Complexity:** Low (reuse AllCategories pattern)
**Effort:** 1-2 days
**Dependencies:** None

**Tasks:**

- [ ] Create `AllLabelsTableView.tsx` component
- [ ] Columns: Checkbox, Icon, Name, Categories (count), Visibility
- [ ] Inline icon editing (IconPicker dialog)
- [ ] Inline name editing (InlineNameEditor)
- [ ] Bulk actions (delete, toggle visibility)
- [ ] Selection state management
- [ ] Register in TableViewRenderer

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/components/table-views/AllLabelsTableView.tsx`

**Files to Modify:**

- `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`

**Acceptance Criteria:**

- Matches AllCategories functionality
- Inline editing works
- Bulk selection and actions work
- Tests added for new components

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

### 2.3 Label View (2-Level Hierarchy) ⏸️ NOT STARTED

**Complexity:** Medium
**Effort:** 3-4 days
**Dependencies:** 2.1 (All Labels view should exist first)

**Tasks:**

- [ ] Create `LabelTableView.tsx` component
- [ ] Show categories within selected label
- [ ] Expandable/collapsible category rows
- [ ] Product count per category
- [ ] Drag-and-drop category reordering (native HTML5)
- [ ] "Add Categories" dropdown
- [ ] "Remove from Label" action
- [ ] Handle `autoOrder` mode (disable DnD when true)

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/components/table-views/LabelTableView.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/DraggableRow.tsx`

**Files to Modify:**

- `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`
- `app/admin/(product-menu)/constants/action-bar-config.ts` (add "Add Categories" logic)

**Acceptance Criteria:**

- Shows categories in correct order (respects junction table)
- Drag-and-drop updates order in database
- Auto-order mode disables manual reordering
- Can add categories from dropdown
- Can remove categories from label

---

### 2.4 Category View (Product Assignment) ⏸️ NOT STARTED

**Complexity:** High (product assignment UX)
**Effort:** 4-5 days
**Dependencies:** 2.3 (Label view pattern established)

**Tasks:**

- [ ] Create `CategoryTableView.tsx` component
- [ ] Show ALL products (not just assigned)
- [ ] Checkbox column for bulk selection
- [ ] "Assigned" column (checkmark if in category)
- [ ] "Primary" indicator for isPrimary products
- [ ] "Add to Category" / "Remove from Category" actions
- [ ] "Set as Primary" action
- [ ] "Added in Categories" column showing cross-references
- [ ] Search/filter products

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/components/table-views/CategoryTableView.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/ProductCheckboxCell.tsx`

**Files to Modify:**

- `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`
- `app/admin/(product-menu)/actions/product-menu-actions.ts` (add product assignment actions)
- `app/admin/(product-menu)/data/categories.ts` (add product assignment helpers)

**Acceptance Criteria:**

- Shows all products with assignment status
- Can add/remove products in bulk
- Can set primary product
- Shows which other categories contain each product
- Product search/filter works

---

### 2.5 Menu View (3-Level Hierarchy) ⏸️ NOT STARTED

**Complexity:** Very High (most complex view)
**Effort:** 5-7 days
**Dependencies:** 2.3, 2.4 (all patterns established)

**Tasks:**

- [ ] Create `MenuTableView.tsx` component
- [ ] 3-level expand/collapse (Labels → Categories → Products)
- [ ] Drag-and-drop across all levels
- [ ] Drop zone visual feedback
- [ ] Handle drag constraints (can't drag label into category)
- [ ] Lazy loading for performance (expand loads categories)
- [ ] Icons and indentation for hierarchy
- [ ] Collapse/expand all controls
- [ ] Keyboard navigation (arrow keys expand/collapse)

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/components/table-views/MenuTableView.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/HierarchyRow.tsx`
- `app/admin/(product-menu)/menu-builder/components/table-views/shared/DropZone.tsx`

**Files to Modify:**

- `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`
- `app/admin/(product-menu)/hooks/useMenuBuilderState.ts` (add expand/collapse state)

**Acceptance Criteria:**

- All 3 levels show correctly with proper indentation
- Expand/collapse works smoothly
- Drag-and-drop updates order in correct junction table
- Visual feedback for valid/invalid drop zones
- Performance is smooth with 100+ items
- Keyboard navigation works

---

## Phase 3: Advanced Features ⏸️ NOT STARTED

**Target:** Polish and power-user features
**Timeline:** 2-4 weeks
**Status:** 0% (waiting for Phase 2 completion)

### 3.1 Drag-and-Drop System ⏸️

**Tasks:**

- [ ] Native HTML5 DnD implementation
- [ ] Visual feedback (ghost preview, drop zones)
- [ ] Constraint validation (prevent invalid drops)
- [ ] Optimistic updates (instant UI, then sync)
- [ ] Error handling and rollback
- [ ] Touch device support

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/hooks/useDragAndDrop.ts`

---

### 3.2 Keyboard Shortcuts ⏸️

**Tasks:**

- [ ] Key handler in MenuBuilder root
- [ ] Platform detection (Mac Cmd vs Win Ctrl)
- [ ] Shortcut map (from spec):
  - `Ctrl+N` - New item
  - `Ctrl+D` - Duplicate
  - `Delete` - Remove selected
  - `Ctrl+Z` - Undo
  - `Ctrl+Shift+Z` - Redo
  - `Ctrl+A` - Select all
  - `↑/↓` - Navigate rows
  - `Space` - Toggle selection
- [ ] Tooltips showing shortcuts (shadcn Kbd component)
- [ ] Disable when input focused

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/hooks/useKeyboardShortcuts.ts`
- `app/admin/(product-menu)/constants/keyboard-shortcuts.ts`

---

### 3.3 Undo/Redo System ⏸️

**Tasks:**

- [ ] 10-operation stack per view (session storage)
- [ ] Serializable state snapshots
- [ ] Toast notifications on undo/redo
- [ ] Action types (create, update, delete, reorder, clone)
- [ ] Batch operations (undo bulk delete as one action)
- [ ] Clear stack on view change

**Files to Create:**

- `app/admin/(product-menu)/menu-builder/hooks/useUndoRedo.ts`

**Files to Modify:**

- `app/admin/(product-menu)/hooks/useMenuBuilderState.ts` (wire undo/redo)

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

## File Structure

```
app/admin/(product-menu)/
├─ menu-builder/
│  ├─ MenuBuilderProvider.tsx       ✅
│  ├─ MenuBuilder.tsx               ✅
│  └─ components/
│     ├─ menu-action-bar/           ✅
│     └─ table-views/
│        ├─ TableViewRenderer.tsx   ✅
│        ├─ PlaceholderTableView.tsx ✅
│        ├─ AllCategoriesTableView.tsx ✅
│        ├─ AllLabelsTableView.tsx  ⏸️ (2.1)
│        ├─ LabelTableView.tsx      ⏸️ (2.3)
│        ├─ CategoryTableView.tsx   ⏸️ (2.4)
│        ├─ MenuTableView.tsx       ⏸️ (2.5)
│        └─ shared/
│           ├─ table/               ✅
│           ├─ cells/               ✅
│           ├─ ContextMenuCell.tsx  ⏸️ (2.2)
│           └─ DraggableRow.tsx     ⏸️ (2.3)
│
├─ hooks/
│  ├─ useMenuBuilderState.ts        ✅
│  ├─ useProductMenuData.ts         ✅
│  ├─ useProductMenuMutations.ts    ✅
│  ├─ useContextSelectionModel.ts   ✅
│  ├─ useContextRowUiState.ts       ✅
│  ├─ usePinnedRow.ts               ✅
│  ├─ useDragAndDrop.ts             ⏸️ (3.1)
│  ├─ useKeyboardShortcuts.ts       ⏸️ (3.2)
│  └─ useUndoRedo.ts                ⏸️ (3.3)
│
├─ constants/
│  ├─ action-bar/                   ✅ (colocated config)
│  │  ├─ model.ts
│  │  ├─ shared.ts
│  │  ├─ actions.ts
│  │  ├─ views.ts
│  │  └─ index.ts
│  ├─ view-configs.ts               ✅
│  └─ dropdown-registry.ts          ✅
│
├─ data/                            ✅
│  ├─ categories.ts
│  ├─ labels.ts
│  └─ __tests__/
│
└─ types/                           ✅
   ├─ builder-state.ts
   ├─ menu.ts
   └─ category.ts
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

---

## Next Action

**Immediate Next Step:** Implement All Labels Table View (2.1)

- Lowest complexity
- Reuses AllCategories pattern
- Deliverable in 1-2 days
- Validates table view primitives work for labels too

**Command to Start:**

```bash
# Ensure clean state
git status

# Create new branch (optional)
git checkout -b feature/all-labels-table-view

# Start development
npm run dev
```

**Files to Read First:**

- `app/admin/(product-menu)/menu-builder/components/table-views/AllCategoriesTableView.tsx`
- `app/admin/(product-menu)/data/labels.ts`
- `docs/menu-builder/FEATURE-SPEC.md` (All Labels section)

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System diagrams, source of truth table, config patterns
- [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) - How to add views/actions
- [FEATURE-SPEC.md](./FEATURE-SPEC.md) - Complete target vision (1,186 lines)
- [archive/](./archive/) - Historical planning docs

---

## Getting Help

**Reference Implementation:**
- `AllCategoriesTableView.tsx` is the **golden example** - copy its patterns for new table views

**Ask Claude Code:**
- "Show me the AllCategories implementation"
- "Explain how the action-bar config works"
- "Help me implement the All Labels view"

---

**Last Updated:** 2026-01-13
**Project Owner:** yuens1002

# Menu Builder: File-System UX Spec

## Overview

A hierarchical menu organization UI modeled after a file explorer. The menu builder focuses on **organizing the product menu structure**, not editing individual products.

Desktop: Three-pane layout

- Left: Explorer tree showing Labels → Categories → Products hierarchy.
- Center: Quick editor for labels/categories (name, slug, visibility, icon/color for labels).
- Right: Assignment panel for attaching products to categories.

Mobile: Stack-based navigation with hierarchy view.

Primary goals:

- **Organize**: Add labels, add categories, group categories under labels.
- **Assign**: Attach products to categories, move categories between labels.
- **Manage**: Rename, copy, delete, sort, toggle visibility.
- **Bulk operations**: Multi-select for batch move/delete/hide.
- Fast inline edits with drag-and-drop and keyboard shortcuts.

## Information Architecture

Hierarchy (top-to-bottom):

1. **Labels** (top-level groups)
   - Each label contains categories
   - Examples: "By Taste Profile", "Origins", "Blends", "Collections", "Merch"
2. **Categories** (grouped under labels)
   - Examples: "Spicy & Earthy", "Ethiopian", "Espresso Blends", "New Arrivals"
   - Each category can have products assigned
3. **Products** (assigned to categories)
   - Products appear as children of their assigned category
   - Products are NOT edited here; only assigned/unassigned

Structure rules:

- Labels are top-level and flat (no nesting).
- Categories are grouped by label (one label per category).
- Products can be assigned to one category.
- All items use single `isVisible` flag.
- All items have `sortOrder` for manual ordering within their level.

## Core Interactions

Explorer Tree:

- **Expand/Collapse**: Labels expand to show categories; categories expand to show assigned products.
- **Inline rename**: Click name or press F2; Esc to cancel, Enter to save.
- **Drag-and-drop**:
  - Reorder items within level (updates `sortOrder`).
  - Drag category to different label (reassigns parent).
  - Drag product to category (assigns/reassigns).
  - Drag product out of category (unassigns).
- **Multi-select**: Shift+Click or Cmd/Ctrl+Click for bulk operations.
- **Keyboard**: Arrow keys to navigate, Space to toggle visibility, Delete to remove, Cmd+D to duplicate.

Quick Editor (labels/categories only):

- **Label**: Name, slug, icon, color, visibility, sort order.
- **Category**: Name, slug, visibility, sort order, assigned label.
- **Products**: NOT editable here (link to product admin instead).

Assignment Panel:

- Shows unassigned products when category is selected.
- Search and filter products.
- Click to assign, or drag to category in tree.
- Shows current assignments with remove option.

Global:

- **Command bar** (Cmd+K): "New Label", "New Category", "Assign Products", search.
- **Bulk actions toolbar**: Appears on multi-select (Move, Delete, Hide, Show).
- **Breadcrumbs**: Label → Category (if drilling into detail).
- **Status indicators**: Unsaved changes, sync state, operation feedback.

## Actions & Commands

**Label actions**:

- Add Label, Duplicate, Rename, Delete, Toggle Visibility, Reorder.

**Category actions**:

- Add Category, Duplicate, Rename, Delete, Toggle Visibility, Move to Label, Reorder.

**Product actions** (in menu builder):

- Assign to Category, Unassign, Move to Category.
- (Full product editing happens in /admin/products)

**Bulk actions** (multi-select):

- Move to Label (categories), Move to Category (products).
- Toggle Visibility, Delete.

**Context menu** (right-click or `…`):

- Rename, Duplicate, Delete.
- Move to… (opens label/category chooser).
- Assign Products… (categories only).
- Toggle Visibility.

## Data Model Mapping (Prisma/Types)

- `Label`: `id`, `name`, `slug`, `icon`, `color`, `isVisible`, `sortOrder`.
- `Category`: `id`, `name`, `slug`, `image`, `isVisible`, `sortOrder`, relation to `Label`.
- `Product`: `id`, `name`, `slug`, `isVisible`, `sortOrder`, relations to `Category` (and variants/images/pricing as existing).
- `SiteSettings`: singleton config (existing model/fields).

Note: Field names reflect existing patterns; adjust to exact schema.

## Persistence & UX

- Optimistic updates with rollback on failure.
- Atomic operations for reorder/move (batch update `sortOrder`).
- Conflict detection: if name/slug collision, show inline error.
- Toasts for success/error; inline indicators for pending.

## Performance & A11y

- Virtualized list for large datasets.
- Debounced search/filter.
- Keyboard-first navigation; ARIA roles for tree and menus.
- High-contrast focus states; screen-reader labels.

## MVP Scope

- Hierarchical explorer: Labels → Categories → Products (read-only product names).
- Inline rename for labels and categories.
- Add/delete labels and categories.
- Toggle visibility with immediate feedback.
- Drag-and-drop: reorder within level, move category to label, assign product to category.
- Quick editor: label fields (name, slug, icon, color) and category fields (name, slug, label).
- Assignment panel: search and assign products to selected category.
- Single-select operations.

## Stretch Goals

- Multi-select with bulk operations.
- Duplicate label/category.
- Undo/Redo for destructive operations.
- Command palette (Cmd+K) with fuzzy search.
- Live preview panel showing menu as customers see it.
- Keyboard shortcuts for power users.
- Drag product to unassign (remove from category).

## Mobile Adaptation

Mobile screens collapse the three-pane layout into a stack-based navigation:

### Navigation Pattern

- **List View** (default): Shows current section with breadcrumb nav.
  - Top: Breadcrumb chips (Site Settings / Labels / Categories / Products).
  - Main: Virtualized list of items in current section.
  - Bottom: Floating Action Button (FAB) for "New [Item]".
- **Detail View**: Full-screen inspector when item is tapped.
  - Top: Back button + item name + Save/Cancel.
  - Main: Form fields scrollable.
  - Bottom: Danger zone (Delete button).

### Mobile-Specific Interactions

- **Navigation**: Horizontal swipe between sections (with breadcrumb sync).
- **Reordering**: Long-press to enter reorder mode; drag handles appear; tap Done to exit.
- **Context Menu**: Long-press item → bottom sheet with actions (Duplicate, Rename, Delete, Toggle Visibility, Assign).
- **Multi-Select**: Tap checkbox icon in toolbar → checkboxes appear on items; bulk actions in bottom bar.
- **Search**: Persistent search bar at top; tap to focus and show keyboard.
- **Visibility Toggle**: Swipe left/right on item to toggle (with undo toast), or use context menu.

### Touch Targets & Gestures

- Minimum 44×44pt tap targets for all interactive elements.
- Swipe actions:
  - Swipe right: Toggle visibility (green/gray indicator).
  - Swipe left: Quick delete (with confirmation).
- Pull-to-refresh on lists.
- Haptic feedback on long-press, reorder, and swipe actions.

### Layout Breakpoints

- **Mobile** (< 768px): Stack-based navigation, full-screen inspector.
- **Tablet** (768px–1024px): Two-pane (explorer + inspector side-by-side; preview hidden).
- **Desktop** (> 1024px): Three-pane (explorer + inspector + preview optional).

### Mobile Constraints

- No keyboard shortcuts (show tooltip on hover for desktop).
- Drag-and-drop requires reorder mode (not always-on).
- Context menu is bottom sheet (not right-click menu).
- Assignment chooser is full-screen modal with search.

### Progressive Enhancement

- Desktop: Rich keyboard shortcuts, hover states, drag-and-drop always active.
- Mobile: Gesture-first, bottom sheets, reorder mode, FAB.

## Component Architecture

- `MenuExplorer`: hierarchical tree with expand/collapse.
- `TreeNode`: renders label/category/product with icon, name, visibility, actions.
- `QuickEditor`: sidebar form for label/category (not products).
- `AssignmentPanel`: product search and assignment for selected category.
- `BulkActionToolbar`: appears on multi-select with batch operations.
- `DnDProvider`: drag-and-drop context; reorder-mode on mobile.
- `MobileHierarchy`: stack navigation with breadcrumbs.
- `BottomSheet`: mobile context menu.

State/Data:

- SWR for reads: `useLabels()`, `useCategories()`, `useProducts()`.
- Server actions for mutations: `createLabel`, `updateLabel`, `deleteLabel`, `reorderLabels`, etc.
- Zod schemas for validation.
- Optimistic updates with rollback.
- Responsive state: viewport size, active node, multi-select set.

## API Endpoints (Server Actions)

**Labels**:

- `createLabel`, `updateLabel`, `deleteLabel`, `duplicateLabel`, `reorderLabels`.

**Categories**:

- `createCategory`, `updateCategory`, `deleteCategory`, `duplicateCategory`, `reorderCategories`.
- `moveCategoryToLabel` (reassign parent label).

**Product Assignments**:

- `assignProductToCategory`, `unassignProductFromCategory`, `moveProductToCategory`.
- `bulkAssignProducts` (batch operation).

**Queries**:

- `getMenuHierarchy` (labels with nested categories and products).
- `getUnassignedProducts` (for assignment panel).
- `searchProducts` (for assignment picker).

## Open Questions

1. **Category nesting**: Should we support sub-categories (future), or keep flat structure within labels?
2. **Product assignment**: Single category per product, or allow multiple categories?
3. **Deletion model**: Hard delete or soft-delete with restore?
4. **Unassigned products**: Show in separate "Unassigned" section, or only in assignment panel?
5. **Ordering**: Always manual `sortOrder`, or offer auto-alphabetical as option?
6. **Duplicate behavior**: Copy just the label/category, or copy with all children?
7. **Permissions**: Admin-only, or role-based (e.g., content editor can organize but not delete)?

## Implementation Plan (Phased)

**Phase 1 — Hierarchy & Basic Operations**:

- Build hierarchical tree: Labels → Categories → Products (read-only).
- Expand/collapse labels and categories.
- Inline rename for labels and categories.
- Add/delete labels and categories with confirmation.
- Toggle visibility with optimistic updates.

**Phase 2 — Drag-and-Drop & Assignment**:

- Drag to reorder within level (persist `sortOrder`).
- Drag category to different label (reassign).
- Assignment panel: search products and assign to category.
- Drag product to category in tree.

**Phase 3 — Bulk & Polish**:

- Multi-select with bulk move/delete/visibility.
- Duplicate label/category.
- Command palette (Cmd+K).
- Keyboard shortcuts for power users.
- Undo/redo for destructive ops.
- Virtualized tree for large datasets.

## Acceptance Criteria

- Users can navigate all sections and edit items without page reloads.
- Reordering persists and reflects immediately.
- Assignments update relationships and reflect in Explorer grouping.
- All actions provide clear feedback and are keyboard accessible.

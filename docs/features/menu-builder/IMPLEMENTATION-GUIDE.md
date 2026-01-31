# Menu Builder - Implementation Guide

**Last Updated:** 2026-01-14
**Scope:** Current foundation with 2/5 table views shipped

- The action bar UI/behavior is driven by `ACTION_BAR_CONFIG`.
- Per-view surface metadata is driven by `VIEW_CONFIGS`.
- Table view components are chosen by `TableViewRenderer` via `tableViewId`.

If you need the "forest view" (diagrams + view matrix), start with:

- [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Architecture

Menu Builder is built as a provider-composed feature:

- Data fetch: SWR via `useProductMenuData`.
- Mutations: server action wrappers via `useProductMenuMutations` that revalidate SWR.
- UI state: URL-backed navigation + local selection state via `useMenuBuilderState`.
- Composition: `MenuBuilderProvider` combines all of the above into a single context consumed by `useMenuBuilder()`.

---

## Provider Composition

Provider: `app/admin/(product-menu)/menu-builder/MenuBuilderProvider.tsx`

It composes:

- `useProductMenuData()`
- `useProductMenuMutations()`
- `useMenuBuilderState()`

Consumer usage:

```ts
const { builder, labels, categories, products, settings, ...mutations } = useMenuBuilder();
```

---

## URL State (Navigation)

Navigation state is persisted in URL params (view + selected entity IDs). Selection/expanded rows are local UI state.

Example URL shapes:

```text

/admin/menu-builder?view=menu
/admin/menu-builder?view=label&labelId=abc123
/admin/menu-builder?view=category&categoryId=def456
/admin/menu-builder?view=all-labels
/admin/menu-builder?view=all-categories
```

Implementation: `app/admin/(product-menu)/hooks/useMenuBuilderState.ts`

---

## Configuration Layers

### Action Bar (Source of Truth)

- Config: `app/admin/(product-menu)/constants/action-bar-config.ts`
- Component: `app/admin/(product-menu)/menu-builder/components/menu-action-bar/index.tsx`

`ACTION_BAR_CONFIG` determines:

- Which actions show for the current view
- How each action executes (using the mutation functions from context)
- Which SWR datasets should refresh after success

### View Surface Configs

- Config: `app/admin/(product-menu)/constants/view-configs.ts`

`VIEW_CONFIGS` determines view “surface metadata”:

- `features` (capabilities to enable UI affordances)
- `tableViewId` (string identifier; no React imports)
- optional action IDs for future row/bulk context menus

### Table View Rendering

- Renderer: `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`

`TableViewRenderer` maps `tableViewId` → actual React component (e.g. `AllCategoriesTableView`, `PlaceholderTableView`).

---

## How To Add A Table View

1. Add a new `tableViewId` to the `TableViewId` union in `app/admin/(product-menu)/constants/view-configs.ts`.
2. Add/update the view entry in `VIEW_CONFIGS` to point at that `tableViewId`.
3. Create the table component under `app/admin/(product-menu)/menu-builder/components/table-views/`.
4. Register the new `tableViewId` in `TableViewRenderer.tsx`.

### Reusable Hooks for Table Views

When creating a new table view, use these hooks to avoid boilerplate:

#### `useDragReorder` - Row drag-and-drop reordering
```typescript

const { getDragHandlers, getDragClasses } = useDragReorder({
  items: labels,
  onReorder: async (ids) => { await reorderLabels(ids); },
});

// In row render:
const { isDragging, isDragOver } = getDragClasses(item.id);
const dragHandlers = getDragHandlers(item.id);

<TableRow
  draggable
  isDragging={isDragging}
  onDragStart={dragHandlers.onDragStart}
  onDragOver={dragHandlers.onDragOver}
  onDragLeave={dragHandlers.onDragLeave}
  onDrop={dragHandlers.onDrop}
  onDragEnd={dragHandlers.onDragEnd}
  className={cn(isDragOver && "border-t-2 border-t-primary")}
>
```

#### `useInlineEditHandlers` - Name/icon/visibility with undo
```typescript

const { handleNameSave, handleIconSave, handleVisibilitySave } = useInlineEditHandlers({
  builder,
  entityKind: "label",
  getItem: (id) => labels.find((l) => l.id === id),
  updateItem: updateLabel,
  onSaveComplete: clearEditing,
});

// Use in cell components:
<InlineNameEditor onSave={handleNameSave} ... />
<InlineIconCell onSave={handleIconSave} ... />
<VisibilityCell onToggle={handleVisibilitySave} ... />
```

#### `useContextRowUiState` - Editing and pinned state
```typescript

const { editingId, pinnedId, clearEditing, clearPinnedIfMatches } = useContextRowUiState(
  builder,
  "label",
  { autoClearPinned: true }  // Auto-clear pinned when editing ends
);
```

#### `usePinnedRow` - Pinned row + default sorting
```typescript

const { pinnedRow, rowsForTable } = usePinnedRow({
  rows: labels,
  pinnedId,
  isSortingActive: false,  // Set true if using column sorting
  // Omit defaultSort to use built-in order-based sort
  // Or pass null to disable sorting entirely
});
```

#### `TableRow` - Built-in click/double-click handling
```typescript

<TableRow
  onRowClick={() => onToggleSelection(item.id)}     // 200ms delay
  onRowDoubleClick={() => navigateToDetail(item.id)} // Cancels pending click
>
```

---

## How To Add An Action

1. Update `ACTION_BAR_CONFIG` for the relevant view(s).
2. If the action needs a new server capability, add a server action under `app/admin/(product-menu)/actions/`.
3. Add a typed wrapper in `useProductMenuMutations.ts`.
4. If the action needs a structured payload, define a Zod schema + type in `app/admin/(product-menu)/types/` and use it end-to-end (UI → mutation wrapper → server action validation).
5. Update/add tests for the action bar config under `app/admin/(product-menu)/constants/__tests__/`.

---

## File Structure

```tsx

app/admin/(product-menu)/
  menu-builder/
    MenuBuilder.tsx
    MenuBuilderProvider.tsx
    components/
      menu-action-bar/
      table-views/
        TableViewRenderer.tsx
        PlaceholderTableView.tsx
        AllCategoriesTableView.tsx   # Column sorting example
        AllLabelsTableView.tsx       # Drag-and-drop example
        shared/
          cells/                     # CheckboxCell, InlineNameEditor, InlineIconCell, VisibilityCell
          table/                     # TableRow, TableCell, TableHeader, columnWidthPresets
  hooks/
    useMenuBuilderState.ts           # URL + selection state
    useProductMenuData.ts            # SWR data fetching
    useProductMenuMutations.ts       # CRUD wrappers
    useContextSelectionModel.ts      # Multi-select state
    useContextRowUiState.ts          # Editing/pinned row state
    usePinnedRow.ts                  # Pinned row + default sorting
    useDragReorder.ts                # Row drag-and-drop reordering
    useInlineEditHandlers.ts         # Name/icon/visibility handlers with undo
  constants/
    action-bar/                      # Colocated action config
    view-configs.ts
    __tests__/action-bar-config.test.ts
  types/
    builder-state.ts
    menu.ts
    category.ts
```

---

## Testing & Checks

```bash

# Typecheck + lint
npm run precheck

# Jest
npm run test:ci

# Or the action bar config test only
npx jest --ci app/admin/(product-menu)/constants/__tests__/action-bar-config.test.ts
```

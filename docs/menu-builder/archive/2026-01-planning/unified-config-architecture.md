# Unified Config Architecture

**Status:** Planning (Pre-Implementation)
**Goal:** Single source of truth where ALL features for a view live together

> Note (Jan 2026): This document describes a _future_ “mega-config” idea.
> The current implementation intentionally uses a smaller split-config approach:
>
> - `ACTION_BAR_CONFIG` for action bar behavior
> - `VIEW_CONFIGS` for view surface metadata (tableViewId/features/actionIds)
>   This reduces risk and keeps the pathway incremental.

---

## 🎯 Problem Statement

**Current state:** Configs are scattered across multiple objects:

- `ACTION_BAR_CONFIG` has action arrays per view
- `VIEW_CONFIGS` has table metadata per view
- Future: Context menus, columns, keyboard shortcuts would each add another config

**Issue:** The view key (`menu`, `all-labels`, etc.) is repeated across multiple configs.

**Goal:** ONE config object where everything for a view is defined together.

---

## 🏗️ Proposed Structure

```typescript
// constants/view-configs.ts

import type { ActionDefinition, ContextMenuAction } from "./shared-definitions";

export type ViewConfig = {
  // Table rendering
  tableComponent: React.ComponentType;
  supportsNesting: boolean;
  supportsDragDrop: boolean;

  // Action bar
  availableActions: string[]; // IDs that reference ACTION_DEFINITIONS
  actionExecutions: Record<string, (context: ActionContext) => Promise<void>>;
  actionDisabled: Record<string, (state: BuilderState) => boolean>;

  // Context menus
  contextMenuActions: ContextMenuAction[];

  // Future extensions
  columns?: ColumnConfig[];
  keyboardShortcuts?: KeyboardShortcut[];
  inlineEditing?: InlineEditConfig;
};

export const VIEW_CONFIGS: Record<ViewType, ViewConfig> = {
  menu: {
    // ===== TABLE =====
    tableComponent: MenuTableView,
    supportsNesting: true,
    supportsDragDrop: true,

    // ===== ACTION BAR =====
    availableActions: [
      "new-label",
      "add-labels",
      "clone",
      "remove",
      "visibility",
      "expand-all",
      "collapse-all",
      "undo",
      "redo",
    ],

    actionExecutions: {
      clone: async ({ selectedIds, mutations }) => {
        // Clone labels with all their categories
        for (const id of selectedIds) {
          await mutations.cloneLabel(id);
        }
      },
      remove: async ({ selectedIds, mutations }) => {
        // Hide labels from menu
        await Promise.all(selectedIds.map((id) => mutations.updateLabel(id, { isVisible: false })));
      },
      visibility: async ({ selectedIds, mutations, labels }) => {
        // Toggle visibility for selected labels
        await Promise.all(
          selectedIds.map(async (id) => {
            const label = labels.find((l) => l.id === id);
            if (label) {
              await mutations.updateLabel(id, { isVisible: !label.isVisible });
            }
          })
        );
      },
    },

    actionDisabled: {
      clone: (state) => state.selectedIds.length === 0,
      remove: (state) => state.selectedIds.length === 0,
      visibility: (state) => state.selectedIds.length === 0,
      "expand-all": () => false,
      "collapse-all": () => false,
      undo: (state) => state.undoStack.length === 0,
      redo: (state) => state.redoStack.length === 0,
    },

    // ===== CONTEXT MENUS =====
    contextMenuActions: [
      {
        id: "rename",
        label: "Rename",
        icon: "Pencil",
        kbd: ["F2"],
        execute: async (row, { setEditingCell }) => {
          setEditingCell({ rowId: row.id, columnId: "name" });
        },
      },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: "Copy",
        kbd: ["⌘", "D"],
        execute: async (row, { mutations }) => {
          if (row.type === "label") {
            await mutations.cloneLabel(row.id);
          } else if (row.type === "category") {
            await mutations.cloneCategory(row.id);
          }
        },
      },
      {
        id: "toggle-visibility",
        label: "Toggle Visibility",
        icon: "Eye",
        execute: async (row, { mutations }) => {
          if (row.type === "label") {
            await mutations.updateLabel(row.id, { isVisible: !row.isVisible });
          } else if (row.type === "category") {
            await mutations.updateCategory(row.id, { isVisible: !row.isVisible });
          }
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: "Trash2",
        isDanger: true,
        separator: true,
        execute: async (row, { mutations }) => {
          if (row.type === "label") {
            await mutations.removeLabel(row.id);
          } else if (row.type === "category") {
            await mutations.removeCategory(row.id);
          }
        },
      },
    ],
  },

  "all-labels": {
    // ===== TABLE =====
    tableComponent: AllLabelsTableView,
    supportsNesting: false,
    supportsDragDrop: false,

    // ===== ACTION BAR =====
    availableActions: ["new-label", "clone", "remove", "visibility", "undo", "redo"],

    actionExecutions: {
      "new-label": async ({ mutations, setEditingCell }) => {
        const result = await mutations.createLabel({
          name: "New Label",
          icon: null,
          isVisible: true,
        });
        if (result.ok && result.data) {
          setEditingCell({ rowId: result.data.id, columnId: "name" });
        }
      },
      clone: async ({ selectedIds, mutations }) => {
        for (const id of selectedIds) {
          await mutations.cloneLabel(id);
        }
      },
      remove: async ({ selectedIds, mutations }) => {
        await Promise.all(selectedIds.map((id) => mutations.updateLabel(id, { isVisible: false })));
      },
      visibility: async ({ selectedIds, mutations, labels }) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const label = labels.find((l) => l.id === id);
            if (label) {
              await mutations.updateLabel(id, { isVisible: !label.isVisible });
            }
          })
        );
      },
    },

    actionDisabled: {
      "new-label": () => false,
      clone: (state) => state.selectedIds.length === 0,
      remove: (state) => state.selectedIds.length === 0,
      visibility: (state) => state.selectedIds.length === 0,
      undo: (state) => state.undoStack.length === 0,
      redo: (state) => state.redoStack.length === 0,
    },

    // ===== CONTEXT MENUS =====
    contextMenuActions: [
      {
        id: "rename",
        label: "Rename",
        icon: "Pencil",
        kbd: ["F2"],
        execute: async (row, { setEditingCell }) => {
          setEditingCell({ rowId: row.id, columnId: "name" });
        },
      },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: "Copy",
        execute: async (row, { mutations }) => {
          await mutations.cloneLabel(row.id);
        },
      },
      {
        id: "toggle-visibility",
        label: "Toggle Visibility",
        icon: "Eye",
        execute: async (row, { mutations }) => {
          await mutations.updateLabel(row.id, { isVisible: !row.isVisible });
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: "Trash2",
        isDanger: true,
        separator: true,
        execute: async (row, { mutations }) => {
          await mutations.removeLabel(row.id);
        },
      },
    ],
  },

  "all-categories": {
    // ===== TABLE =====
    tableComponent: AllCategoriesTableView,
    supportsNesting: false,
    supportsDragDrop: false,

    // ===== ACTION BAR =====
    availableActions: ["new-category", "clone", "remove", "visibility", "undo", "redo"],

    actionExecutions: {
      "new-category": async ({ mutations, setEditingCell, currentLabelId }) => {
        if (!currentLabelId) return;
        const result = await mutations.createCategory({
          labelId: currentLabelId,
          name: "New Category",
          isVisible: true,
        });
        if (result.ok && result.data) {
          setEditingCell({ rowId: result.data.id, columnId: "name" });
        }
      },
      clone: async ({ selectedIds, mutations }) => {
        for (const id of selectedIds) {
          await mutations.cloneCategory(id);
        }
      },
      remove: async ({ selectedIds, mutations }) => {
        await Promise.all(
          selectedIds.map((id) => mutations.updateCategory(id, { isVisible: false }))
        );
      },
      visibility: async ({ selectedIds, mutations, categories }) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const category = categories.find((c) => c.id === id);
            if (category) {
              await mutations.updateCategory(id, { isVisible: !category.isVisible });
            }
          })
        );
      },
    },

    actionDisabled: {
      "new-category": () => false,
      clone: (state) => state.selectedIds.length === 0,
      remove: (state) => state.selectedIds.length === 0,
      visibility: (state) => state.selectedIds.length === 0,
      undo: (state) => state.undoStack.length === 0,
      redo: (state) => state.redoStack.length === 0,
    },

    // ===== CONTEXT MENUS =====
    contextMenuActions: [
      {
        id: "rename",
        label: "Rename",
        icon: "Pencil",
        kbd: ["F2"],
        execute: async (row, { setEditingCell }) => {
          setEditingCell({ rowId: row.id, columnId: "name" });
        },
      },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: "Copy",
        execute: async (row, { mutations }) => {
          await mutations.cloneCategory(row.id);
        },
      },
      {
        id: "toggle-visibility",
        label: "Toggle Visibility",
        icon: "Eye",
        execute: async (row, { mutations }) => {
          await mutations.updateCategory(row.id, { isVisible: !row.isVisible });
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: "Trash2",
        isDanger: true,
        separator: true,
        execute: async (row, { mutations }) => {
          await mutations.removeCategory(row.id);
        },
      },
    ],
  },

  // label and category views would follow same pattern...
};
```

---

## 📁 File Structure

```text
constants/
  shared-definitions.ts        # ACTION_DEFINITIONS, helper functions
  view-configs.ts              # Single unified config (VIEW_CONFIGS)

components/
  menu-action-bar/
    index.tsx                  # Reads VIEW_CONFIGS[view].availableActions

  table-views/
    TableViewRenderer.tsx      # Reads VIEW_CONFIGS[view].tableComponent
    ContextMenuCell.tsx        # Reads VIEW_CONFIGS[view].contextMenuActions

    shared/                    # Shared table cells
      CheckboxCell.tsx
      ExpandToggle.tsx
      VisibilityCell.tsx
      InlineNameEditor.tsx
      IconCell.tsx

    MenuTableView.tsx          # Imported by VIEW_CONFIGS.menu
    AllLabelsTableView.tsx     # Imported by VIEW_CONFIGS["all-labels"]
    AllCategoriesTableView.tsx # Imported by VIEW_CONFIGS["all-categories"]
    LabelTableView.tsx
    CategoryTableView.tsx
```

---

## 🔄 How Components Consume Config

### **Action Bar** (already exists)

```typescript
// components/menu-action-bar/index.tsx
function MenuActionBar() {
  const { builder } = useMenuBuilder();
  const config = VIEW_CONFIGS[builder.currentView];

  return (
    <div>
      {config.availableActions.map(actionId => {
        const actionDef = ACTION_DEFINITIONS[actionId];
        const isDisabled = config.actionDisabled[actionId]?.(builder) ?? false;
        const executeAction = config.actionExecutions[actionId];

        return (
          <ActionButton
            key={actionId}
            {...actionDef}
            disabled={isDisabled}
            onClick={() => executeAction(context)}
          />
        );
      })}
    </div>
  );
}
```

### **Table Renderer** (new component)

```typescript
// components/table-views/TableViewRenderer.tsx
function TableViewRenderer() {
  const { builder } = useMenuBuilder();
  const config = VIEW_CONFIGS[builder.currentView];
  const TableComponent = config.tableComponent;

  return <TableComponent />;
}
```

### **Context Menu** (new component)

```typescript
// components/table-views/ContextMenuCell.tsx
function ContextMenuCell({ row }: { row: unknown }) {
  const { builder } = useMenuBuilder();
  const config = VIEW_CONFIGS[builder.currentView];

  return (
    <ContextMenu>
      {config.contextMenuActions.map(action => (
        <ContextMenuItem
          key={action.id}
          icon={action.icon}
          onClick={() => action.execute(row, context)}
        >
          {action.label}
        </ContextMenuItem>
      ))}
    </ContextMenu>
  );
}
```

---

## ✅ Benefits

1. **Single Source of Truth** - Everything for `all-categories` view in ONE place
2. **No Key Repetition** - `all-categories: { }` appears once, not 5 times
3. **Easy to Extend** - Add new feature? Just add to ViewConfig type
4. **Type Safety** - TypeScript ensures all views have all required features
5. **Easy to Compare** - See differences between views at a glance
6. **Zero Conditionals** - Components just read config and render

---

## 🚀 Implementation Order

### **Phase 1: Planning** (Current)

- ✅ Define unified ViewConfig structure
- ⏸️ Get confirmation before implementing

### **Phase 2: Migrate Existing Code**

1. Create `shared-definitions.ts` with ACTION_DEFINITIONS
2. Create `view-configs.ts` with unified VIEW_CONFIGS
3. Update action bar to consume VIEW_CONFIGS
4. Deprecate old action-bar-config.ts

### **Phase 3: Build All-Categories View**

1. Create AllCategoriesTableView component
2. Use shared components (CheckboxCell, etc.)
3. Wire to VIEW_CONFIGS["all-categories"]
4. Test action bar + context menus

### **Phase 4: Build Shared Components**

1. CheckboxCell
2. VisibilityCell
3. InlineNameEditor
4. (other shared cells as needed)

---

## ❓ Questions to Confirm

1. **File naming:** `view-configs.ts` or different name?
2. **Shared definitions:** Separate file or same file?
3. **Action executions:** Inline in config or separate functions?
4. **Context menu actions:** Inline definitions or factory functions?
5. **Start with all-categories:** Confirm this is the right view to start with?

---

## 🎯 Next Step

**Wait for confirmation** that this unified structure matches your vision, then proceed with implementation.

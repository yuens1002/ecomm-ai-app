# Menu Builder: Table Views Implementation Plan

**Status:** Phase 2A - Starting Implementation
**Created:** January 5, 2026
**Phase:** 2 of 2

> **Note:** Code samples in this document are for reference and architectural guidance only. All implementations should be written from scratch based on these specifications, not copied directly.

---

## 🎯 Overview

Build 5 table view components that integrate with our existing architecture:

- Action bar with declarative config (already complete)
- MenuBuilderProvider for state/data
- View-specific rendering based on `builder.currentView`

**Current State:**

- ✅ Action bar config with view-specific execute logic
- ✅ Dropdown components (add-labels, add-categories, add-products)
- ✅ Provider with state + data + mutations
- ✅ Navigation system (URL-backed)
- ✅ Selection management
- ✅ 72 tests passing

**Goal:** Build table components that leverage existing infrastructure without modification.

---

## 🏗️ Config Architecture (Zero Conditionals)

**Core Principle:** Everything is declarative configuration. Components consume configs, never check conditions.

### **3-Tier Config Pattern**

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. SHARED DEFINITIONS (Define Once)                         │
├─────────────────────────────────────────────────────────────┤
│ ACTION_DEFINITIONS                                          │
│   - UI properties for each action (icon, label, kbd, etc.)  │
│   - No logic, just display metadata                         │
│                                                             │
│ CONTEXT_MENU_ACTIONS                                        │
│   - Factory functions for reusable menu actions             │
│   - Common behaviors (rename, duplicate, delete, etc.)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. VIEW_CONFIGS (Compose Per View)                          │
├─────────────────────────────────────────────────────────────┤
│ menu: {                                                     │
│   tableComponent: MenuTableView,                            │
│   availableActions: ["clone", "remove", "visibility"],      │
│   actionExecutions: { clone: async (ctx) => {...} },        │
│   contextMenuActions: [ACTIONS.rename(), ACTIONS.delete()], │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GENERIC COMPONENTS (Consume Configs)                     │
├─────────────────────────────────────────────────────────────┤
│ <TableViewRenderer view={view} />                           │
│   → Reads VIEW_CONFIGS[view].tableComponent                 │
│   → Renders the right table, zero conditionals              │
│                                                             │
│ <ActionBar view={view} />                                   │
│   → Reads VIEW_CONFIGS[view].availableActions               │
│   → Maps to ACTION_DEFINITIONS for display                  │
│   → Calls VIEW_CONFIGS[view].actionExecutions on click      │
│                                                             │
│ <ContextMenuCell view={view} row={row} />                   │
│   → Reads VIEW_CONFIGS[view].contextMenuActions             │
│   → Renders menu items, calls action.execute()              │
└─────────────────────────────────────────────────────────────┘
```

### **No Conditionals Anywhere**

❌ **Never do this:**

```typescript
if (view === "menu") return <MenuTableView />;
if (view === "label") return <LabelTableView />;
```

✅ **Always do this:**

```typescript
const config = VIEW_CONFIGS[view];
return <config.tableComponent />;
```

### **File Structure**

```text
constants/
  action-bar-config.ts          # Single giant config file
    ├─ ACTION_DEFINITIONS       # Shared action UI (icons, labels, kbd)
    ├─ CONTEXT_MENU_ACTIONS     # Shared menu action factories
    └─ VIEW_CONFIGS             # Per-view composition
         ├─ menu
         ├─ label
         ├─ category
         ├─ all-labels
         └─ all-categories
```

### **Benefits**

1. **Single Source of Truth** - All view features in VIEW_CONFIGS
2. **Zero Duplication** - Reuse ACTION_DEFINITIONS & CONTEXT_MENU_ACTIONS
3. **Zero Conditionals** - Components just read configs
4. **Easy to Extend** - New view = one entry in VIEW_CONFIGS
5. **Type Safe** - Full TypeScript inference throughout
6. **Testable** - Test configs, not component logic
7. **Maintainable** - Change action? Update one definition

---

## 📋 Architecture Alignment

### **What We Already Have**

1. **action-bar-config.ts** (496 lines)
   - All button definitions with view-specific execute logic
   - SHARED_ACTIONS: remove, clone, visibility, expand/collapse, undo/redo
   - Disabled logic per view (checks data counts, selections, undo/redo stacks)
   - Already knows which actions are available per view

2. **MenuBuilderProvider** (42 lines)
   - Combines `useProductMenuData()` (labels, categories, products)
   - Combines `useProductMenuMutations()` (CRUD operations)
   - Combines `useMenuBuilderState()` (navigation, selections, expand/collapse)
   - Single hook: `useMenuBuilder()`

3. **Dropdown Components** (3 files)
   - AddLabelsDropdown, AddCategoriesDropdown, AddProductsDropdown
   - Use DropdownContent base with search + sections
   - Wire up via DROPDOWN_REGISTRY

4. **Types** (complete)
   - BuilderState, MenuLabel, MenuCategory, MenuProduct
   - ProductMenuMutations (typed mutation functions)
   - ActionContext for execute logic

### **What We Need to Build**

1. **Table components** (5 views)
   - Read data from `useMenuBuilder()`
   - Render rows based on current view
   - Integrate with existing action bar (no changes needed)
   - Handle selection state (already in builder)
   - Handle expand/collapse (already in builder)

2. **Shared table cells** (reusable)
   - CheckboxCell - Integrate with `builder.toggleSelection()`
   - ExpandToggle - Integrate with `builder.toggleExpand()`
   - VisibilityCell - Switch/Eye icon variants
   - InlineNameEditor - Input with save/cancel
   - IconCell - Click to open IconPicker

3. **Table features**
   - Inline editing (name, icon)
   - Drag & drop reordering
   - Keyboard navigation
   - Touch gestures
   - ~~Context menus~~ (deferred - functionality already in action bar)

---

## 🗂️ File Structure

```text
app/admin/(product-menu)/menu-builder/
├── components/
│   ├── table-views/                    # NEW - Phase 2
│   │   ├── shared/                     # Reusable cells
│   │   │   ├── CheckboxCell.tsx
│   │   │   ├── ExpandToggle.tsx
│   │   │   ├── VisibilityCell.tsx
│   │   │   ├── InlineNameEditor.tsx
│   │   │   ├── IconCell.tsx
│   │   │   └── DragHandle.tsx         # Native HTML5 drag & drop
│   │   ├── MenuTableView.tsx           # Menu view (3 levels)
│   │   ├── LabelTableView.tsx          # Label view (2 levels)
│   │   ├── CategoryTableView.tsx       # Category view (products)
│   │   ├── AllLabelsTableView.tsx      # All-labels view (flat)
│   │   └── AllCategoriesTableView.tsx  # All-categories view (flat)
│   ├── menu-action-bar/                # EXISTING - Phase 1
│   │   ├── index.tsx                   # Action bar (done)
│   │   ├── AddLabelsDropdown.tsx       # (done)
│   │   ├── AddCategoriesDropdown.tsx   # (done)
│   │   ├── AddProductsDropdown.tsx     # (done)
│   │   └── DropdownContent.tsx         # Base dropdown (done)
│   ├── modals/                         # NEW - Phase 2+
│   │   ├── NewLabelModal.tsx           # Create new label (TODO)
│   │   ├── NewCategoryModal.tsx        # Create new category (TODO)
│   │   ├── SortModeDropdown.tsx        # Auto A-Z vs Manual (TODO)
│   │   └── SortOrderDropdown.tsx       # Manual, A-Z, Z-A, etc. (TODO)
│   ├── MenuNavBar.tsx                  # EXISTING - Phase 1
│   └── MenuSettingsDialog.tsx          # EXISTING - Phase 1
├── MenuBuilder.tsx                     # UPDATE - Add table views
└── MenuBuilderProvider.tsx             # EXISTING - No changes
```

---

## ⏸️ Deferred TODOs (Phase 2+)

### **Declarative Config Pattern (Avoiding Duplication)**

Instead of creating separate modal/dropdown components, we'll **extend action-bar-config.ts** with declarative configurations:

```typescript
// Add to action-bar-config.ts
// NOTE: code written here is for demo purposes only, DO NOT COPY & PASTE into production code

// ==================== UNIFIED VIEW CONFIGURATION ====================
// Single source of truth for all view-specific features
// Everything for a view lives together - no repeated keys across configs

// PATTERN: Keep action definitions separate, views reference them by ID
// This keeps the file manageable while maintaining single config structure

// ==================== ACTION DEFINITIONS (Shared) ====================
// Define each action once with its UI properties
// Views will reference these by ID and provide view-specific logic

export type ActionDefinition = {
  id: string;
  type: "button" | "combo" | "dropdown";
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd: string[];
  position: "left" | "right";
  comboWith?: string; // For combo buttons
};

export const ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  "new-label": {
    id: "new-label",
    type: "button",
    icon: Plus,
    label: "New Label",
    tooltip: "Add new label",
    kbd: [modKey, "N"],
    position: "left",
  },
  "new-category": {
    id: "new-category",
    type: "button",
    icon: Plus,
    label: "New Category",
    tooltip: "Add new category",
    kbd: [modKey, "Shift", "N"],
    position: "left",
  },
  clone: {
    id: "clone",
    type: "button",
    icon: Copy,
    label: "Clone",
    tooltip: "Duplicate selected items",
    kbd: [modKey, "D"],
    position: "left",
  },
  remove: {
    id: "remove",
    type: "button",
    icon: Trash,
    label: "Remove",
    tooltip: "Delete selected items",
    kbd: ["Delete"],
    position: "left",
  },
  visibility: {
    id: "visibility",
    type: "button",
    icon: Eye,
    label: "Toggle Visibility",
    tooltip: "Show/hide selected items",
    kbd: [modKey, "H"],
    position: "left",
  },
  "add-labels": {
    id: "add-labels",
    type: "dropdown",
    icon: Tags,
    label: "Add Labels",
    tooltip: "Attach labels to selected categories",
    kbd: [modKey, "L"],
    position: "left",
  },
  // ... etc for all actions
};

// ==================== CONTEXT MENU ACTIONS (Shared) ====================
// Define common context menu actions once, reuse across views

export type ContextMenuAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  kbd?: string[];
  isDanger?: boolean;
  separator?: boolean;
  execute: (row: unknown, context: ActionContext) => Promise<void>;
  isDisabled?: (row: unknown, context: ActionContext) => boolean;
  isVisible?: (row: unknown, context: ActionContext) => boolean;
};

// Shared context menu action definitions
export const CONTEXT_MENU_ACTIONS = {
  rename: (rowType: "label" | "category" | "product"): ContextMenuAction => ({
    id: "rename",
    label: "Rename",
    icon: Pencil,
    kbd: ["F2"],
    execute: async (row, { setEditingCell }) => {
      const id = (row as any).id;
      setEditingCell({ rowId: id, columnId: "name" });
    },
  }),
  duplicate: (rowType: "label" | "category"): ContextMenuAction => ({
    id: "duplicate",
    label: "Duplicate",
    icon: Copy,
    kbd: [modKey, "D"],
    execute: async (row, { mutations }) => {
      const id = (row as any).id;
      if (rowType === "label") {
        await mutations.cloneLabel(id);
      } else {
        await mutations.cloneCategory(id);
      }
    },
  }),
  toggleVisibility: (): ContextMenuAction => ({
    id: "toggle-visibility",
    label: "Toggle Visibility",
    icon: Eye,
    kbd: [modKey, "H"],
    execute: async (row, { mutations }) => {
      const item = row as any;
      if ("labelId" in item) {
        // It's a category
        await mutations.updateCategory(item.id, { isVisible: !item.isVisible });
      } else {
        // It's a label
        await mutations.updateLabel(item.id, { isVisible: !item.isVisible });
      }
    },
  }),
  remove: (rowType: "label" | "category" | "product"): ContextMenuAction => ({
    id: "remove",
    label: "Delete",
    icon: Trash2,
    kbd: ["Delete"],
    isDanger: true,
    separator: true,
    execute: async (row, { mutations }) => {
      const id = (row as any).id;
      if (rowType === "label") {
        await mutations.removeLabel(id);
      } else if (rowType === "category") {
        await mutations.removeCategory(id);
      } else {
        await mutations.removeProduct(id);
      }
    },
  }),
};

// ==================== VIEW CONFIGURATION ====================
// Compose views from shared action/menu definitions

export type ViewConfig = {
  // Table rendering
  tableComponent: React.ComponentType<TableViewProps>;
  getRowId: (row: unknown) => string;

  // Features
  supportsNesting?: boolean;
  supportsDragDrop?: boolean;

  // Action bar: Which actions are available + view-specific logic
  availableActions: string[]; // References to ACTION_DEFINITIONS
  actionExecutions?: Record<string, (context: ActionContext) => Promise<void>>;
  actionDisabled?: Record<string, (state: BuilderState) => boolean>;

  // Context menu: Compose from shared definitions
  contextMenuActions: ContextMenuAction[];

  // Future: columns, inline editing, keyboard shortcuts, etc.
  // columns?: ColumnConfig[];
  // inlineEditing?: InlineEditConfig;
};

export const VIEW_CONFIGS: Record<ProductMenuView, ViewConfig> = {
  menu: {
    tableComponent: MenuTableView,
    getRowId: (row) => (row as MenuRow).id,
    supportsNesting: true,
    supportsDragDrop: true,
    availableActions: ["new-label", "clone", "remove", "expand-all", "collapse-all", "undo", "redo"],
    contextMenuActions: [
      {
        id: "rename",
        label: "Rename",
        icon: Pencil,
        kbd: ["F2"],
        execute: async (row, { setEditingCell }) => {
          const menuRow = row as MenuRow;
          setEditingCell({ rowId: menuRow.id, columnId: "name" });
        },
      },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: Copy,
        kbd: [modKey, "D"],
        execute: async (row, { mutations }) => {
          const menuRow = row as MenuRow;
          if (menuRow.type === "label") {
            await mutations.cloneLabel(menuRow.id);
          } else if (menuRow.type === "category") {
            await mutations.cloneCategory(menuRow.id);
          }
        },
      },
      {
        id: "toggle-visibility",
        label: "Toggle Visibility",
        icon: Eye,
        kbd: [modKey, "H"],
        execute: async (row, { mutations }) => {
          const menuRow = row as MenuRow;
          if (menuRow.type === "label") {
            await mutations.updateLabel(menuRow.id, { isVisible: !menuRow.isVisible });
          } else if (menuRow.type === "category") {
            await mutations.updateCategory(menuRow.id, { isVisible: !menuRow.isVisible });
          }
        },
      },
      {
        id: "remove",
        label: "Remove",
        icon: Trash2,
        kbd: ["Delete"],
        isDanger: true,
        separator: true,
        execute: async (row, { mutations }) => {
          const menuRow = row as MenuRow;
          if (menuRow.type === "label") {
            await mutations.removeLabel(menuRow.id);
          } else if (menuRow.type === "category") {
            await mutations.removeCategory(menuRow.id);
          }
        },
      },
    ],
  },
  label: {
    tableComponent: LabelTableView,
    getRowId: (row) => (row as LabelRow).id,
    supportsNesting: true,
    supportsDragDrop: true,

    availableActions: [
      "new-category",
      "add-products",
      "sort-mode",
      "clone",
      "remove",
      "expand-all",
      "collapse-all",
      "undo",
      "redo",
    ],

    actionExecutions: {
      clone: async ({ selectedIds, mutations, categories }) => {
        // Only clone categories in label view
        for (const id of selectedIds) {
          const category = categories.find(c => c.id === id);
          if (category) await mutations.cloneCategory(id);
        }
      },
      // ... other action executions
    },

    contextMenuActions: [
    {
      id: "rename",
      label: "Rename",
      icon: Pencil,
      kbd: ["F2"],
      execute: async (row, { setEditingCell }) => {
        const labelRow = row as LabelRow;
        setEditingCell({ rowId: labelRow.id, columnId: "name" });
      },
      isVisible: (row) => (row as LabelRow).type === "category",
    },
    {
      id: "remove-product",
      label: "Remove from Category",
      icon: X,
      kbd: ["Delete"],
      execute: async (row, { mutations, currentCategoryId }) => {
        const labelRow = row as LabelRow;
        if (labelRow.type === "product" && currentCategoryId) {
          await mutations.removeProductFromCategory(currentCategoryId, labelRow.productId);
        }
      },
      isVisible: (row) => (row as LabelRow).type === "product",
    },
    {
      id: "delete",
      label: "Delete Category",
      icon: Trash2,
      isDanger: true,
      separator: true,
      execute: async (row, { mutations }) => {
        const labelRow = row as LabelRow;
        if (labelRow.type === "category") {
          await mutations.removeCategory(labelRow.id);
        }
      },
      isVisible: (row) => (row as LabelRow).type === "category",
    },
    ],
  },
  category: {
    tableComponent: CategoryTableView,
    getRowId: (row) => (row as CategoryRow).id,
    supportsNesting: false,
    supportsDragDrop: true,
    availableActions: ["add-products", "sort-order", "remove", "undo", "redo"],
    contextMenuActions: [
      {
        id: "remove-product",
        label: "Remove from Category",
        icon: X,
        kbd: ["Delete"],
        execute: async (row, { mutations, currentCategoryId }) => {
          const categoryRow = row as CategoryRow;
          if (currentCategoryId) {
            await mutations.removeProductFromCategory(currentCategoryId, categoryRow.productId);
          }
        },
      },
    ],
  },
  "all-labels": {
    tableComponent: AllLabelsTableView,
    getRowId: (row) => (row as Label).id,
    supportsNesting: false,
    supportsDragDrop: false,
    availableActions: ["new-label", "clone", "remove", "undo", "redo"],
    contextMenuActions: [
      {
        id: "rename",
        label: "Rename",
        icon: Pencil,
        kbd: ["F2"],
        execute: async (row, { setEditingCell }) => {
          const label = row as Label;
          setEditingCell({ rowId: label.id, columnId: "name" });
        },
      },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: Copy,
        kbd: [modKey, "D"],
        execute: async (row, { mutations }) => {
          const label = row as Label;
          await mutations.cloneLabel(label.id);
        },
      },
      {
        id: "toggle-visibility",
        label: "Toggle Visibility",
        icon: Eye,
        kbd: [modKey, "H"],
        execute: async (row, { mutations }) => {
          const label = row as Label;
          await mutations.updateLabel(label.id, { isVisible: !label.isVisible });
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        kbd: ["Delete"],
        isDanger: true,
        separator: true,
        execute: async (row, { mutations }) => {
          const label = row as Label;
          await mutations.removeLabel(label.id);
        },
      },
    ],
  },
  "all-categories": {
    tableComponent: AllCategoriesTableView,
    getRowId: (row) => (row as Category).id,
    supportsNesting: false,
    supportsDragDrop: false,
    contextMenuActionsnc (row, { mutations }) => {
        const label = row as Label;
        await mutations.removeLabel(label.id);
      },
    },
  ],
  "all-categories": [
    {
      id: "rename",
      label: "Rename",
      icon: Pencil,
      kbd: ["F2"],
      execute: async (row, { setEditingCell }) => {
        const category = row as Category;
        setEditingCell({ rowId: category.id, columnId: "name" });
      },
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: Copy,
      kbd: [modKey, "D"],
      execute: async (row, { mutations }) => {
        const category = row as Category;
        await mutations.cloneCategory(category.id);
      },
    },
    {
      id: "toggle-visibility",
      label: "Toggle Visibility",
      icon: Eye,
      kbd: [modKey, "H"],
      execute: async (row, { mutations }) => {
        const category = row as Category;
        await mutations.updateCategory(category.id, { isVisible: !category.isVisible });
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      kbd: ["Delete"],
      isDanger: true,
    ],
  }   separator: true,
      execute: async (row, { mutations }) => {
        const category = row as Category;
        await mutations.removeCategory(category.id);
      },
    },
  ],
};VIEW_CONFIGS } from "../../constants/action-bar-config";
import type { ProductMenuView } from "../../types";

type TableViewRendererProps = {
  view: ProductMenuView;
  // ... other props passed to table
};

export function TableViewRenderer({ view, ...props }: TableViewRendererProps) {
  const config = VIEW_CONFIGS[view];
  const TableComponent = config.tableComponent;

  return <Tablether props passed to table
};

export function TableViewRenderer({ view, ...props }: TableViewRendererProps) {
  const config = TABLE_VIEW_CONFIGS[view];
  const { Component } = config;

  return <Component {...props} />;
}

// Usage in MenuBuilderContent.tsx:
// Instead of:
// {view === "menu" && <MenuTableView />}
// {view === "label" && <LabelTableView />}
// {view === "category" && <CategoryTableView />}
// ...
//
// Just do:
// <TableViewRenderer view={view} />
```

### **Dynamic Modal Component:**

```tsx
// components/menu-action-bar/DynamicModal.tsx
// components/menu-action-bar/DynamicModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IconPicker } from "@/components/admin/IconPicker";
import type { ModalConfig } from "../../constants/action-bar-config";

type DynamicModalProps = {
  config: ModalConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DynamicModal({ config, open, onOpenChange }: DynamicModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await config.onSubmit(formData);
      if (result.ok) {
        onOpenChange(false);
        toast.success(`${config.title} created successfully`);
      } else {
        toast.error(result.error || "Failed to create");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          {config.description && <p className="text-sm text-muted-foreground">{config.description}</p>}
        </DialogHeader>

        <div className="space-y-4">
          {config.fields.map((field) => {
            switch (field.type) {
              case "text":
                return (
                  <div key={field.name}>
                    <label className="text-sm font-medium">{field.label}</label>
                    <Input
                      value={formData[field.name] as string || ""}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  </div>
                );
              case "icon":
                return (
                  <div key={field.name}>
                    <label className="text-sm font-medium">{field.label}</label>
                    <IconPicker
                      currentIcon={formData[field.name] as string | null}
                      onSave={(icon) => setFormData({ ...formData, [field.name]: icon })}
                    />
                  </div>
                );
              case "switch":
                return (
                  <div key={field.name} className="flex items-center justify-between">
                    <label className="text-sm font-medium">{field.label}</label>
                    <Switch
                      checked={formData[field.name] as boolean ?? field.defaultValue}
                      onCheckedChange={(checked) => setFormData({ ...formData, [field.name]: checked })}
                    />
                  </div>
                );
            }
     Single Table Renderer** - `TableViewRenderer` picks correct table based on config
4. **Single Context Menu Component** - `ContextMenuCell` renders view-specific actions from config
5. **All Config in One Place** - action-bar-config.ts has EVERYTHING (modals, dropdowns, tables, context menus, actions)
6. **Easy to Extend** - Add new view? Just add to `TABLE_VIEW_CONFIGS` and `CONTEXT_MENU_CONFIGS`
7. **Type Safe** - Full TypeScript types for all configs
8. **Testable** - Test config structure, not individual components
9. **Zero Conditionals** - No switch statements anywhere in component code
          {isLoading ? "Creating..." : config.submitLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

// NOTE: Dropdown components and content structure to be designed during Phase 2.5
// Content should be created at DropdownActionButton level, not here

### **Update action-bar-config.ts onClick Handlers:**

```typescript
// In action-bar-config.ts, update TODO items:

{
  id: "new-label",
  type: "button",
  icon: Plus,
  label: "New Label",
  tooltip: "Add new label",
  kbd: [modKey, "N"],
  position: "left",
  disabled: () => false,
  onClick: async ({ mutations, setEditingCell }) => {
    // Create label with placeholder name
    const result = await mutations.createLabel({
      name: "New Label",
      icon: null,
      isVisible: true,
    });

    if (result.ok && result.data) {
      // Auto-focus inline editor on the new label
      setEditingCell({ rowId: result.data.id, columnId: "name" });
    }
  },
},

{
  id: "new-category",
  type: "button",
  icon: Plus,
  label: "New Category",
  tooltip: "Add new category",
  kbd: [modKey, "Shift", "N"],
  position: "left",
  disabled: () => false,
  onClick: async ({ mutations, setEditingCell, currentLabelId }) => {
    if (!currentLabelId) return;

    // Create category with placeholder name
    const result = await mutations.createCategory({
      labelId: currentLabelId,
      name: "New Category",
      isVisible: true,
    });

    if (result.ok && result.data) {
      // Auto-focus inline editor on the new category
      setEditingCell({ rowId: result.data.id, columnId: "name" });
    }
  },
},

// Note: Dropdown actions don't need onClick handlers
// Content/options built directly in DropdownActionButton component
{
  id: "sort-mode",
  type: "dropdown",
  icon: ArrowUpDown,
  label: "Sort Mode",
  tooltip: "Category ordering mode",
  kbd: [modKey, "R"],
  position: "left",
  disabled: () => false,
  // No onClick - dropdown logic in DropdownActionButton
},
```

### **Benefits of This Approach:**

1. **Single Dropdown Component** - `DynamicDropdown` renders any options based on config
2. **ll Config in One Place** - action-bar-config.ts has modals, dropdowns, and actions
3. **Type Safe** - Full TypeScript types for all configs
4. **Testable** - Test config structure, not individual components

### **What's Currently in action-bar-config.ts as TODOs:**

1. **Clone Execute Logic** (3 TODOs)
   - `menu` view: Clone labels with all categories
   - `all-labels` view: Clone labels
   - `all-categories` view: Clone categories
   - **Why deferred:** Need server actions that don't exist yet (`cloneLabel`, `cloneCategory`)
   - **When to implement:** After table views are working, create server actions then wire up

2. **New Label/Category Actions** (3 TODOs)
   - `menu` view: New Label button
   - `all-labels` view: New Label button
   - `all-categories` view: New Category button
   - **Why deferred:** Should add a new item onto the table view in context
   - **When to implement:** After each table view being completed

3. **Sort Dropdowns** (2 TODOs)
   - `label` view: Sort Mode dropdown (Auto A-Z vs Manual)
   - `category` view: Sort Order dropdown (Manual, A-Z, Z-A, Added First/Last)
   - **Why deferred:** Sorting is visual in tables, should implement with table views
   - **When to implement:** During table views implementation (Week 2-3)

### **Implementation Order:**

**Phase 2 (Current):** Table views with existing functionality

- ✅ Inline editing (name, icon)
- ✅ Visibility toggles
- ✅ Selection + action bar integration
- ✅ Drag & drop reordering
- ✅ Context menus
- ✅ Keyboard navigation

**Phase 2.5 (Sort Dropdowns):** ~2 days

- Build SortModeDropdown component (Auto A-Z toggle for labels)
- Build SortOrderDropdown component (ordering options for categories)
- Wire up to action-bar-config.ts onClick handlers
- Implement sorting mutations (updateLabel autoOrder, reorder products)

**Phase 3 (Clone):** ~1 week

- Create server actions: `cloneLabel`, `cloneCategory`
- Implement clone execute logic in action-bar-config.ts
- Add "Copy" suffix logic with collision detection
- Test modal + clone workflows

### **Current State:**

All TODOs have placeholder `console.log` statements so buttons work without errors. They'll be implemented when table views are complete and we have the full context.

---

## � Table Column Specifications

Each view has a specific set of columns optimized for its purpose. All views start with a checkbox column for bulk selection.

### **Menu View**

| Column     | Width  | Type         | Description                                       |
| ---------- | ------ | ------------ | ------------------------------------------------- |
| Checkbox   | `w-6`  | Selection    | Bulk select labels, categories, products          |
| Labels     | Flex   | Hierarchical | Label/category/product names with expand/collapse |
| Visibility | Center | Icon/Switch  | Switch for labels, icon for nested items          |
| Categories | Center | Count        | Number of categories in label                     |
| Products   | Center | Count        | Number of products in category                    |

**Row Types:**

- **Label rows**: Show expand toggle, Tags icon, name, visibility switch, category count, product count
- **Category rows** (indented 24px): Show expand toggle, FileSpreadsheet icon, name, visibility icon, product count
- **Product rows** (indented 48px): Show name only, visibility icon

---

### **Label View**

| Column     | Width  | Type         | Description                                                 |
| ---------- | ------ | ------------ | ----------------------------------------------------------- |
| Checkbox   | `w-6`  | Selection    | Bulk select categories and products                         |
| Categories | Flex   | Hierarchical | Category/product names with expand/collapse                 |
| Visibility | Center | Icon         | Eye/EyeOff icons (read-only, categories inherit from label) |
| Products   | Center | Count        | Number of products in category                              |

**Row Types:**

- **Category rows**: Show expand toggle, FileSpreadsheet icon, name, visibility icon, product count
- **Product rows** (indented 24px): Show name only, visibility icon

---

### **Category View**

| Column              | Width  | Type      | Description                                                  |
| ------------------- | ------ | --------- | ------------------------------------------------------------ |
| Checkbox            | `w-6`  | Selection | Bulk select products                                         |
| Products            | Flex   | Flat      | Product names (all products, not just assigned)              |
| Visibility          | Center | Icon      | Eye/EyeOff icon (shows product's global visibility)          |
| Added in categories | Center | List      | Comma-separated list of category names where product appears |

**Row Types:**

- **Product rows**: Show product name, visibility icon, list of categories it belongs to

---

### **All Labels View**

| Column     | Width  | Type        | Description                                 |
| ---------- | ------ | ----------- | ------------------------------------------- |
| Checkbox   | `w-6`  | Selection   | Bulk select labels                          |
| Icon       | `w-12` | Interactive | Label icon (click to edit via IconPicker)   |
| Name       | Flex   | Editable    | Label name with inline editor               |
| Categories | Center | Count       | Number of categories attached to this label |
| Visibility | Center | Switch      | Toggle label visibility                     |

**Row Types:**

- **Label rows**: Show icon picker, inline name editor, category count, visibility switch

---

### **All Categories View**

| Column     | Width  | Type      | Description                                             |
| ---------- | ------ | --------- | ------------------------------------------------------- |
| Checkbox   | `w-6`  | Selection | Bulk select categories                                  |
| Name       | Flex   | Editable  | Category name with inline editor                        |
| Labels     | Auto   | List      | Comma-separated list of labels this category belongs to |
| Products   | Auto   | Count     | Number of products assigned to category                 |
| Visibility | Center | Switch    | Toggle category visibility                              |

**Row Types:**

- **Category rows**: Show inline name editor, label names, visibility switch

---

### **Column Component Mapping**

| Column Type         | Component                         | Variants                                       |
| ------------------- | --------------------------------- | ---------------------------------------------- |
| Checkbox            | `CheckboxCell`                    | Standard checkbox with selection state         |
| Icon                | `IconCell`                        | Clickable icon that opens IconPicker dialog    |
| Name (editable)     | `InlineNameEditor`                | Text with click-to-edit, Enter/Escape handling |
| Name (hierarchical) | Inline with `ExpandToggle`        | Text with expand/collapse chevron              |
| Visibility (switch) | `VisibilityCell` variant="switch" | Interactive toggle                             |
| Visibility (icon)   | `VisibilityCell` variant="icon"   | Read-only Eye/EyeOff                           |
| Count               | Text cell                         | Center-aligned number                          |
| List                | Text cell                         | Comma-separated strings                        |

---

## �📝 Detailed Implementation Plan

### **Phase 2A: Shared Components (Week 1)**

#### **1. CheckboxCell Component**

```tsx
// components/table-views/shared/CheckboxCell.tsx
type CheckboxCellProps = {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
};

export function CheckboxCell({ id, checked, onToggle, disabled }: CheckboxCellProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => onToggle(id)}
      disabled={disabled}
      aria-label={`Select ${id}`}
    />
  );
}
```

**Integration:**

```tsx
const { builder } = useMenuBuilder();
<CheckboxCell
  id={label.id}
  checked={builder.selectedIds.includes(label.id)}
  onToggle={builder.toggleSelection}
/>;
```

#### **2. ExpandToggle Component**

```tsx
// components/table-views/shared/ExpandToggle.tsx
type ExpandToggleProps = {
  id: string;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: (id: string) => void;
};

export function ExpandToggle({ id, isExpanded, hasChildren, onToggle }: ExpandToggleProps) {
  if (!hasChildren) return <div className="w-4" />;

  return (
    <Button variant="ghost" size="sm" className="w-4 h-4 p-0" onClick={() => onToggle(id)}>
      {isExpanded ? <ChevronDown /> : <ChevronRight />}
    </Button>
  );
}
```

**Integration:**

```tsx
const { builder } = useMenuBuilder();
<ExpandToggle
  id={label.id}
  isExpanded={builder.expandedIds.includes(label.id)}
  hasChildren={label.categories.length > 0}
  onToggle={builder.toggleExpand}
/>;
```

#### **3. VisibilityCell Component**

```tsx
// components/table-views/shared/VisibilityCell.tsx
type VisibilityCellProps = {
  id: string;
  isVisible: boolean;
  variant: "switch" | "icon";
  onToggle?: (id: string, visible: boolean) => Promise<void>;
  disabled?: boolean;
};

export function VisibilityCell({
  id,
  isVisible,
  variant,
  onToggle,
  disabled,
}: VisibilityCellProps) {
  if (variant === "icon") {
    return isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />;
  }

  return (
    <Switch
      checked={isVisible}
      onCheckedChange={(checked) => onToggle?.(id, checked)}
      disabled={disabled}
    />
  );
}
```

**Integration:**

```tsx
const { updateLabel } = useMenuBuilder();
<VisibilityCell
  id={label.id}
  isVisible={label.isVisible}
  variant="switch"
  onToggle={async (id, visible) => {
    await updateLabel(id, { isVisible: visible });
  }}
/>;
```

#### **4. InlineNameEditor Component**

```tsx
// components/table-views/shared/InlineNameEditor.tsx
type InlineNameEditorProps = {
  id: string;
  initialValue: string;
  onSave: (id: string, name: string) => Promise<void>;
};

export function InlineNameEditor({ id, initialValue, onSave }: InlineNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(id, value);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button onClick={() => setIsEditing(true)} className="text-left hover:underline">
        {value}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        autoFocus
        disabled={isLoading}
      />
      <Button size="sm" onClick={handleSave} disabled={isLoading}>
        <Check className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

**Integration:**

```tsx
const { updateLabel } = useMenuBuilder();
<InlineNameEditor
  id={label.id}
  initialValue={label.name}
  onSave={async (id, name) => {
    await updateLabel(id, { name });
  }}
/>;
```

#### **5. IconCell Component**

```tsx
// components/table-views/shared/IconCell.tsx
type IconCellProps = {
  id: string;
  iconName: string | null;
  onSave: (id: string, iconName: string | null) => Promise<void>;
};

export function IconCell({ id, iconName, onSave }: IconCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="hover:bg-muted rounded p-1">
        {iconName ? (
          <DynamicIcon name={iconName} className="w-5 h-5" />
        ) : (
          <span className="text-muted-foreground text-xs">None</span>
        )}
      </button>

      <IconPickerDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        currentIcon={iconName}
        onSave={async (newIcon) => {
          await onSave(id, newIcon);
          setIsOpen(false);
        }}
      />
    </>
  );
}
```

---

### **Phase 2B: Simple Tables (Week 2)**

#### **6. AllLabelsTableView Component**

**Purpose:** Flat list of all labels with inline editing and visibility toggles.

**Columns:** `checkbox | Icon | Name | Categories | Visibility`

```tsx
// components/table-views/AllLabelsTableView.tsx
export function AllLabelsTableView() {
  const { builder, labels, updateLabel } = useMenuBuilder();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox /> {/* Select all */}
          </TableHead>
          <TableHead className="w-12">Icon</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Categories</TableHead>
          <TableHead className="w-24">Visibility</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {labels.map((label) => (
          <TableRow key={label.id}>
            <TableCell>
              <CheckboxCell
                id={label.id}
                checked={builder.selectedIds.includes(label.id)}
                onToggle={builder.toggleSelection}
              />
            </TableCell>
            <TableCell>
              <IconCell
                id={label.id}
                iconName={label.icon}
                onSave={async (id, icon) => {
                  await updateLabel(id, { icon });
                }}
              />
            </TableCell>
            <TableCell>
              <InlineNameEditor
                id={label.id}
                initialValue={label.name}
                onSave={async (id, name) => {
                  await updateLabel(id, { name });
                }}
              />
            </TableCell>
            <TableCell>{label.categories.length}</TableCell>
            <TableCell>
              <VisibilityCell
                id={label.id}
                isVisible={label.isVisible}
                variant="switch"
                onToggle={async (id, visible) => {
                  await updateLabel(id, { isVisible: visible });
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Action Bar Integration:** Already works! Action bar reads `builder.currentView` and enables/disables buttons based on config.

#### **7. AllCategoriesTableView Component**

**Purpose:** Flat list of all categories with inline editing and visibility toggles.

**Columns:** `checkbox | Name | Labels | Visibility`

```tsx
// components/table-views/AllCategoriesTableView.tsx
export function AllCategoriesTableView() {
  const { builder, categories, labels, updateCategory } = useMenuBuilder();

  // Helper to get label names for a category
  const getLabelNames = (categoryId: string) => {
    return labels
      .filter((label) => label.categories.some((c) => c.id === categoryId))
      .map((label) => label.name)
      .join(", ");
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox /> {/* Select all */}
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Labels</TableHead>
          <TableHead className="w-24">Visibility</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>
              <CheckboxCell
                id={category.id}
                checked={builder.selectedIds.includes(category.id)}
                onToggle={builder.toggleSelection}
              />
            </TableCell>
            <TableCell>
              <InlineNameEditor
                id={category.id}
                initialValue={category.name}
                onSave={async (id, name) => {
                  await updateCategory(id, { name });
                }}
              />
            </TableCell>
            <TableCell>{getLabelNames(category.id)}</TableCell>
            <TableCell>
              <VisibilityCell
                id={category.id}
                isVisible={category.isVisible}
                variant="switch"
                onToggle={async (id, visible) => {
                  await updateCategory(id, { isVisible: visible });
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### **Phase 2C: Hierarchical Tables (Week 3-4)**

#### **8. MenuTableView Component**

**Purpose:** 3-level hierarchy (labels → categories → products) with expand/collapse.

**Columns:** `checkbox | Labels | Visibility | Categories | Products`

```tsx
// components/table-views/MenuTableView.tsx
export function MenuTableView() {
  const { builder, labels } = useMenuBuilder();

  const visibleLabels = labels.filter((label) => label.isVisible);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox /> {/* Select all */}
          </TableHead>
          <TableHead>Labels</TableHead>
          <TableHead className="w-24">Visibility</TableHead>
          <TableHead>Categories</TableHead>
          <TableHead>Products</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleLabels.map((label) => (
          <React.Fragment key={label.id}>
            {/* Label row */}
            <LabelRow label={label} />

            {/* Category rows (if expanded) */}
            {builder.expandedIds.includes(label.id) &&
              label.categories.map((category) => (
                <React.Fragment key={category.id}>
                  <CategoryRow category={category} indent={1} />

                  {/* Product rows (if category expanded) */}
                  {builder.expandedIds.includes(category.id) &&
                    category.products.map((product) => (
                      <ProductRow key={product.id} product={product} indent={2} />
                    ))}
                </React.Fragment>
              ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

function LabelRow({ label }: { label: MenuLabel }) {
  const { builder, updateLabel } = useMenuBuilder();

  return (
    <TableRow>
      <TableCell>
        <CheckboxCell
          id={label.id}
          checked={builder.selectedIds.includes(label.id)}
          onToggle={builder.toggleSelection}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ExpandToggle
            id={label.id}
            isExpanded={builder.expandedIds.includes(label.id)}
            hasChildren={label.categories.length > 0}
            onToggle={builder.toggleExpand}
          />
          <span>{label.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <VisibilityCell
          id={label.id}
          isVisible={label.isVisible}
          variant="switch"
          onToggle={async (id, visible) => {
            await updateLabel(id, { isVisible: visible });
          }}
        />
      </TableCell>
      <TableCell>{label.categories.length}</TableCell>
      <TableCell>-</TableCell>
    </TableRow>
  );
}

function CategoryRow({ category, indent }: { category: MenuCategory; indent: number }) {
  const { builder } = useMenuBuilder();

  return (
    <TableRow>
      <TableCell>
        <CheckboxCell
          id={category.id}
          checked={builder.selectedIds.includes(category.id)}
          onToggle={builder.toggleSelection}
        />
      </TableCell>
      <TableCell style={{ paddingLeft: `${indent * 24}px` }}>
        <div className="flex items-center gap-2">
          <ExpandToggle
            id={category.id}
            isExpanded={builder.expandedIds.includes(category.id)}
            hasChildren={category.products?.length > 0}
            onToggle={builder.toggleExpand}
          />
          <span>{category.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <VisibilityCell id={category.id} isVisible={category.isVisible} variant="icon" />
      </TableCell>
      <TableCell>-</TableCell>
      <TableCell>{category.products?.length || 0}</TableCell>
    </TableRow>
  );
}

function ProductRow({ product, indent }: { product: MenuProduct; indent: number }) {
  const { builder } = useMenuBuilder();

  return (
    <TableRow>
      <TableCell>
        <CheckboxCell
          id={product.id}
          checked={builder.selectedIds.includes(product.id)}
          onToggle={builder.toggleSelection}
        />
      </TableCell>
      <TableCell style={{ paddingLeft: `${indent * 24}px` }}>{product.name}</TableCell>
      <TableCell>
        <VisibilityCell id={product.id} isVisible={product.isVisible} variant="icon" />
      </TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
    </TableRow>
  );
}
```

#### **9. LabelTableView Component**

**Purpose:** 2-level hierarchy (categories → products) for a specific label.

**Columns:** `checkbox | Categories | Visibility | Products`

Similar pattern to MenuTableView but starts at category level.

#### **10. CategoryTableView Component**

**Purpose:** Show all products with assignment indicators for a specific category.

**Columns:** `checkbox | Products | Visibility | Added in Categories`

Shows ALL products (not just assigned). Categories column shows where product appears elsewhere.

---

### **Phase 2D: Update MenuBuilder.tsx**

```tsx
// MenuBuilder.tsx
function MenuBuilderContent() {
  const { builder } = useMenuBuilder();

  // ... existing nav/action bar ...

  {
    /* Render appropriate table view */
  }
  {
    builder.currentView === "menu" && <MenuTableView />;
  }
  {
    builder.currentView === "label" && <LabelTableView />;
  }
  {
    builder.currentView === "category" && <CategoryTableView />;
  }
  {
    builder.currentView === "all-labels" && <AllLabelsTableView />;
  }
  {
    builder.currentView === "all-categories" && <AllCategoriesTableView />;
  }
}
```

---

## 🖱️ Drag & Drop Integration

### **Native HTML5 Approach**

Following the pattern from LabelsTable.tsx - proven and working.

**Why Native HTML5:**

- ✅ Zero bundle size
- ✅ Already working in LabelsTable
- ✅ Simple 3-handler pattern
- ⚠️ No touch support (acceptable for MVP)
- ⚠️ No keyboard DnD (can upgrade to @dnd-kit later)

### **DragHandle Component**

```tsx
// components/table-views/shared/DragHandle.tsx
import { GripVertical } from "lucide-react";

type DragHandleProps = {
  onDragStart: (e: React.DragEvent) => void;
};

export function DragHandle({ onDragStart }: DragHandleProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1"
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
```

### **Drag State Management**

```tsx
// In table component
const [draggedId, setDraggedId] = useState<string | null>(null);

const handleDragStart = (id: string) => {
  setDraggedId(id);
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault(); // Required for drop to work
};

const handleDrop = async (targetId: string) => {
  if (!draggedId || draggedId === targetId) {
    setDraggedId(null);
    return;
  }

  // Reorder logic
  const dragIndex = items.findIndex((i) => i.id === draggedId);
  const dropIndex = items.findIndex((i) => i.id === targetId);

  const reordered = [...items];
  const [removed] = reordered.splice(dragIndex, 1);
  reordered.splice(dropIndex, 0, removed);

  // Update order field
  const updates = reordered.map((item, index) => ({
    id: item.id,
    order: index,
  }));

  // Optimistic update
  await reorderMutation(updates);

  setDraggedId(null);
};
```

### **Integration in Table Rows**

```tsx
<TableRow
  onDragOver={handleDragOver}
  onDrop={() => handleDrop(label.id)}
  className={draggedId === label.id ? "opacity-50" : ""}
>
  <TableCell>
    <DragHandle onDragStart={() => handleDragStart(label.id)} />
  </TableCell>
  {/* Other cells */}
</TableRow>
```

### **Reorder Operations by View**

**Menu View:**

- Reorder labels → Updates `CategoryLabel.order`
- Reorder categories within label → Updates `CategoryLabelCategory.order`
- Reorder products within category → Updates `CategoriesOnProducts.order`

**All-Labels View:**

- Reorder labels globally → Updates `CategoryLabel.order`

**All-Categories View:**

- Cannot reorder (categories belong to different labels)

**Label View:**

- Reorder categories for this label → Updates `CategoryLabelCategory.order`

**Category View:**

- Reorder products for this category → Updates `CategoriesOnProducts.order`

---

## 🚧 Deferred Features (Future Enhancement)

### **Context Menus (If Time Permits)**

**Rationale for deferring:** All context menu functionality (rename, duplicate, delete, toggle visibility) is already available via the action bar with keyboard shortcuts. Context menus would be a UX enhancement but not essential for MVP.

**If implemented later:**

- Right-click + long-press support for quick actions
- Per-row context menu component
- View-specific menu items
- See archived sections below for implementation reference

---

## 📱 Mobile & Touch Considerations

### **Always-Visible Checkboxes**

Checkbox visibility is responsive:

- **Mobile/sm**: checkboxes are always visible.
- **md+**: checkboxes are shown on row hover/focus, and always visible when selected.

```tsx
// Responsive: always visible on mobile; hover-reveal on md+
<TableCell className="w-12">
  <CheckboxCell
    id={item.id}
    checked={builder.selectedIds.includes(item.id)}
    onToggle={builder.toggleSelection}
  />
</TableCell>
```

### **Touch-Friendly Targets**

Ensure all interactive elements meet 44x44px minimum touch target:

```tsx
// Button sizes
<Button size="icon" className="h-10 w-10"> {/* 40px minimum */}

// Checkbox larger on mobile
<Checkbox className="h-5 w-5 md:h-4 md:w-4" />

// Table row padding
<TableRow className="h-12 md:h-10"> {/* More padding on mobile */}
```

### **No Drag & Drop on Mobile**

Drag handle hidden on touch devices:

```tsx
<TableCell className="hidden md:table-cell">
  <DragHandle onDragStart={() => handleDragStart(item.id)} />
</TableCell>
```

**Alternative:** Add "Reorder Mode" button that shows up/down arrows on mobile (future enhancement).

### **Responsive Table Layout**

```tsx
// Stack columns on small screens
<div className="overflow-x-auto">
  <Table className="min-w-[600px]">
    {" "}
    {/* Force horizontal scroll on mobile */}
    {/* Table content */}
  </Table>
</div>
```

Or use responsive columns:

```tsx
// Hide less important columns on mobile
<TableHead className="hidden md:table-cell">Categories</TableHead>
<TableHead className="hidden lg:table-cell">Products</TableHead>
```

### **Mobile Keyboard**

Auto-focus and proper input types:

```tsx
<Input
  type="text"
  autoFocus
  autoComplete="off"
  autoCapitalize="words" // For names
  enterKeyHint="done" // Shows "Done" on mobile keyboard
/>
```

---

## ⌨️ Keyboard Navigation

### **Arrow Key Navigation**

```tsx
// In table component
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedIndex) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowRight":
        if (builder.expandedIds.includes(currentItemId)) {
          // Already expanded, move to first child
          moveFocus(1);
        } else {
          // Expand
          builder.toggleExpand(currentItemId);
        }
        break;
      case "ArrowLeft":
        if (builder.expandedIds.includes(currentItemId)) {
          // Collapse
          builder.toggleExpand(currentItemId);
        } else {
          // Move to parent
          moveFocusToParent();
        }
        break;
      case "Enter":
      case "F2":
        startInlineEdit(currentItemId);
        break;
      case "Space":
        e.preventDefault();
        builder.toggleSelection(currentItemId);
        break;
      case "Escape":
        builder.clearSelection();
        break;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [selectedIndex, currentItemId, builder]);
```

### **Focus Management**

```tsx
// Track focused row
const [focusedIndex, setFocusedIndex] = useState(0);
const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

const moveFocus = (delta: number) => {
  const newIndex = focusedIndex + delta;
  if (newIndex >= 0 && newIndex < items.length) {
    setFocusedIndex(newIndex);
    rowRefs.current[newIndex]?.focus();
  }
};

// Make rows focusable
<TableRow
  ref={(el) => (rowRefs.current[index] = el)}
  tabIndex={0}
  onFocus={() => setFocusedIndex(index)}
  className={focusedIndex === index ? "ring-2 ring-primary" : ""}
>
```

### **Inline Edit Keyboard Shortcuts**

Already handled in InlineNameEditor:

- `Enter` → Save
- `Escape` → Cancel
- Auto-focus input when entering edit mode

---

## 🧪 Testing Strategy

### **Unit Tests**

1. **Shared Components**
   - CheckboxCell: Toggle callback fires with correct ID
   - ExpandToggle: Shows correct icon, fires callback
   - VisibilityCell: Switch variant vs icon variant
   - InlineNameEditor: Save/cancel, Enter/Escape keys
   - IconCell: Opens picker, saves selection

2. **Table Views**
   - AllLabelsTableView: Renders all labels, integrates with builder
   - AllCategoriesTableView: Renders all categories, shows label names
   - MenuTableView: Hierarchical rendering, expand/collapse
   - LabelTableView: Shows categories for specific label
   - CategoryTableView: Shows all products with assignment status

### **Integration Tests**

1. **Selection Flow**
   - Select item → action bar button enabled
   - Execute action → mutation called with correct IDs
   - Clear selection → button disabled

2. **Inline Edit Flow**
   - Click name → edit mode
   - Save → mutation called, UI updates
   - Cancel → reverts to original value

3. **Expand/Collapse Flow**
   - Click chevron → expand
   - Click again → collapse
   - Expand All button → all items expanded

---

## ⚡ Performance Considerations

1. **Large Lists**
   - Use React.memo for row components
   - Virtual scrolling if > 100 items (react-virtual)
   - Debounce inline edit saves

2. **Optimistic Updates**
   - Update UI immediately
   - Revert on error
   - Show loading states

3. **Memoization**
   - Memoize filtered/sorted data
   - Memoize row render functions
   - Use React Compiler optimizations

---

## 🎯 Success Criteria

### **Phase 2A Complete**

- ✅ All 5 shared components built and tested
- ✅ Components integrate with useMenuBuilder()
- ✅ Inline editing works
- ✅ Visibility toggles work

### **Phase 2B Complete**

- ✅ AllLabelsTableView fully functional
- ✅ AllCategoriesTableView fully functional
- ✅ Action bar integration verified
- ✅ Selection state persists

### **Phase 2C Complete**

- ✅ MenuTableView with 3-level hierarchy
- ✅ LabelTableView with 2-level hierarchy
- ✅ CategoryTableView with product assignment
- ✅ Expand/collapse works correctly

### **Phase 2D Complete**

- ✅ MenuBuilder.tsx renders correct view
- ✅ All views accessible via navigation
- ✅ No regressions in existing features
- ✅ Keyboard navigation works across all views
- ✅ Mobile touch interactions work
- ✅ Responsive layout adapts correctly
- ✅ Drag & drop reordering works

---

## 📦 Dependencies

### **Already Installed**

- shadcn/ui components (table, input, button, checkbox, switch)
- Lucide icons (Eye, EyeOff, Check, X, ChevronDown, ChevronRight, GripVertical, Pencil)
- SWR for data fetching

### **Need to Add**

- IconPicker component (reuse from LabelsTable)
- DynamicIcon component (reuse from existing)

---

## 🚫 What NOT to Change

1. **action-bar-config.ts** - Already complete with all execute logic
2. **MenuBuilderProvider** - Already provides everything we need
3. **dropdown-registry.ts** - Dropdowns already wired up
4. **MenuNavBar** - Navigation already works
5. **Test files** - 72 tests passing, don't break them

---

## 📅 Timeline Estimate (Updated)

**Week 1 (5 days):**

- Day 1-2: Shared components (CheckboxCell, ExpandToggle, VisibilityCell)
- Day 3: InlineNameEditor, IconCell
- Day 4: DragHandle component
- Day 5: Keyboard navigation hooks, test shared components

**Week 2 (5 days):**

- Day 1-2: AllLabelsTableView with drag & drop
- Day 3-4: AllCategoriesTableView with drag & drop
- Day 5: Integration testing + mobile touch testing

**Week 3 (5 days):**

- Day 1-3: MenuTableView (most complex) with hierarchical drag & drop
- Day 4: LabelTableView with drag & drop
- Day 5: CategoryTableView

**Week 4 (5 days):**

- Day 1: Update MenuBuilder.tsx, wire everything up
- Day 2: Keyboard navigation polish across all views
- Day 3: Mobile responsiveness and touch interactions
- Day 4: Performance optimization, edge cases
- Day 5: Final testing, documentation

**Future Enhancement (if time permits):**

- Context menus (right-click + long-press) - All functionality already available via action bar, this would be UX enhancement only

**Total:** ~20 working days (4 weeks)

**Note:** Added 2 shared components (DragHandle, ContextMenuCell) and 3 additional concerns (keyboard nav, mobile touch, responsive) - still fits in 4 weeks by combining tasks.

---

## 🔄 Iteration Strategy

### **Build → Test → Integrate**

1. Build shared component
2. Test in isolation
3. Integrate into simplest table (AllLabelsTableView)
4. Verify action bar still works
5. Move to next component

### **Start Simple → Add Complexity**

1. AllLabelsTableView (flat, no hierarchy)
2. AllCategoriesTableView (flat, similar)
3. LabelTableView (2 levels)
4. CategoryTableView (product assignment)
5. MenuTableView (3 levels, most complex)

---

## 💡 Key Insights

1. **Zero changes to action bar** - Already view-aware
2. **Zero changes to provider** - Already has all data/mutations
3. **Zero changes to navigation** - Already handles routing
4. **Build UI only** - All logic already exists

**This is the power of our architecture:**

- Declarative config
- Single source of truth
- View-driven execution
- Clean separation of concerns

---

## 📖 Next Steps

1. **Review this plan** - Confirm approach
2. **Start with shared components** - Build foundation
3. **Test incrementally** - Don't wait until the end
4. **Document as we go** - Update specs with learnings

---

**Ready to start Week 1?** 🚀

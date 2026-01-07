# All-Categories Table View - Implementation Plan

**Status:** Ready for Confirmation  
**Approach:** Option 1 (Recommended) - Extend current structure  
**Tech Stack:** TanStack React Table + shadcn Data Table  
**Reference:** mock2 styles

---

## 🎯 Architecture Decision

### **Keep Existing + Add New**

```text
action-bar-config.ts (UNCHANGED)
  ├─ SHARED_ACTIONS
  ├─ ACTION_BAR_CONFIG["all-categories"] = [actions array]
  └─ Already has button icons, labels, positions, onClick handlers

view-configs.ts (NEW)
  └─ VIEW_CONFIGS["all-categories"] = {
       tableComponent: AllCategoriesTableView,
       supportsNesting: false,
       supportsDragDrop: false,
       actionIds: ["new-category", "clone", "remove", "visibility", "undo", "redo"],
       contextMenuActions: [...],
     }
```

**Action bar continues working as-is** - no migration needed!

---

## 📋 All-Categories Table Spec (from mock2)

### **Columns**

| Column     | Width | Content                                            | Alignment |
| ---------- | ----- | -------------------------------------------------- | --------- |
| Checkbox   | `w-6` | Selection checkbox                                 | Center    |
| Name       | Flex  | FileSpreadsheet icon + name + Pencil icon          | Left      |
| Labels     | Auto  | Comma-separated list of labels category belongs to | Center    |
| Visibility | Auto  | Switch component                                   | Center    |

### **Styles (from mock2)**

```tsx
// Header row
<tr className="h-10 bg-muted/40 border-b">
  <td className="w-6 p-2"> {/* Checkbox */}
  <td className="text-sm font-medium pl-2 pr-4 truncate max-w-0"> {/* Name */}
  <td className="text-sm font-medium px-4 truncate max-w-0 text-center"> {/* Labels */}
  <td className="text-sm font-medium px-4 truncate max-w-0 text-center"> {/* Visibility */}

// Data row
<tr className="h-10 hover:bg-muted/40">
  <td className="w-6 p-2">
    <input type="checkbox" className="w-4 h-4 accent-foreground" />

  <td>
    <div className="flex items-center gap-2 text-sm pl-2 pr-4">
      <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
      <span className="italic text-muted-foreground">category1...</span>
      <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
    </div>

  <td className="text-sm px-4 text-center">
    1 {/* Label count */}

  <td className="text-sm px-4">
    <div className="flex justify-center">
      <Switch defaultChecked />
    </div>
```

### **Interactive Elements**

1. **Checkbox** - Integrates with `builder.selectedIds` + `builder.toggleSelection()`
2. **Name cell** - Click pencil or name to enter inline edit mode
3. **Visibility switch** - Calls `mutations.updateCategory(id, { isVisible: !isVisible })`

---

## 🏗️ File Structure

```text
constants/
  action-bar-config.ts (UNCHANGED)
  view-configs.ts (NEW)

components/table-views/
  AllCategoriesTableView.tsx (NEW)

  shared/
    table/                           # Compositional table parts
      TableHeader.tsx                # Extends shadcn TableHeader
      TableRow.tsx                   # Extends shadcn TableRow with selection states
      TableCell.tsx                  # Extends shadcn TableCell with variants

    cells/                           # Reusable cell components
      CheckboxCell.tsx
      InlineNameEditor.tsx
      VisibilityCell.tsx
      IconCell.tsx (future)
      ExpandToggle.tsx (future)
```

**Architecture Principle:** Extend shadcn table components for consistency, never edit them directly.

---

## 📝 Implementation Files

### **1. view-configs.ts**

```typescript
// constants/view-configs.ts
import type { ViewType } from "../types/builder-state";
import type { ActionContext } from "./action-bar-config";

export type ContextMenuAction = {
  id: string;
  label: string;
  icon: string;
  kbd?: string[];
  isDanger?: boolean;
  separator?: boolean;
  execute: (row: unknown, context: ActionContext) => Promise<void>;
  isVisible?: (row: unknown) => boolean;
};

export type ViewConfig = {
  // Table rendering
  tableComponent: React.ComponentType;
  supportsNesting: boolean;
  supportsDragDrop: boolean;

  // Action bar (references to ACTION_BAR_CONFIG)
  actionIds: string[]; // IDs that exist in ACTION_BAR_CONFIG

  // Context menus
  contextMenuActions: ContextMenuAction[];

  // Future extensions
  columns?: unknown;
  keyboardShortcuts?: unknown;
};

// Import table components
import { AllCategoriesTableView } from "../components/table-views/AllCategoriesTableView";

export const VIEW_CONFIGS: Record<ViewType, ViewConfig> = {
  "all-categories": {
    tableComponent: AllCategoriesTableView,
    supportsNesting: false,
    supportsDragDrop: false,

    actionIds: ["new-category", "clone", "remove", "visibility", "undo", "redo"],

    contextMenuActions: [
      {
        id: "rename",
        label: "Rename",
        icon: "Pencil",
        kbd: ["F2"],
        execute: async (row, { setEditingCell }) => {
          const category = row as MenuCategory;
          setEditingCell?.({ rowId: category.id, columnId: "name" });
        },
      },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: "Copy",
        kbd: ["⌘", "D"],
        execute: async (row, { mutations }) => {
          const category = row as MenuCategory;
          await mutations.cloneCategory?.(category.id);
        },
      },
      {
        id: "toggle-visibility",
        label: "Toggle Visibility",
        icon: "Eye",
        execute: async (row, { mutations }) => {
          const category = row as MenuCategory;
          await mutations.updateCategory(category.id, {
            isVisible: !category.isVisible,
          });
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: "Trash2",
        isDanger: true,
        separator: true,
        execute: async (row, { mutations }) => {
          const category = row as MenuCategory;
          await mutations.removeCategory?.(category.id);
        },
      },
    ],
  },

  // Other views can be added later
  menu: {} as ViewConfig,
  label: {} as ViewConfig,
  category: {} as ViewConfig,
  "all-labels": {} as ViewConfig,
};
```

---

### **2. AllCategoriesTableView.tsx**

```typescript
// components/table-views/AllCategoriesTableView.tsx
"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Pencil } from "lucide-react";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/CheckboxCell";
import { InlineNameEditor } from "./shared/InlineNameEditor";
import { VisibilityCell } from "./shared/VisibilityCell";
import type { MenuCategory } from "../../types/menu";

export function AllCategoriesTableView() {
  const { builder, categories, labels, updateCategory } = useMenuBuilder();

  // Helper: Get label names for a category
  const getCategoryLabels = (categoryId: string) => {
    const assignedLabels = labels
      .filter((label) =>
        label.categories?.some((cat) => cat.id === categoryId)
      )
      .map((label) => label.name);

    return assignedLabels.length > 0 ? assignedLabels.join(", ") : "—";
  };

  // Column definitions
  const columns = useMemo<ColumnDef<MenuCategory>[]>(
    () => [
      // Checkbox column
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center h-full">
            <CheckboxCell
              id="select-all"
              checked={
                table.getIsAllRowsSelected() ||
                table.getIsSomeRowsSelected()
              }
              onToggle={() => table.toggleAllRowsSelected()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center h-full">
            <CheckboxCell
              id={row.original.id}
              checked={builder.selectedIds.includes(row.original.id)}
              onToggle={() => builder.toggleSelection(row.original.id)}
            />
          </div>
        ),
        size: 24, // w-6
      },

      // Name column
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm pl-2 pr-4">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            <InlineNameEditor
              id={row.original.id}
              initialValue={row.original.name}
              onSave={async (id, name) => {
                await updateCategory(id, { name });
              }}
            />
            <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
          </div>
        ),
      },

      // Labels column
      {
        id: "labels",
        header: () => <div className="text-center">Labels</div>,
        cell: ({ row }) => (
          <div className="text-sm px-4 text-center">
            {getCategoryLabels(row.original.id)}
          </div>
        ),
      },

      // Visibility column
      {
        id: "visibility",
        header: () => <div className="text-center">Visibility</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <VisibilityCell
              id={row.original.id}
              isVisible={row.original.isVisible}
              variant="switch"
              onToggle={async (id, visible) => {
                await updateCategory(id, { isVisible: visible });
              }}
            />
          </div>
        ),
      },
    ],
    [builder, categories, labels, updateCategory, getCategoryLabels]
  );

  // Initialize table
  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="h-10 bg-muted/40 border-b"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.id === "select"
                      ? "w-6 p-2"
                      : header.id === "name"
                        ? "text-sm font-medium pl-2 pr-4 truncate max-w-0"
                        : "text-sm font-medium px-4 truncate max-w-0 text-center"
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="h-10 hover:bg-muted/40"
                data-state={
                  builder.selectedIds.includes(row.original.id) && "selected"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === "select"
                        ? "w-6 p-2"
                        : cell.column.id === "labels" ||
                            cell.column.id === "visibility"
                          ? "px-4"
                          : ""
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No categories yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### **3. Shared Table Components**

#### **Compositional Table Parts**

These extend shadcn table componecells/nts with consistent behavior:

**TableHeader.tsx**

```typescript
// components/table-views/shared/table/TableHeader.tsx
import { TableHeader as ShadcnTableHeader, TableRow, TableHead } from "@/components/ui/table";

type Column = {
  id: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
};

type TableHeaderProps = {
  columns: Column[];
  onSelectAll?: () => void;
  allSelected?: boolean;
};

export function TableHeader({ columns, onSelectAll, allSelected }: TableHeaderProps) {
  return (
    <ShadcnTableHeader>
      <TableRow className="h-10 bg-muted/40 border-b">
        {columns.map((column) => (
          <TableHead
            key={column.id}
            className={`
              ${column.width || ""}
              ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""}
              ${column.id === "select" ? "w-6 p-2" : "text-sm font-medium px-4 truncate max-w-0"}
            `}cells/
          >
            {column.id === "select" && onSelectAll ? (
              <CheckboxCell
                id="select-all"
                checked={allSelected || false}
                onToggle={onSelectAll}
              />
            ) : (
              column.label
            )}
          </TableHead>
        ))}
      </TableRow>
    </ShadcnTableHeader>
  );
}
```

**TableRow.tsx**

```typescript
// components/table-views/shared/table/TableRow.tsx
import { TableRow as ShadcnTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableRowProps = {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export function TableRow({ children, selected, onClick, className }: TableRowProps) {
  return (
    <ShadcnTableRow
      className={cn(
        "h-10 hover:bg-muted/40",
        onClick && "cursor-pointer",
        className
      )}
      data-state={selected ? "selected" : undefined}
      onClick={onClick}
    >
      {children}
    </ShadcnTableRow>
  );
}
```

**TableCell.tsx**

```typescript
// components/table-views/shared/table/TableCell.tsx
import { TableCell as ShadcnTableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableCellProps = {
  children: React.ReactNode;
  align?: "left" | "center" | "ricells/ght";
  width?: string;
  className?: string;
};

export function TableCell({ children, align, width, className }: TableCellProps) {
  return (
    <ShadcnTableCell
      className={cn(
        width,
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </ShadcnTableCell>
  );
}
```

---

#### **Cell Components**

**CheckboxCell.tsx**

```typescript
// components/table-views/shared/CheckboxCell.tsx
import { Checkbox } from "@/components/ui/checkbox";

type CheckboxCellProps = {
  id: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function CheckboxCell({
  id,
  checked,
  onToggle,
  disabled,
}: CheckboxCellProps) {
  return (
    <Checkbox
- ✅ **Shared structure**: Compositional table parts extend shadcn components
- ✅ **Consistent UI**: All table views use same shared/table components
      id={id}
      checked={checked}
      onCheckedChange={onToggle}
      disabled={disabled}
      className="w-4 h-4 accent-foreground"
      aria-label={`Select ${id}`}
    />
  );
}
```

#### **InlineNameEditor.tsx**

```typescript
// components/table-views/shared/InlineNameEditor.tsx
import { useState } from "react";

type InlineNameEditorProps = {
  id: string;
  initialValue: string;
  onSave: (id: string, name: string) => Promise<void>;
};

export function InlineNameEditor({
  id,
  initialValue,
  onSave,
}: InlineNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleSave = async () => {
    if (value !== initialValue) {
      await onSave(id, value);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="italic text-muted-foreground hover:underline text-left"
      >
        {value || "Untitled"}
      </button>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
          setValue(initialValue);
          setIsEditing(false);
        }
      }}
      className="border-b border-foreground bg-transparent outline-none"
      autoFocus
    />
  );
}
```

#### **VisibilityCell.tsx**

```typescript
// components/table-views/shared/VisibilityCell.tsx
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";

type VisibilityCellProps = {
  id: string;
  isVisible: boolean;
  variant: "switch" | "icon";
  onToggle?: (id: string, visible: boolean) => Promise<void>;
};

export function VisibilityCell({
  id,
  isVisible,
  variant,
  onToggle,
}: VisibilityCellProps) {
  if (variant === "icon") {
    return isVisible ? (
      <Eye className="w-4 h-4 text-muted-foreground" />
    ) : (
      <EyeOff className="w-4 h-4 text-muted-foreground" />
    );
  }

  return (
    <Switch
      checked={isVisible}
      onCheckedChange={(checked) => onToggle?.(id, checked)}
    />
  );
}
```

---

## ✅ Confirmation Checklist

Before implementing, confirm:

- ✅ **Architecture**: Option 1 - Keep action-bar-config.ts, add view-configs.ts
- ✅ **Tech Stack**: TanStack React Table + shadcn Data Table
- ✅ **Styles**: Match mock2 exactly (classes, spacing, icons)
- ✅ **Integration**: Uses `useMenuBuilder()` hook for data + mutations
- ✅ **Features**: Checkbox selection, inline editing, visibility toggle
- ✅ **No breaking changes**: Action bar continues working as-is

---

## 🚀 Nextshared/table/ compositional components (TableHeader, TableRow, TableCell)

3. Create shared/cells/ components (CheckboxCell, InlineNameEditor, VisibilityCell)
4. Create `AllCategoriesTableView.tsx` using shared table components
5. Test table rendering with real data
6. Test action bar integration (buttons should work with selection)

**Implementation order:**

- ✅ Shared table parts first (foundation)
- ✅ Cell components second (building blocks)
- ✅ AllCategoriesTableView last (composi

3. Create 3 shared components (CheckboxCell, InlineNameEditor, VisibilityCell)
4. Test table rendering with real data
5. Test action bar integration (buttons should work with selection)

---

**Ready to proceed?** Confirm the approach and I'll start implementation! 🎯

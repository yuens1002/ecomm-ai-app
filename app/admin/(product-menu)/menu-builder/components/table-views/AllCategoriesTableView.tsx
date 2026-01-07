"use client";
"use no memo";

import * as React from "react";
import { useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { TableBody, TableHeader, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet } from "lucide-react";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { EmptyState } from "../shared/EmptyState";
import { MenuBuilderTable } from "./shared/table/MenuBuilderTable";
import { allCategoriesWidthPreset } from "./shared/table/columnWidthPresets";
import { SortableHeaderCell } from "./shared/table/SortableHeaderCell";
import { generateSlug } from "@/hooks/useSlugGenerator";
import type { MenuCategory } from "../../../types/menu";

export function AllCategoriesTableView() {
  const { builder, categories, labels, products, updateCategory, createCategory } =
    useMenuBuilder();
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const previousCategoriesRef = React.useRef<MenuCategory[]>([]);

  // Auto-detect new categories by diffing with previous list
  React.useEffect(() => {
    const previousIds = new Set(previousCategoriesRef.current.map((c) => c.id));
    const newCategories = categories.filter((c) => !previousIds.has(c.id));

    if (
      newCategories.length > 0 &&
      previousCategoriesRef.current.length > 0 &&
      !editingCategoryId
    ) {
      setSorting([]);
      setEditingCategoryId(newCategories[0].id);
    }

    previousCategoriesRef.current = categories;
  }, [categories, editingCategoryId]);

  // Helper: Get label names for a category
  const getCategoryLabels = useCallback(
    (categoryId: string) => {
      const assignedLabels = labels
        .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
        .map((label) => label.name);
      return assignedLabels.length > 0 ? assignedLabels.join(", ") : "—";
    },
    [labels]
  );

  // Helper: Get product count for a category
  const getCategoryProductCount = useCallback(
    (categoryId: string) => {
      const count = products.filter((product) => product.categoryIds?.includes(categoryId)).length;
      return count > 0 ? count.toString() : "—";
    },
    [products]
  );

  const getCategoryProductCountNumber = useCallback(
    (categoryId: string) => {
      return products.filter((product) => product.categoryIds?.includes(categoryId)).length;
    },
    [products]
  );

  // Handle row click for navigation
  const handleRowClick = useCallback(
    (categoryId: string, event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest('input[type="checkbox"]') ||
        target.closest("[contenteditable]")
      ) {
        return;
      }
      builder.navigateToCategory(categoryId);
    },
    [builder]
  );

  // Handle new category creation
  const handleNewCategory = useCallback(async () => {
    const existingNames = categories.map((c) => c.name);
    let counter = 1;
    let newName = "New Category";
    while (existingNames.includes(newName)) {
      newName = `New Category ${counter}`;
      counter++;
    }
    const slug = generateSlug(newName);
    await createCategory({ name: newName, slug });
  }, [categories, createCategory]);

  // Listen for action bar new-category event
  React.useEffect(() => {
    const handler = () => handleNewCategory();
    window.addEventListener("menu-builder:new-category", handler);
    return () => window.removeEventListener("menu-builder:new-category", handler);
  }, [handleNewCategory]);

  // Column definitions
  const columns = useMemo<ColumnDef<MenuCategory>[]>(
    () => [
      {
        id: "select",
        header: () => {
          const allSelected = categories.every((cat) => builder.selectedIds.includes(cat.id));
          const someSelected =
            categories.some((cat) => builder.selectedIds.includes(cat.id)) && !allSelected;

          return (
            <Checkbox
              checked={allSelected || (someSelected && "indeterminate")}
              onCheckedChange={() => {
                if (allSelected) {
                  builder.clearSelection();
                } else {
                  builder.selectAll(categories.map((c) => c.id));
                }
              }}
              aria-label="Select all"
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={builder.selectedIds.includes(row.original.id)}
            onCheckedChange={() => builder.toggleSelection(row.original.id)}
            aria-label={`Select ${row.original.name}`}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-opacity"
          />
        ),
        enableSorting: false,
        size: 36,
      },
      {
        accessorKey: "name",
        header: "Category",
        sortingFn: "alphanumeric",
        cell: ({ row }) => (
          <InlineNameEditor
            id={row.original.id}
            initialValue={row.original.name}
            isEditing={editingCategoryId === row.original.id}
            onStartEdit={() => setEditingCategoryId(row.original.id)}
            onCancelEdit={() => setEditingCategoryId(null)}
            onSave={async (id, name) => {
              await updateCategory(id, { name });
              setEditingCategoryId(null);
            }}
          />
        ),
      },
      {
        id: "labels",
        header: "Added to labels",
        accessorFn: (row) => getCategoryLabels(row.id),
        sortingFn: "alphanumeric",
        cell: ({ row }) => (
          <div className="text-sm truncate max-w-xs">{getCategoryLabels(row.original.id)}</div>
        ),
      },
      {
        id: "products",
        header: "Products",
        accessorFn: (row) => getCategoryProductCountNumber(row.id),
        sortingFn: "basic",
        cell: ({ row }) => (
          <div className="text-sm text-right">{getCategoryProductCount(row.original.id)}</div>
        ),
      },
      {
        id: "visibility",
        header: "Visibility",
        accessorFn: (row) => (row.isVisible ? 1 : 0),
        sortingFn: "basic",
        cell: ({ row }) => (
          <VisibilityCell
            id={row.original.id}
            isVisible={row.original.isVisible}
            variant="switch"
            onToggle={async (id, visible) => {
              await updateCategory(id, { isVisible: visible });
            }}
          />
        ),
      },
    ],
    [
      builder,
      updateCategory,
      getCategoryLabels,
      getCategoryProductCount,
      getCategoryProductCountNumber,
      categories,
      editingCategoryId,
    ]
  );

  // Initialize table
  const table = useReactTable({
    data: categories,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: true,
  });

  // Selection state
  const allSelected = categories.every((cat) => builder.selectedIds.includes(cat.id));
  const someSelected =
    categories.some((cat) => builder.selectedIds.includes(cat.id)) && !allSelected;

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No Categories Yet"
        description="Get started by creating your first category"
        actionLabel="New Category"
        onAction={handleNewCategory}
      />
    );
  }

  return (
    <div className="w-full pt-4">
      <MenuBuilderTable minWidthClassName="min-w-[660px]">
        <TableHeader className="h-10 bg-muted/40 border-b">
          <TableRow className="group/header hover:bg-transparent">
            <TableHead className={allCategoriesWidthPreset.select.head}>
              <div className="flex items-center">
                <Checkbox
                  checked={allSelected || (someSelected && "indeterminate")}
                  onCheckedChange={() => {
                    if (allSelected) {
                      builder.clearSelection();
                    } else {
                      builder.selectAll(categories.map((c) => c.id));
                    }
                  }}
                  aria-label="Select all"
                />
              </div>
            </TableHead>
            <SortableHeaderCell
              table={table}
              columnId="name"
              label="Category"
              align="left"
              headClassName={allCategoriesWidthPreset.name.head}
            />
            <SortableHeaderCell
              table={table}
              columnId="labels"
              label="Added to labels"
              align="left"
              headClassName={allCategoriesWidthPreset.labels.head}
            />
            <SortableHeaderCell
              table={table}
              columnId="products"
              label="Products"
              align="right"
              headClassName={allCategoriesWidthPreset.products.head}
            />
            <SortableHeaderCell
              table={table}
              columnId="visibility"
              label="Visibility"
              align="center"
              headClassName={allCategoriesWidthPreset.visibility.head}
            />
          </TableRow>
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = builder.selectedIds.includes(row.original.id);
            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? "selected" : undefined}
                className="group cursor-pointer h-10 hover:bg-muted/40 border-b-0"
                onClick={(e) => handleRowClick(row.original.id, e)}
              >
                <TableCell className={allCategoriesWidthPreset.select.cell}>
                  <div
                    className={
                      "flex h-10 items-center opacity-100 transition-opacity " +
                      (isSelected
                        ? "md:opacity-100"
                        : "md:opacity-0 md:group-hover:opacity-100 md:has-[:focus-visible]:opacity-100")
                    }
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => builder.toggleSelection(row.original.id)}
                      aria-label={`Select ${row.original.name}`}
                    />
                  </div>
                </TableCell>
                <TableCell className={"truncate " + (allCategoriesWidthPreset.name.cell ?? "")}>
                  <InlineNameEditor
                    id={row.original.id}
                    initialValue={row.original.name}
                    isEditing={editingCategoryId === row.original.id}
                    onStartEdit={() => setEditingCategoryId(row.original.id)}
                    onCancelEdit={() => setEditingCategoryId(null)}
                    onSave={async (id, name) => {
                      await updateCategory(id, { name });
                      setEditingCategoryId(null);
                    }}
                  />
                </TableCell>
                <TableCell
                  className={
                    "text-sm truncate max-w-xs " + (allCategoriesWidthPreset.labels.cell ?? "")
                  }
                >
                  {getCategoryLabels(row.original.id)}
                </TableCell>
                <TableCell
                  className={
                    "text-sm text-right truncate max-w-xs " +
                    (allCategoriesWidthPreset.products.cell ?? "")
                  }
                >
                  {getCategoryProductCount(row.original.id)}
                </TableCell>
                <TableCell
                  className={"text-center " + (allCategoriesWidthPreset.visibility.cell ?? "")}
                >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </MenuBuilderTable>
    </div>
  );
}

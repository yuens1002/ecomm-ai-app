"use client";
"use no memo";

import { Checkbox } from "@/components/ui/checkbox";
import { TableBody } from "@/components/ui/table";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { FileSpreadsheet } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo } from "react";
import type { MenuCategory } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { EmptyState } from "../shared/EmptyState";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { allCategoriesWidthPreset } from "./shared/table/columnWidthPresets";
import { MenuBuilderTable } from "./shared/table/MenuBuilderTable";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";

export function AllCategoriesTableView() {
  const { builder, categories, labels, products, updateCategory, createNewCategory } =
    useMenuBuilder();
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [pinnedCategoryId, setPinnedCategoryId] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const previousCategoriesRef = React.useRef<MenuCategory[]>([]);

  const pinnedCategory = useMemo(() => {
    if (!pinnedCategoryId) return undefined;
    return categories.find((c) => c.id === pinnedCategoryId);
  }, [categories, pinnedCategoryId]);

  const categoriesForTable = useMemo(() => {
    const rest = pinnedCategoryId
      ? categories.filter((c) => c.id !== pinnedCategoryId)
      : categories;

    if (sorting.length > 0) return rest;

    return [...rest].sort((a, b) => {
      if (b.order !== a.order) return b.order - a.order;
      return b.id.localeCompare(a.id);
    });
  }, [categories, pinnedCategoryId, sorting]);

  // Auto-detect new categories by diffing with previous list
  React.useEffect(() => {
    const previousIds = new Set(previousCategoriesRef.current.map((c) => c.id));
    const newCategories = categories.filter((c) => !previousIds.has(c.id));

    if (
      newCategories.length > 0 &&
      previousCategoriesRef.current.length > 0 &&
      !editingCategoryId
    ) {
      const newestNew = [...newCategories].sort((a, b) => {
        if (b.order !== a.order) return b.order - a.order;
        return b.id.localeCompare(a.id);
      })[0];

      const nextId = newestNew?.id ?? newCategories[0].id;
      setPinnedCategoryId(nextId);
      setEditingCategoryId(nextId);
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
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categoriesForTable,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
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
        onAction={createNewCategory}
      />
    );
  }

  return (
    <MenuBuilderTable className="w-full pt-4" minWidthClassName="min-w-[660px]">
      <TableHeader
        table={table}
        hasSelectAll
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={() => {
          if (allSelected) {
            builder.clearSelection();
          } else {
            builder.selectAll(categories.map((c) => c.id));
          }
        }}
        columns={[
          {
            id: "select",
            label: "",
            isCheckbox: true,
            width: allCategoriesWidthPreset.select.head,
          },
          {
            id: "name",
            label: "Category",
            align: "left",
            width: allCategoriesWidthPreset.name.head,
          },
          {
            id: "labels",
            label: "Added to labels",
            align: "left",
            width: allCategoriesWidthPreset.labels.head,
          },
          {
            id: "products",
            label: "Products",
            align: "right",
            width: allCategoriesWidthPreset.products.head,
          },
          {
            id: "visibility",
            label: "Visibility",
            align: "center",
            width: allCategoriesWidthPreset.visibility.head,
          },
        ]}
      />

      <TableBody>
        {pinnedCategory
          ? (() => {
              const isSelected = builder.selectedIds.includes(pinnedCategory.id);
              return (
                <TableRow
                  key={pinnedCategory.id}
                  data-state={isSelected ? "selected" : undefined}
                  className="cursor-pointer h-10 hover:bg-muted/40 border-b-0"
                  onClick={(e) => handleRowClick(pinnedCategory.id, e)}
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
                        onCheckedChange={() => builder.toggleSelection(pinnedCategory.id)}
                        aria-label={`Select ${pinnedCategory.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className={allCategoriesWidthPreset.name.cell}>
                    <InlineNameEditor
                      id={pinnedCategory.id}
                      initialValue={pinnedCategory.name}
                      isEditing={editingCategoryId === pinnedCategory.id}
                      onStartEdit={() => setEditingCategoryId(pinnedCategory.id)}
                      onCancelEdit={() => {
                        setEditingCategoryId(null);
                        setPinnedCategoryId(null);
                      }}
                      onSave={async (id, name) => {
                        await updateCategory(id, { name });
                        setEditingCategoryId(null);
                        setPinnedCategoryId(null);
                      }}
                    />
                  </TableCell>
                  <TableCell className={"text-sm " + (allCategoriesWidthPreset.labels.cell ?? "")}>
                    {getCategoryLabels(pinnedCategory.id)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={"text-sm " + (allCategoriesWidthPreset.products.cell ?? "")}
                  >
                    {getCategoryProductCount(pinnedCategory.id)}
                  </TableCell>
                  <TableCell align="center" className={allCategoriesWidthPreset.visibility.cell}>
                    <div className="flex justify-center">
                      <VisibilityCell
                        id={pinnedCategory.id}
                        isVisible={pinnedCategory.isVisible}
                        variant="switch"
                        onToggle={async (id, visible) => {
                          await updateCategory(id, { isVisible: visible });
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })()
          : null}

        {table.getRowModel().rows.map((row) => {
          const isSelected = builder.selectedIds.includes(row.original.id);
          return (
            <TableRow
              key={row.original.id}
              data-state={isSelected ? "selected" : undefined}
              className="cursor-pointer h-10 hover:bg-muted/40 border-b-0"
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
              <TableCell className={allCategoriesWidthPreset.name.cell}>
                <InlineNameEditor
                  id={row.original.id}
                  initialValue={row.original.name}
                  isEditing={editingCategoryId === row.original.id}
                  onStartEdit={() => setEditingCategoryId(row.original.id)}
                  onCancelEdit={() => {
                    setEditingCategoryId(null);
                    if (pinnedCategoryId === row.original.id) setPinnedCategoryId(null);
                  }}
                  onSave={async (id, name) => {
                    await updateCategory(id, { name });
                    setEditingCategoryId(null);
                    if (pinnedCategoryId === row.original.id) setPinnedCategoryId(null);
                  }}
                />
              </TableCell>
              <TableCell className={"text-sm " + (allCategoriesWidthPreset.labels.cell ?? "")}>
                {getCategoryLabels(row.original.id)}
              </TableCell>
              <TableCell
                align="right"
                className={"text-sm " + (allCategoriesWidthPreset.products.cell ?? "")}
              >
                {getCategoryProductCount(row.original.id)}
              </TableCell>
              <TableCell align="center" className={allCategoriesWidthPreset.visibility.cell}>
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
  );
}

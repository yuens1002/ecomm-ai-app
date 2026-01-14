"use client";
"use no memo";

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
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuCategory } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { EmptyState } from "../shared/EmptyState";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { allCategoriesWidthPreset } from "./shared/table/columnWidthPresets";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";

const ALL_CATEGORIES_HEADER_COLUMNS: TableHeaderColumn[] = [
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
];

export function AllCategoriesTableView() {
  const { builder, categories, labels, products, updateCategory, createNewCategory } =
    useMenuBuilder();

  const {
    editingId: editingCategoryId,
    pinnedId: pinnedCategoryId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "category", { autoClearPinned: true });

  const selectableCategoryIds = useMemo(() => categories.map((c) => c.id), [categories]);
  const {
    isSelectionActive: isCategorySelectionActive,
    selectionState,
    onSelectAll,
    onToggleId: onToggleCategoryId,
    isSelected: isCategorySelected,
  } = useContextSelectionModel(builder, { kind: "category", selectableIds: selectableCategoryIds });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const { pinnedRow: pinnedCategory, rowsForTable: categoriesForTable } = usePinnedRow({
    rows: categories,
    pinnedId: pinnedCategoryId,
    isSortingActive: sorting.length > 0,
    // Uses built-in default sort by order field
  });

  // Inline edit handlers with undo/redo
  const { handleNameSave, handleVisibilitySave } = useInlineEditHandlers({
    builder,
    entityKind: "category",
    getItem: (id) => categories.find((c) => c.id === id),
    updateItem: updateCategory,
    onSaveComplete: clearEditing,
  });

  // Helper: Get label names for a category
  const categoryLabelsById = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const label of labels) {
      for (const category of label.categories ?? []) {
        const existing = map.get(category.id);
        if (existing) {
          existing.push(label.name);
        } else {
          map.set(category.id, [label.name]);
        }
      }
    }

    return map;
  }, [labels]);

  const categoryProductCountById = useMemo(() => {
    const map = new Map<string, number>();

    for (const product of products) {
      for (const categoryId of product.categoryIds ?? []) {
        map.set(categoryId, (map.get(categoryId) ?? 0) + 1);
      }
    }

    return map;
  }, [products]);

  const getCategoryLabels = useCallback(
    (categoryId: string) => {
      const names = categoryLabelsById.get(categoryId);
      return names && names.length > 0 ? names.join(", ") : "—";
    },
    [categoryLabelsById]
  );

  const getCategoryProductCountNumber = useCallback(
    (categoryId: string) => categoryProductCountById.get(categoryId) ?? 0,
    [categoryProductCountById]
  );

  // Column definitions
  const columns = useMemo<ColumnDef<MenuCategory>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name,
        sortingFn: "alphanumeric",
      },
      {
        id: "labels",
        accessorFn: (row) => getCategoryLabels(row.id),
        sortingFn: "alphanumeric",
      },
      {
        id: "products",
        accessorFn: (row) => getCategoryProductCountNumber(row.id),
        sortingFn: "basic",
      },
      {
        id: "visibility",
        accessorFn: (row) => (row.isVisible ? 1 : 0),
        sortingFn: "basic",
      },
    ],
    [getCategoryLabels, getCategoryProductCountNumber]
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

  const allSelected = selectionState.allSelected;
  const someSelected = selectionState.someSelected;

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No Categories Yet"
        description="Get started by creating your first category"
        actionLabel="New Category"
        onAction={async () => {
          const createdId = await createNewCategory();
          if (createdId) {
            builder.setPinnedNew({ kind: "category", id: createdId });
            builder.setEditing({ kind: "category", id: createdId });
          }
        }}
      />
    );
  }

  const renderCategoryRow = (category: MenuCategory, options?: { isPinned?: boolean }) => {
    const isPinned = options?.isPinned === true;
    const isSelected = isCategorySelected(category.id);

    return (
      <TableRow
        key={category.id}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected}
        onRowClick={() => onToggleCategoryId(category.id)}
        onRowDoubleClick={() => builder.navigateToCategory(category.id)}
      >
        <TableCell className={allCategoriesWidthPreset.select.cell} data-row-click-ignore>
          <CheckboxCell
            id={category.id}
            checked={isSelected}
            onToggle={onToggleCategoryId}
            isSelectable={isCategorySelectionActive}
            disabled={!isCategorySelectionActive}
            alwaysVisible={isSelected}
            ariaLabel={`Select ${category.name}`}
          />
        </TableCell>

        <TableCell className={allCategoriesWidthPreset.name.cell}>
          <InlineNameEditor
            id={category.id}
            initialValue={category.name}
            isEditing={editingCategoryId === category.id}
            onStartEdit={() => builder.setEditing({ kind: "category", id: category.id })}
            onCancelEdit={() => {
              clearEditing();
              if (isPinned || pinnedCategoryId === category.id) {
                clearPinnedIfMatches(category.id);
              }
            }}
            onSave={async (id, name) => {
              await handleNameSave(id, name);
              if (isPinned || pinnedCategoryId === category.id) {
                clearPinnedIfMatches(category.id);
              }
            }}
          />
        </TableCell>

        <TableCell className={"text-sm " + (allCategoriesWidthPreset.labels.cell ?? "")}>
          {getCategoryLabels(category.id)}
        </TableCell>

        <TableCell
          align="right"
          className={"text-sm " + (allCategoriesWidthPreset.products.cell ?? "")}
        >
          {(() => {
            const count = getCategoryProductCountNumber(category.id);
            return count > 0 ? count.toString() : "—";
          })()}
        </TableCell>

        <TableCell align="center" className={allCategoriesWidthPreset.visibility.cell}>
          <div className="flex justify-center">
            <VisibilityCell
              id={category.id}
              isVisible={category.isVisible}
              variant="switch"
              onToggle={handleVisibilitySave}
            />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <TableHeader
        table={table}
        hasSelectAll
        allSelected={allSelected}
        someSelected={someSelected}
        selectAllDisabled={!isCategorySelectionActive}
        onSelectAll={onSelectAll}
        columns={ALL_CATEGORIES_HEADER_COLUMNS}
      />

      <TableBody>
        {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true }) : null}
        {table.getRowModel().rows.map((row) => renderCategoryRow(row.original))}
      </TableBody>
    </>
  );
}

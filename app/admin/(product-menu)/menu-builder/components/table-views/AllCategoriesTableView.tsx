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
import type { MenuCategory } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { EmptyState } from "../shared/EmptyState";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
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

  const { editingId: editingCategoryId, pinnedId: pinnedCategoryId, clearEditing, clearPinnedIfMatches } =
    useContextRowUiState(builder, "category");

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
    defaultSort: (a, b) => {
      if (b.order !== a.order) return b.order - a.order;
      return b.id.localeCompare(a.id);
    },
  });

  React.useEffect(() => {
    if (!pinnedCategoryId) return;
    if (editingCategoryId && editingCategoryId === pinnedCategoryId) return;
    clearPinnedIfMatches(pinnedCategoryId);
  }, [pinnedCategoryId, editingCategoryId, clearPinnedIfMatches]);

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

  const getCategoryProductCountNumber = useCallback(
    (categoryId: string) => {
      return products.filter((product) => product.categoryIds?.includes(categoryId)).length;
    },
    [products]
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
        {(() => {
          const renderCategoryRow = (category: MenuCategory, options?: { isPinned?: boolean }) => {
            const isPinned = options?.isPinned === true;
            const isSelected = isCategorySelected(category.id);

            return (
              <TableRow
                key={category.id}
                data-state={isSelected ? "selected" : undefined}
                isSelected={isSelected}
                onClick={() => builder.navigateToCategory(category.id)}
              >
                <TableCell
                  className={allCategoriesWidthPreset.select.cell}
                  onClick={(e) => e.stopPropagation()}
                >
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
                      await updateCategory(id, { name });
                      clearEditing();
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
                      onToggle={async (id, visible) => {
                        await updateCategory(id, { isVisible: visible });
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          };

          return (
            <>
              {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true }) : null}
              {table.getRowModel().rows.map((row) => renderCategoryRow(row.original))}
            </>
          );
        })()}
      </TableBody>
    </>
  );
}

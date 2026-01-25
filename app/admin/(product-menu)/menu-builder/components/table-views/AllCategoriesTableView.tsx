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
import { buildFlatRegistry } from "../../../hooks/useIdentityRegistry";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuCategory } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { TouchTarget } from "./shared/cells/TouchTarget";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { allCategoriesWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";

const ALL_CATEGORIES_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Category" },
  { id: "products", label: "Products" },
  { id: "addedDate", label: "Added Date" },
  { id: "visibility", label: "Visibility" },
  { id: "labels", label: "Added to Labels" },
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

  // Build registry for this flat view
  const registry = useMemo(() => buildFlatRegistry(categories, "category"), [categories]);

  // Default sort by addedDate desc (newest first) - no DnD in this view so always show sort indicator
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "addedDate", desc: true }]);

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
        id: "addedDate",
        accessorFn: (row) => row.createdAt.getTime(),
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

  // IMPORTANT: selectableKeys must match the VISUAL row order (after sorting)
  // so that shift+click range selection selects the correct rows
  const selectableKeys = useMemo(() => {
    const sortedRows = table.getRowModel().rows;
    // Include pinned row at the top if present
    const keys: string[] = [];
    if (pinnedCategory) {
      keys.push(createKey("category", pinnedCategory.id));
    }
    for (const row of sortedRows) {
      keys.push(createKey("category", row.original.id));
    }
    return keys;
  }, [table, pinnedCategory]);

  const {
    selectionState,
    onSelectAll,
    onToggle,
    isSelected,
    anchorKey,
    rangeSelect,
  } = useContextSelectionModel(builder, { selectableKeys });

  // Unified click handler with range selection support
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    navigate: (kind, entityId) => builder.navigateToCategory(entityId),
    rangeSelect,
    anchorKey,
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
    const categoryKey = createKey("category", category.id);
    const isCategorySelected = isSelected(categoryKey);

    return (
      <TableRow
        key={category.id}
        data-state={isCategorySelected ? "selected" : undefined}
        isSelected={isCategorySelected}
        isHidden={!category.isVisible}
        onRowClick={(options) => handleClick(categoryKey, options)}
        onRowDoubleClick={() => handleDoubleClick(categoryKey)}
      >
        <TableCell config={allCategoriesWidthPreset.select} data-row-click-ignore>
          <TouchTarget>
            <CheckboxCell
              id={category.id}
              checked={isCategorySelected}
              onToggle={() => onToggle(categoryKey)}
              isSelectable
              alwaysVisible={isCategorySelected}
              ariaLabel={`Select ${category.name}`}
              anchorKey={anchorKey}
              onRangeSelect={anchorKey && anchorKey !== categoryKey ? () => rangeSelect(categoryKey) : undefined}
            />
          </TouchTarget>
        </TableCell>

        <TableCell config={allCategoriesWidthPreset.name}>
          <InlineNameEditor
            id={category.id}
            initialValue={category.name}
            isEditing={editingCategoryId === category.id}
            isHidden={!category.isVisible}
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

        <TableCell config={allCategoriesWidthPreset.products} className="text-sm">
          {(() => {
            const count = getCategoryProductCountNumber(category.id);
            return count > 0 ? count.toString() : "—";
          })()}
        </TableCell>

        <TableCell config={allCategoriesWidthPreset.addedDate} className="text-sm">
          {category.createdAt.toLocaleDateString()}
        </TableCell>

        <TableCell config={allCategoriesWidthPreset.visibility}>
          <VisibilityCell
            id={category.id}
            isVisible={category.isVisible}
            variant="switch"
            onToggle={handleVisibilitySave}
          />
        </TableCell>

        <TableCell config={allCategoriesWidthPreset.labels} className="text-sm">
          {getCategoryLabels(category.id)}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <TableViewWrapper>
      <TableHeader
        columns={ALL_CATEGORIES_HEADER_COLUMNS}
        preset={allCategoriesWidthPreset}
        table={table}
        hasSelectAll
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={onSelectAll}
      />

      <TableBody>
        {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true }) : null}
        {table.getRowModel().rows.map((row) => renderCategoryRow(row.original))}
      </TableBody>
    </TableViewWrapper>
  );
}

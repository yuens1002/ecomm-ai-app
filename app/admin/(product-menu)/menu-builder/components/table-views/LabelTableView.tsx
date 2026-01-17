"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Eye, EyeOff, GripVertical, Layers } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useDragReorder } from "../../../hooks/useDragReorder";
import { usePersistColumnSort } from "../../../hooks/usePersistColumnSort";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuCategoryInLabel } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { labelViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";

/** Category with order within current label, added order rank, and product names */
type LabelCategory = MenuCategoryInLabel & {
  orderInLabel: number;
  addedOrderRank: number; // Chronological rank based on attachedAt (1 = first added)
  productNames: string;
  isVisible: boolean;
};

const LABEL_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Categories" },
  { id: "addedOrder", label: "Added Order" },
  { id: "products", label: "Products" },
  { id: "visibility", label: "Visibility" },
  { id: "dragHandle", label: "" },
];

export function LabelTableView() {
  const {
    builder,
    labels,
    categories,
    products,
    reorderCategoriesInLabel,
  } = useMenuBuilder();

  const currentLabelId = builder.currentLabelId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Pinning support for newly added categories
  const { pinnedId: pinnedCategoryId } = useContextRowUiState(
    builder,
    "category",
    { autoClearPinned: true }
  );

  // Get current label
  const currentLabel = useMemo(() => {
    if (!currentLabelId) return null;
    return labels.find((l) => l.id === currentLabelId) ?? null;
  }, [labels, currentLabelId]);

  // Get categories for current label with product names and added order rank
  const labelCategories = useMemo((): LabelCategory[] => {
    if (!currentLabel) return [];

    // Calculate chronological rank based on attachedAt (1 = oldest/first added)
    // Use ID as tiebreaker for stable sorting when timestamps are equal
    const sortedByAttachedAt = [...currentLabel.categories].sort((a, b) => {
      const timeDiff = new Date(a.attachedAt).getTime() - new Date(b.attachedAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id); // Stable tiebreaker
    });
    const attachedAtRankMap = new Map<string, number>();
    sortedByAttachedAt.forEach((cat, index) => {
      attachedAtRankMap.set(cat.id, index + 1);
    });

    return currentLabel.categories.map((cat) => {
      // Find full category data to get visibility
      const fullCategory = categories.find((c) => c.id === cat.id);

      // Get product names for this category
      const categoryProducts = products
        .filter((p) => p.categoryIds.includes(cat.id))
        .map((p) => p.name);

      const productNames = categoryProducts.length > 0
        ? categoryProducts.join(", ")
        : "—";

      return {
        ...cat,
        orderInLabel: cat.order,
        addedOrderRank: attachedAtRankMap.get(cat.id) ?? 0,
        productNames,
        isVisible: fullCategory?.isVisible ?? true,
      };
    });
  }, [currentLabel, categories, products]);

  // Separate pinned row from table rows
  const { pinnedRow: pinnedCategory, rowsForTable: categoriesForTable } = usePinnedRow({
    rows: labelCategories,
    pinnedId: pinnedCategoryId,
    isSortingActive: sorting.length > 0,
    defaultSort: null, // labelCategories is pre-sorted by order
  });

  // Selection model for remove action
  const selectableCategoryIds = useMemo(
    () => labelCategories.map((c) => c.id),
    [labelCategories]
  );
  const {
    isSelectionActive: isCategorySelectionActive,
    selectionState,
    onSelectAll,
    onToggleId: onToggleCategoryId,
    isSelected: isCategorySelected,
  } = useContextSelectionModel(builder, {
    kind: "category",
    selectableIds: selectableCategoryIds,
  });

  // Push undo action for reorder
  const pushReorderUndo = useCallback(
    (previousIds: string[], newIds: string[]) => {
      if (!currentLabelId) return;
      const labelId = currentLabelId;

      builder.pushUndoAction({
        action: "reorder:categories-in-label",
        timestamp: new Date(),
        data: {
          undo: async () => {
            await reorderCategoriesInLabel(labelId, previousIds);
          },
          redo: async () => {
            await reorderCategoriesInLabel(labelId, newIds);
          },
        },
      });
    },
    [currentLabelId, builder, reorderCategoriesInLabel]
  );

  // Drag & Drop handlers - reset sorting when manual reorder occurs
  const { getDragHandlers, getDragClasses } = useDragReorder({
    items: labelCategories,
    onReorder: async (ids) => {
      if (currentLabelId) {
        // Capture old order before mutation (labelCategories still has old order)
        const previousIds = labelCategories.map((c) => c.id);
        await reorderCategoriesInLabel(currentLabelId, ids);
        pushReorderUndo(previousIds, ids);
      }
    },
    onReorderComplete: () => {
      // Clear column sorting after manual DnD reorder
      setSorting([]);
    },
  });

  // Navigation handler for double-click
  const handleNavigateToCategory = useCallback(
    (categoryId: string) => {
      builder.navigateToCategory(categoryId);
    },
    [builder]
  );

  // Column definitions - name and addedOrder are sortable
  const columns = useMemo<ColumnDef<LabelCategory>[]>(
    () => [
      { id: "select", accessorFn: () => null, enableSorting: false },
      { id: "name", accessorFn: (row) => row.name, sortingFn: "alphanumeric" },
      { id: "addedOrder", accessorFn: (row) => row.addedOrderRank, sortingFn: "basic" },
      { id: "products", accessorFn: (row) => row.productNames, enableSorting: false },
      { id: "visibility", accessorFn: (row) => (row.isVisible ? 1 : 0), enableSorting: false },
      { id: "dragHandle", accessorFn: () => null, enableSorting: false },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categoriesForTable,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    getRowId: (row) => row.id,
  });

  // Persist sort order to database when column sorting is applied
  usePersistColumnSort({
    sorting,
    contextId: currentLabelId,
    table,
    onPersist: reorderCategoriesInLabel,
  });

  const allSelected = selectionState.allSelected;
  const someSelected = selectionState.someSelected;

  // Empty state
  if (!currentLabelId || !currentLabel) {
    return (
      <EmptyState
        icon={Layers}
        title="No Label Selected"
        description="Select a label to view its categories"
      />
    );
  }

  if (labelCategories.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No Categories"
        description="Add categories to this label using the action bar"
      />
    );
  }

  const renderCategoryRow = (
    category: LabelCategory,
    options?: { isPinned?: boolean; isLastRow?: boolean }
  ) => {
    const _isPinned = options?.isPinned === true;
    const isLastRow = options?.isLastRow === true;
    const isSelected = isCategorySelected(category.id);
    const isRowHovered = hoveredRowId === category.id;
    const dragClasses = getDragClasses(category.id);
    const dragHandlers = getDragHandlers(category.id);

    return (
      <TableRow
        key={category.id}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected}
        isDragging={dragClasses.isDragging}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(category.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary")
        )}
        onRowClick={() => onToggleCategoryId(category.id)}
        onRowDoubleClick={() => handleNavigateToCategory(category.id)}
      >
        {/* Checkbox */}
        <TableCell config={labelViewWidthPreset.select} data-row-click-ignore>
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

        {/* Category Name */}
        <TableCell config={labelViewWidthPreset.name}>
          <span className="truncate font-medium">{category.name}</span>
        </TableCell>

        {/* Added Order (chronological rank based on attachedAt) */}
        <TableCell config={labelViewWidthPreset.addedOrder}>
          <span className="text-sm">{category.addedOrderRank}</span>
        </TableCell>

        {/* Products (comma-separated) */}
        <TableCell config={labelViewWidthPreset.products} className="text-sm text-muted-foreground">
          <span className="truncate">{category.productNames}</span>
        </TableCell>

        {/* Visibility (read-only icon) */}
        <TableCell config={labelViewWidthPreset.visibility}>
          {category.isVisible ? (
            <Eye className="h-4 w-4 text-foreground inline" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground inline" />
          )}
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={labelViewWidthPreset.dragHandle} data-row-click-ignore>
          <div
            className={cn(
              "flex items-center justify-center cursor-grab active:cursor-grabbing",
              // xs-sm: always visible
              "opacity-100",
              // md+: show on hover only
              isRowHovered ? "md:opacity-100" : "md:opacity-0"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const rows = table.getRowModel().rows;

  return (
    <TableViewWrapper>
      <TableHeader
        columns={LABEL_VIEW_HEADER_COLUMNS}
        preset={labelViewWidthPreset}
        table={table}
        hasSelectAll
        allSelected={allSelected}
        someSelected={someSelected}
        selectAllDisabled={!isCategorySelectionActive}
        onSelectAll={onSelectAll}
      />

      <TableBody>
        {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true }) : null}
        {rows.map((row, index) =>
          renderCategoryRow(row.original, { isLastRow: index === rows.length - 1 })
        )}
      </TableBody>
    </TableViewWrapper>
  );
}

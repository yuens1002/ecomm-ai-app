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
import { Eye, EyeOff, Layers } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  useContextRowHighlight,
  useMoveHandlers,
  useBulkAction,
  useContextClone,
  useContextRemove,
  useContextMoveTo,
} from "../../../hooks/context-menu";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useSingleEntityDnd } from "../../../hooks/dnd/useSingleEntityDnd";
import { useDnDEligibility } from "../../../hooks/dnd/useDnDEligibility";
import { buildFlatRegistry } from "../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { usePersistColumnSort } from "../../../hooks/usePersistColumnSort";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuCategoryInLabel } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { TouchTarget } from "./shared/cells/TouchTarget";
import { RowContextMenu } from "./shared/cells/RowContextMenu";
import { labelViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import { DragHandleCell } from "./shared/cells/DragHandleCell";

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
  { id: "visibility", label: "Visibility" },
  { id: "products", label: "Products" },
  { id: "dragHandle", label: "" },
];

export function LabelTableView() {
  const {
    builder,
    labels,
    categories,
    products,
    reorderCategoriesInLabel,
    cloneCategory,
    detachCategory,
    attachCategory,
  } = useMenuBuilder();

  const currentLabelId = builder.currentLabelId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Context menu row highlighting
  const { isContextRow, handleContextOpenChange } = useContextRowHighlight();

  // Pinning support for newly added categories
  const { pinnedId: pinnedCategoryId } = useContextRowUiState(builder, "category", {
    autoClearPinned: true,
  });

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

      const productNames = categoryProducts.length > 0 ? categoryProducts.join(", ") : "—";

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

  // Build registry for this flat view
  const registry = useMemo(() => buildFlatRegistry(labelCategories, "category"), [labelCategories]);

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

  // Initialize table - BEFORE selection model so we can get sorted row order
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
  }, [table, pinnedCategory, sorting]);

  // Selection model for remove action
  const {
    selectionState,
    onSelectAll,
    onToggle,
    isSelected,
    getCheckboxState,
    actionableRoots,
    selectedKind,
    isSameKind,
    anchorKey,
    rangeSelect,
  } = useContextSelectionModel(builder, { selectableKeys });

  // Derive DnD eligibility from selection state (action-bar pattern)
  const eligibility = useDnDEligibility({
    actionableRoots,
    selectedKind,
    isSameKind,
    registry,
  });

  // Unified click handler with range selection support
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    navigate: (kind, entityId) => builder.navigateToCategory(entityId),
    rangeSelect,
    anchorKey,
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
  const { getDragHandlers, getDragClasses, getIsDraggable, eligibleEntityIds } = useSingleEntityDnd({
    items: labelCategories,
    onReorder: async (ids: string[]) => {
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
    eligibility,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu data (targets for submenus)
  // ─────────────────────────────────────────────────────────────────────────────

  // Move-to targets (other visible labels)
  const moveToTargets = useMemo(
    () =>
      labels
        .filter((l) => l.isVisible && l.id !== currentLabelId)
        .map((l) => ({ id: l.id, name: l.name })),
    [labels, currentLabelId]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu handlers (using shared hooks)
  // ─────────────────────────────────────────────────────────────────────────────

  // Bulk action support for context menu operations
  const { getTargetIds } = useBulkAction({
    isSelected,
    actionableRoots,
    isSameKind,
    entityKind: "category",
  });

  // Move up/down handlers for context menu reordering
  const { handleMoveUp, handleMoveDown, getPositionFlags } = useMoveHandlers({
    items: labelCategories,
    reorder: async (ids: string[]) => {
      if (currentLabelId) {
        await reorderCategoriesInLabel(currentLabelId, ids);
      }
    },
    onReorderComplete: () => setSorting([]),
  });

  // Clone handler (with bulk support)
  const { handleClone: handleContextClone } = useContextClone({
    cloneEntity: (id) => cloneCategory({ id }),
    getTargetIds,
    entityLabel: { singular: "Category", plural: "categories" },
  });

  // Remove from label handler (with bulk support)
  const { handleRemove: handleContextRemove } = useContextRemove({
    parentId: currentLabelId,
    detachEntity: detachCategory,
    getTargetIds,
    entityLabel: { singular: "Category", plural: "categories" },
  });

  // Move to another label handler
  const { handleMoveTo } = useContextMoveTo({
    sourceParentId: currentLabelId,
    detach: detachCategory,
    attach: attachCategory,
    getEntityName: (id) => categories.find((c) => c.id === id)?.name,
    getTargetName: (id) => labels.find((l) => l.id === id)?.name,
    entityLabel: "Category",
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
    const categoryKey = createKey("category", category.id);
    const isCategorySelected = isSelected(categoryKey);
    const isRowHovered = hoveredRowId === category.id;
    const isRowContextMenu = isContextRow(category.id);
    const positionFlags = getPositionFlags(category.id);
    const dragClasses = getDragClasses(category.id);
    const dragHandlers = getDragHandlers(category.id);

    // Get cursor styling state for this row
    const isDraggable = getIsDraggable(category.id);

    return (
      <RowContextMenu
        key={category.id}
        entityKind="category"
        viewType="label"
        entityId={category.id}
        isVisible={category.isVisible}
        isFirst={positionFlags.isFirst}
        isLast={positionFlags.isLast}
        selectedCount={actionableRoots.length}
        isInSelection={isCategorySelected}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        moveToTargets={moveToTargets}
        currentParentId={currentLabelId ?? undefined}
        onOpenChange={handleContextOpenChange(category.id)}
        onClone={() => handleContextClone(category.id)}
        onRemove={() => handleContextRemove(category.id)}
        onMoveUp={() => handleMoveUp(category.id)}
        onMoveDown={() => handleMoveDown(category.id)}
        onMoveTo={(toLabelId) => handleMoveTo(category.id, toLabelId)}
      >
      <TableRow
        data-state={isCategorySelected ? "selected" : undefined}
        isSelected={isCategorySelected}
        isContextRow={isRowContextMenu}
        isHidden={!category.isVisible}
        isDragging={dragClasses.isDragging}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        isDraggable={isDraggable}
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
        onRowClick={(options) => handleClick(categoryKey, options)}
        onRowDoubleClick={() => handleDoubleClick(categoryKey)}
      >
        {/* Checkbox */}
        <TableCell config={labelViewWidthPreset.select} data-row-click-ignore>
          <TouchTarget>
            <CheckboxCell
              id={category.id}
              checked={isCategorySelected}
              onToggle={() => onToggle(categoryKey)}
              isSelectable
              alwaysVisible={isCategorySelected}
              anchorKey={anchorKey}
              onRangeSelect={anchorKey && anchorKey !== categoryKey ? () => rangeSelect(categoryKey) : undefined}
              ariaLabel={`Select ${category.name}`}
            />
          </TouchTarget>
        </TableCell>

        {/* Category Name */}
        <TableCell config={labelViewWidthPreset.name}>
          <span className="truncate font-medium">{category.name}</span>
        </TableCell>

        {/* Added Order (chronological rank based on attachedAt) */}
        <TableCell config={labelViewWidthPreset.addedOrder}>
          <span className="text-sm">{category.addedOrderRank}</span>
        </TableCell>

        {/* Visibility (read-only icon) */}
        <TableCell config={labelViewWidthPreset.visibility}>
          {category.isVisible ? (
            <Eye className="h-4 w-4 inline" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground inline" />
          )}
        </TableCell>

        {/* Products (comma-separated) */}
        <TableCell config={labelViewWidthPreset.products} className="text-sm">
          <span className="truncate">{category.productNames}</span>
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={labelViewWidthPreset.dragHandle} data-row-click-ignore>
          <DragHandleCell
            isEligible={eligibility.canDrag}
            isRowInEligibleSet={eligibleEntityIds.has(category.id)}
            checkboxState={getCheckboxState(categoryKey)}
            isRowHovered={isRowHovered}
          />
        </TableCell>
      </TableRow>
      </RowContextMenu>
    );
  };

  const rows = table.getRowModel().rows;

  return (
    <>
      <TableViewWrapper>
        <TableHeader
          columns={LABEL_VIEW_HEADER_COLUMNS}
          preset={labelViewWidthPreset}
          table={table}
          hasSelectAll
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
        />

        <TableBody>
          {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true }) : null}
          {rows.map((row, index) =>
            renderCategoryRow(row.original, {
              isLastRow: index === rows.length - 1,
            })
          )}
        </TableBody>
      </TableViewWrapper>
    </>
  );
}

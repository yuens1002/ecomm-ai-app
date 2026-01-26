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
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  useContextRowHighlight,
  useMoveHandlers,
  useBulkAction,
  useDeleteConfirmation,
  useContextClone,
  useContextRemove,
  useContextMoveTo,
  useContextVisibility,
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
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { labelViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableHeader } from "./shared/table/TableHeader";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import { DeleteConfirmationDialog } from "./shared/table/DeleteConfirmationDialog";
import { ConfiguredTableRow } from "./shared/table/ConfiguredTableRow";
import { useConfiguredRow, type UseConfiguredRowOptions } from "../../../hooks/table-view";
import {
  labelViewConfig,
  LABEL_VIEW_HEADER_COLUMNS,
  type LabelViewExtra,
  type LabelCategory,
} from "../../../constants/table-view-configs";

export function LabelTableView() {
  const {
    builder,
    labels,
    categories,
    products,
    reorderCategoriesInLabel,
    cloneCategory,
    deleteCategory,
    updateCategory,
    detachCategory,
    attachCategory,
  } = useMenuBuilder();

  const currentLabelId = builder.currentLabelId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Context menu row highlighting (shared hook)
  const { isContextRow, handleContextOpenChange } = useContextRowHighlight();

  // Delete confirmation dialog (shared hook)
  const {
    deleteConfirmation,
    isDeleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation({
    deleteEntity: (_kind, id) => deleteCategory(id),
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const { handleMoveUp, handleMoveDown } = useMoveHandlers({
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

  // Delete handler
  const handleContextDelete = useCallback(
    (categoryId: string) => {
      requestDelete(categoryId, "category", getTargetIds);
    },
    [requestDelete, getTargetIds]
  );

  // Visibility toggle (with bulk support)
  const { handleVisibilityToggle: handleContextVisibility } = useContextVisibility({
    updateEntity: (id, visible) => updateCategory(id, { isVisible: visible }),
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

  // Extra context for config-driven rendering
  const extra: LabelViewExtra = useMemo(
    () => ({
      currentLabelId,
      moveToTargets,
      canDrag: eligibility.canDrag,
      eligibleEntityIds,
      getCheckboxState,
    }),
    [currentLabelId, moveToTargets, eligibility.canDrag, eligibleEntityIds, getCheckboxState]
  );

  // Context menu handlers for config
  const contextMenuHandlers = useMemo(
    () => ({
      clone: handleContextClone,
      delete: handleContextDelete,
      visibility: handleContextVisibility,
      remove: handleContextRemove,
      moveUp: handleMoveUp,
      moveDown: handleMoveDown,
      moveTo: handleMoveTo,
    }),
    [
      handleContextClone,
      handleContextDelete,
      handleContextVisibility,
      handleContextRemove,
      handleMoveUp,
      handleMoveDown,
      handleMoveTo,
    ]
  );

  // Selection info for context menu
  const selectionInfo = useMemo(
    () => ({
      actionableRoots,
      isSameKind,
    }),
    [actionableRoots, isSameKind]
  );

  // Config-driven row builder
  const configuredRowOptions: UseConfiguredRowOptions<LabelCategory> = useMemo(
    () => ({
      config: labelViewConfig,
      contextMenuHandlers,
      selectionInfo,
      extra,
      onContextMenuOpenChange: handleContextOpenChange,
      onMouseEnter: setHoveredRowId,
      onMouseLeave: () => setHoveredRowId(null),
      onRowClick: handleClick,
      onRowDoubleClick: handleDoubleClick,
    }),
    [
      contextMenuHandlers,
      selectionInfo,
      extra,
      handleContextOpenChange,
      handleClick,
      handleDoubleClick,
    ]
  );

  const { buildRow } = useConfiguredRow(configuredRowOptions);

  // Empty state
  if (!currentLabelId || !currentLabel) {
    return (
      <EmptyState
        icon={labelViewConfig.emptyStates[0].icon}
        title={labelViewConfig.emptyStates[0].title}
        description={labelViewConfig.emptyStates[0].description}
      />
    );
  }

  if (labelCategories.length === 0) {
    return (
      <EmptyState
        icon={labelViewConfig.emptyStates[1].icon}
        title={labelViewConfig.emptyStates[1].title}
        description={labelViewConfig.emptyStates[1].description}
      />
    );
  }

  // Build row state and handlers for each row
  const buildRowState = (category: LabelCategory, options?: { isPinned?: boolean }) => ({
    isSelected: isSelected(createKey("category", category.id)),
    checkboxState: getCheckboxState(createKey("category", category.id)),
    anchorKey,
    isRowHovered: hoveredRowId === category.id,
    isContextRow: isContextRow(category.id),
    isEditing: false, // No inline editing in LabelTableView
    isPinned: options?.isPinned || pinnedCategoryId === category.id,
  });

  const buildRowHandlers = (category: LabelCategory) => ({
    onToggle: () => onToggle(createKey("category", category.id)),
    onRangeSelect:
      anchorKey && anchorKey !== createKey("category", category.id)
        ? () => rangeSelect(createKey("category", category.id))
        : undefined,
    onStartEdit: () => {}, // No inline editing
    onCancelEdit: () => {},
    onSave: async () => {},
  });

  // Render a category row with DnD support
  const renderCategoryRow = (
    category: LabelCategory,
    index: number,
    total: number,
    options?: { isPinned?: boolean }
  ) => {
    const rowData = buildRow(
      category,
      index,
      total,
      buildRowState(category, options),
      buildRowHandlers(category)
    );

    // Get DnD classes and handlers
    const dragClasses = getDragClasses(category.id);
    const dragHandlers = getDragHandlers(category.id);
    const isDraggable = getIsDraggable(category.id);

    return (
      <ConfiguredTableRow
        key={rowData.key}
        data={{
          ...rowData,
          tableRowProps: {
            ...rowData.tableRowProps,
            isDragging: dragClasses.isDragging,
            isDragOver: dragClasses.isDragOver,
            isLastRow: index === total - 1,
            isDraggable,
            draggable: true,
            onDragStart: dragHandlers.onDragStart,
            onDragOver: dragHandlers.onDragOver,
            onDragLeave: dragHandlers.onDragLeave,
            onDrop: dragHandlers.onDrop,
            onDragEnd: dragHandlers.onDragEnd,
            className: cn(
              rowData.tableRowProps.className,
              dragClasses.isDragOver &&
                (dragClasses.dropPosition === "after"
                  ? "!border-b-2 !border-b-primary"
                  : "!border-t-2 !border-t-primary")
            ),
          },
        }}
      />
    );
  };

  const rows = table.getRowModel().rows;
  const totalRows = (pinnedCategory ? 1 : 0) + rows.length;

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
          {pinnedCategory
            ? renderCategoryRow(pinnedCategory, 0, totalRows, { isPinned: true })
            : null}
          {rows.map((row, index) =>
            renderCategoryRow(
              row.original,
              pinnedCategory ? index + 1 : index,
              totalRows
            )
          )}
        </TableBody>
      </TableViewWrapper>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmation.open}
        targetCount={deleteConfirmation.targetIds.length}
        entityName="category"
        associationMessage="all product associations"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

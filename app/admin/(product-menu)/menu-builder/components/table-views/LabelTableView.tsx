"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
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
    deleteCategory,
    cloneCategory,
    updateCategory,
    detachCategory,
    attachCategory,
  } = useMenuBuilder();

  const currentLabelId = builder.currentLabelId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Context menu highlight state
  const [contextRowId, setContextRowId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    targetIds: string[];
  }>({ open: false, targetIds: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

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
  // Context menu handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleConfirmDelete = useCallback(async () => {
    const { targetIds } = deleteConfirmation;
    if (!targetIds || targetIds.length === 0) return;

    setIsDeleting(true);
    try {
      const results = await Promise.all(targetIds.map((id) => deleteCategory(id)));
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast({
          title: targetIds.length > 1 ? `${targetIds.length} categories deleted` : "Category deleted",
        });
      } else {
        toast({ title: "Error", description: "Some categories could not be deleted", variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, targetIds: [] });
    }
  }, [deleteConfirmation, deleteCategory, toast]);

  const handleContextDelete = useCallback(
    (categoryId: string) => {
      setDeleteConfirmation({ open: true, targetIds: [categoryId] });
    },
    []
  );

  const handleContextClone = useCallback(
    async (categoryId: string) => {
      const result = await cloneCategory({ id: categoryId });
      if (result.ok) {
        toast({ title: "Category cloned" });
      } else {
        toast({ title: "Error", description: "Could not clone category", variant: "destructive" });
      }
    },
    [cloneCategory, toast]
  );

  const handleContextVisibility = useCallback(
    async (categoryId: string, visible: boolean) => {
      const result = await updateCategory(categoryId, { isVisible: visible });
      if (!result.ok) {
        toast({ title: "Error", description: "Could not update visibility", variant: "destructive" });
      }
    },
    [updateCategory, toast]
  );

  const handleContextRemove = useCallback(
    async (categoryId: string) => {
      if (!currentLabelId) return;
      const result = await detachCategory(currentLabelId, categoryId);
      if (result.ok) {
        toast({ title: "Category removed from label" });
      } else {
        toast({ title: "Error", description: "Could not remove category", variant: "destructive" });
      }
    },
    [currentLabelId, detachCategory, toast]
  );

  const handleMoveUp = useCallback(
    async (categoryId: string) => {
      const index = labelCategories.findIndex((c) => c.id === categoryId);
      if (index <= 0 || !currentLabelId) return;
      const newOrder = labelCategories.map((c) => c.id);
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      await reorderCategoriesInLabel(currentLabelId, newOrder);
      setSorting([]); // Clear sorting when manually reordering
    },
    [labelCategories, currentLabelId, reorderCategoriesInLabel]
  );

  const handleMoveDown = useCallback(
    async (categoryId: string) => {
      const index = labelCategories.findIndex((c) => c.id === categoryId);
      if (index < 0 || index >= labelCategories.length - 1 || !currentLabelId) return;
      const newOrder = labelCategories.map((c) => c.id);
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      await reorderCategoriesInLabel(currentLabelId, newOrder);
      setSorting([]); // Clear sorting when manually reordering
    },
    [labelCategories, currentLabelId, reorderCategoriesInLabel]
  );

  const handleMoveTo = useCallback(
    async (categoryId: string, toLabelId: string) => {
      if (!currentLabelId) return;
      const category = categories.find((c) => c.id === categoryId);
      const toLabel = labels.find((l) => l.id === toLabelId);

      // Detach from current label
      const detachResult = await detachCategory(currentLabelId, categoryId);
      if (!detachResult.ok) {
        toast({ title: "Move failed", description: "Failed to remove from current label", variant: "destructive" });
        return;
      }

      // Attach to target label
      const attachResult = await attachCategory(toLabelId, categoryId);
      if (!attachResult.ok) {
        // Try to revert
        await attachCategory(currentLabelId, categoryId);
        toast({ title: "Move failed", description: "Failed to add to target label", variant: "destructive" });
        return;
      }

      toast({
        title: "Category moved",
        description: `Moved "${category?.name ?? "Category"}" to "${toLabel?.name ?? "Label"}"`,
      });
    },
    [currentLabelId, categories, labels, attachCategory, detachCategory, toast]
  );

  // Get move targets (other visible labels)
  const moveToTargets = useMemo(
    () =>
      labels
        .filter((l) => l.isVisible && l.id !== currentLabelId)
        .map((l) => ({ id: l.id, name: l.name })),
    [labels, currentLabelId]
  );

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
      onContextMenuOpenChange: (rowId, open) =>
        setContextRowId(open ? rowId : null),
      onMouseEnter: setHoveredRowId,
      onMouseLeave: () => setHoveredRowId(null),
      onRowClick: handleClick,
      onRowDoubleClick: handleDoubleClick,
    }),
    [
      contextMenuHandlers,
      selectionInfo,
      extra,
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
    isContextRow: contextRowId === category.id,
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
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ open: false, targetIds: [] })}
      />
    </>
  );
}

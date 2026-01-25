"use client";
"use no memo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Eye, EyeOff, Layers } from "lucide-react";
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
  } = useContextSelectionModel(builder, { selectableKeys: registry.allKeys as string[] });

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
    options?: { isPinned?: boolean; isFirstRow?: boolean; isLastRow?: boolean }
  ) => {
    const _isPinned = options?.isPinned === true;
    const isFirstRow = options?.isFirstRow === true;
    const isLastRow = options?.isLastRow === true;
    const categoryKey = createKey("category", category.id);
    const isCategorySelected = isSelected(categoryKey);
    const isRowHovered = hoveredRowId === category.id;
    const isContextRow = contextRowId === category.id;
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
        isFirst={isFirstRow}
        isLast={isLastRow}
        selectedCount={actionableRoots.length}
        isInSelection={isCategorySelected}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        moveToTargets={moveToTargets}
        currentParentId={currentLabelId ?? undefined}
        onOpenChange={(open) => setContextRowId(open ? category.id : null)}
        onClone={() => handleContextClone(category.id)}
        onVisibilityToggle={(visible) => handleContextVisibility(category.id, visible)}
        onRemove={() => handleContextRemove(category.id)}
        onDelete={() => handleContextDelete(category.id)}
        onMoveUp={() => handleMoveUp(category.id)}
        onMoveDown={() => handleMoveDown(category.id)}
        onMoveTo={(toLabelId) => handleMoveTo(category.id, toLabelId)}
      >
      <TableRow
        data-state={isCategorySelected ? "selected" : undefined}
        isSelected={isCategorySelected}
        isContextRow={isContextRow}
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
          {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true, isFirstRow: true }) : null}
          {rows.map((row, index) =>
            renderCategoryRow(row.original, {
              isFirstRow: !pinnedCategory && index === 0,
              isLastRow: index === rows.length - 1,
            })
          )}
        </TableBody>
      </TableViewWrapper>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmation({ open: false, targetIds: [] });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Delete {deleteConfirmation.targetIds.length}{" "}
              {deleteConfirmation.targetIds.length === 1 ? "category" : "categories"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The{" "}
              {deleteConfirmation.targetIds.length === 1 ? "category" : "categories"} will be
              permanently deleted and all product associations will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

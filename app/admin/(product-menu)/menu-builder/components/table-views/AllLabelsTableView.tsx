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
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Tag } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  useContextRowHighlight,
  useMoveHandlers,
  useBulkAction,
  useDeleteConfirmation,
  useContextClone,
  useContextVisibility,
  useRelationshipToggle,
} from "../../../hooks/context-menu";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useSingleEntityDnd } from "../../../hooks/dnd/useSingleEntityDnd";
import { useDnDEligibility } from "../../../hooks/dnd/useDnDEligibility";
import { buildFlatRegistry } from "../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { GroupedEntitiesGhost, GhostRowContent } from "./shared/table/GroupedEntitiesGhost";
import { useGroupedEntitiesGhost } from "../../../hooks/dnd/useGroupedEntitiesGhost";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuLabel } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { TouchTarget } from "./shared/cells/TouchTarget";
import { InlineIconCell } from "./shared/cells/InlineIconCell";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { allLabelsWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import { DragHandleCell } from "./shared/cells/DragHandleCell";
import { RowContextMenu } from "./shared/cells/RowContextMenu";

const ALL_LABELS_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "icon", label: "Icon" },
  { id: "name", label: "Label" },
  { id: "visibility", label: "Visibility" },
  { id: "categories", label: "Categories" },
  { id: "dragHandle", label: "" },
];

export function AllLabelsTableView() {
  const { builder, labels, categories, updateLabel, reorderLabels, createNewLabel, deleteLabel, cloneLabel, attachCategory, detachCategory } = useMenuBuilder();

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Context menu row highlighting
  const { isContextRow, handleContextOpenChange } = useContextRowHighlight();

  // Delete confirmation dialog
  const {
    deleteConfirmation,
    isDeleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation({
    deleteEntity: (_kind, id) => deleteLabel(id),
  });

  const {
    editingId: editingLabelId,
    pinnedId: pinnedLabelId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "label", { autoClearPinned: true });

  // Build registry for this flat view
  const registry = useMemo(() => buildFlatRegistry(labels, "label"), [labels]);

  const { pinnedRow: pinnedLabel, rowsForTable: labelsForTable } = usePinnedRow({
    rows: labels,
    pinnedId: pinnedLabelId,
    isSortingActive: false, // No sorting in this view (manual drag order)
    defaultSort: null, // Labels come pre-sorted from server (ascending by order)
  });

  // IMPORTANT: selectableKeys must match the VISUAL row order
  // so that shift+click range selection selects the correct rows.
  // Visual order: pinned row first (if any), then the rest.
  const selectableKeys = useMemo(() => {
    const keys: string[] = [];
    if (pinnedLabel) {
      keys.push(createKey("label", pinnedLabel.id));
    }
    for (const label of labelsForTable) {
      keys.push(createKey("label", label.id));
    }
    return keys;
  }, [pinnedLabel, labelsForTable]);

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
    navigate: (kind, entityId) => builder.navigateToLabel(entityId),
    rangeSelect,
    anchorKey,
  });

  // Drag & Drop handlers using eligibility (action-bar pattern)
  const { getDragHandlers: getBaseDragHandlers, getDragClasses, getIsDraggable, eligibleEntityIds } = useSingleEntityDnd({
    items: labels,
    onReorder: async (ids) => {
      await reorderLabels(ids);
    },
    eligibility,
  });

  // Multi-drag ghost for count badge (unique ID for this view)
  const GHOST_ID = "all-labels-drag-ghost";
  const { setGhostImage } = useGroupedEntitiesGhost(GHOST_ID);

  // Pre-compute first selected label for ghost content using actionableRoots
  // (must exist BEFORE drag starts for synchronous setDragImage call)
  const firstSelectedLabel = useMemo(() => {
    if (actionableRoots.length <= 1) return null;
    // Extract entity IDs from actionable root keys (format: "label:id")
    const actionableEntityIds = new Set(
      actionableRoots.map((key) => key.split(":")[1])
    );
    // Find first label matching an actionable entity
    for (const label of labels) {
      if (actionableEntityIds.has(label.id)) {
        return label;
      }
    }
    return null;
  }, [actionableRoots, labels]);

  // Wrap drag handlers to set ghost image for multi-select
  const getDragHandlers = useCallback(
    (itemId: string) => {
      const baseHandlers = getBaseDragHandlers(itemId);
      const labelKey = createKey("label", itemId);
      // Use actionableRoots for multi-drag check (consistent with selection model)
      const isInActionableRoots = actionableRoots.includes(labelKey);
      const isMultiSelect = isInActionableRoots && actionableRoots.length > 1;

      return {
        ...baseHandlers,
        onDragStart: (e: React.DragEvent) => {
          baseHandlers.onDragStart(e);
          if (isMultiSelect) {
            setGhostImage(e);
          }
        },
      };
    },
    [getBaseDragHandlers, actionableRoots, setGhostImage]
  );

  const { toast } = useToast();

  // Check if a label name already exists (case-insensitive)
  const isDuplicateLabelName = useCallback(
    (name: string, excludeId: string) => {
      const normalizedName = name.trim().toLowerCase();
      return labels.some(
        (l) => l.id !== excludeId && l.name.trim().toLowerCase() === normalizedName
      );
    },
    [labels]
  );

  // Inline edit handlers with undo/redo
  const { handleNameSave, handleIconSave, handleVisibilitySave } = useInlineEditHandlers({
    builder,
    entityKind: "label",
    getItem: (id) => labels.find((l) => l.id === id),
    updateItem: updateLabel,
    onSaveComplete: clearEditing,
    isDuplicateName: isDuplicateLabelName,
    onError: (message) => toast({ title: "Error", description: message, variant: "destructive" }),
  });

  // Helper: Get comma-separated category names for a label
  const getLabelCategories = useCallback((label: MenuLabel) => {
    const cats = label.categories ?? [];
    if (cats.length === 0) return "—";
    if (cats.length === 1) return cats[0].name;
    return cats.map((c) => c.name).join(", ");
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu data (targets for submenus)
  // ─────────────────────────────────────────────────────────────────────────────

  // Category targets for manage-categories submenu (all available categories)
  const categoryTargets = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu handlers (using shared hooks)
  // ─────────────────────────────────────────────────────────────────────────────

  // Bulk action support for context menu operations
  const { getTargetIds } = useBulkAction({
    isSelected,
    actionableRoots,
    isSameKind,
    entityKind: "label",
  });

  // Move up/down handlers for context menu reordering
  const { handleMoveUp, handleMoveDown, getPositionFlags } = useMoveHandlers({
    items: labelsForTable,
    reorder: reorderLabels,
  });

  // Clone (with bulk support)
  const { handleClone: handleContextClone } = useContextClone({
    cloneEntity: (id) => cloneLabel({ id }),
    getTargetIds,
    entityLabel: { singular: "Label", plural: "labels" },
  });

  // Delete handler
  const handleContextDelete = useCallback(
    (labelId: string) => {
      requestDelete(labelId, "label", getTargetIds);
    },
    [requestDelete, getTargetIds]
  );

  // Visibility toggle (with bulk support + undo for single items)
  const { handleVisibilityToggle: handleBulkVisibility } = useContextVisibility({
    updateEntity: (id, visible) => updateLabel(id, { isVisible: visible }),
    getTargetIds,
    entityLabel: { singular: "Label", plural: "labels" },
  });

  // Wrap to use undo-enabled handler for single items
  const handleContextVisibilityToggle = useCallback(
    async (labelId: string, visible: boolean) => {
      const targetIds = getTargetIds(labelId);
      if (targetIds.length === 1) {
        // Single item - use handler with undo support
        await handleVisibilitySave(labelId, visible);
      } else {
        // Bulk operation - use hook handler
        await handleBulkVisibility(labelId, visible);
      }
    },
    [getTargetIds, handleVisibilitySave, handleBulkVisibility]
  );

  // Category toggle for manage-categories submenu
  const { handleToggle: handleCategoryToggle } = useRelationshipToggle({
    attach: attachCategory,
    detach: detachCategory,
    relationshipLabel: "category",
  });

  // Column definitions - must match ALL_LABELS_HEADER_COLUMNS ids
  // Note: When adding a new column, add entry here AND in ALL_LABELS_HEADER_COLUMNS
  const columns = useMemo<ColumnDef<MenuLabel>[]>(
    () => [
      { id: "select", accessorFn: () => null },
      { id: "icon", accessorFn: (row) => row.icon },
      { id: "name", accessorFn: (row) => row.name },
      { id: "categories", accessorFn: (row) => getLabelCategories(row) },
      { id: "visibility", accessorFn: (row) => (row.isVisible ? 1 : 0) },
      { id: "dragHandle", accessorFn: () => null },
    ],
    [getLabelCategories]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: labelsForTable,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableSorting: false, // Row order dictates DB label order via drag-drop
  });

  const allSelected = selectionState.allSelected;
  const someSelected = selectionState.someSelected;

  // Empty state
  if (labels.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No Labels Yet"
        description="Get started by creating your first label"
        actionLabel="New Label"
        onAction={async () => {
          const createdId = await createNewLabel();
          if (createdId) {
            builder.setPinnedNew({ kind: "label", id: createdId });
            builder.setEditing({ kind: "label", id: createdId });
          }
        }}
      />
    );
  }

  const renderLabelRow = (label: MenuLabel, options?: { isPinned?: boolean; isLastRow?: boolean }) => {
    const isPinned = options?.isPinned === true;
    const isLastRow = options?.isLastRow === true;
    const labelKey = createKey("label", label.id);
    const isLabelSelected = isSelected(labelKey);
    const isRowHovered = hoveredRowId === label.id;
    const isRowContextMenu = isContextRow(label.id);
    const positionFlags = getPositionFlags(label.id);
    const dragClasses = getDragClasses(label.id);
    const dragHandlers = getDragHandlers(label.id);

    // Get cursor styling state for this row
    const isDraggable = getIsDraggable(label.id);

    return (
      <RowContextMenu
        key={label.id}
        entityKind="label"
        viewType="all-labels"
        entityId={label.id}
        isVisible={label.isVisible}
        isFirst={positionFlags.isFirst}
        isLast={positionFlags.isLast}
        selectedCount={actionableRoots.length}
        isInSelection={isLabelSelected}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        categoryTargets={categoryTargets}
        attachedCategoryIds={label.categories?.map((c) => c.id) ?? []}
        onOpenChange={handleContextOpenChange(label.id)}
        onClone={() => handleContextClone(label.id)}
        onVisibilityToggle={(visible) => handleContextVisibilityToggle(label.id, visible)}
        onDelete={() => handleContextDelete(label.id)}
        onMoveUp={() => handleMoveUp(label.id)}
        onMoveDown={() => handleMoveDown(label.id)}
        onCategoryToggle={(categoryId, shouldAttach) => handleCategoryToggle(label.id, categoryId, shouldAttach)}
      >
      <TableRow
        data-state={isLabelSelected ? "selected" : undefined}
        isSelected={isLabelSelected}
        isContextRow={isRowContextMenu}
        isHidden={!label.isVisible}
        isDragging={dragClasses.isDragging || dragClasses.isInDragSet}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        isDraggable={isDraggable}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(label.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary")
        )}
        onRowClick={(options) => handleClick(labelKey, options)}
        onRowDoubleClick={() => handleDoubleClick(labelKey)}
      >
        {/* Checkbox */}
        <TableCell config={allLabelsWidthPreset.select} data-row-click-ignore>
          <TouchTarget>
            <CheckboxCell
              id={label.id}
              checked={isLabelSelected}
              onToggle={() => onToggle(labelKey)}
              isSelectable
              alwaysVisible={isLabelSelected}
              ariaLabel={`Select ${label.name}`}
              anchorKey={anchorKey}
              onRangeSelect={anchorKey && anchorKey !== labelKey ? () => rangeSelect(labelKey) : undefined}
            />
          </TouchTarget>
        </TableCell>

        {/* Icon */}
        <TableCell config={allLabelsWidthPreset.icon} data-row-click-ignore>
          <InlineIconCell
            id={label.id}
            icon={label.icon}
            onSave={handleIconSave}
            isRowHovered={isRowHovered}
          />
        </TableCell>

        {/* Name */}
        <TableCell config={allLabelsWidthPreset.name}>
          <InlineNameEditor
            id={label.id}
            initialValue={label.name}
            isEditing={editingLabelId === label.id}
            isHidden={!label.isVisible}
            onStartEdit={() => builder.setEditing({ kind: "label", id: label.id })}
            onCancelEdit={() => {
              clearEditing();
              if (isPinned || pinnedLabelId === label.id) {
                clearPinnedIfMatches(label.id);
              }
            }}
            onSave={async (id, name) => {
              await handleNameSave(id, name);
              if (isPinned || pinnedLabelId === label.id) {
                clearPinnedIfMatches(label.id);
              }
            }}
          />
        </TableCell>

        {/* Visibility */}
        <TableCell config={allLabelsWidthPreset.visibility}>
          <VisibilityCell
            id={label.id}
            isVisible={label.isVisible}
            variant="switch"
            onToggle={handleVisibilitySave}
          />
        </TableCell>

        {/* Categories */}
        <TableCell config={allLabelsWidthPreset.categories} className="text-sm">
          {getLabelCategories(label)}
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={allLabelsWidthPreset.dragHandle} data-row-click-ignore>
          <DragHandleCell
            isEligible={eligibility.canDrag}
            isRowInEligibleSet={eligibleEntityIds.has(label.id)}
            checkboxState={getCheckboxState(labelKey)}
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
          columns={ALL_LABELS_HEADER_COLUMNS}
          preset={allLabelsWidthPreset}
          table={table}
          hasSelectAll
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
        />

        <TableBody>
          {pinnedLabel ? renderLabelRow(pinnedLabel, { isPinned: true }) : null}
          {rows.map((row, index) =>
            renderLabelRow(row.original, {
              isLastRow: index === rows.length - 1,
            })
          )}
        </TableBody>
      </TableViewWrapper>

      {/* Multi-drag ghost with count badge - pre-rendered based on selection */}
      {actionableRoots.length > 1 && firstSelectedLabel && (
        <GroupedEntitiesGhost
          key={`ghost-${actionableRoots.length}-${firstSelectedLabel.id}`}
          ghostId={GHOST_ID}
          count={actionableRoots.length}
        >
          <GhostRowContent name={firstSelectedLabel.name} />
        </GroupedEntitiesGhost>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => {
          if (!open) cancelDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Delete {deleteConfirmation.targetIds.length}{" "}
              {deleteConfirmation.targetIds.length === 1
                ? deleteConfirmation.entityKind
                : deleteConfirmation.entityKind === "label" ? "labels" : "categories"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The{" "}
              {deleteConfirmation.targetIds.length === 1
                ? deleteConfirmation.entityKind
                : deleteConfirmation.entityKind === "label" ? "labels" : "categories"}{" "}
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
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

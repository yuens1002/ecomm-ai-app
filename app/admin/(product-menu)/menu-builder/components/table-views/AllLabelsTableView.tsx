"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Tag } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useDragReorder } from "../../../hooks/useDragReorder";
import { useDnDEligibility } from "../../../hooks/dnd/useDnDEligibility";
import { buildFlatRegistry } from "../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { MultiDragGhost, GhostRowContent } from "../../../hooks/dnd/MultiDragGhost";
import { useMultiDragGhost } from "../../../hooks/dnd/useMultiDragGhost";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuLabel } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
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

const ALL_LABELS_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "icon", label: "Icon" },
  { id: "name", label: "Label" },
  { id: "visibility", label: "Visibility" },
  { id: "categories", label: "Categories" },
  { id: "dragHandle", label: "" },
];

export function AllLabelsTableView() {
  const { builder, labels, updateLabel, reorderLabels, createNewLabel } = useMenuBuilder();

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const {
    editingId: editingLabelId,
    pinnedId: pinnedLabelId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "label", { autoClearPinned: true });

  // Build registry for this flat view
  const registry = useMemo(() => buildFlatRegistry(labels, "label"), [labels]);

  const {
    selectionState,
    onSelectAll,
    onToggle,
    isSelected,
    getCheckboxState,
    actionableRoots,
    selectedKind,
    isSameKind,
  } = useContextSelectionModel(builder, { selectableKeys: registry.allKeys as string[] });

  // Derive DnD eligibility from selection state (action-bar pattern)
  const eligibility = useDnDEligibility({
    actionableRoots,
    selectedKind,
    isSameKind,
    registry,
  });

  // Build set of eligible entity IDs for row-specific drag handle state
  const eligibleEntityIds = useMemo(
    () => new Set(eligibility.draggedEntities.map((e) => e.entityId)),
    [eligibility.draggedEntities]
  );

  // Unified click handler
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    navigate: (kind, entityId) => builder.navigateToLabel(entityId),
  });

  const { pinnedRow: pinnedLabel, rowsForTable: labelsForTable } = usePinnedRow({
    rows: labels,
    pinnedId: pinnedLabelId,
    isSortingActive: false, // No sorting in this view (manual drag order)
    // Uses built-in default sort by order field
  });

  // Drag & Drop handlers using eligibility (action-bar pattern)
  const { getDragHandlers: getBaseDragHandlers, getDragClasses, dragState } = useDragReorder({
    items: labels,
    onReorder: async (ids) => {
      await reorderLabels(ids);
    },
    eligibility,
    getIdFromKey: (key) => key.split(":")[1],
  });

  // Multi-drag ghost for count badge (unique ID for this view)
  const GHOST_ID = "all-labels-drag-ghost";
  const { setGhostImage } = useMultiDragGhost(GHOST_ID);

  // Get first dragged label for ghost content (use dragState.draggedIds for correct count)
  const firstDraggedLabel = useMemo(() => {
    if (dragState.draggedIds.length <= 1) return null;
    for (const label of labels) {
      if (dragState.draggedIds.includes(label.id)) {
        return label;
      }
    }
    return null;
  }, [dragState.draggedIds, labels]);

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
    const dragClasses = getDragClasses(label.id);
    const dragHandlers = getDragHandlers(label.id);

    return (
      <TableRow
        key={label.id}
        data-state={isLabelSelected ? "selected" : undefined}
        isSelected={isLabelSelected}
        isHidden={!label.isVisible}
        isDragging={dragClasses.isDragging || dragClasses.isInDragSet}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
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
        onRowClick={() => handleClick(labelKey)}
        onRowDoubleClick={() => handleDoubleClick(labelKey)}
      >
        {/* Checkbox */}
        <TableCell config={allLabelsWidthPreset.select} data-row-click-ignore>
          <CheckboxCell
            id={label.id}
            checked={isLabelSelected}
            onToggle={() => onToggle(labelKey)}
            isSelectable
            alwaysVisible={isLabelSelected}
            ariaLabel={`Select ${label.name}`}
          />
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
            renderLabelRow(row.original, { isLastRow: index === rows.length - 1 })
          )}
        </TableBody>
      </TableViewWrapper>

      {/* Multi-drag ghost with count badge - render when multiple items dragged */}
      {dragState.dragCount > 1 && firstDraggedLabel && (
        <MultiDragGhost
          key={`ghost-${dragState.dragCount}-${firstDraggedLabel.id}`}
          ghostId={GHOST_ID}
          count={dragState.dragCount}
        >
          <GhostRowContent name={firstDraggedLabel.name} />
        </MultiDragGhost>
      )}
    </>
  );
}

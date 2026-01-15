"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { GripVertical, Tag } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useDragReorder } from "../../../hooks/useDragReorder";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuLabel } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { EmptyState } from "../shared/EmptyState";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { InlineIconCell } from "./shared/cells/InlineIconCell";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { allLabelsWidthPreset } from "./shared/table/columnWidthPresets";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";

const ALL_LABELS_HEADER_COLUMNS: TableHeaderColumn[] = [
  {
    id: "select",
    label: "",
    isCheckbox: true,
    width: allLabelsWidthPreset.select?.head,
  },
  {
    id: "icon",
    label: "Icon",
    align: "center",
    width: allLabelsWidthPreset.icon?.head,
  },
  {
    id: "name",
    label: "Label",
    align: "left",
    width: allLabelsWidthPreset.name?.head,
  },
  {
    id: "categories",
    label: "Categories",
    align: "left",
    width: allLabelsWidthPreset.categories?.head,
  },
  {
    id: "visibility",
    label: "Visibility",
    align: "center",
    width: allLabelsWidthPreset.visibility?.head,
  },
  {
    id: "dragHandle",
    label: "",
    align: "center",
    width: allLabelsWidthPreset.dragHandle?.head,
  },
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

  const selectableLabelIds = useMemo(() => labels.map((l) => l.id), [labels]);
  const {
    isSelectionActive: isLabelSelectionActive,
    selectionState,
    onSelectAll,
    onToggleId: onToggleLabelId,
    isSelected: isLabelSelected,
  } = useContextSelectionModel(builder, { kind: "label", selectableIds: selectableLabelIds });

  const { pinnedRow: pinnedLabel, rowsForTable: labelsForTable } = usePinnedRow({
    rows: labels,
    pinnedId: pinnedLabelId,
    isSortingActive: false, // No sorting in this view (manual drag order)
    // Uses built-in default sort by order field
  });

  // Drag & Drop handlers
  const { getDragHandlers, getDragClasses } = useDragReorder({
    items: labels,
    onReorder: async (ids) => {
      await reorderLabels(ids);
    },
  });

  // Inline edit handlers with undo/redo
  const { handleNameSave, handleIconSave, handleVisibilitySave } = useInlineEditHandlers({
    builder,
    entityKind: "label",
    getItem: (id) => labels.find((l) => l.id === id),
    updateItem: updateLabel,
    onSaveComplete: clearEditing,
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

  const renderLabelRow = (label: MenuLabel, options?: { isPinned?: boolean }) => {
    const isPinned = options?.isPinned === true;
    const isSelected = isLabelSelected(label.id);
    const isRowHovered = hoveredRowId === label.id;
    const dragClasses = getDragClasses(label.id);
    const dragHandlers = getDragHandlers(label.id);

    return (
      <TableRow
        key={label.id}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected}
        isDragging={dragClasses.isDragging}
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
              ? "border-b-2 border-b-primary"
              : "border-t-2 border-t-primary")
        )}
        onRowClick={() => onToggleLabelId(label.id)}
        onRowDoubleClick={() => builder.navigateToLabel(label.id)}
      >
        {/* Checkbox */}
        <TableCell className={allLabelsWidthPreset.select?.cell} data-row-click-ignore>
          <CheckboxCell
            id={label.id}
            checked={isSelected}
            onToggle={onToggleLabelId}
            isSelectable={isLabelSelectionActive}
            disabled={!isLabelSelectionActive}
            alwaysVisible={isSelected}
            ariaLabel={`Select ${label.name}`}
          />
        </TableCell>

        {/* Icon */}
        <TableCell align="center" className={allLabelsWidthPreset.icon?.cell} data-row-click-ignore>
          <div className="flex justify-center">
            <InlineIconCell
              id={label.id}
              icon={label.icon}
              onSave={handleIconSave}
              isRowHovered={isRowHovered}
            />
          </div>
        </TableCell>

        {/* Name */}
        <TableCell className={allLabelsWidthPreset.name?.cell}>
          <InlineNameEditor
            id={label.id}
            initialValue={label.name}
            isEditing={editingLabelId === label.id}
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

        {/* Categories */}
        <TableCell className={"text-sm " + (allLabelsWidthPreset.categories?.cell ?? "")}>
          {getLabelCategories(label)}
        </TableCell>

        {/* Visibility */}
        <TableCell align="center" className={allLabelsWidthPreset.visibility?.cell}>
          <div className="flex justify-center">
            <VisibilityCell
              id={label.id}
              isVisible={label.isVisible}
              variant="switch"
              onToggle={handleVisibilitySave}
            />
          </div>
        </TableCell>

        {/* Drag Handle */}
        <TableCell className={allLabelsWidthPreset.dragHandle?.cell} data-row-click-ignore>
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

  return (
    <>
      <TableHeader
        table={table}
        hasSelectAll
        allSelected={allSelected}
        someSelected={someSelected}
        selectAllDisabled={!isLabelSelectionActive}
        onSelectAll={onSelectAll}
        columns={ALL_LABELS_HEADER_COLUMNS}
      />

      <TableBody>
        {pinnedLabel ? renderLabelRow(pinnedLabel, { isPinned: true }) : null}
        {table.getRowModel().rows.map((row) => renderLabelRow(row.original))}
      </TableBody>
    </>
  );
}

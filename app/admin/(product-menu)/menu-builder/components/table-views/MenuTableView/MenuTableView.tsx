"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, GripVertical, LayoutGrid } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useContextRowUiState } from "../../../../hooks/useContextRowUiState";
import { useInlineEditHandlers } from "../../../../hooks/useInlineEditHandlers";
import { useMenuBuilder } from "../../../MenuBuilderProvider";
import { CheckboxCell } from "../shared/cells/CheckboxCell";
import { ChevronToggleCell } from "../shared/cells/ChevronToggleCell";
import { InlineIconCell } from "../shared/cells/InlineIconCell";
import { InlineNameEditor } from "../shared/cells/InlineNameEditor";
import { menuViewWidthPreset } from "../shared/table/columnWidthPresets";
import { EmptyState } from "../shared/table/EmptyState";
import { TableCell } from "../shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "../shared/table/TableHeader";
import { TableRow } from "../shared/table/TableRow";
import { TableViewWrapper } from "../shared/table/TableViewWrapper";
import type {
  FlatCategoryRow,
  FlatLabelRow,
  FlatMenuRow,
  FlatProductRow,
} from "./types";
import { isCategoryRow, isLabelRow, isProductRow } from "./types";
import { useFlattenedMenuRows } from "./useFlattenedMenuRows";
import { useMenuSelectionState } from "./useMenuSelectionState";
import { useMenuTableDragReorder } from "./useMenuTableDragReorder";

/** Indentation in pixels per hierarchy level */
const INDENT_PER_LEVEL = 24;

// Column order: select, name (with icon for labels), categories, visibility, products, dragHandle
const MENU_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Name" },
  { id: "categories", label: "Categories" },
  { id: "visibility", label: "Visibility" },
  { id: "products", label: "Products" },
  { id: "dragHandle", label: "" },
];

/**
 * MenuTableView - 3-level hierarchical table showing Labels → Categories → Products
 *
 * Features:
 * - Only shows visible labels (isVisible=true)
 * - Expand/collapse for labels and categories
 * - Level-based indentation (0px labels, 24px categories, 48px products)
 * - Drag-and-drop reordering (same-level and same-parent only)
 * - Auto-collapse all on label drag
 * - Selection (single entity type at a time)
 * - Inline editing for label names and icons
 * - Eye icon for visibility (read-only display)
 */
export function MenuTableView() {
  const {
    builder,
    labels,
    categories,
    products,
    updateLabel,
    reorderLabels,
    reorderCategoriesInLabel,
    reorderProductsInCategory,
  } = useMenuBuilder();

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Filter to only show visible labels in the menu table
  const visibleLabels = useMemo(
    () => labels.filter((l) => l.isVisible),
    [labels]
  );

  // Flatten hierarchy into rows based on expand state (only visible labels)
  const rows = useFlattenedMenuRows({
    labels: visibleLabels,
    categories,
    products,
    expandedIds: builder.expandedIds,
  });

  // Row UI state for label editing
  const {
    editingId: editingLabelId,
    pinnedId: pinnedLabelId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "label", { autoClearPinned: true });

  // Hierarchical selection state with tri-state checkboxes
  const {
    getRowCheckboxState,
    getRowCheckboxVisible,
    onToggleRow,
    headerState,
    onSelectAllLabels,
    isSelectAllDisabled,
  } = useMenuSelectionState({
    rows,
    labels: visibleLabels,
    products,
    builder,
  });

  // Inline edit handlers for label name, icon
  const { handleNameSave, handleIconSave } = useInlineEditHandlers({
    builder,
    entityKind: "label",
    getItem: (id) => labels.find((l) => l.id === id),
    updateItem: updateLabel,
    onSaveComplete: clearEditing,
  });

  // Hierarchical drag-and-drop with auto-collapse on label drag and hover-to-expand
  const { getDragHandlers: getBaseDragHandlers, getDragClasses } = useMenuTableDragReorder({
    rows,
    labels: visibleLabels,
    products,
    reorderFunctions: {
      reorderLabels,
      reorderCategoriesInLabel,
      reorderProductsInCategory,
    },
    pushUndoAction: builder.pushUndoAction,
    onExpandItem: builder.toggleExpand,
  });

  // Wrap drag handlers to auto-collapse on label drag start
  const getDragHandlers = useCallback(
    (row: FlatMenuRow) => {
      const baseHandlers = getBaseDragHandlers(row);
      return {
        ...baseHandlers,
        onDragStart: () => {
          // Auto-collapse all when dragging a label
          if (row.level === "label") {
            builder.collapseAll();
          }
          baseHandlers.onDragStart();
        },
      };
    },
    [getBaseDragHandlers, builder]
  );

  // Handle row click (toggle selection by level)
  const handleRowClick = useCallback(
    (row: FlatMenuRow) => {
      onToggleRow(row);
    },
    [onToggleRow]
  );

  // Handle double-click navigation
  const handleRowDoubleClick = useCallback(
    (row: FlatMenuRow) => {
      switch (row.level) {
        case "label":
          builder.navigateToLabel(row.id);
          break;
        case "category":
          builder.navigateToCategory(row.id);
          break;
        case "product":
          // Products don't have a dedicated view to navigate to
          break;
      }
    },
    [builder]
  );

  // Render a label row
  const renderLabelRow = (row: FlatLabelRow, isLastRow: boolean) => {
    const label = row.data;
    const checkboxState = getRowCheckboxState(row);
    const checkboxVisible = getRowCheckboxVisible(row);
    const isSelected = checkboxState === "checked";
    const isIndeterminate = checkboxState === "indeterminate";
    const isRowHovered = hoveredRowId === row.id;
    const dragClasses = getDragClasses(row);
    const dragHandlers = getDragHandlers(row);
    const isPinned = pinnedLabelId === row.id;

    return (
      <TableRow
        key={row.id}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected || isIndeterminate}
        isDragging={dragClasses.isDragging}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(row.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary"),
          dragClasses.isAutoExpanded && "animate-auto-expand-flash"
        )}
        onRowClick={() => handleRowClick(row)}
        onRowDoubleClick={() => handleRowDoubleClick(row)}
      >
        {/* Checkbox */}
        <TableCell config={menuViewWidthPreset.select} data-row-click-ignore>
          <CheckboxCell
            id={row.id}
            checked={isSelected}
            indeterminate={isIndeterminate}
            onToggle={() => onToggleRow(row)}
            isSelectable={checkboxVisible}
            disabled={!checkboxVisible}
            alwaysVisible={isSelected || isIndeterminate}
            ariaLabel={`Select ${row.name}`}
          />
        </TableCell>

        {/* Name with chevron, icon, and inline editing */}
        <TableCell config={menuViewWidthPreset.name}>
          <div className="flex items-center">
            {/* Chevron */}
            <ChevronToggleCell
              isExpanded={row.isExpanded}
              isExpandable={row.isExpandable}
              onToggle={() => builder.toggleExpand(row.id)}
              ariaLabel={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
            />
            {/* Inline Icon */}
            <InlineIconCell
              id={row.id}
              icon={label.icon}
              onSave={handleIconSave}
              isRowHovered={isRowHovered}
            />
            {/* Inline Name Editor */}
            <InlineNameEditor
              id={row.id}
              initialValue={row.name}
              isEditing={editingLabelId === row.id}
              onStartEdit={() => builder.setEditing({ kind: "label", id: row.id })}
              onCancelEdit={() => {
                clearEditing();
                if (isPinned) {
                  clearPinnedIfMatches(row.id);
                }
              }}
              onSave={async (id, name) => {
                await handleNameSave(id, name);
                if (isPinned) {
                  clearPinnedIfMatches(row.id);
                }
              }}
            />
          </div>
        </TableCell>

        {/* Categories count */}
        <TableCell config={menuViewWidthPreset.categories}>
          <span className="text-sm">{row.categoryCount}</span>
        </TableCell>

        {/* Visibility (eye icon - read only, centered) */}
        <TableCell config={menuViewWidthPreset.visibility}>
          <div className="flex items-center justify-center">
            <Eye className="h-4 w-4" />
          </div>
        </TableCell>

        {/* Products count */}
        <TableCell config={menuViewWidthPreset.products}>
          <span className="text-sm">{row.productCount}</span>
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={menuViewWidthPreset.dragHandle} data-row-click-ignore>
          <div
            className={cn(
              "flex items-center justify-center cursor-grab active:cursor-grabbing",
              "opacity-100",
              isRowHovered ? "md:opacity-100" : "md:opacity-0"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Render a category row
  const renderCategoryRow = (row: FlatCategoryRow, isLastRow: boolean) => {
    // Use composite key to handle same category under multiple labels
    const rowKey = `${row.parentId}-${row.id}`;
    const checkboxState = getRowCheckboxState(row);
    const checkboxVisible = getRowCheckboxVisible(row);
    const isSelected = checkboxState === "checked";
    const isIndeterminate = checkboxState === "indeterminate";
    const isRowHovered = hoveredRowId === rowKey;
    const dragClasses = getDragClasses(row);
    const dragHandlers = getDragHandlers(row);

    return (
      <TableRow
        key={rowKey}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected || isIndeterminate}
        isHidden={!row.isVisible}
        isDragging={dragClasses.isDragging}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(rowKey)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary"),
          dragClasses.isAutoExpanded && "animate-auto-expand-flash"
        )}
        onRowClick={() => handleRowClick(row)}
        onRowDoubleClick={() => handleRowDoubleClick(row)}
      >
        {/* Checkbox */}
        <TableCell config={menuViewWidthPreset.select} data-row-click-ignore>
          <CheckboxCell
            id={row.id}
            checked={isSelected}
            indeterminate={isIndeterminate}
            onToggle={() => onToggleRow(row)}
            isSelectable={checkboxVisible}
            disabled={!checkboxVisible}
            alwaysVisible={isSelected || isIndeterminate}
            ariaLabel={`Select ${row.name}`}
          />
        </TableCell>

        {/* Name with chevron and indent */}
        <TableCell config={menuViewWidthPreset.name}>
          <div
            className="flex items-center"
            style={{ paddingLeft: `${INDENT_PER_LEVEL}px` }}
          >
            <ChevronToggleCell
              isExpanded={row.isExpanded}
              isExpandable={row.isExpandable}
              onToggle={() => builder.toggleExpand(`${row.parentId}-${row.id}`)}
              ariaLabel={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
            />
            <span className="truncate font-medium pl-1.5">{row.name}</span>
          </div>
        </TableCell>

        {/* Categories count (empty for categories) */}
        <TableCell config={menuViewWidthPreset.categories}>
          <span className="text-sm text-muted-foreground">—</span>
        </TableCell>

        {/* Visibility (eye icon, centered) */}
        <TableCell config={menuViewWidthPreset.visibility}>
          <div className="flex items-center justify-center">
            {row.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </div>
        </TableCell>

        {/* Products count */}
        <TableCell config={menuViewWidthPreset.products}>
          <span className="text-sm">{row.productCount}</span>
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={menuViewWidthPreset.dragHandle} data-row-click-ignore>
          <div
            className={cn(
              "flex items-center justify-center cursor-grab active:cursor-grabbing",
              "opacity-100",
              isRowHovered ? "md:opacity-100" : "md:opacity-0"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Render a product row
  const renderProductRow = (row: FlatProductRow, isLastRow: boolean) => {
    // Use composite key: grandParentId-parentId-id to uniquely identify product in category under label
    const rowKey = `${row.grandParentId}-${row.parentId}-${row.id}`;
    const checkboxState = getRowCheckboxState(row);
    const checkboxVisible = getRowCheckboxVisible(row);
    const isSelected = checkboxState === "checked";
    // Products are leaf nodes - no indeterminate state
    const isRowHovered = hoveredRowId === rowKey;
    const dragClasses = getDragClasses(row);
    const dragHandlers = getDragHandlers(row);

    return (
      <TableRow
        key={rowKey}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected}
        isHidden={!row.isVisible}
        isDragging={dragClasses.isDragging}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(rowKey)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary")
        )}
        onRowClick={() => handleRowClick(row)}
        onRowDoubleClick={() => handleRowDoubleClick(row)}
      >
        {/* Checkbox */}
        <TableCell config={menuViewWidthPreset.select} data-row-click-ignore>
          <CheckboxCell
            id={rowKey}
            checked={isSelected}
            onToggle={() => onToggleRow(row)}
            isSelectable={checkboxVisible}
            disabled={!checkboxVisible}
            alwaysVisible={isSelected}
            ariaLabel={`Select ${row.name}`}
          />
        </TableCell>

        {/* Name with indent (no chevron for products) */}
        <TableCell config={menuViewWidthPreset.name}>
          <div
            className="flex items-center"
            style={{ paddingLeft: `${INDENT_PER_LEVEL * 2}px` }}
          >
            {/* Empty space for chevron alignment */}
            <div className="w-5 flex-shrink-0" />
            <span className="truncate pl-1.5">{row.name}</span>
          </div>
        </TableCell>

        {/* Categories count (empty for products) */}
        <TableCell config={menuViewWidthPreset.categories}>
          <span className="text-sm text-muted-foreground">—</span>
        </TableCell>

        {/* Visibility (eye icon, centered) */}
        <TableCell config={menuViewWidthPreset.visibility}>
          <div className="flex items-center justify-center">
            {row.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </div>
        </TableCell>

        {/* Products count (empty for products) */}
        <TableCell config={menuViewWidthPreset.products}>
          <span className="text-sm text-muted-foreground">—</span>
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={menuViewWidthPreset.dragHandle} data-row-click-ignore>
          <div
            className={cn(
              "flex items-center justify-center cursor-grab active:cursor-grabbing",
              "opacity-100",
              isRowHovered ? "md:opacity-100" : "md:opacity-0"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Render a row based on its type
  const renderRow = (row: FlatMenuRow, index: number, totalRows: number) => {
    const isLastRow = index === totalRows - 1;

    if (isLabelRow(row)) {
      return renderLabelRow(row, isLastRow);
    }
    if (isCategoryRow(row)) {
      return renderCategoryRow(row, isLastRow);
    }
    if (isProductRow(row)) {
      return renderProductRow(row, isLastRow);
    }
    return null;
  };

  // Empty state when no visible labels
  if (visibleLabels.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No Menu Items"
        description="Add labels from the dropdown to show them in the menu"
      />
    );
  }

  return (
    <TableViewWrapper>
      <TableHeader
        columns={MENU_VIEW_HEADER_COLUMNS}
        preset={menuViewWidthPreset}
        hasSelectAll
        allSelected={headerState.allSelected}
        someSelected={headerState.someSelected}
        selectAllDisabled={isSelectAllDisabled}
        onSelectAll={onSelectAllLabels}
      />

      <TableBody>
        {rows.map((row, index) => renderRow(row, index, rows.length))}
      </TableBody>
    </TableViewWrapper>
  );
}

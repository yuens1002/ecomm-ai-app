"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, GripVertical, LayoutGrid } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { ChevronToggleCell } from "./shared/cells/ChevronToggleCell";
import { InlineIconCell } from "./shared/cells/InlineIconCell";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { menuViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import {
  HierarchyNameCell,
  HierarchyCheckbox,
  HierarchyChevron,
  HierarchyIcon,
  HierarchyName,
} from "./shared/cells/HierarchyNameCell";
import type {
  FlatCategoryRow,
  FlatLabelRow,
  FlatMenuRow,
} from "./MenuTableView.types";
import { isCategoryRow, isLabelRow } from "./MenuTableView.types";
import { useFlattenedMenuRows } from "../../../hooks/useFlattenedMenuRows";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { buildMenuRegistry } from "../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { useMenuTableDragReorder } from "../../../hooks/useMenuTableDragReorder";

// Column order: name (with inline checkbox), categories, visibility, products, dragHandle
// Checkbox is inside name column, indenting with hierarchy depth
const MENU_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "name", label: "Name", hasInlineCheckbox: true },
  { id: "categories", label: "Categories" },
  { id: "visibility", label: "Visibility" },
  { id: "products", label: "Products" },
  { id: "dragHandle", label: "" },
];

/**
 * MenuTableView - 2-level hierarchical table showing Labels → Categories
 *
 * Features:
 * - Only shows visible labels (isVisible=true)
 * - Expand/collapse for labels
 * - Level-based indentation (0px labels, 24px categories)
 * - Drag-and-drop reordering (same-level and same-parent only)
 * - Auto-collapse all on label drag
 * - Selection (single entity type at a time)
 * - Inline editing for label names and icons
 * - Eye icon for visibility (read-only display)
 * - Product count shown as info column (products managed in Category Detail)
 *
 * Note: Products are not included in the selection registry. Product count
 * is displayed but product management is done in Category Detail view.
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

  // Build registry for hierarchical selection (uses kind-prefixed keys)
  // Note: Registry is 2-level only (labels + categories), products are display-only
  const registry = useMemo(
    () => buildMenuRegistry(visibleLabels),
    [visibleLabels]
  );

  // Unified selection model with hierarchy support for tri-state checkboxes
  const {
    getCheckboxState,
    onToggle,
    onToggleWithHierarchy,
    selectionState,
    onSelectAll,
  } = useContextSelectionModel(builder, {
    selectableKeys: registry.allKeys as string[],
    hierarchy: { getDescendants: (key) => registry.getChildKeys(key) as string[] },
  });

  // Unified click handler with expand/collapse sync
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    onToggleWithHierarchy,
    getCheckboxState,
    expandedIds: builder.expandedIds,
    toggleExpand: builder.toggleExpand,
    navigate: (kind, entityId) => {
      switch (kind) {
        case "label":
          builder.navigateToLabel(entityId);
          break;
        case "category":
          builder.navigateToCategory(entityId);
          break;
        // Products don't have a dedicated view
      }
    },
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
  const { getDragHandlers: getBaseDragHandlers, getDragClasses, dragState } = useMenuTableDragReorder({
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

  // Helper: Get row key based on row type (2-level: labels and categories only)
  const getRowKey = useCallback((row: FlatMenuRow): string => {
    if (isLabelRow(row)) {
      return createKey("label", row.id);
    }
    if (isCategoryRow(row)) {
      return createKey("category", row.parentId, row.id);
    }
    // Should never reach here in 2-level view
    return "";
  }, []);

  // Render a label row
  const renderLabelRow = (row: FlatLabelRow, isLastRow: boolean) => {
    const label = row.data;
    const labelKey = getRowKey(row);
    const checkboxState = getCheckboxState(labelKey);
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
        onRowClick={() => handleClick(labelKey)}
        onRowDoubleClick={() => handleDoubleClick(labelKey)}
      >
        {/* Name with checkbox, chevron, icon, and inline editing */}
        <TableCell config={menuViewWidthPreset.name}>
          <HierarchyNameCell depth={0}>
            <HierarchyCheckbox>
              <CheckboxCell
                id={row.id}
                checked={isSelected}
                indeterminate={isIndeterminate}
                onToggle={() => handleClick(labelKey)}
                isSelectable
                alwaysVisible={isSelected || isIndeterminate}
                ariaLabel={`Select ${row.name}`}
              />
            </HierarchyCheckbox>
            <HierarchyChevron>
              <ChevronToggleCell
                isExpanded={row.isExpanded}
                isExpandable={row.isExpandable}
                onToggle={() => builder.toggleExpand(row.id)}
                ariaLabel={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                disabled={dragState.isDraggingLabel}
              />
            </HierarchyChevron>
            {/* Icon + Name as visual unit with tighter spacing */}
            <div className="flex items-center gap-1">
              <HierarchyIcon>
                <InlineIconCell
                  id={row.id}
                  icon={label.icon}
                  onSave={handleIconSave}
                  isRowHovered={isRowHovered}
                />
              </HierarchyIcon>
              <HierarchyName>
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
              </HierarchyName>
            </div>
          </HierarchyNameCell>
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

  // Render a category row (leaf node in 2-level view - no chevron)
  const renderCategoryRow = (row: FlatCategoryRow, isLastRow: boolean) => {
    // Use composite key to handle same category under multiple labels
    const compositeId = `${row.parentId}-${row.id}`;
    const categoryKey = getRowKey(row);
    const checkboxState = getCheckboxState(categoryKey);
    const isSelected = checkboxState === "checked";
    // Categories are leaf nodes in 2-level view - no indeterminate state
    const isRowHovered = hoveredRowId === compositeId;
    const dragClasses = getDragClasses(row);
    const dragHandlers = getDragHandlers(row);

    return (
      <TableRow
        key={compositeId}
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
        onMouseEnter={() => setHoveredRowId(compositeId)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary")
        )}
        onRowClick={() => handleClick(categoryKey)}
        onRowDoubleClick={() => handleDoubleClick(categoryKey)}
      >
        {/* Name with checkbox and indent (no chevron - leaf node) */}
        <TableCell config={menuViewWidthPreset.name}>
          <HierarchyNameCell depth={1}>
            <HierarchyCheckbox>
              <CheckboxCell
                id={compositeId}
                checked={isSelected}
                onToggle={() => handleClick(categoryKey)}
                isSelectable
                alwaysVisible={isSelected}
                ariaLabel={`Select ${row.name}`}
              />
            </HierarchyCheckbox>
            <HierarchyName>
              <span className="truncate font-medium">{row.name}</span>
            </HierarchyName>
          </HierarchyNameCell>
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

  // Render a row based on its type (2-level: labels and categories only)
  const renderRow = (row: FlatMenuRow, index: number, totalRows: number) => {
    const isLastRow = index === totalRows - 1;

    if (isLabelRow(row)) {
      return renderLabelRow(row, isLastRow);
    }
    if (isCategoryRow(row)) {
      return renderCategoryRow(row, isLastRow);
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
        allSelected={selectionState.allSelected}
        someSelected={selectionState.someSelected}
        onSelectAll={onSelectAll}
      />

      <TableBody>
        {rows.map((row, index) => renderRow(row, index, rows.length))}
      </TableBody>
    </TableViewWrapper>
  );
}

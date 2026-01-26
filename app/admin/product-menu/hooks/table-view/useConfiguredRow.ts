"use client";

/**
 * Use Configured Row
 *
 * A lightweight hook for rendering rows using a ViewConfig.
 * Unlike useTableView which manages all state, this hook lets the view
 * manage its own state (react-table sorting, etc.) while using the config
 * for rendering columns.
 *
 * This is useful for views that have special requirements like react-table
 * sorting that aren't handled by useTableView.
 */

import { useCallback } from "react";
import { buildRowContext, NO_DND } from "./buildRowContext";
import type {
  ViewConfig,
  EntityKind,
  RowRenderResult,
  ContextMenuHandlers,
} from "./types";
import type { CheckboxState } from "../useContextSelectionModel";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RowState = {
  isSelected: boolean;
  checkboxState: CheckboxState;
  anchorKey: string | null;
  isRowHovered: boolean;
  isContextRow: boolean;
  isEditing: boolean;
  isPinned: boolean;
};

type RowHandlers = {
  onToggle: () => void;
  onRangeSelect: (() => void) | undefined;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: string, value: string) => Promise<void>;
};

type SelectionInfo = {
  actionableRoots: string[];
  isSameKind: boolean;
};

export type UseConfiguredRowOptions<T> = {
  /** View configuration */
  config: ViewConfig<T>;
  /** Context menu handlers */
  contextMenuHandlers: ContextMenuHandlers;
  /** Selection info for bulk actions */
  selectionInfo: SelectionInfo;
  /** Extra context to pass to cell renderers */
  extra?: Record<string, unknown>;
  /** Callback when context menu opens/closes */
  onContextMenuOpenChange: (rowId: string, open: boolean) => void;
  /** Callback when mouse enters row */
  onMouseEnter: (rowId: string) => void;
  /** Callback when mouse leaves row */
  onMouseLeave: (rowId: string) => void;
  /** Click handler */
  onRowClick: (rowKey: string, opts?: { shiftKey?: boolean }) => void;
  /** Double-click handler */
  onRowDoubleClick: (rowKey: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for rendering rows using a ViewConfig.
 *
 * @example
 * ```tsx
 * const { buildRow } = useConfiguredRow({
 *   config: allCategoriesConfig,
 *   contextMenuHandlers: { clone, delete, visibility, ... },
 *   selectionInfo: { actionableRoots, isSameKind },
 *   extra: { getProductCount, getCategoryLabels, ... },
 *   onContextMenuOpenChange: (id, open) => setContextRowId(open ? id : null),
 *   onMouseEnter: setHoveredRowId,
 *   onMouseLeave: () => setHoveredRowId(null),
 *   onRowClick: handleClick,
 *   onRowDoubleClick: handleDoubleClick,
 * });
 *
 * // In render:
 * {categories.map((cat, i) => {
 *   const rowData = buildRow(cat, i, total, rowState, rowHandlers);
 *   return <ConfiguredTableRow key={cat.id} data={rowData} />;
 * })}
 * ```
 */
export function useConfiguredRow<T extends { id: string }>(
  options: UseConfiguredRowOptions<T>
) {
  const {
    config,
    contextMenuHandlers,
    selectionInfo,
    extra = {},
    onContextMenuOpenChange,
    onMouseEnter,
    onMouseLeave,
    onRowClick,
    onRowDoubleClick,
  } = options;

  const { viewType, entityKind } = config;

  /**
   * Build row render data from row and state.
   */
  const buildRow = useCallback(
    (
      row: T,
      index: number,
      total: number,
      state: RowState,
      handlers: RowHandlers
    ): RowRenderResult<T> => {
      const rowId = row.id;
      const rowKey = `${entityKind}:${rowId}`;

      // Build context
      const ctx = buildRowContext<T>({
        row,
        rowId,
        rowKey,
        entityKind: entityKind as EntityKind,
        selection: {
          isSelected: state.isSelected,
          checkboxState: state.checkboxState,
          anchorKey: state.anchorKey,
          onToggle: handlers.onToggle,
          onRangeSelect: handlers.onRangeSelect,
        },
        uiState: {
          isRowHovered: state.isRowHovered,
          isContextRow: state.isContextRow,
          isEditing: state.isEditing,
          isPinned: state.isPinned,
        },
        position: {
          index,
          total,
        },
        dnd: NO_DND,
        editHandlers: {
          onStartEdit: handlers.onStartEdit,
          onCancelEdit: handlers.onCancelEdit,
          onSave: handlers.onSave,
        },
        extra,
      });

      // Get entity row config
      const entityConfig = config.rowConfig;
      if (!entityConfig) {
        throw new Error(`No row config found for view: ${viewType}`);
      }

      // Get context menu props
      const contextMenuProps = entityConfig.getContextMenuProps(
        row,
        ctx,
        contextMenuHandlers
      );

      // Get table row props
      const tableRowProps = entityConfig.getTableRowProps?.(row, ctx) ?? {};

      // Get drag class (not used for non-DnD views, but included for completeness)
      const dragClassName = entityConfig.getDragClassName?.(row, ctx) ?? "";

      return {
        key: rowKey,
        row,
        ctx,
        contextMenuProps: {
          ...contextMenuProps,
          entityKind: entityKind as EntityKind,
          viewType,
          entityId: rowId,
          isVisible: (row as unknown as { isVisible?: boolean }).isVisible ?? true,
          isFirst: index === 0,
          isLast: index === total - 1,
          selectedCount: selectionInfo.actionableRoots.length,
          isInSelection: state.isSelected,
          isMixedSelection:
            selectionInfo.actionableRoots.length > 0 && !selectionInfo.isSameKind,
          onOpenChange: (open: boolean) => onContextMenuOpenChange(rowId, open),
        },
        tableRowProps: {
          isSelected: state.isSelected,
          isContextRow: state.isContextRow,
          isHidden: tableRowProps.isHidden,
          className: dragClassName,
          onRowClick: (opts?: { shiftKey?: boolean }) => onRowClick(rowKey, opts),
          onRowDoubleClick: () => onRowDoubleClick(rowKey),
          onMouseEnter: () => onMouseEnter(rowId),
          onMouseLeave: () => onMouseLeave(rowId),
        },
        columns: config.columns.map((col) => ({
          id: col.id,
          width: col.width,
          ignoreRowClick: col.ignoreRowClick,
          className: col.className,
          content: col.render(row, ctx),
        })),
      };
    },
    [
      entityKind,
      viewType,
      config,
      contextMenuHandlers,
      selectionInfo,
      extra,
      onContextMenuOpenChange,
      onMouseEnter,
      onMouseLeave,
      onRowClick,
      onRowDoubleClick,
    ]
  );

  return { buildRow };
}

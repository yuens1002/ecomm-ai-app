"use client";

/**
 * Unified Table View Hook
 *
 * Central hook for config-driven table views. Handles:
 * - Common state management (context menu, delete confirmation, hover)
 * - Selection model setup
 * - Click handlers
 * - Row rendering with RowContext
 * - Empty state detection
 *
 * This hook is the single source of truth for table view behavior,
 * reducing duplication across different views.
 */

import { useCallback, useMemo, useState } from "react";
import { buildFlatRegistry } from "../useIdentityRegistry";
import { useContextSelectionModel } from "../useContextSelectionModel";
import { useRowClickHandler } from "../useRowClickHandler";
import { useContextRowUiState } from "../useContextRowUiState";
import { createKey } from "../../types/identity-registry";
import { buildRowContext, NO_DND } from "./buildRowContext";
import type {
  UseTableViewOptions,
  UseTableViewReturn,
  DeleteConfirmationState,
  EntityKind,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified hook for config-driven table views.
 *
 * @example
 * ```tsx
 * const { renderRow, emptyState, selectionState } = useTableView({
 *   config: allCategoriesConfig,
 *   items: categories,
 *   builder,
 *   handlers: { ... },
 * });
 *
 * if (emptyState) return <EmptyState {...emptyState} />;
 *
 * return (
 *   <TableViewWrapper>
 *     <TableHeader ... />
 *     <TableBody>
 *       {categories.map((cat, i) => renderRow(cat, i, categories.length))}
 *     </TableBody>
 *   </TableViewWrapper>
 * );
 * ```
 */
export function useTableView<T extends { id: string }>(
  options: UseTableViewOptions<T>
): UseTableViewReturn<T> {
  const { config, items, builder, handlers, parentId, extra = {} } = options;
  const { viewType, entityKind, emptyStates } = config;

  // ─────────────────────────────────────────────────────────────────────────
  // Common UI State
  // ─────────────────────────────────────────────────────────────────────────

  const [contextRowId, setContextRowId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    targetIds: [],
    entityKind,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Editing/Pinned State
  // ─────────────────────────────────────────────────────────────────────────

  const { editingId, pinnedId, clearEditing, clearPinnedIfMatches } = useContextRowUiState(
    builder,
    entityKind,
    { autoClearPinned: true }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Registry
  // ─────────────────────────────────────────────────────────────────────────

  // For now, only flat registry is supported
  // TODO: Add support for hierarchical registry when implementing MenuTableView
  const registry = useMemo(
    () => buildFlatRegistry(items, entityKind),
    [items, entityKind]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Selection Model
  // ─────────────────────────────────────────────────────────────────────────

  const selectableKeys = useMemo(
    () => items.map((item) => createKey(entityKind, item.id)),
    [items, entityKind]
  );

  const selectionModel = useContextSelectionModel(builder, {
    selectableKeys,
    // TODO: Add hierarchy support for hierarchical views
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Click Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const clickHandlers = useRowClickHandler(registry, {
    onToggle: selectionModel.onToggle,
    navigate: handlers.navigate,
    rangeSelect: selectionModel.rangeSelect,
    anchorKey: selectionModel.anchorKey,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Delete Confirmation Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const openDeleteConfirmation = useCallback(
    (ids: string[]) => {
      setDeleteConfirmation({ open: true, targetIds: ids, entityKind });
    },
    [entityKind]
  );

  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({ open: false, targetIds: [], entityKind });
  }, [entityKind]);

  // ─────────────────────────────────────────────────────────────────────────
  // Target IDs Helper (for bulk actions)
  // ─────────────────────────────────────────────────────────────────────────

  const getTargetIds = useCallback(
    (entityId: string): string[] => {
      const key = createKey(entityKind, entityId);
      const inSelection = selectionModel.isSelected(key);
      const isBulk =
        inSelection &&
        selectionModel.actionableRoots.length > 1 &&
        selectionModel.isSameKind;

      if (isBulk) {
        // Extract IDs from keys (format: "kind:id")
        return selectionModel.actionableRoots.map((k) => k.split(":")[1]);
      }
      return [entityId];
    },
    [entityKind, selectionModel]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Empty State
  // ─────────────────────────────────────────────────────────────────────────

  const emptyState = useMemo(() => {
    const ctx = {
      items,
      parentId,
      parentExists: parentId !== undefined,
    };
    return emptyStates.find((es) => es.condition(ctx)) ?? null;
  }, [items, parentId, emptyStates]);

  // ─────────────────────────────────────────────────────────────────────────
  // Row Renderer
  // ─────────────────────────────────────────────────────────────────────────

  const renderRow = useCallback(
    (row: T, index: number, total: number) => {
      const rowId = row.id;
      const rowKey = createKey(entityKind, rowId);
      const rowEntityKind = (handlers.getEntityKind?.(row) ?? entityKind) as EntityKind;

      // Build row context
      const ctx = buildRowContext<T>({
        row,
        rowId,
        rowKey,
        entityKind: rowEntityKind,
        selection: {
          isSelected: selectionModel.isSelected(rowKey),
          checkboxState: selectionModel.getCheckboxState(rowKey),
          anchorKey: selectionModel.anchorKey,
          onToggle: () => selectionModel.onToggle(rowKey),
          onRangeSelect:
            selectionModel.anchorKey && selectionModel.anchorKey !== rowKey
              ? () => selectionModel.rangeSelect(rowKey)
              : undefined,
        },
        uiState: {
          isRowHovered: hoveredRowId === rowId,
          isContextRow: contextRowId === rowId,
          isEditing: editingId === rowId,
          isPinned: pinnedId === rowId,
        },
        position: {
          index,
          total,
        },
        dnd: NO_DND, // TODO: Add DnD support
        editHandlers: {
          onStartEdit: () => builder.setEditing({ kind: rowEntityKind, id: rowId }),
          onCancelEdit: () => {
            clearEditing();
            if (pinnedId === rowId) {
              clearPinnedIfMatches(rowId);
            }
          },
          onSave: async (id, value) => {
            await handlers.inlineEdit.onNameSave(id, value);
            if (pinnedId === rowId) {
              clearPinnedIfMatches(rowId);
            }
          },
        },
        extra: {
          ...extra,
          // Add helper for getting target IDs (for bulk operations)
          getTargetIds,
          // Add view-level handlers for context menu
          handlers,
          viewType,
        },
      });

      // Get entity row config
      const entityConfig = config.entityConfigs?.[rowEntityKind] ?? config.rowConfig;
      if (!entityConfig) {
        throw new Error(`No row config found for entity kind: ${rowEntityKind}`);
      }

      // Get context menu props
      const contextMenuProps = entityConfig.getContextMenuProps(row, ctx, handlers.contextMenu);

      // Get table row props
      const tableRowProps = entityConfig.getTableRowProps?.(row, ctx) ?? {};

      // Get drag class
      const dragClassName = entityConfig.getDragClassName?.(row, ctx) ?? "";

      // Return the row data for the view to render
      // NOTE: We return the context and props, not the JSX
      // The view component handles actual rendering to allow flexibility
      return {
        key: rowKey,
        row,
        ctx,
        contextMenuProps: {
          ...contextMenuProps,
          entityKind: rowEntityKind,
          viewType,
          entityId: rowId,
          isVisible: (row as unknown as { isVisible?: boolean }).isVisible ?? true,
          isFirst: index === 0,
          isLast: index === total - 1,
          selectedCount: selectionModel.actionableRoots.length,
          isInSelection: selectionModel.isSelected(rowKey),
          isMixedSelection: selectionModel.actionableRoots.length > 0 && !selectionModel.isSameKind,
          onOpenChange: (open: boolean) => setContextRowId(open ? rowId : null),
        },
        tableRowProps: {
          ...tableRowProps,
          isSelected: ctx.isSelected,
          isContextRow: ctx.isContextRow,
          isHidden: tableRowProps.isHidden ?? !(row as unknown as { isVisible?: boolean }).isVisible,
          className: dragClassName,
          onRowClick: (opts: { shiftKey?: boolean }) => clickHandlers.handleClick(rowKey, opts),
          onRowDoubleClick: () => clickHandlers.handleDoubleClick(rowKey),
          onMouseEnter: () => setHoveredRowId(rowId),
          onMouseLeave: () => setHoveredRowId(null),
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
      config,
      handlers,
      selectionModel,
      hoveredRowId,
      contextRowId,
      editingId,
      pinnedId,
      builder,
      clearEditing,
      clearPinnedIfMatches,
      extra,
      getTargetIds,
      viewType,
      clickHandlers,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // First Selected Item (for ghost component)
  // ─────────────────────────────────────────────────────────────────────────

  const firstSelectedItem = useMemo(() => {
    if (selectionModel.actionableRoots.length === 0) return null;
    const firstKey = selectionModel.actionableRoots[0];
    const firstId = firstKey.split(":")[1];
    return items.find((item) => item.id === firstId) ?? null;
  }, [selectionModel.actionableRoots, items]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Rendering
    renderRow,
    emptyState,

    // Selection
    selectionState: selectionModel.selectionState,
    onSelectAll: selectionModel.onSelectAll,
    actionableRoots: selectionModel.actionableRoots,

    // Delete dialog
    deleteConfirmation,
    isDeleting,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    setIsDeleting,

    // UI state
    hoveredRowId,
    contextRowId,

    // For ghost
    firstSelectedItem,
  };
}

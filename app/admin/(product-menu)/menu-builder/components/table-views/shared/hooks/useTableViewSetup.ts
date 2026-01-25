"use client";

import { useCallback, useMemo, useState } from "react";
import { useContextRowUiState } from "../../../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../../../hooks/useContextSelectionModel";
import { buildFlatRegistry } from "../../../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../../../hooks/useRowClickHandler";
import { usePinnedRow } from "../../../../../hooks/usePinnedRow";
import { createKey } from "../../../../../types/identity-registry";
import type { SelectedEntityKind } from "../../../../../types/builder-state";

export type EntityKindType = "label" | "category" | "product";

/**
 * Minimal builder interface required by useTableViewSetup.
 * Combines the APIs needed by useContextRowUiState and useContextSelectionModel.
 */
type BuilderApi = {
  // Row UI state (for useContextRowUiState)
  editingRow: { kind: SelectedEntityKind; id: string } | null;
  pinnedNewRow: { kind: SelectedEntityKind; id: string } | null;
  setEditing: (next: { kind: SelectedEntityKind; id: string } | null) => void;
  setPinnedNew: (next: { kind: SelectedEntityKind; id: string } | null) => void;
  // Selection state (for useContextSelectionModel)
  selectedIds: string[];
  selectedKind: SelectedEntityKind | null;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
};

export type TableViewSetupOptions<T extends { id: string }> = {
  builder: BuilderApi;
  items: T[];
  entityKind: EntityKindType;
  pinnedId: string | null;
  /** Whether sorting is active (affects pinned row behavior) */
  isSortingActive?: boolean;
  /** Navigate callback for double-click */
  navigate: (entityId: string) => void;
  /** Optional: sorted rows from table (for selectableKeys after sorting) */
  sortedRows?: T[];
};

export type DeleteConfirmationState = {
  open: boolean;
  targetIds: string[];
};

/**
 * Shared hook for flat table view setup.
 * Handles registry building, selection model, click handling, pinned row, and context state.
 *
 * Use this for flat (non-hierarchical) table views like AllLabelsTableView and AllCategoriesTableView.
 */
export function useTableViewSetup<T extends { id: string }>({
  builder,
  items,
  entityKind,
  pinnedId,
  isSortingActive = false,
  navigate,
  sortedRows,
}: TableViewSetupOptions<T>) {
  // Context menu highlight state (separate from selection)
  const [contextRowId, setContextRowId] = useState<string | null>(null);

  // Delete confirmation state (single or bulk from context menu)
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    targetIds: [],
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Editing/pinned state from context
  const {
    editingId,
    pinnedId: pinnedIdFromContext,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, entityKind, { autoClearPinned: true });

  // Build registry for this flat view
  const registry = useMemo(
    () => buildFlatRegistry(items, entityKind),
    [items, entityKind]
  );

  // Pinned row handling
  const { pinnedRow, rowsForTable } = usePinnedRow({
    rows: items,
    pinnedId,
    isSortingActive,
    defaultSort: null, // Items come pre-sorted from server
  });

  // Build selectableKeys from visual order (pinned first, then rest)
  // When sortedRows is provided (for sorted views), use that instead of rowsForTable
  const selectableKeys = useMemo(() => {
    const keys: string[] = [];
    if (pinnedRow) {
      keys.push(createKey(entityKind, pinnedRow.id));
    }
    const rows = sortedRows ?? rowsForTable;
    for (const item of rows) {
      keys.push(createKey(entityKind, item.id));
    }
    return keys;
  }, [pinnedRow, sortedRows, rowsForTable, entityKind]);

  // Selection model
  const selectionModel = useContextSelectionModel(builder, { selectableKeys });

  // Click handlers
  const clickHandlers = useRowClickHandler(registry, {
    onToggle: selectionModel.onToggle,
    navigate: (_kind, entityId) => navigate(entityId),
    rangeSelect: selectionModel.rangeSelect,
    anchorKey: selectionModel.anchorKey,
  });

  // Helper to get target IDs (bulk if in selection with multiple, single otherwise)
  const getTargetIds = useCallback(
    (entityId: string): string[] => {
      const key = createKey(entityKind, entityId);
      const inSelection = selectionModel.isSelected(key);
      const isBulk =
        inSelection &&
        selectionModel.actionableRoots.length > 1 &&
        selectionModel.isSameKind;
      if (isBulk) {
        return selectionModel.actionableRoots.map((k) => k.split(":")[1]);
      }
      return [entityId];
    },
    [entityKind, selectionModel]
  );

  // Open delete confirmation dialog
  const openDeleteConfirmation = useCallback(
    (entityId: string) => {
      const targetIds = getTargetIds(entityId);
      setDeleteConfirmation({ open: true, targetIds });
    },
    [getTargetIds]
  );

  // Close delete confirmation dialog
  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({ open: false, targetIds: [] });
  }, []);

  return {
    // State
    contextRowId,
    setContextRowId,
    deleteConfirmation,
    isDeleting,
    setIsDeleting,

    // Editing/pinned
    editingId,
    pinnedIdFromContext,
    clearEditing,
    clearPinnedIfMatches,

    // Registry and rows
    registry,
    pinnedRow,
    rowsForTable,
    selectableKeys,

    // Selection
    selectionState: selectionModel.selectionState,
    onSelectAll: selectionModel.onSelectAll,
    onToggle: selectionModel.onToggle,
    isSelected: selectionModel.isSelected,
    getCheckboxState: selectionModel.getCheckboxState,
    actionableRoots: selectionModel.actionableRoots,
    selectedKind: selectionModel.selectedKind,
    isSameKind: selectionModel.isSameKind,
    anchorKey: selectionModel.anchorKey,
    rangeSelect: selectionModel.rangeSelect,

    // Click handlers
    handleClick: clickHandlers.handleClick,
    handleDoubleClick: clickHandlers.handleDoubleClick,

    // Helpers
    getTargetIds,
    openDeleteConfirmation,
    closeDeleteConfirmation,

    // Helper for creating entity keys
    createEntityKey: (id: string) => createKey(entityKind, id),
  };
}

"use client";

import { useCallback, useMemo } from "react";
import type { SelectedEntityKind } from "../types/builder-state";

type BuilderSelectionApi = {
  selectedIds: string[];
  selectedKind: SelectedEntityKind | null;
  toggleSelection: (id: string, options?: { kind?: SelectedEntityKind }) => void;
  selectAll: (ids: string[], options?: { kind?: SelectedEntityKind }) => void;
  clearSelection: () => void;
};

type BulkSelectionState = {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
};

export function useContextSelectionModel(
  builder: BuilderSelectionApi,
  options: {
    kind: SelectedEntityKind;
    selectableIds: string[];
  }
) {
  const { kind, selectableIds } = options;

  const isSelectionActive = builder.selectedKind === null || builder.selectedKind === kind;

  const selectionState: BulkSelectionState = useMemo(() => {
    if (selectableIds.length === 0 || builder.selectedIds.length === 0) {
      return { allSelected: false, someSelected: false, selectedCount: 0 };
    }

    const selected = new Set(builder.selectedIds);
    let selectedCount = 0;

    for (const id of selectableIds) {
      if (selected.has(id)) selectedCount += 1;
    }

    const allSelected = selectedCount === selectableIds.length;
    const someSelected = selectedCount > 0 && !allSelected;

    return { allSelected, someSelected, selectedCount };
  }, [selectableIds, builder.selectedIds]);

  const onSelectAll = useCallback(() => {
    if (!isSelectionActive) return;

    if (selectionState.allSelected) {
      builder.clearSelection();
    } else {
      builder.selectAll(selectableIds, { kind });
    }
  }, [builder, isSelectionActive, kind, selectableIds, selectionState.allSelected]);

  const onToggleId = useCallback(
    (id: string) => {
      if (!isSelectionActive) return;
      builder.toggleSelection(id, { kind });
    },
    [builder, isSelectionActive, kind]
  );

  const isSelected = useCallback((id: string) => builder.selectedIds.includes(id), [builder.selectedIds]);

  return {
    kind,
    selectableIds,
    isSelectionActive,
    selectionState,
    onSelectAll,
    onToggleId,
    isSelected,
  };
}

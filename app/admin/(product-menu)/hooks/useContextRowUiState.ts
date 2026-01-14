"use client";

import { useCallback, useEffect } from "react";
import type { SelectedEntityKind } from "../types/builder-state";

type ActiveRow = {
  kind: SelectedEntityKind;
  id: string;
};

type BuilderRowUiApi = {
  editingRow: ActiveRow | null;
  pinnedNewRow: ActiveRow | null;
  setEditing: (next: ActiveRow | null) => void;
  setPinnedNew: (next: ActiveRow | null) => void;
};

type UseContextRowUiStateOptions = {
  /**
   * When true, automatically clears pinned state when the pinned item
   * is no longer being edited. This is the typical behavior for table views.
   * @default false
   */
  autoClearPinned?: boolean;
};

export function useContextRowUiState(
  builder: BuilderRowUiApi,
  kind: SelectedEntityKind,
  options: UseContextRowUiStateOptions = {}
) {
  const { autoClearPinned = false } = options;

  const editingId = builder.editingRow?.kind === kind ? builder.editingRow.id : null;
  const pinnedId = builder.pinnedNewRow?.kind === kind ? builder.pinnedNewRow.id : null;

  const clearEditing = useCallback(() => {
    builder.setEditing(null);
  }, [builder]);

  const clearPinnedIfMatches = useCallback(
    (id: string) => {
      if (builder.pinnedNewRow?.kind === kind && builder.pinnedNewRow.id === id) {
        builder.setPinnedNew(null);
      }
    },
    [builder, kind]
  );

  // Auto-clear pinned when item is no longer being edited
  useEffect(() => {
    if (!autoClearPinned) return;
    if (!pinnedId) return;
    if (editingId && editingId === pinnedId) return;
    clearPinnedIfMatches(pinnedId);
  }, [autoClearPinned, pinnedId, editingId, clearPinnedIfMatches]);

  return { editingId, pinnedId, clearEditing, clearPinnedIfMatches };
}

"use client";

import { useCallback } from "react";
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

export function useContextRowUiState(builder: BuilderRowUiApi, kind: SelectedEntityKind) {
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

  return { editingId, pinnedId, clearEditing, clearPinnedIfMatches };
}

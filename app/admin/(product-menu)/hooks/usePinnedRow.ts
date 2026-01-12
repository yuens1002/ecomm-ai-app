"use client";

import { useMemo } from "react";

export type UsePinnedRowOptions<TItem extends { id: string }> = {
  rows: TItem[];
  pinnedId?: string | null;
  isSortingActive: boolean;
  defaultSort?: (a: TItem, b: TItem) => number;
};

export function usePinnedRow<TItem extends { id: string }>({
  rows,
  pinnedId,
  isSortingActive,
  defaultSort,
}: UsePinnedRowOptions<TItem>): {
  pinnedRow: TItem | undefined;
  rowsForTable: TItem[];
} {
  const pinnedRow = useMemo(() => {
    if (!pinnedId) return undefined;
    return rows.find((r) => r.id === pinnedId);
  }, [rows, pinnedId]);

  const rowsForTable = useMemo(() => {
    const rest = pinnedId ? rows.filter((r) => r.id !== pinnedId) : rows;

    if (isSortingActive) return rest;

    if (defaultSort) {
      return [...rest].sort(defaultSort);
    }

    return rest;
  }, [rows, pinnedId, isSortingActive, defaultSort]);

  return { pinnedRow, rowsForTable };
}

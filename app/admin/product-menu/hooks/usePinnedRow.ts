"use client";

import { useMemo } from "react";

/** Default sort by order (descending) then id for items with order field */
function defaultOrderSort<T extends { id: string; order?: number }>(a: T, b: T): number {
  const orderA = a.order ?? 0;
  const orderB = b.order ?? 0;
  if (orderB !== orderA) return orderB - orderA;
  return b.id.localeCompare(a.id);
}

export type UsePinnedRowOptions<TItem extends { id: string }> = {
  rows: TItem[];
  pinnedId?: string | null;
  isSortingActive: boolean;
  /**
   * Custom sort function. Set to `null` to disable sorting entirely.
   * If omitted, uses default sort by `order` field (descending).
   */
  defaultSort?: ((a: TItem, b: TItem) => number) | null;
};

export function usePinnedRow<TItem extends { id: string; order?: number }>({
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

    // Skip sorting if table sorting is active (let table handle it)
    if (isSortingActive) return rest;

    // Explicit null means no sorting
    if (defaultSort === null) return rest;

    // Use provided sort or built-in default
    const sortFn = defaultSort ?? defaultOrderSort;
    return [...rest].sort(sortFn);
  }, [rows, pinnedId, isSortingActive, defaultSort]);

  return { pinnedRow, rowsForTable };
}

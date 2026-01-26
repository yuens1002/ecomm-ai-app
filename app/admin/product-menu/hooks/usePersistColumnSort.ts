"use client";

import type { SortingState, Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";

type UsePersistColumnSortOptions<TData> = {
  /** TanStack table sorting state */
  sorting: SortingState;
  /** Context ID (labelId, categoryId, etc.) - mutation won't run if falsy */
  contextId: string | undefined;
  /** TanStack table instance */
  table: Table<TData>;
  /** Mutation function to persist the new order */
  onPersist: (contextId: string, ids: string[]) => Promise<unknown>;
};

/**
 * Hook to persist column sort order to database.
 *
 * When a sortable column header is clicked:
 * 1. TanStack table visually reorders rows
 * 2. This hook detects the sorting change
 * 3. Extracts sorted IDs from table rows
 * 4. Calls onPersist to save the new order
 *
 * Features:
 * - Guards against concurrent persists with a ref
 * - Only triggers when sorting is active
 * - Extracts row IDs from table.getRowModel()
 *
 * @example
 * ```tsx
 * usePersistColumnSort({
 *   sorting,
 *   contextId: currentLabelId,
 *   table,
 *   onPersist: reorderCategoriesInLabel,
 * });
 * ```
 */
export function usePersistColumnSort<TData extends { id: string }>({
  sorting,
  contextId,
  table,
  onPersist,
}: UsePersistColumnSortOptions<TData>) {
  const isPersistingRef = useRef(false);

  useEffect(() => {
    if (sorting.length === 0 || !contextId || isPersistingRef.current) return;

    const sortedRows = table.getRowModel().rows;
    if (sortedRows.length === 0) return;

    const sortedIds = sortedRows.map((row) => row.original.id);

    isPersistingRef.current = true;
    onPersist(contextId, sortedIds).finally(() => {
      isPersistingRef.current = false;
    });
  }, [sorting, contextId, table, onPersist]);
}

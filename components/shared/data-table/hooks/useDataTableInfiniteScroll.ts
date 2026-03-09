"use client";

import { useEffect, useRef } from "react";
import type { Table } from "@tanstack/react-table";
import { useInfiniteScroll } from "./useInfiniteScroll";

interface UseDataTableInfiniteScrollOptions<TData> {
  table: Table<TData>;
  /** Concatenated key that changes when filters/search/status change */
  scrollKey: string;
}

/**
 * Wraps useInfiniteScroll with automatic reset when filters/search change.
 * Derives totalCount and batchSize from the table instance.
 */
export function useDataTableInfiniteScroll<TData>({
  table,
  scrollKey,
}: UseDataTableInfiniteScrollOptions<TData>) {
  const allFilteredRows = table.getFilteredRowModel().rows;
  const batchSize = table.getState().pagination.pageSize;

  const { visibleCount, sentinelRef, hasMore, reset } = useInfiniteScroll({
    totalCount: allFilteredRows.length,
    batchSize,
  });

  const prevScrollKey = useRef(scrollKey);
  useEffect(() => {
    if (scrollKey !== prevScrollKey.current) {
      prevScrollKey.current = scrollKey;
      reset();
    }
  }, [scrollKey, reset]);

  return { allFilteredRows, visibleCount, sentinelRef, hasMore };
}

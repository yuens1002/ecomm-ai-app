"use client";

import * as React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";

type SortableHeaderCellProps<TData> = {
  table: Table<TData>;
  columnId: string;
  label: string;
  align?: "left" | "center" | "right";
  headClassName?: string;
};

/**
 * Sortable table header cell with visual sort state indicator.
 *
 * UX Design:
 * - Sort state indicator (↑/↓) prepended to label when column is sorted
 * - ArrowUpDown toggle icon after label, hidden on md+ until hover (same as before)
 * - Clicking cycles: unsorted → asc → desc → unsorted
 * - After DnD reorder, parent should reset sorting via table.resetSorting()
 */
export function SortableHeaderCell<TData>({
  table,
  columnId,
  label,
  align = "left",
  headClassName,
}: SortableHeaderCellProps<TData>) {
  const column = table.getColumn(columnId);
  const sortState = column?.getIsSorted();

  // Sort state indicator - shows current direction, only visible when sorted
  const SortStateIcon = sortState === "asc" ? ArrowUp : sortState === "desc" ? ArrowDown : null;

  // Toggle icon - positioned absolutely so it doesn't affect text alignment
  // Mobile: always visible, md+: hidden until header row hover or button focus
  const toggleIconClassName = cn(
    "absolute left-full ml-1.5 h-3.5 w-3.5 flex-shrink-0 transition-opacity text-muted-foreground",
    "opacity-100 md:opacity-0 md:group-hover/header:opacity-100 md:group-focus-visible/sort:opacity-100"
  );

  const buttonClassName = cn(
    "relative inline-flex max-w-full min-w-0 items-center rounded-md outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    align === "left" && "text-left",
    align === "center" && "text-center",
    align === "right" && "text-right"
  );

  const containerClassName = cn(
    align === "left" && "block",
    align === "center" && "flex justify-center",
    align === "right" && "flex justify-end"
  );

  const handleClick = () => {
    // Toggle between asc ↔ desc only (first click = asc)
    // Reset to unsorted happens via: DnD reorder, different column sort, or undo
    if (!sortState || sortState === "desc") {
      column?.toggleSorting(false); // asc
    } else {
      column?.toggleSorting(true); // desc
    }
  };

  return (
    <TableHead className={cn(
      "font-medium text-foreground border-b-2 transition-colors duration-200",
      sortState ? "border-b-foreground" : "border-b-border hover:border-b-muted-foreground",
      headClassName
    )}>
      <div className={containerClassName}>
        <button
          type="button"
          className={cn("group/sort", buttonClassName)}
          onClick={handleClick}
        >
          {SortStateIcon && <SortStateIcon className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-foreground" />}
          <span className="min-w-0 truncate">{label}</span>
          <ArrowUpDown className={toggleIconClassName} />
        </button>
      </div>
    </TableHead>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Header } from "@tanstack/react-table";

import type { DataTableColumnMeta } from "./types";

interface DataTableHeaderCellProps<TData> {
  header: Header<TData, unknown>;
  className?: string;
}

export function DataTableHeaderCell<TData>({
  header,
  className,
}: DataTableHeaderCellProps<TData>) {
  const canSort = header.column.getCanSort();
  const sortState = header.column.getIsSorted();
  const canResize = header.column.getCanResize();
  const meta = header.column.columnDef.meta as
    | DataTableColumnMeta
    | undefined;

  const SortStateIcon =
    sortState === "asc" ? ArrowUp : sortState === "desc" ? ArrowDown : null;

  const handleSortClick = () => {
    if (!canSort) return;
    // 3-state cycling: unsorted → asc → desc → unsorted
    if (!sortState) {
      header.column.toggleSorting(false); // asc
    } else if (sortState === "asc") {
      header.column.toggleSorting(true); // desc
    } else {
      header.column.clearSorting(); // unsorted
    }
  };

  return (
    <th
      className={cn(
        "h-10 px-3 font-medium text-foreground border-b-2 text-left align-middle",
        "group/header relative select-none",
        // no static border-r — resize handle provides the visual separator
        canSort && "cursor-pointer",
        sortState
          ? "border-b-foreground"
          : "border-b-border",
        meta?.pin === "left" &&
          "sticky left-0 z-30 bg-background after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border",
        className
      )}
      style={{ width: header.getSize() }}
    >
      <div className="flex items-center">
        {canSort ? (
          <button
            type="button"
            className="group/sort relative inline-flex items-center min-w-0 rounded-md outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            onClick={handleSortClick}
          >
            {SortStateIcon && (
              <SortStateIcon className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-foreground" />
            )}
            <span className="min-w-0 truncate">
              {header.isPlaceholder
                ? null
                : typeof header.column.columnDef.header === "string"
                  ? header.column.columnDef.header
                  : null}
            </span>
            <ArrowUpDown
              className={cn(
                "ml-1.5 h-3.5 w-3.5 flex-shrink-0 transition-opacity text-muted-foreground",
                "opacity-100 md:opacity-0 md:group-hover/header:opacity-100 md:group-focus-visible/sort:opacity-100"
              )}
            />
          </button>
        ) : (
          <span className="min-w-0 truncate">
            {header.isPlaceholder
              ? null
              : typeof header.column.columnDef.header === "string"
                ? header.column.columnDef.header
                : null}
          </span>
        )}

        {/* Resize handle — px-2 each side of cell boundary */}
        {canResize && (
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={cn(
              "absolute -right-2 top-0 h-full w-4 cursor-col-resize select-none touch-none z-20",
              "after:absolute after:left-1/2 after:-translate-x-1/2 after:top-0 after:h-full after:w-px",
              "after:bg-border after:opacity-0 sm:after:opacity-100 md:after:opacity-0 md:group-hover/hrow:after:opacity-100",
              "hover:after:bg-border hover:after:opacity-100 active:after:bg-border",
              header.column.getIsResizing() && "after:!bg-border after:!opacity-100"
            )}
          />
        )}
      </div>
    </th>
  );
}

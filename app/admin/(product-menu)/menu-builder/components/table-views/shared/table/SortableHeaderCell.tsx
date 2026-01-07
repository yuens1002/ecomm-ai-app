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

export function SortableHeaderCell<TData>({
  table,
  columnId,
  label,
  align = "left",
  headClassName,
}: SortableHeaderCellProps<TData>) {
  const column = table.getColumn(columnId);
  const sortState = column?.getIsSorted();

  const Icon = sortState === "asc" ? ArrowUp : sortState === "desc" ? ArrowDown : ArrowUpDown;

  const iconClassName = cn(
    "absolute left-full ml-2 h-3.5 w-3.5 transition-opacity",
    sortState
      ? "opacity-100 text-foreground"
      : "opacity-100 text-muted-foreground md:opacity-0 md:group-hover/header:opacity-100 md:group-focus-visible/sort:opacity-100"
  );

  const buttonClassName = cn(
    "relative inline-flex max-w-full min-w-0 items-center",
    align === "left" && "text-left",
    align === "center" && "text-center",
    align === "right" && "text-right"
  );

  const containerClassName = cn(
    align === "left" && "block",
    align === "center" && "flex justify-center",
    align === "right" && "flex justify-end"
  );

  return (
    <TableHead className={cn("font-medium text-foreground", headClassName)}>
      <div className={containerClassName}>
        <button
          type="button"
          className={cn("group/sort", buttonClassName)}
          onClick={() => column?.toggleSorting()}
        >
          <span className="min-w-0 truncate">{label}</span>
          <Icon className={iconClassName} />
        </button>
      </div>
    </TableHead>
  );
}

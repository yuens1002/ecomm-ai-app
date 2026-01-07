import * as React from "react";
import { TableHead, TableHeader as ShadcnTableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";

export type TableHeaderColumn = {
  id: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  isCheckbox?: boolean;
  isSticky?: boolean;
  stickyLeft?: string;
};

type TableHeaderProps = {
  columns: TableHeaderColumn[];
  table?: Table<unknown>;
  hasSelectAll?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
  className?: string;
};

export function TableHeader({
  columns,
  table,
  hasSelectAll = false,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  className,
}: TableHeaderProps) {
  return (
    <ShadcnTableHeader className={className}>
      <TableRow className="group/header">
        {columns.map((column) => {
          if (column.isCheckbox && hasSelectAll) {
            return (
              <TableHead
                key={column.id}
                className={cn(
                  "pl-2.5",
                  column.width,
                  column.isSticky && "sticky z-10 bg-muted",
                  column.stickyLeft
                )}
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={allSelected || (someSelected && "indeterminate")}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                  />
                </div>
              </TableHead>
            );
          }

          if (column.isCheckbox) {
            return (
              <TableHead
                key={column.id}
                className={cn(
                  "pl-2.5",
                  column.width,
                  column.isSticky && "sticky z-10 bg-muted",
                  column.stickyLeft
                )}
              />
            );
          }

          const alignClass =
            column.align === "center"
              ? "text-center"
              : column.align === "right"
                ? "text-right"
                : "";

          // Get sorting info from table if available
          const tableColumn = table?.getColumn(column.id);
          const canSort = tableColumn?.getCanSort();
          const sortDirection = tableColumn?.getIsSorted();

          if (table && tableColumn && canSort) {
            return (
              <TableHead
                key={column.id}
                className={cn(
                  column.width,
                  alignClass,
                  "truncate max-w-xs",
                  column.isSticky && "sticky z-10 bg-muted",
                  column.stickyLeft
                )}
              >
                <button
                  className={cn(
                    "relative inline-block text-foreground hover:opacity-70 transition-opacity font-medium"
                  )}
                  onClick={() => tableColumn.toggleSorting()}
                >
                  {column.label}
                  <span className="absolute left-[calc(100%+0.25rem)] top-1/2 -translate-y-1/2 inline-flex">
                    {sortDirection === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : sortDirection === "desc" ? (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    )}
                  </span>
                </button>
              </TableHead>
            );
          }

          return (
            <TableHead
              key={column.id}
              className={cn(
                column.width,
                alignClass,
                "font-medium text-foreground truncate max-w-xs",
                column.isSticky && "sticky z-10 bg-muted/40",
                column.stickyLeft
              )}
            >
              {column.label}
            </TableHead>
          );
        })}
      </TableRow>
    </ShadcnTableHeader>
  );
}

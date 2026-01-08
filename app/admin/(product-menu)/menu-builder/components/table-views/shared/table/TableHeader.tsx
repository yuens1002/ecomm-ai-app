import * as React from "react";
import { TableHead, TableHeader as ShadcnTableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import { SortableHeaderCell } from "./SortableHeaderCell";

export type TableHeaderColumn = {
  id: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  isCheckbox?: boolean;
  isSticky?: boolean;
  stickyLeft?: string;
};

type TableHeaderProps<TData> = {
  columns: TableHeaderColumn[];
  table?: Table<TData>;
  hasSelectAll?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
  className?: string;
};

export function TableHeader<TData = unknown>({
  columns,
  table,
  hasSelectAll = false,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  className,
}: TableHeaderProps<TData>) {
  return (
    <ShadcnTableHeader className={cn("h-10 bg-muted/40 border-b", className)}>
      <TableRow className="group/header hover:bg-transparent">
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

          if (table && tableColumn && canSort) {
            return (
              <SortableHeaderCell
                key={column.id}
                table={table}
                columnId={column.id}
                label={column.label}
                align={column.align}
                headClassName={cn(
                  column.width,
                  column.isSticky && "sticky z-10 bg-muted/40",
                  column.stickyLeft
                )}
              />
            );
          }

          return (
            <TableHead
              key={column.id}
              className={cn(
                column.width,
                alignClass,
                "font-medium text-foreground",
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

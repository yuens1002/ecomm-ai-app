"use client";

import { cn } from "@/lib/utils";
import { flexRender, type Table } from "@tanstack/react-table";

import { DataTableHeaderCell } from "./DataTableHeaderCell";
import { DataTableShell } from "./DataTableShell";
import type { DataTableColumnMeta } from "./types";

interface DataTableProps<TData> {
  table: Table<TData>;
  onRowDoubleClick?: (row: TData) => void;
  emptyMessage?: string;
}

const PIN_LEFT_CLASS = "sticky left-0 z-30 bg-background after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border";

const RESPONSIVE_CLASSES: Record<string, string> = {
  desktop: "hidden sm:table-cell",
  mobile: "sm:hidden",
};

function getMetaClasses(meta: DataTableColumnMeta | undefined) {
  const classes: string[] = [];
  if (meta?.pin === "left") classes.push(PIN_LEFT_CLASS);
  if (meta?.responsive && RESPONSIVE_CLASSES[meta.responsive]) {
    classes.push(RESPONSIVE_CLASSES[meta.responsive]);
  }
  return classes.join(" ");
}

export function DataTable<TData>({
  table,
  onRowDoubleClick,
  emptyMessage = "No results found.",
}: DataTableProps<TData>) {
  return (
    <DataTableShell>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="hover:bg-transparent group/hrow">
            {headerGroup.headers.map((header) => {
              if (!header.column.getIsVisible()) return null;
              const meta = header.column.columnDef.meta as
                | DataTableColumnMeta
                | undefined;
              return (
                <DataTableHeaderCell
                  key={header.id}
                  header={header}
                  className={getMetaClasses(meta)}
                />
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length === 0 ? (
          <tr>
            <td
              colSpan={table.getVisibleLeafColumns().length}
              className="text-center py-8 text-muted-foreground"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "hover:bg-muted/40 border-b last:border-b-0 group/row",
                onRowDoubleClick && "cursor-pointer"
              )}
              onDoubleClick={
                onRowDoubleClick
                  ? () => onRowDoubleClick(row.original)
                  : undefined
              }
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as
                  | DataTableColumnMeta
                  | undefined;
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-3 py-2 align-top",
                      getMetaClasses(meta),
                      meta?.cellClassName
                    )}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </DataTableShell>
  );
}

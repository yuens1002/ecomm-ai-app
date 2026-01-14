import { Checkbox } from "@/components/ui/checkbox";
import { TableHeader as ShadcnTableHeader, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import { SortableHeaderCell } from "./SortableHeaderCell";

/**
 * Column definition for TableHeader.
 *
 * IMPORTANT: When adding a new column to a table view:
 * 1. Add entry to the header columns array (e.g., ALL_LABELS_HEADER_COLUMNS)
 * 2. Add matching entry to TanStack table `columns` array with same `id`
 * 3. Add width preset in columnWidthPresets.ts
 * 4. Add the TableCell in the row render function
 *
 * The `id` must match between header columns and TanStack columns to avoid
 * "[Table] Column with id 'xxx' does not exist" errors.
 */
export type TableHeaderColumn = {
  id: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  isCheckbox?: boolean;
};

type TableHeaderProps<TData> = {
  columns: TableHeaderColumn[];
  table?: Table<TData>;
  hasSelectAll?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
  selectAllDisabled?: boolean;
  className?: string;
};

export function TableHeader<TData = unknown>({
  columns,
  table,
  hasSelectAll = false,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  selectAllDisabled = false,
  className,
}: TableHeaderProps<TData>) {
  return (
    <ShadcnTableHeader className={cn("h-10 bg-muted/40 border-b", className)}>
      <TableRow className="group/header hover:bg-transparent">
        {columns.map((column) => {
          if (column.isCheckbox && hasSelectAll) {
            return (
              <TableHead key={column.id} className={cn("pl-2.5", column.width)}>
                <div className="flex items-center">
                  <Checkbox
                    checked={
                      selectAllDisabled ? false : allSelected || (someSelected && "indeterminate")
                    }
                    onCheckedChange={selectAllDisabled ? undefined : onSelectAll}
                    disabled={selectAllDisabled}
                    aria-label="Select all"
                  />
                </div>
              </TableHead>
            );
          }

          if (column.isCheckbox) {
            return <TableHead key={column.id} className={cn("pl-2.5", column.width)} />;
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
                headClassName={cn(column.width)}
              />
            );
          }

          return (
            <TableHead
              key={column.id}
              className={cn(column.width, alignClass, "font-medium text-foreground")}
            >
              {column.label}
            </TableHead>
          );
        })}
      </TableRow>
    </ShadcnTableHeader>
  );
}

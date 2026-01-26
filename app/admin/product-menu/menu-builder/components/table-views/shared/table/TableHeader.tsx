import { Checkbox } from "@/components/ui/checkbox";
import { TableHeader as ShadcnTableHeader, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import type { ColumnWidthPreset } from "./columnWidthPresets";
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
 * The `id` must match between header columns, TanStack columns, and preset keys.
 */
export type TableHeaderColumn = {
  id: string;
  label: string;
  /** Renders as a standalone checkbox column (no label) */
  isCheckbox?: boolean;
  /** Renders a checkbox before the label (used for hierarchy name columns) */
  hasInlineCheckbox?: boolean;
};

type TableHeaderProps<TData> = {
  columns: TableHeaderColumn[];
  /** Width preset - provides width and align for each column by id */
  preset: ColumnWidthPreset;
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
  preset,
  table,
  hasSelectAll = false,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  selectAllDisabled = false,
  className,
}: TableHeaderProps<TData>) {
  return (
    <ShadcnTableHeader className={cn("h-10 border-b-2", className)}>
      <TableRow className="group/header hover:bg-transparent">
        {columns.map((column) => {
          const config = preset[column.id];
          const width = config?.head;
          const align = config?.align;

          if (column.isCheckbox && hasSelectAll) {
            return (
              <TableHead key={column.id} className={cn("pl-2.5", width)}>
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
            return <TableHead key={column.id} className={cn("pl-2.5", width)} />;
          }

          // Inline checkbox with label (used for hierarchy name columns)
          // mr-4 (16px) + gap-2 (8px) = 24px, accounts for chevron button's internal padding
          if (column.hasInlineCheckbox && hasSelectAll) {
            return (
              <TableHead key={column.id} className={cn(width, "font-medium text-foreground")}>
                <div className="h-full flex items-center gap-2">
                  <div className="flex-shrink-0 mr-4 flex items-center">
                    <Checkbox
                      checked={
                        selectAllDisabled ? false : allSelected || (someSelected && "indeterminate")
                      }
                      onCheckedChange={selectAllDisabled ? undefined : onSelectAll}
                      disabled={selectAllDisabled}
                      aria-label="Select all"
                    />
                  </div>
                  <span>{column.label}</span>
                </div>
              </TableHead>
            );
          }

          const alignClass =
            align === "center" ? "text-center" : align === "right" ? "text-right" : "";

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
                align={align}
                headClassName={cn(width)}
              />
            );
          }

          return (
            <TableHead
              key={column.id}
              className={cn(width, alignClass, "font-medium text-foreground truncate")}
            >
              {column.label}
            </TableHead>
          );
        })}
      </TableRow>
    </ShadcnTableHeader>
  );
}

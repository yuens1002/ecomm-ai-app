import { TableCell as ShadcnTableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import * as React from "react";
import type { ColumnWidthEntry } from "./columnWidthPresets";

type TableCellProps = React.ComponentPropsWithoutRef<typeof ShadcnTableCell> & {
  /** Preset entry - provides cell class and align */
  config?: ColumnWidthEntry;
};

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ config, className, ...props }, ref) => {
    const align = config?.align;
    const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";

    return (
      <ShadcnTableCell
        ref={ref}
        className={cn("truncate", alignClass, config?.cell, className)}
        {...props}
      />
    );
  }
);

TableCell.displayName = "TableCell";

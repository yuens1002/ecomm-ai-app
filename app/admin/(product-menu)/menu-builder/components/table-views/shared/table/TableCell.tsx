import { TableCell as ShadcnTableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import * as React from "react";

type TableCellProps = React.ComponentPropsWithoutRef<typeof ShadcnTableCell> & {
  align?: "left" | "center" | "right";
};

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ align = "left", className, ...props }, ref) => {
    const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";

    return (
      <ShadcnTableCell ref={ref} className={cn("truncate", alignClass, className)} {...props} />
    );
  }
);

TableCell.displayName = "TableCell";

import * as React from "react";
import { TableCell as ShadcnTableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableCellProps = React.ComponentPropsWithoutRef<typeof ShadcnTableCell> & {
  align?: "left" | "center" | "right";
  isSticky?: boolean;
  stickyLeft?: string;
};

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ align = "left", isSticky, stickyLeft, className, ...props }, ref) => {
    const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";

    return (
      <ShadcnTableCell
        ref={ref}
        className={cn(
          "truncate max-w-xs",
          alignClass,
          isSticky && "sticky z-10",
          stickyLeft,
          className
        )}
        {...props}
      />
    );
  }
);

TableCell.displayName = "TableCell";

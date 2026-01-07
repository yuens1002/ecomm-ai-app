import * as React from "react";
import { TableRow as ShadcnTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableRowProps = React.ComponentPropsWithoutRef<typeof ShadcnTableRow> & {
  isSelected?: boolean;
  isDragging?: boolean;
};

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ isSelected, isDragging, className, ...props }, ref) => {
    return (
      <ShadcnTableRow
        ref={ref}
        className={cn(
          "group",
          isSelected && "bg-accent/50 border-l-2 border-l-primary",
          isDragging && "opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

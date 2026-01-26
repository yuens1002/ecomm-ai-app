import { Table as ShadcnTable } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import * as React from "react";

type TableViewWrapperProps = React.ComponentPropsWithoutRef<typeof ShadcnTable>;

/**
 * Wrapper for table views that provides consistent table styling.
 * Each table view should wrap its content with this component.
 */
export const TableViewWrapper = React.forwardRef<
  HTMLTableElement,
  TableViewWrapperProps
>(({ className, children, ...props }, ref) => (
  <ShadcnTable
    ref={ref}
    className={cn("table-fixed min-w-[660px] w-full mt-4", className)}
    {...props}
  >
    {children}
  </ShadcnTable>
));

TableViewWrapper.displayName = "TableViewWrapper";

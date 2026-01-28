import { cn } from "@/lib/utils";
import * as React from "react";

type TableViewWrapperProps = React.HTMLAttributes<HTMLTableElement>;

/**
 * Wrapper for table views that provides consistent table styling.
 */
export const TableViewWrapper = React.forwardRef<
  HTMLTableElement,
  TableViewWrapperProps
>(({ className, children, ...props }, ref) => (
  <div className="relative w-full mt-4">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm table-fixed", className)}
      {...props}
    >
      {children}
    </table>
  </div>
));

TableViewWrapper.displayName = "TableViewWrapper";

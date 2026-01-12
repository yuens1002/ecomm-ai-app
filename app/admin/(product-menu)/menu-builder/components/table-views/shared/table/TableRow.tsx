import * as React from "react";
import { TableRow as ShadcnTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      [
        "button",
        "a",
        'input[type="checkbox"]',
        "input",
        "textarea",
        "select",
        "[role=button]",
        "[contenteditable]",
        "[data-row-click-ignore]",
      ].join(",")
    )
  );
}

type TableRowProps = React.ComponentPropsWithoutRef<typeof ShadcnTableRow> & {
  isSelected?: boolean;
  isDragging?: boolean;
};

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({
    isSelected,
    isDragging,
    className,
    onClick,
    onDoubleClick,
    ...props
  }, ref) => {
    const handleClick: React.MouseEventHandler<HTMLTableRowElement> = (event) => {
      if (isInteractiveTarget(event.target)) return;
      onClick?.(event);
    };

    const handleDoubleClick: React.MouseEventHandler<HTMLTableRowElement> = (event) => {
      if (isInteractiveTarget(event.target)) return;
      onDoubleClick?.(event);
    };

    return (
      <ShadcnTableRow
        ref={ref}
        className={cn(
          "group cursor-pointer h-10 hover:bg-muted/40 border-b-0",
          isSelected && "bg-accent/50 border-l-2 border-l-primary",
          isDragging && "opacity-50",
          className
        )}
        onClick={onClick ? handleClick : undefined}
        onDoubleClick={onDoubleClick ? handleDoubleClick : undefined}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

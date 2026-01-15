import { TableRow as ShadcnTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

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
        "[role=checkbox]",
        "[contenteditable]",
        "[data-row-click-ignore]",
      ].join(",")
    )
  );
}

/** Delay in ms before single-click fires (allows double-click to cancel) */
const CLICK_DELAY_MS = 200;

type TableRowProps = Omit<
  React.ComponentPropsWithoutRef<typeof ShadcnTableRow>,
  "onClick" | "onDoubleClick"
> & {
  isSelected?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isLastRow?: boolean;
  /**
   * Called on single-click (delayed to distinguish from double-click).
   * Ignored if click target is an interactive element.
   */
  onRowClick?: () => void;
  /**
   * Called on double-click (cancels pending single-click).
   * Ignored if click target is an interactive element.
   */
  onRowDoubleClick?: () => void;
};

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  (
    {
      isSelected,
      isDragging,
      isDragOver: _isDragOver,
      isLastRow: _isLastRow,
      className,
      onRowClick,
      onRowDoubleClick,
      ...props
    },
    ref
  ) => {
    const clickTimeoutRef = useRef<number | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (clickTimeoutRef.current !== null) {
          window.clearTimeout(clickTimeoutRef.current);
        }
      };
    }, []);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLTableRowElement>) => {
        if (isInteractiveTarget(event.target)) return;
        if (!onRowClick) return;

        // Clear any pending click
        if (clickTimeoutRef.current !== null) {
          window.clearTimeout(clickTimeoutRef.current);
        }

        // Delay single-click to allow double-click to cancel
        clickTimeoutRef.current = window.setTimeout(() => {
          onRowClick();
          clickTimeoutRef.current = null;
        }, CLICK_DELAY_MS);
      },
      [onRowClick]
    );

    const handleDoubleClick = useCallback(
      (event: React.MouseEvent<HTMLTableRowElement>) => {
        if (isInteractiveTarget(event.target)) return;
        if (!onRowDoubleClick) return;

        // Cancel pending single-click
        if (clickTimeoutRef.current !== null) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }

        onRowDoubleClick();
      },
      [onRowDoubleClick]
    );

    return (
      <ShadcnTableRow
        ref={ref}
        className={cn(
          "group cursor-pointer h-10 hover:bg-muted/40 border-l-2 border-l-transparent",
          // Always hide top/bottom borders - let drag indicator override with !important
          "border-b-0 border-t-0",
          isSelected && "bg-accent/50 border-l-primary",
          isDragging && "opacity-50",
          className
        )}
        onClick={onRowClick ? handleClick : undefined}
        onDoubleClick={onRowDoubleClick ? handleDoubleClick : undefined}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

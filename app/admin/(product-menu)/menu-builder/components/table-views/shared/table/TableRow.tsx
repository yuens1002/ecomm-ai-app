import { TableRow as ShadcnTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion, type MotionProps } from "motion/react";
import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

/** Motion-enabled table row for animations */
const MotionTr = motion.tr;

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

/** Stagger delay between each row in cascade animation (seconds) */
const STAGGER_DELAY = 0.04;
/** Row height for calculating animation offset (matches h-10 = 2.5rem = 40px) */
const ROW_HEIGHT = 40;

/**
 * Get animation props for cascade expand/collapse.
 * - Expand: rows start at parent position and slide down to their spot
 * - Collapse: rows slide up to parent position and fade out
 *
 * Note: Parent container uses scrollbar-gutter: stable to prevent scrollbar flash.
 */
export const getRowAnimationProps = (
  staggerIndex?: number,
  _siblingCount?: number
): MotionProps => {
  const index = staggerIndex ?? 0;
  // Start position: offset up by (index + 1) rows to appear at parent level
  const initialY = -(index + 1) * ROW_HEIGHT;

  return {
    initial: { opacity: 0, y: initialY },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        delay: index * STAGGER_DELAY,
      },
    },
    exit: {
      opacity: 0,
      y: initialY,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
  };
};

type TableRowProps = Omit<
  React.ComponentPropsWithoutRef<typeof ShadcnTableRow>,
  "onClick" | "onDoubleClick"
> & {
  isSelected?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isLastRow?: boolean;
  /** When true, applies muted text styling to indicate the row is hidden/not visible */
  isHidden?: boolean;
  /** When true, enables motion animations (use with AnimatePresence) */
  animated?: boolean;
  /** Unique key for AnimatePresence exit animations (required when animated=true) */
  layoutId?: string;
  /** Index for staggered cascade animation (0 = no delay, 1+ = incremental delay) */
  staggerIndex?: number;
  /**
   * Whether this row can be dragged. Controls cursor on mousedown (intent):
   * - true: cursor-grabbing on active (can drag)
   * - false: cursor-not-allowed on active (can't drag)
   * - undefined: pointer cursor (clickable row)
   * All states show pointer on hover; intent feedback on mousedown only.
   */
  isDraggable?: boolean;
  /**
   * Called on single-click (delayed to distinguish from double-click).
   * Ignored if click target is an interactive element.
   * Receives event info for modifier key detection (e.g., Shift+click for range select).
   */
  onRowClick?: (options?: { shiftKey?: boolean }) => void;
  /**
   * Called on double-click (cancels pending single-click).
   * Ignored if click target is an interactive element.
   */
  onRowDoubleClick?: () => void;
  /**
   * Called on right-click / context menu (mobile long-press handled by ContextMenu wrapper).
   * Use this with TableRowContextMenu for mobile support.
   */
  onContextMenu?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
};

/** HTML drag event props that conflict with motion's drag system */
type HtmlDragProps = {
  draggable?: boolean;
  onDrag?: React.DragEventHandler<HTMLTableRowElement>;
  onDragEnd?: React.DragEventHandler<HTMLTableRowElement>;
  onDragEnter?: React.DragEventHandler<HTMLTableRowElement>;
  onDragLeave?: React.DragEventHandler<HTMLTableRowElement>;
  onDragOver?: React.DragEventHandler<HTMLTableRowElement>;
  onDragStart?: React.DragEventHandler<HTMLTableRowElement>;
  onDrop?: React.DragEventHandler<HTMLTableRowElement>;
};

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  (
    {
      isSelected,
      isDragging,
      isDragOver: _isDragOver,
      isLastRow,
      isHidden,
      animated,
      layoutId,
      staggerIndex,
      isDraggable,
      className,
      onRowClick,
      onRowDoubleClick,
      // Extract HTML drag props to pass explicitly (conflict with motion's drag system)
      draggable,
      onDrag,
      onDragEnd,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDragStart,
      onDrop,
      ...props
    },
    ref
  ) => {
    const htmlDragProps: HtmlDragProps = {
      draggable: draggable === true || draggable === "true" ? true : undefined,
      onDrag,
      onDragEnd,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDragStart,
      onDrop,
    };
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

        // Capture modifier keys before the timeout (event may be reused)
        const shiftKey = event.shiftKey;

        // Clear any pending click
        if (clickTimeoutRef.current !== null) {
          window.clearTimeout(clickTimeoutRef.current);
        }

        // Delay single-click to allow double-click to cancel
        clickTimeoutRef.current = window.setTimeout(() => {
          onRowClick({ shiftKey });
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

    // Cursor based on isDraggable prop:
    // Pointer on hover, intent feedback only on mousedown (active)
    // - undefined: pointer cursor (clickable row)
    // - true: pointer on hover, grabbing on active (can drag)
    // - false: pointer on hover, not-allowed on active (can't drag)
    const cursorClass =
      isDraggable === undefined
        ? "cursor-pointer"
        : isDraggable
          ? "cursor-pointer active:cursor-grabbing"
          : "cursor-pointer active:cursor-not-allowed";

    const rowClassName = cn(
      "group h-10 hover:bg-muted/40",
      cursorClass,
      // Left border: use !important to override TableBody's [&_tr:last-child]:border-0
      "!border-l-2",
      isSelected ? "border-l-primary bg-accent/50" : "border-l-transparent",
      // Hide top border, show bottom border only on last row (drag indicator overrides with !important)
      "border-t-0",
      isLastRow ? "border-b border-b-border" : "border-b-0",
      isDragging && "opacity-50",
      // Muted text styling for hidden/not visible rows
      isHidden && "text-muted-foreground",
      className
    );

    // Use motion.tr for animated rows (enables AnimatePresence exit animations)
    // Cast props to bypass motion's type conflicts (HTML5 events work at runtime)
    if (animated) {
      return (
        <MotionTr
          ref={ref}
          layoutId={layoutId}
          className={rowClassName}
          onClick={onRowClick ? handleClick : undefined}
          onDoubleClick={onRowDoubleClick ? handleDoubleClick : undefined}
          {...getRowAnimationProps(staggerIndex)}
          {...(htmlDragProps as Record<string, unknown>)}
          {...(props as Record<string, unknown>)}
        />
      );
    }

    return (
      <ShadcnTableRow
        ref={ref}
        className={rowClassName}
        onClick={onRowClick ? handleClick : undefined}
        onDoubleClick={onRowDoubleClick ? handleDoubleClick : undefined}
        {...htmlDragProps}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

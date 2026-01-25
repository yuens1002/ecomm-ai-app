import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useLongPress } from "../../../../../hooks/useLongPress";

type CheckboxCellProps = {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
  alwaysVisible?: boolean;
  ariaLabel?: string;
  isSelectable?: boolean;
  /** When true, shows indeterminate state (some descendants selected) */
  indeterminate?: boolean;
  /** Current anchor key for range selection (enables long-press range select) */
  anchorKey?: string | null;
  /** Callback for range selection (called on long-press when anchor exists) */
  onRangeSelect?: () => void;
};

export function CheckboxCell({
  id,
  checked,
  onToggle,
  disabled,
  alwaysVisible,
  ariaLabel,
  isSelectable = true,
  indeterminate = false,
  anchorKey,
  onRangeSelect,
}: CheckboxCellProps) {
  const pointerToggleRef = React.useRef(false);
  // Track if the current interaction was a completed long-press (to prevent toggle)
  const longPressCompletedRef = React.useRef(false);
  // Track if shift was held during click (for shift+click range selection)
  const shiftKeyRef = React.useRef(false);

  // Long-press for range selection (only enabled when anchor exists and handler provided)
  const canRangeSelect = Boolean(anchorKey && onRangeSelect);
  const { isPressed, handlers: longPressHandlers } = useLongPress({
    duration: 500,
    movementThreshold: 10,
    onLongPress: () => {
      longPressCompletedRef.current = true;
      if (onRangeSelect) {
        onRangeSelect();
      }
    },
  });

  if (!isSelectable) {
    return <div className="h-4 w-4" aria-hidden="true" />;
  }

  // Long-press visual feedback: pulsing ring
  // Only shows after visualDelay (150ms default) to distinguish click from hold
  const showLongPressUI = canRangeSelect && isPressed;

  return (
    <div
      data-row-click-ignore
      {...(canRangeSelect ? longPressHandlers : {})}
      onPointerDown={(e) => {
        pointerToggleRef.current = true;
        longPressCompletedRef.current = false; // Reset on new interaction
        shiftKeyRef.current = e.shiftKey; // Capture shift key state
        if (canRangeSelect) {
          longPressHandlers.onPointerDown(e);
        }
      }}
      className={cn(
        "relative flex items-center opacity-100 transition-opacity",
        alwaysVisible
          ? "md:opacity-100"
          : "md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
      )}
    >
      <Checkbox
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={() => {
          // Skip toggle if this was a completed long-press (range select already handled it)
          if (longPressCompletedRef.current) {
            longPressCompletedRef.current = false;
            return;
          }

          // Shift+click: trigger range selection if available
          if (shiftKeyRef.current && onRangeSelect) {
            shiftKeyRef.current = false;
            onRangeSelect();
            return;
          }
          shiftKeyRef.current = false;

          onToggle(id);

          // If this was a pointer interaction, drop focus so the checkbox can
          // return to its "hidden unless hovered" state when unchecked.
          if (pointerToggleRef.current) {
            pointerToggleRef.current = false;
            queueMicrotask(() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
            });
          }
        }}
        disabled={disabled}
        aria-label={ariaLabel ?? `Select ${id}`}
        className={cn(
          "data-[state=checked]:bg-accent-foreground",
          showLongPressUI && "ring-2 ring-primary ring-offset-2 animate-pulse"
        )}
      />
    </div>
  );
}

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

  // Long-press for range selection (only enabled when anchor exists and handler provided)
  const canRangeSelect = Boolean(anchorKey && onRangeSelect);
  const { isPressed, progress, handlers: longPressHandlers } = useLongPress({
    duration: 500,
    movementThreshold: 10,
    onLongPress: () => {
      if (onRangeSelect) {
        onRangeSelect();
      }
    },
  });

  if (!isSelectable) {
    return <div className="h-4 w-4" aria-hidden="true" />;
  }

  // Long-press visual feedback: ring animation and progress indicator
  const showLongPressUI = canRangeSelect && isPressed;

  return (
    <div
      data-row-click-ignore
      {...(canRangeSelect ? longPressHandlers : {})}
      onPointerDown={(e) => {
        pointerToggleRef.current = true;
        if (canRangeSelect) {
          longPressHandlers.onPointerDown(e);
        }
      }}
      className={cn(
        "relative flex items-center opacity-100 transition-opacity",
        alwaysVisible
          ? "md:opacity-100"
          : "md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100",
        // Long-press visual feedback
        showLongPressUI && "ring-2 ring-primary ring-offset-1 rounded-sm"
      )}
    >
      <Checkbox
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={() => {
          // Only fire toggle if not in long-press mode or long-press wasn't completed
          if (!isPressed) {
            onToggle(id);
          }

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
        className="data-[state=checked]:bg-accent-foreground"
      />

      {/* Circular progress indicator during long-press */}
      {showLongPressUI && (
        <div className="absolute -inset-1 pointer-events-none">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress * 62.83} 62.83`}
              className="text-primary opacity-50"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

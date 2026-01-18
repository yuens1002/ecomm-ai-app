import { Checkbox } from "@/components/ui/checkbox";
import * as React from "react";

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
}: CheckboxCellProps) {
  const pointerToggleRef = React.useRef(false);

  if (!isSelectable) {
    return <div className="h-4 w-4" aria-hidden="true" />;
  }

  return (
    <div
      data-row-click-ignore
      onPointerDown={() => {
        pointerToggleRef.current = true;
      }}
      className={
        "flex items-center opacity-100 transition-opacity " +
        (alwaysVisible
          ? "md:opacity-100"
          : "md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100")
      }
    >
      <Checkbox
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={() => {
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
        className="data-[state=checked]:bg-accent-foreground"
      />
    </div>
  );
}

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";

type CheckboxCellProps = {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
  alwaysVisible?: boolean;
  ariaLabel?: string;
  isSelectable?: boolean;
};

export function CheckboxCell({
  id,
  checked,
  onToggle,
  disabled,
  alwaysVisible,
  ariaLabel,
  isSelectable = true,
}: CheckboxCellProps) {
  if (!isSelectable) {
    return <div className="h-4 w-4" aria-hidden="true" />;
  }

  return (
    <div
      className={
        "flex items-center opacity-100 transition-opacity " +
        (alwaysVisible
          ? "md:opacity-100"
          : "md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100")
      }
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(id)}
        disabled={disabled}
        aria-label={ariaLabel ?? `Select ${id}`}
        className="data-[state=checked]:bg-accent-foreground"
      />
    </div>
  );
}

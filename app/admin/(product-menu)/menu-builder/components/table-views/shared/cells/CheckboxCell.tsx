import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";

type CheckboxCellProps = {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
};

export function CheckboxCell({ id, checked, onToggle, disabled }: CheckboxCellProps) {
  return (
    <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(id)}
        disabled={disabled}
        aria-label={`Select ${id}`}
        className="data-[state=checked]:bg-accent-foreground"
      />
    </div>
  );
}

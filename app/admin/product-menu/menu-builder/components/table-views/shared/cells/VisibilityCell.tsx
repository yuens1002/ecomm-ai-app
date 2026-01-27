import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";

type VisibilityCellProps = {
  id: string;
  isVisible: boolean;
  variant: "switch" | "icon";
  onToggle?: (id: string, visible: boolean) => Promise<void>;
  disabled?: boolean;
};

export function VisibilityCell({
  id,
  isVisible,
  variant,
  onToggle,
  disabled,
}: VisibilityCellProps) {
  if (variant === "icon") {
    const Icon = isVisible ? Eye : EyeOff;
    const label = isVisible ? "Visible" : "Hidden";

    return (
      <button
        type="button"
        tabIndex={0}
        disabled={disabled}
        aria-label={`${label} - ${disabled ? 'Cannot toggle visibility' : 'Click to toggle visibility'}`}
        className="inline-flex items-center justify-center disabled:cursor-not-allowed"
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={isVisible}
        onCheckedChange={(checked) => onToggle?.(id, checked)}
        disabled={disabled}
        aria-label={`Toggle visibility for ${id}`}
      />
    </div>
  );
}

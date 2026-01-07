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
    return isVisible ? (
      <Eye className="w-4 h-4 text-muted-foreground" />
    ) : (
      <EyeOff className="w-4 h-4 text-muted-foreground" />
    );
  }

  return (
    <Switch
      checked={isVisible}
      onCheckedChange={(checked) => onToggle?.(id, checked)}
      disabled={disabled}
      aria-label={`Toggle visibility for ${id}`}
    />
  );
}

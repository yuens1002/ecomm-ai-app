import { cn } from "@/lib/utils";
import { BREW_METHOD_LABELS, type BrewMethodKey } from "@/lib/types/roaster-brew-guide";

interface BrewMethodBadgeProps {
  method: string;
  size?: "sm" | "md";
  className?: string;
}

export function BrewMethodBadge({ method, size = "sm", className }: BrewMethodBadgeProps) {
  const label = BREW_METHOD_LABELS[method as BrewMethodKey] ?? method;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "bg-secondary text-secondary-foreground",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
    >
      {label}
    </span>
  );
}

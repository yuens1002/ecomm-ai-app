import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type ChevronToggleCellProps = {
  /** Whether the row is currently expanded */
  isExpanded: boolean;
  /** Whether this row can be expanded (has children) */
  isExpandable: boolean;
  /** Called when the chevron is clicked */
  onToggle: () => void;
  /** Accessible label for the toggle button */
  ariaLabel?: string;
  /** Whether the toggle is disabled (e.g., during drag operations) */
  disabled?: boolean;
};

/**
 * Chevron cell for expand/collapse in hierarchical tables.
 * Shows a rotatable chevron icon for expandable rows, or empty space for leaf nodes.
 */
export function ChevronToggleCell({
  isExpanded,
  isExpandable,
  onToggle,
  ariaLabel = "Toggle expand",
  disabled = false,
}: ChevronToggleCellProps) {
  if (!isExpandable) {
    // Empty space to maintain alignment for leaf nodes
    return <div className="w-5 h-5" />;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onToggle();
        }
      }}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/50 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
      )}
      aria-label={ariaLabel}
      aria-expanded={isExpanded}
    >
      <ChevronRight
        className={cn(
          "h-4 w-4 transition-transform duration-150",
          isExpanded && "rotate-90"
        )}
      />
    </button>
  );
}

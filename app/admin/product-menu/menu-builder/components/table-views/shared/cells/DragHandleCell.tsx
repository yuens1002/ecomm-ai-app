"use client";

import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import type { CheckboxState } from "../../../../../hooks/useContextSelectionModel";

type DragHandleCellProps = {
  /** Whether DnD is currently eligible based on selection */
  isEligible: boolean;
  /** Whether this specific row is in the eligible entity set */
  isRowInEligibleSet: boolean;
  /** The row's checkbox state for visibility rules */
  checkboxState: CheckboxState;
  /** Whether the row is currently hovered */
  isRowHovered: boolean;
  /** Optional additional class names */
  className?: string;
};

/**
 * Drag handle cell with eligibility-based styling.
 *
 * Visual states:
 * - Eligible + checked: Default color, grab cursor, always visible
 * - Eligible + unchecked: Default color, grab cursor, hover-only
 * - Ineligible + checked/indeterminate: Muted color, not-allowed cursor, always visible
 * - Ineligible + unchecked: Muted color, not-allowed cursor, hover-only
 *
 * Visibility rules match checkbox:
 * - Always visible when checked or indeterminate
 * - Hover-only when unchecked
 *
 * Mobile: Hidden on touch devices (md breakpoint). Context menu provides
 * Move Up/Down actions as DnD alternative on mobile.
 */
export function DragHandleCell({
  isEligible,
  isRowInEligibleSet,
  checkboxState,
  isRowHovered,
  className,
}: DragHandleCellProps) {
  // Visibility: always show when checked or indeterminate, otherwise hover-only
  const alwaysVisible = checkboxState === "checked" || checkboxState === "indeterminate";
  const isVisible = alwaysVisible || isRowHovered;

  // Color: default when eligible, muted when not
  // Note: indeterminate is also ineligible (partial selection can't be dragged)
  // Row must also be in the eligible entity set (registry lookup succeeded)
  const isEnabled = isEligible && isRowInEligibleSet && checkboxState === "checked";

  return (
    <div
      className={cn(
        // Hidden on mobile/touch devices, flex on md+ (desktop)
        "hidden md:flex items-center justify-center",
        // Cursor based on eligibility
        isEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
        // Visibility: conditional based on selection/hover state
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <GripVertical
        className={cn(
          "h-4 w-4",
          // Color based on eligibility
          isEnabled ? "text-muted-foreground" : "text-muted-foreground/40"
        )}
      />
    </div>
  );
}

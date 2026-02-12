import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

/**
 * CVA variants for hierarchy depth indentation.
 *
 * Spacing rhythm:
 * - Standard gap: 8px (gap-2) between checkbox, chevron, content
 * - Icon + Name: use separate wrapper with gap-1 (4px) - visual unit
 * - Chevron size: 20px (w-5 h-5) with ~4px internal padding from button styling
 * - Checkbox size: 16px (w-4 h-4)
 *
 * Indentation model (checkbox indents WITH hierarchy):
 * - Labels (depth 0): no indent - checkbox + chevron + icon + name
 * - Categories (depth 1): 32px indent - aligns checkbox near header "Name" text
 * - No-descendant (depth 2): 60px indent - accounts for chevron space shift (no chevron)
 *
 * Header layout: [checkbox 16px][mr-4 16px][gap-2 8px][Name text] = ~40px to Name
 * Chevron button has ~4px internal padding, so visual alignment is offset
 */
const hierarchyVariants = cva("flex items-center gap-2", {
  variants: {
    depth: {
      0: "", // Labels: no indent
      1: "pl-23", // Categories: 32px indent (near Name column start)
      2: "pl-36", // No-descendant rows: 56px indent (no chevron, space shifts left)
    },
  },
  defaultVariants: {
    depth: 0,
  },
});

type HierarchyNameCellProps = VariantProps<typeof hierarchyVariants> & {
  children: ReactNode;
  className?: string;
};

/**
 * Main container for hierarchical name cells.
 * Includes checkbox, chevron, icon, and name - all indent together based on depth.
 *
 * Usage:
 * ```tsx
 * <HierarchyNameCell depth={0}>
 *   <HierarchyCheckbox>...</HierarchyCheckbox>
 *   <HierarchyChevron>...</HierarchyChevron>
 *   <HierarchyIcon>...</HierarchyIcon>
 *   <HierarchyName>...</HierarchyName>
 * </HierarchyNameCell>
 * ```
 */
export function HierarchyNameCell({ depth, children, className }: HierarchyNameCellProps) {
  return (
    <div
      data-slot="hierarchy-name-cell"
      data-depth={depth}
      className={cn(hierarchyVariants({ depth }), className)}
    >
      {children}
    </div>
  );
}

type SlotProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Slot for the checkbox within HierarchyNameCell.
 * Prevents checkbox clicks from triggering row selection.
 * mr-4 (16px) + gap-2 (8px) = 24px effective gap, minus ~4px chevron button padding = ~20px visual gap.
 */
export function HierarchyCheckbox({ children, className }: SlotProps) {
  return (
    <div
      data-slot="hierarchy-checkbox"
      data-row-click-ignore
      className={cn("flex-shrink-0 mr-3", className)}
    >
      {children}
    </div>
  );
}

/**
 * Slot for the expand/collapse chevron within HierarchyNameCell.
 * -ml-1 (4px) compensates for chevron button's internal padding (20px button, 16px icon).
 * This aligns the chevron icon visually with header "Name" text when not hovered.
 */
export function HierarchyChevron({ children, className }: SlotProps) {
  return (
    <div data-slot="hierarchy-chevron" className={cn("flex-shrink-0 -ml-1", className)}>
      {children}
    </div>
  );
}

/**
 * Slot for the icon within HierarchyNameCell (typically for labels).
 */
export function HierarchyIcon({ children, className }: SlotProps) {
  return (
    <div data-slot="hierarchy-icon" className={cn("flex-shrink-0", className)}>
      {children}
    </div>
  );
}

/**
 * Slot for the name/text within HierarchyNameCell.
 * Uses min-w-0 to handle long names properly.
 * Note: overflow-visible allows focus rings to display fully.
 */
export function HierarchyName({ children, className }: SlotProps) {
  return (
    <div data-slot="hierarchy-name" className={cn("min-w-0 overflow-visible", className)}>
      {children}
    </div>
  );
}

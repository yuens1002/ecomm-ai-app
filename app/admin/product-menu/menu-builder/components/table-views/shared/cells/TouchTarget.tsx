import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TouchTargetProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Wrapper that expands touch target to 44x44px on mobile (WCAG 2.5.5 compliance).
 * Desktop keeps natural sizing since precise cursors don't need large targets.
 *
 * NOTE: Only use for block-level items in their own table cell (e.g., CheckboxCell,
 * ChevronToggleCell). Do NOT wrap inline elements (e.g., pencil icon next to text)
 * as it will break layout. For inline elements, use the pseudo-element technique:
 * `className="relative before:absolute before:-inset-3 before:md:hidden"`
 *
 * @example
 * ```tsx
 * <TableCell>
 *   <TouchTarget>
 *     <CheckboxCell ... />
 *   </TouchTarget>
 * </TableCell>
 * ```
 */
export function TouchTarget({ children, className }: TouchTargetProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        // 44x44px minimum on mobile, natural size on desktop
        "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
        className
      )}
    >
      {children}
    </div>
  );
}

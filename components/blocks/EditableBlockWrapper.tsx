"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditableBlockWrapperProps {
  children: ReactNode;
  onEdit?: () => void;
  /** Buttons shown on top-left (e.g., Add block) */
  leftButtons?: ReactNode;
  /** Buttons shown on top-right (e.g., Edit, Delete) */
  rightButtons?: ReactNode;
  /** @deprecated Use rightButtons instead */
  editButtons?: ReactNode;
  className?: string;
  showHoverEffect?: boolean;
}

/**
 * Reusable wrapper for editable blocks in the CMS
 * Provides:
 * - Hover effect with fade-in edit buttons
 * - Click to edit functionality
 * - Consistent styling across all block types
 * - Left buttons (Add) and right buttons (Edit/Delete)
 */
export function EditableBlockWrapper({
  children,
  onEdit,
  leftButtons,
  rightButtons,
  editButtons,
  className,
  showHoverEffect = true,
}: EditableBlockWrapperProps) {
  // Support legacy editButtons prop
  const right = rightButtons || editButtons;

  return (
    <div
      className={cn(
        "relative cursor-pointer",
        showHoverEffect &&
          "group transition-all hover:ring-1 hover:ring-[#00d4ff]",
        className
      )}
      onClick={onEdit}
    >
      {/* Block Content */}
      {children}

      {/* Left Controls Overlay (Add button) - Fade in on hover */}
      {leftButtons && showHoverEffect && (
        <div className="absolute top-4 left-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {leftButtons}
        </div>
      )}

      {/* Right Controls Overlay (Edit/Delete) - Fade in on hover */}
      {right && showHoverEffect && (
        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {right}
        </div>
      )}
    </div>
  );
}

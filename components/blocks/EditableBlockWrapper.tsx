"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditableBlockWrapperProps {
  children: ReactNode;
  onEdit?: () => void;
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
 */
export function EditableBlockWrapper({
  children,
  onEdit,
  editButtons,
  className,
  showHoverEffect = true,
}: EditableBlockWrapperProps) {
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

      {/* Edit Controls Overlay - Fade in on hover */}
      {editButtons && showHoverEffect && (
        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {editButtons}
        </div>
      )}
    </div>
  );
}

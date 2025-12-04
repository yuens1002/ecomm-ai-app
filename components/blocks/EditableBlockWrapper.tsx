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
  /** When true, clicking the wrapper won't trigger onEdit (useful when dialog is open) */
  disabled?: boolean;
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
  disabled = false,
}: EditableBlockWrapperProps) {
  // Support legacy editButtons prop
  const right = rightButtons || editButtons;

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on a portal (like dialog overlay)
    // or if the target is not within this wrapper
    const target = e.target as HTMLElement;
    const isFromPortal = !e.currentTarget.contains(target);

    if (!disabled && !isFromPortal && onEdit) {
      onEdit();
    }
  };

  return (
    <div
      className={cn(
        "relative cursor-pointer",
        showHoverEffect &&
          "group transition-all hover:ring-1 hover:ring-[#00d4ff]",
        className
      )}
      onClick={handleClick}
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

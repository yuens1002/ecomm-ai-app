import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  isEditing?: boolean;
  onClick?: () => void;
  actionButtons?: ReactNode;
}

/**
 * Typography wrapper - applies global .prose styles from globals.css
 * Use this to wrap rich text content for consistent typography.
 */
export function Typography({
  children,
  className,
  isEditing = false,
  onClick,
  actionButtons,
}: TypographyProps) {
  const editingClasses = isEditing
    ? "relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
    : "";

  return (
    <div onClick={onClick} className={cn("prose", editingClasses, className)}>
      {children}

      {/* Action Buttons (e.g., delete) */}
      {isEditing && actionButtons && (
        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionButtons}
        </div>
      )}
    </div>
  );
}

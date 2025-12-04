import { Clock } from "lucide-react";
import { ReactNode } from "react";

interface ScheduleEntry {
  day: string;
  hours: string;
}

interface HoursCardProps {
  schedule: ScheduleEntry[];
  title?: string;
  className?: string;
  /** 'card' for standalone block, 'inline' for embedding in other components */
  variant?: "card" | "inline";
  isEditing?: boolean;
  onClick?: () => void;
  actionButtons?: ReactNode;
}

/**
 * HoursCard - Presentational component for displaying business hours
 *
 * Features:
 * - Clock icon with "Hours" title
 * - Grid of day/hours entries
 * - Edit mode with hover effect and action buttons
 * - Consistent styling with other block display components
 * - Variants: 'card' (standalone) or 'inline' (for embedding in LocationBlock etc.)
 */
export function HoursCard({
  schedule,
  title = "Hours",
  className = "",
  variant = "card",
  isEditing = false,
  onClick,
  actionButtons,
}: HoursCardProps) {
  const cardClasses = "flex flex-col gap-4 rounded-lg border p-6";
  const inlineClasses = "";
  const baseClasses = variant === "card" ? cardClasses : inlineClasses;
  const editingClasses = isEditing
    ? "relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
    : "";

  return (
    <div
      className={`${baseClasses} ${editingClasses} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 pb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-1">
        {schedule.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.day}</span>
            <span className="font-medium">{item.hours}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons (e.g., delete) */}
      {isEditing && actionButtons && (
        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionButtons}
        </div>
      )}
    </div>
  );
}

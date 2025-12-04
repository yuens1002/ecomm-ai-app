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
 */
export function HoursCard({
  schedule,
  title = "Hours",
  className = "",
  isEditing = false,
  onClick,
  actionButtons,
}: HoursCardProps) {
  const baseClasses = "flex flex-col gap-4 rounded-lg border p-6";
  const editingClasses = isEditing
    ? "relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
    : "";

  return (
    <div
      className={`${baseClasses} ${editingClasses} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="grid gap-2">
        {schedule.map((item, index) => (
          <div key={index} className="flex justify-between">
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

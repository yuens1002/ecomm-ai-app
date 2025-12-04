import { LucideIcon, Calendar, MapPin, Award } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  emoji?: string; // Optional emoji to display instead of icon
  icon?: LucideIcon;
  className?: string;
  isEditing?: boolean;
  onClick?: () => void;
  actionButtons?: ReactNode;
}

// Map common labels to icons
const getIconForLabel = (label: string): LucideIcon => {
  const lowerLabel = label.toLowerCase();
  if (
    lowerLabel.includes("found") ||
    lowerLabel.includes("year") ||
    lowerLabel.includes("since")
  ) {
    return Calendar;
  }
  if (
    lowerLabel.includes("origin") ||
    lowerLabel.includes("countr") ||
    lowerLabel.includes("region")
  ) {
    return MapPin;
  }
  return Award;
};

export function StatCard({
  label,
  value,
  emoji,
  icon,
  className = "",
  isEditing = false,
  onClick,
  actionButtons,
}: StatCardProps) {
  const Icon = icon || getIconForLabel(label);

  const baseClasses =
    "flex flex-col items-center justify-center text-center p-6 bg-muted/50 rounded-lg border border-border h-full";
  const editingClasses = isEditing
    ? "relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
    : "";

  return (
    <div
      className={`${baseClasses} ${editingClasses} ${className}`}
      onClick={onClick}
    >
      {emoji ? (
        <span className="text-4xl mb-3" role="img" aria-label={label}>
          {emoji}
        </span>
      ) : (
        <Icon className="h-8 w-8 text-primary mb-3 shrink-0" />
      )}
      <div className="text-3xl font-bold text-foreground mb-1 overflow-hidden text-ellipsis line-clamp-2 w-full">
        {value}
      </div>
      <div className="text-sm text-muted-foreground font-medium overflow-hidden text-ellipsis line-clamp-2 w-full">
        {label}
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

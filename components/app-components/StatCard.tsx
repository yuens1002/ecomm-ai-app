import { LucideIcon, Calendar, MapPin, Award } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
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
  icon,
  className = "",
}: StatCardProps) {
  const Icon = icon || getIconForLabel(label);

  return (
    <div
      className={`flex flex-col items-center text-center p-6 bg-muted/50 rounded-lg border border-border ${className}`}
    >
      <Icon className="h-8 w-8 text-primary mb-3" />
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

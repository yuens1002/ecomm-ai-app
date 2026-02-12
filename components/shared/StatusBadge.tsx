import { getStatusColor, getStatusLabel } from "./record-utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  colorClassName?: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  colorClassName,
  className = "font-medium",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-1 text-xs ${className} rounded-full ${colorClassName || getStatusColor(status)}`}
    >
      {label || getStatusLabel(status)}
    </span>
  );
}

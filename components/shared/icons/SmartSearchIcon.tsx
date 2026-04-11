interface SmartSearchIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom smart search icon — a magnifying glass with a subtle spark at the handle,
 * conveying "this search understands you" without generic AI iconography.
 */
export function SmartSearchIcon({ className, size = 20 }: SmartSearchIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Magnifying glass lens */}
      <circle cx="10.5" cy="10.5" r="6.5" />
      {/* Handle */}
      <line x1="15.5" y1="15.5" x2="20" y2="20" />
      {/* Spark lines inside the lens — intelligence motif */}
      <line x1="10.5" y1="7.5" x2="10.5" y2="8.5" />
      <line x1="10.5" y1="12.5" x2="10.5" y2="13.5" />
      <line x1="7.5" y1="10.5" x2="8.5" y2="10.5" />
      <line x1="12.5" y1="10.5" x2="13.5" y2="10.5" />
      {/* Diagonal sparks for warmth */}
      <line x1="8.4" y1="8.4" x2="9.1" y2="9.1" />
      <line x1="11.9" y1="11.9" x2="12.6" y2="12.6" />
    </svg>
  );
}

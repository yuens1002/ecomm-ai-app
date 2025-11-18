import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats billing interval into human-readable delivery schedule string
 * @param interval - Billing interval (day, week, month, year)
 * @param count - Interval count (1, 2, 3, etc.)
 * @returns Formatted string like "Every week", "Every 2 weeks", "Every month"
 */
export function formatBillingInterval(
  interval: string,
  count: number = 1
): string {
  const normalizedInterval = interval.toLowerCase();
  if (count === 1) {
    return `Every ${normalizedInterval}`;
  }
  return `Every ${count} ${normalizedInterval}s`;
}

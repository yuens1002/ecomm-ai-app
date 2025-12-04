"use client";

import { icons, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Export the type for icon names
export type IconName = keyof typeof icons;

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  label?: string;
  labelPosition?: "right" | "bottom";
  labelClassName?: string;
}

/**
 * Dynamic Icon Component
 * Renders a Lucide icon by name with optional label
 *
 * @example
 * <DynamicIcon name="Coffee" size={24} />
 * <DynamicIcon name="MapPin" label="Location" labelPosition="right" />
 */
export function DynamicIcon({
  name,
  className,
  size = 24,
  label,
  labelPosition = "right",
  labelClassName,
}: DynamicIconProps) {
  // Get the icon component from lucide-react
  const IconComponent = icons[name as keyof typeof icons] as LucideIcon;

  // Fallback to a default icon if not found
  const Icon = IconComponent || icons.FileText;

  if (label) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2",
          labelPosition === "bottom" && "flex-col",
          className
        )}
      >
        <Icon size={size} />
        <span className={cn("text-sm", labelClassName)}>{label}</span>
      </div>
    );
  }

  return <Icon size={size} className={className} />;
}

/**
 * Get list of all available Lucide icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(icons).sort();
}

/**
 * Icon selector for forms - shows common icons
 */
export const COMMON_PAGE_ICONS = [
  "Home",
  "Coffee",
  "MapPin",
  "Clock",
  "Phone",
  "Mail",
  "Info",
  "HelpCircle",
  "Users",
  "ShoppingBag",
  "Calendar",
  "Settings",
  "FileText",
  "Image",
  "Star",
  "Heart",
] as const;

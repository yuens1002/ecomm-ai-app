"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicIcon, type IconName } from "@/components/shared/icons/DynamicIcon";

export type BannerVariant = "preview" | "promo" | "info" | "warning" | "error";

interface SiteBannerProps {
  variant?: BannerVariant;
  message: string;
  icon?: IconName;
  dismissible?: boolean;
  onDismiss?: () => void;
  link?: {
    href: string;
    label: string;
  };
  className?: string;
}

const variantStyles: Record<BannerVariant, string> = {
  preview: "bg-amber-500 text-amber-950",
  promo: "bg-primary text-primary-foreground",
  info: "bg-blue-500 text-white",
  warning: "bg-yellow-500 text-yellow-950",
  error: "bg-red-500 text-white",
};

const defaultIcons: Record<BannerVariant, IconName> = {
  preview: "Eye",
  promo: "Tag",
  info: "Info",
  warning: "TriangleAlert",
  error: "CircleAlert",
};

export function SiteBanner({
  variant = "info",
  message,
  icon,
  dismissible = false,
  onDismiss,
  link,
  className,
}: SiteBannerProps) {
  const iconName = icon || defaultIcons[variant];

  return (
    <div
      className={cn(
        "w-full px-4 py-2 text-center text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-center gap-2">
        <DynamicIcon name={iconName} className="h-4 w-4 shrink-0" />
        <span>{message}</span>
        {link && (
          <a
            href={link.href}
            className="underline underline-offset-2 hover:no-underline font-semibold ml-1"
          >
            {link.label}
          </a>
        )}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

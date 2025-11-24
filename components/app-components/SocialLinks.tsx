"use client";

import Link from "next/link";
import Image from "next/image";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  customIconUrl?: string | null;
  useCustomIcon: boolean;
}

interface SocialLinksProps {
  links: SocialLink[];
}

export default function SocialLinks({ links }: SocialLinksProps) {
  if (links.length === 0) {
    return null;
  }

  const renderIcon = (link: SocialLink) => {
    // Use custom image if enabled and URL is provided
    if (link.useCustomIcon && link.customIconUrl) {
      return (
        <Image
          src={link.customIconUrl}
          alt={`${link.platform} icon`}
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
      );
    }

    // Otherwise use Lucide icon with fill
    // Try exact match first
    let IconComponent = icons[link.icon as keyof typeof icons] as LucideIcon;
    
    // If not found, try case-insensitive match
    if (!IconComponent) {
      const iconKey = Object.keys(icons).find(
        key => key.toLowerCase() === link.icon.toLowerCase()
      );
      if (iconKey) {
        IconComponent = icons[iconKey as keyof typeof icons] as LucideIcon;
      }
    }
    
    // Fallback to Link icon
    if (!IconComponent) {
      IconComponent = icons.Link as LucideIcon;
    }
    
    return <IconComponent className="w-5 h-5" fill="currentColor" />;
  };

  return (
    <div className="flex gap-4">
      {links.map((link) => (
        <Link
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={link.platform}
        >
          {renderIcon(link)}
        </Link>
      ))}
    </div>
  );
}

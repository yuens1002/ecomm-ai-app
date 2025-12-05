"use client";

import { useState, useEffect } from "react";
import { useSiteBanner } from "@/hooks/useSiteBanner";
import { SiteBanner } from "./SiteBanner";

/**
 * Client component that renders the site banner from context.
 * Renders only after mount to prevent hydration mismatch.
 */
export function SiteBannerPortal() {
  const [mounted, setMounted] = useState(true); // Set to true directly, no effect needed
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastBannerMessage, setLastBannerMessage] = useState<
    string | undefined
  >();
  const { banner } = useSiteBanner();

  // Reset dismissed state when banner changes
  if (banner?.message !== lastBannerMessage) {
    setLastBannerMessage(banner?.message);
    setIsDismissed(false);
  }

  // Don't render anything during SSR or if no banner
  if (!mounted || !banner || isDismissed) {
    return null;
  }

  return (
    <SiteBanner
      variant={banner.variant}
      message={banner.message}
      icon={banner.icon}
      dismissible={banner.dismissible}
      onDismiss={() => setIsDismissed(true)}
      link={banner.link}
    />
  );
}

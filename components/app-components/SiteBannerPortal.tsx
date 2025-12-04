"use client";

import { useState, useEffect } from "react";
import { useSiteBanner } from "@/hooks/useSiteBanner";
import { SiteBanner } from "./SiteBanner";

/**
 * Client component that renders the site banner from context.
 * Renders only after mount to prevent hydration mismatch.
 */
export function SiteBannerPortal() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { banner } = useSiteBanner();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset dismissed state when banner changes
  useEffect(() => {
    setIsDismissed(false);
  }, [banner?.message]);

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

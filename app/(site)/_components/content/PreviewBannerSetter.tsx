"use client";

import { useEffect } from "react";
import { useSiteBanner } from "@/app/(site)/_hooks/useSiteBanner";

interface PreviewBannerSetterProps {
  show: boolean;
}

/**
 * Client component that sets the preview banner in the SiteHeader
 * via the SiteBanner context when the page is in preview mode.
 */
export function PreviewBannerSetter({ show }: PreviewBannerSetterProps) {
  const { setBanner, clearBanner } = useSiteBanner();

  useEffect(() => {
    if (show) {
      setBanner({
        variant: "preview",
        message: "PREVIEW MODE — This page is not published",
        icon: "Eye",
      });
    } else {
      clearBanner();
    }

    // Clear banner when component unmounts
    return () => {
      clearBanner();
    };
    // setBanner and clearBanner are stable (memoized) so safe to exclude
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // This component doesn't render anything
  return null;
}

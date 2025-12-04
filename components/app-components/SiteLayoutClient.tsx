"use client";

import { ReactNode } from "react";
import { SiteBannerProvider } from "@/hooks/useSiteBanner";

/**
 * Client-side wrapper for site layout that provides the banner context.
 * This ensures hydration consistency by making the provider boundary explicit.
 */
export function SiteLayoutClient({ children }: { children: ReactNode }) {
  return <SiteBannerProvider>{children}</SiteBannerProvider>;
}

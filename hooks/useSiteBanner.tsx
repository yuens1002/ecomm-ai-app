"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { IconName } from "@/components/app-components/DynamicIcon";
import type { BannerVariant } from "@/components/app-components/SiteBanner";

interface BannerConfig {
  variant?: BannerVariant;
  message: string;
  icon?: IconName;
  dismissible?: boolean;
  link?: {
    href: string;
    label: string;
  };
}

interface SiteBannerContextType {
  banner: BannerConfig | null;
  setBanner: (banner: BannerConfig | null) => void;
  clearBanner: () => void;
}

const SiteBannerContext = createContext<SiteBannerContextType | null>(null);

export function SiteBannerProvider({ children }: { children: ReactNode }) {
  const [banner, setBannerState] = useState<BannerConfig | null>(null);

  const setBanner = useCallback((newBanner: BannerConfig | null) => {
    setBannerState(newBanner);
  }, []);

  const clearBanner = useCallback(() => setBannerState(null), []);

  return (
    <SiteBannerContext.Provider value={{ banner, setBanner, clearBanner }}>
      {children}
    </SiteBannerContext.Provider>
  );
}

/**
 * Hook to access the site banner context.
 * Returns a safe default if used outside of provider (e.g., during SSR).
 */
export function useSiteBanner(): SiteBannerContextType {
  const context = useContext(SiteBannerContext);

  // Return safe defaults if context is not available (SSR or outside provider)
  if (context === null) {
    return {
      banner: null,
      setBanner: () => {},
      clearBanner: () => {},
    };
  }

  return context;
}

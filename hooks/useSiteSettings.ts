"use client";

import { useEffect, useState } from "react";
import {
  type SiteSettings,
  defaultSettings,
  mapSettingsRecord,
} from "@/lib/site-settings";

// Re-export for consumers that import from this module
export type { SiteSettings };
export { defaultSettings };

// Cache for settings to avoid repeated fetches
let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;

async function fetchSettings(): Promise<SiteSettings> {
  // If already fetching, return the same promise
  if (fetchPromise) return fetchPromise;

  // If already cached, return immediately
  if (cachedSettings) return Promise.resolve(cachedSettings);

  // Start new fetch
  fetchPromise = fetch("/api/settings/public")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    })
    .then((data) => {
      cachedSettings = mapSettingsRecord(data);
      fetchPromise = null; // Clear promise after successful fetch
      return cachedSettings;
    })
    .catch((error) => {
      console.error("Error fetching site settings:", error);
      fetchPromise = null; // Clear promise on error
      return defaultSettings;
    });

  return fetchPromise;
}

/**
 * Hook to access site-wide branding settings
 * Returns default values immediately, then updates with DB values
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(
    cachedSettings || defaultSettings
  );
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (!cachedSettings) {
      fetchSettings().then((fetchedSettings) => {
        setSettings(fetchedSettings);
        setIsLoading(false);
      });
    }
  }, []);

  return { settings, isLoading };
}

/**
 * Clear the settings cache (useful after admin updates settings)
 */
export function clearSettingsCache() {
  cachedSettings = null;
  fetchPromise = null;
}

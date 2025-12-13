"use client";

import { useEffect, useState } from "react";

export interface SiteSettings {
  storeName: string;
  storeTagline: string;
  storeDescription: string;
  storeLogoUrl: string;
  contactEmail: string;
  // Marketing Content
  homepageFeaturedHeading: string;
  homepageRecommendationsTrendingHeading: string;
  homepageRecommendationsTrendingDescription: string;
  homepageRecommendationsPersonalizedHeading: string;
  homepageRecommendationsExploreAllText: string;
  footerCategoriesHeading: string;
  footerQuickLinksHeading: string;
  productRelatedHeading: string;
  // Add-ons Section Titles
  productAddOnsSectionTitle: string;
  cartAddOnsSectionTitle: string;
}

const defaultSettings: SiteSettings = {
  storeName: "Artisan Roast",
  storeTagline: "Specialty coffee sourced from the world's finest origins.",
  storeDescription:
    "Premium specialty coffee, carefully roasted to perfection. From single-origin beans to signature blends, discover exceptional coffee delivered to your door.",
  storeLogoUrl: "/logo.svg",
  contactEmail: "hello@artisan-roast.com",
  // Marketing Content defaults
  homepageFeaturedHeading: "Our Small Batch Collection",
  homepageRecommendationsTrendingHeading: "Trending Now",
  homepageRecommendationsTrendingDescription:
    "Discover what other coffee lovers are enjoying",
  homepageRecommendationsPersonalizedHeading: "Recommended For You",
  homepageRecommendationsExploreAllText: "Explore All Coffees",
  footerCategoriesHeading: "Coffee Selection",
  footerQuickLinksHeading: "Quick Links",
  productRelatedHeading: "You Might Also Like",
  // Add-ons defaults
  productAddOnsSectionTitle: "Save on a Bundle",
  cartAddOnsSectionTitle: "You May Also Like",
};

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
      cachedSettings = {
        storeName: data.store_name || defaultSettings.storeName,
        storeTagline: data.store_tagline || defaultSettings.storeTagline,
        storeDescription:
          data.store_description || defaultSettings.storeDescription,
        storeLogoUrl: data.store_logo_url || defaultSettings.storeLogoUrl,
        contactEmail: data.contactEmail || defaultSettings.contactEmail,
        // Marketing Content
        homepageFeaturedHeading:
          data.homepage_featured_heading ||
          defaultSettings.homepageFeaturedHeading,
        homepageRecommendationsTrendingHeading:
          data.homepage_recommendations_trending_heading ||
          defaultSettings.homepageRecommendationsTrendingHeading,
        homepageRecommendationsTrendingDescription:
          data.homepage_recommendations_trending_description ||
          defaultSettings.homepageRecommendationsTrendingDescription,
        homepageRecommendationsPersonalizedHeading:
          data.homepage_recommendations_personalized_heading ||
          defaultSettings.homepageRecommendationsPersonalizedHeading,
        homepageRecommendationsExploreAllText:
          data.homepage_recommendations_explore_all_text ||
          defaultSettings.homepageRecommendationsExploreAllText,
        footerCategoriesHeading:
          data.footer_categories_heading ||
          defaultSettings.footerCategoriesHeading,
        footerQuickLinksHeading:
          data.footer_quick_links_heading ||
          defaultSettings.footerQuickLinksHeading,
        productRelatedHeading:
          data.product_related_heading || defaultSettings.productRelatedHeading,
        // Add-ons Section Titles
        productAddOnsSectionTitle:
          data.product_addons_section_title ||
          defaultSettings.productAddOnsSectionTitle,
        cartAddOnsSectionTitle:
          data.cart_addons_section_title ||
          defaultSettings.cartAddOnsSectionTitle,
      };
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

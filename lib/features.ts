/**
 * Feature flags for Artisan Roast
 * Community edition has core features enabled
 * Pro edition unlocks additional features
 */

import { EDITION } from "./version";

/**
 * Feature flag definitions
 * Community features are always enabled
 * Pro features are gated by EDITION env var
 */
export const FEATURES = {
  // Community Edition (always enabled)
  AI_CHAT: true,
  AI_RECOMMENDATIONS: true,
  MENU_BUILDER: true,
  PAGES_CMS: true,
  SUBSCRIPTIONS: true,
  FEEDBACK_WIDGET: true,
  ANALYTICS_BASIC: true,

  // Pro Edition (gated)
  CUSTOM_DOMAIN: EDITION === "pro",
  PRIORITY_SUPPORT: EDITION === "pro",
  ADVANCED_ANALYTICS: EDITION === "pro",
  WHITE_LABEL: EDITION === "pro",
  AUTO_UPDATES: EDITION === "pro",
  MULTI_STORE: EDITION === "pro",
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function hasFeature(feature: FeatureKey): boolean {
  return FEATURES[feature] ?? false;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureKey[] {
  return (Object.keys(FEATURES) as FeatureKey[]).filter(
    (key) => FEATURES[key]
  );
}

/**
 * Get all Pro-only features
 */
export function getProFeatures(): FeatureKey[] {
  return (Object.keys(FEATURES) as FeatureKey[]).filter(
    (key) => !FEATURES[key] && EDITION !== "pro"
  );
}

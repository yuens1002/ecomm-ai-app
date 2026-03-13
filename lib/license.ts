/**
 * License Module — Core tier detection, feature gating, and usage budget checks.
 *
 * Calls the platform API to validate the store's license key and determine
 * which features are enabled. Gracefully degrades to FREE tier when the
 * platform is unreachable or no key is configured.
 *
 * Cache strategy:
 * - License validation: 24h TTL (tier changes are infrequent)
 * - Feature catalog: 24h TTL
 * - Usage budget: 5min TTL (must stay fresh for UI display)
 */

import type {
  Tier,
  LicenseInfo,
  UsageBudgetResult,
  CatalogFeature,
  Capabilities,
  GAConfig,
} from "./license-types";
import { APP_VERSION } from "./version";
import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_URL = (
  process.env.PLATFORM_URL || "https://manage.artisanroast.app"
).replace(/\/+$/, "");

const CACHE_TTL = {
  license: 24 * 60 * 60 * 1000, // 24 hours
  catalog: 24 * 60 * 60 * 1000, // 24 hours
  usage: 5 * 60 * 1000, // 5 minutes
} as const;

const DEFAULT_GA_CONFIG: GAConfig = {
  connected: false,
  measurementId: null,
  propertyName: null,
  lastSynced: null,
};

const FREE_DEFAULT: LicenseInfo = {
  valid: false,
  tier: "FREE",
  features: [],
  trialEndsAt: null,
  managedBy: null,
  compatibility: "full",
  warnings: [],
  usage: null,
  gaConfig: DEFAULT_GA_CONFIG,
  availableActions: [],
};

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ---------------------------------------------------------------------------
// License key resolution
// ---------------------------------------------------------------------------

export async function getLicenseKey(): Promise<string> {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: "license.key" },
    });
    if (setting?.value) return setting.value;
  } catch {
    // DB error — fall through to env
  }
  return process.env.LICENSE_KEY || "";
}

// ---------------------------------------------------------------------------
// Core: validateLicense
// ---------------------------------------------------------------------------

/**
 * Validate the store's license key against the platform API.
 * Returns cached result within TTL. Falls back to FREE on error.
 */
export async function validateLicense(): Promise<LicenseInfo> {
  // Dev/test mock override
  const mockTier = process.env.MOCK_LICENSE_TIER as Tier | undefined;
  if (mockTier) {
    return getMockLicenseInfo(mockTier);
  }

  // Check cache
  const cached = getCached<LicenseInfo>("license");
  if (cached) return cached;

  const key = await getLicenseKey();
  if (!key) {
    setCache("license", FREE_DEFAULT, CACHE_TTL.license);
    return FREE_DEFAULT;
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/license/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        appVersion: APP_VERSION,
        capabilities: getCapabilities(),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `License validation failed [${response.status}]:`,
        await response.text().catch(() => "")
      );
      return fallbackOrFree();
    }

    const data = (await response.json()) as LicenseInfo;
    setCache("license", data, CACHE_TTL.license);
    return data;
  } catch (error) {
    console.error("License validation error:", error);
    return fallbackOrFree();
  }
}

/** Return stale cache if available, otherwise FREE default. */
function fallbackOrFree(): LicenseInfo {
  // Try stale cache (expired but still in map)
  const stale = cache.get("license");
  if (stale) {
    // Re-cache with short TTL to avoid hammering on errors
    setCache("license", stale.data as LicenseInfo, 5 * 60 * 1000);
    return stale.data as LicenseInfo;
  }
  setCache("license", FREE_DEFAULT, CACHE_TTL.license);
  return FREE_DEFAULT;
}

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------

/** Get the current tier. */
export async function getTier(): Promise<Tier> {
  const info = await validateLicense();
  return info.tier;
}

/** Check if Pro or Hosted tier is active. */
export async function isProEnabled(): Promise<boolean> {
  const tier = await getTier();
  return tier === "PRO" || tier === "HOSTED";
}

// ---------------------------------------------------------------------------
// Feature gating
// ---------------------------------------------------------------------------

/**
 * Check if a specific Pro feature is enabled for this license.
 * FREE-tier features (chat, recommend, aboutAssist) use app-settings toggles,
 * not this function.
 */
export async function hasFeature(slug: string): Promise<boolean> {
  const info = await validateLicense();
  return info.features.includes(slug);
}

// ---------------------------------------------------------------------------
// Trial
// ---------------------------------------------------------------------------

/** Get days remaining in trial, or null if not in trial. */
export async function getTrialDaysRemaining(): Promise<number | null> {
  const info = await validateLicense();
  if (info.tier !== "TRIAL" || !info.trialEndsAt) return null;

  const end = new Date(info.trialEndsAt).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  return days;
}

// ---------------------------------------------------------------------------
// Usage budget
// ---------------------------------------------------------------------------

/** Check token usage budget (TRIAL tier). Uses shorter cache TTL. */
export async function checkUsageBudget(): Promise<UsageBudgetResult | null> {
  const info = await validateLicense();
  if (!info.usage) return null;

  const { tokensUsed, tokenBudget, billingRequired } = info.usage;
  const percentUsed =
    tokenBudget > 0 ? Math.round((tokensUsed / tokenBudget) * 100) : 0;

  return {
    tokensUsed,
    tokenBudget,
    percentUsed,
    isExhausted: tokensUsed >= tokenBudget,
    billingRequired,
  };
}

// ---------------------------------------------------------------------------
// Feature catalog
// ---------------------------------------------------------------------------

/** Fetch the Pro feature catalog from the platform. Cached 24h. */
export async function getFeatureCatalog(): Promise<CatalogFeature[]> {
  const cached = getCached<CatalogFeature[]>("catalog");
  if (cached) return cached;

  try {
    const response = await fetch(`${PLATFORM_URL}/api/features`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Feature catalog fetch failed:", response.status);
      return getDefaultCatalog();
    }

    const data = (await response.json()) as { features: CatalogFeature[] };
    const features = data.features || [];
    setCache("catalog", features, CACHE_TTL.catalog);
    return features;
  } catch (error) {
    console.error("Feature catalog error:", error);
    return getDefaultCatalog();
  }
}

/** Hardcoded fallback catalog when platform is unreachable. */
function getDefaultCatalog(): CatalogFeature[] {
  const catalog: CatalogFeature[] = [
    {
      slug: "ga",
      name: "Google Analytics",
      description: "Inject GA tracking across your storefront",
      category: "analytics",
      minAppVersion: "0.95.0",
    },
    {
      slug: "analytics-insights",
      name: "Analytics Insights",
      description:
        "AI-powered sales trends, customer behavior, and demand forecasting",
      category: "analytics",
      minAppVersion: "0.95.0",
    },
    {
      slug: "ai-product-ops",
      name: "AI Product Operations",
      description:
        "Generate and enhance product descriptions, suggest tags, optimize SEO",
      category: "ai",
      minAppVersion: "0.95.0",
    },
    {
      slug: "ai-cms",
      name: "AI Content Management",
      description: "Generate page content, rewrite copy, suggest layouts",
      category: "ai",
      minAppVersion: "0.95.0",
    },
    {
      slug: "ai-reviews",
      name: "AI Review Management",
      description:
        "Summarize reviews, sentiment scoring, spam detection, response generation",
      category: "ai",
      minAppVersion: "0.95.0",
    },
    {
      slug: "ai-promotions",
      name: "AI Promotions",
      description:
        "Generate promo copy, suggest discount strategies, A/B test variants",
      category: "ai",
      minAppVersion: "0.95.0",
    },
    {
      slug: "priority-support",
      name: "Priority Support",
      description:
        "Email and phone support with dedicated hours per billing cycle",
      category: "support",
      minAppVersion: "0.95.0",
    },
  ];
  setCache("catalog", catalog, CACHE_TTL.catalog);
  return catalog;
}

// ---------------------------------------------------------------------------
// GA config
// ---------------------------------------------------------------------------

/** Get Google Analytics configuration from license. */
export async function getGAConfig(): Promise<GAConfig> {
  const info = await validateLicense();
  return info.gaConfig || DEFAULT_GA_CONFIG;
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

/** Report this store's capabilities to the platform. */
export function getCapabilities(): Capabilities {
  return {
    licenseModule: true,
    settingsTable: true,
    aiProxy: false, // Phase 2C
    gaInjection: false, // Phase 2D
  };
}

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

/** Clear all cached license data. Call after key changes. */
export function invalidateCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Mock data (for MOCK_LICENSE_TIER env var)
// ---------------------------------------------------------------------------

function getMockLicenseInfo(tier: Tier): LicenseInfo {
  switch (tier) {
    case "TRIAL":
      return {
        valid: true,
        tier: "TRIAL",
        features: [
          "ga",
          "analytics-insights",
          "ai-product-ops",
          "ai-cms",
          "ai-reviews",
          "ai-promotions",
          "priority-support",
        ],
        trialEndsAt: new Date(
          Date.now() + 18 * 24 * 60 * 60 * 1000
        ).toISOString(),
        managedBy: null,
        compatibility: "full",
        warnings: [],
        usage: {
          tokensUsed: 31400,
          tokenBudget: 50000,
          hourlyRemaining: 8200,
          billingRequired: false,
        },
        gaConfig: DEFAULT_GA_CONFIG,
        availableActions: [
          {
            slug: "upgrade-pro",
            label: "Upgrade to Pro",
            url: `${PLATFORM_URL}/signup?plan=pro`,
            variant: "primary",
          },
          {
            slug: "manage-billing",
            label: "Manage Billing",
            url: `${PLATFORM_URL}/billing`,
            variant: "outline",
          },
        ],
      };
    case "PRO":
      return {
        valid: true,
        tier: "PRO",
        features: [
          "ga",
          "ai-product-ops",
          "ai-reviews",
          "analytics-insights",
        ],
        trialEndsAt: null,
        managedBy: null,
        compatibility: "full",
        warnings: [],
        usage: null,
        gaConfig: DEFAULT_GA_CONFIG,
        availableActions: [
          {
            slug: "add-features",
            label: "Add Features",
            url: `${PLATFORM_URL}/billing`,
            variant: "outline",
          },
          {
            slug: "manage-billing",
            label: "Manage Billing",
            url: `${PLATFORM_URL}/billing`,
            variant: "outline",
          },
        ],
      };
    case "HOSTED":
      return {
        valid: true,
        tier: "HOSTED",
        features: [
          "ga",
          "analytics-insights",
          "ai-product-ops",
          "ai-cms",
          "ai-reviews",
          "ai-promotions",
          "priority-support",
        ],
        trialEndsAt: null,
        managedBy: "platform",
        compatibility: "full",
        warnings: [],
        usage: null,
        gaConfig: {
          connected: true,
          measurementId: "G-MOCK12345",
          propertyName: "Mock Store",
          lastSynced: new Date().toISOString(),
        },
        availableActions: [
          {
            slug: "manage-billing",
            label: "Manage Billing",
            url: `${PLATFORM_URL}/billing`,
            variant: "outline",
          },
        ],
      };
    default:
      return FREE_DEFAULT;
  }
}

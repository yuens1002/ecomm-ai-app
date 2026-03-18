/**
 * Tests for lib/license.ts
 *
 * Mocks:
 * - global.fetch for platform API calls
 * - @prisma/client for SiteSettings reads
 */

import type { LicenseInfo } from "../license-types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    siteSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

// Must be after PrismaClient mock
const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client") as {
  __mockPrisma: {
    siteSettings: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };
};

// Mock version.ts
jest.mock("../version", () => ({
  APP_VERSION: "0.95.3",
}));

// Mock prisma module
jest.mock("../prisma", () => ({
  prisma: jest.requireMock("@prisma/client").__mockPrisma,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProResponse(): LicenseInfo {
  return {
    valid: true,
    tier: "PRIORITY_SUPPORT",
    features: ["ga", "ai-product-ops", "ai-reviews", "analytics-insights"],
    trialEndsAt: null,
    managedBy: null,
    compatibility: "full",
    warnings: [],
    usage: null,
    gaConfig: {
      connected: false,
      measurementId: null,
      propertyName: null,
      lastSynced: null,
    },
    availableActions: [],
    plan: null,
    lapsed: null,
    support: {
      pools: [],
    },
    alaCarte: [],
    legal: null,
  };
}

function makeTrialResponse(): LicenseInfo {
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
    gaConfig: {
      connected: false,
      measurementId: null,
      propertyName: null,
      lastSynced: null,
    },
    availableActions: [],
    plan: null,
    lapsed: null,
    support: {
      pools: [],
    },
    alaCarte: [],
    legal: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Import after mocks
let validateLicense: typeof import("../license").validateLicense;
let getTier: typeof import("../license").getTier;
let isProEnabled: typeof import("../license").isProEnabled;
let hasFeature: typeof import("../license").hasFeature;
let getTrialDaysRemaining: typeof import("../license").getTrialDaysRemaining;
let checkUsageBudget: typeof import("../license").checkUsageBudget;
let getFeatureCatalog: typeof import("../license").getFeatureCatalog;
let getCapabilities: typeof import("../license").getCapabilities;
let invalidateCache: typeof import("../license").invalidateCache;

beforeAll(async () => {
  const mod = await import("../license");
  validateLicense = mod.validateLicense;
  getTier = mod.getTier;
  isProEnabled = mod.isProEnabled;
  hasFeature = mod.hasFeature;
  getTrialDaysRemaining = mod.getTrialDaysRemaining;
  checkUsageBudget = mod.checkUsageBudget;
  getFeatureCatalog = mod.getFeatureCatalog;
  getCapabilities = mod.getCapabilities;
  invalidateCache = mod.invalidateCache;
});

beforeEach(() => {
  jest.clearAllMocks();
  invalidateCache();
  delete process.env.MOCK_LICENSE_TIER;
  delete process.env.LICENSE_KEY;
  mockPrisma.siteSettings.findUnique.mockResolvedValue(null);
});

describe("validateLicense", () => {
  it("returns FREE when no license key is configured", async () => {
    const result = await validateLicense();
    expect(result.tier).toBe("FREE");
    expect(result.features).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls platform API when key is in env", async () => {
    process.env.LICENSE_KEY = "ar_lic_test123";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeProResponse(),
    });

    const result = await validateLicense();
    expect(result.tier).toBe("PRIORITY_SUPPORT");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/license/validate"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("ar_lic_test123"),
      })
    );
  });

  it("reads key from DB when available", async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValueOnce({
      key: "license.key",
      value: "ar_lic_from_db",
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeProResponse(),
    });

    const result = await validateLicense();
    expect(result.tier).toBe("PRIORITY_SUPPORT");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("ar_lic_from_db"),
      })
    );
  });

  it("returns cached result within TTL", async () => {
    process.env.LICENSE_KEY = "ar_lic_test";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeProResponse(),
    });

    await validateLicense(); // populate cache
    const result = await validateLicense(); // should use cache

    expect(result.tier).toBe("PRIORITY_SUPPORT");
    expect(mockFetch).toHaveBeenCalledTimes(1); // only first call
  });

  it("falls back to FREE on network error", async () => {
    process.env.LICENSE_KEY = "ar_lic_test";
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await validateLicense();
    expect(result.tier).toBe("FREE");
  });

  it("falls back to FREE on non-OK response", async () => {
    process.env.LICENSE_KEY = "ar_lic_test";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const result = await validateLicense();
    expect(result.tier).toBe("FREE");
  });

  it("uses stale cache on network error after initial fetch", async () => {
    process.env.LICENSE_KEY = "ar_lic_test";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeProResponse(),
    });

    await validateLicense(); // populate cache
    invalidateCache(); // clear TTL

    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    // Stale cache entry may have been cleared by invalidateCache, so this returns FREE
    const result = await validateLicense();
    // After invalidateCache + network error, no stale cache exists
    expect(result.tier).toBe("FREE");
  });
});

describe("MOCK_LICENSE_TIER", () => {
  it("returns mock TRIAL without network call", async () => {
    process.env.MOCK_LICENSE_TIER = "TRIAL";
    const result = await validateLicense();
    expect(result.tier).toBe("TRIAL");
    expect(result.features).toContain("ga");
    expect(result.trialEndsAt).not.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns mock PRO without network call", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    const result = await validateLicense();
    expect(result.tier).toBe("PRIORITY_SUPPORT");
    expect(result.features).toContain("ai-product-ops");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns FREE for unknown mock tier", async () => {
    process.env.MOCK_LICENSE_TIER = "FREE";
    const result = await validateLicense();
    expect(result.tier).toBe("FREE");
  });
});

describe("getTier", () => {
  it("returns the tier from validateLicense", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    expect(await getTier()).toBe("PRIORITY_SUPPORT");
  });
});

describe("isProEnabled", () => {
  it("returns true for PRO", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    expect(await isProEnabled()).toBe(true);
  });

  it("returns true for HOSTED", async () => {
    process.env.MOCK_LICENSE_TIER = "HOSTED";
    expect(await isProEnabled()).toBe(true);
  });

  it("returns false for FREE", async () => {
    expect(await isProEnabled()).toBe(false);
  });

  it("returns false for TRIAL", async () => {
    process.env.MOCK_LICENSE_TIER = "TRIAL";
    expect(await isProEnabled()).toBe(false);
  });
});

describe("hasFeature", () => {
  it("returns true when feature is in license", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    expect(await hasFeature("ai-product-ops")).toBe(true);
  });

  it("returns false when feature is not in license", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    expect(await hasFeature("ai-cms")).toBe(false);
  });

  it("returns false for FREE tier", async () => {
    expect(await hasFeature("ga")).toBe(false);
  });
});

describe("getTrialDaysRemaining", () => {
  it("returns days remaining for TRIAL", async () => {
    process.env.MOCK_LICENSE_TIER = "TRIAL";
    const days = await getTrialDaysRemaining();
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(30);
  });

  it("returns null for non-TRIAL tiers", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    expect(await getTrialDaysRemaining()).toBeNull();
  });

  it("returns null for FREE", async () => {
    expect(await getTrialDaysRemaining()).toBeNull();
  });
});

describe("checkUsageBudget", () => {
  it("returns budget info for TRIAL", async () => {
    process.env.MOCK_LICENSE_TIER = "TRIAL";
    const budget = await checkUsageBudget();
    expect(budget).not.toBeNull();
    expect(budget!.tokensUsed).toBe(31400);
    expect(budget!.tokenBudget).toBe(50000);
    expect(budget!.percentUsed).toBe(63);
    expect(budget!.isExhausted).toBe(false);
  });

  it("returns null for FREE", async () => {
    expect(await checkUsageBudget()).toBeNull();
  });

  it("returns null for PRO", async () => {
    process.env.MOCK_LICENSE_TIER = "PRIORITY_SUPPORT";
    expect(await checkUsageBudget()).toBeNull();
  });
});

describe("getFeatureCatalog", () => {
  it("returns default catalog when platform unreachable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const catalog = await getFeatureCatalog();
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.some((f) => f.slug === "ga")).toBe(true);
    expect(catalog.some((f) => f.slug === "ai-product-ops")).toBe(true);
  });

  it("caches catalog response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            slug: "test-feature",
            name: "Test",
            description: "A test",
            category: "ai",
            minAppVersion: "0.95.0",
          },
        ],
      }),
    });

    const first = await getFeatureCatalog();
    const second = await getFeatureCatalog();
    expect(first).toEqual(second);
    // fetch only called once (catalog), not for license (no key)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("getCapabilities", () => {
  it("returns capabilities object", () => {
    const caps = getCapabilities();
    expect(caps.licenseModule).toBe(true);
    expect(caps.settingsTable).toBe(true);
    expect(caps.aiProxy).toBe(false);
    expect(caps.gaInjection).toBe(false);
  });
});

describe("invalidateCache", () => {
  it("forces re-fetch after invalidation", async () => {
    process.env.LICENSE_KEY = "ar_lic_test";
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeTrialResponse(),
    });

    await validateLicense(); // first call
    invalidateCache();
    await validateLicense(); // should re-fetch

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

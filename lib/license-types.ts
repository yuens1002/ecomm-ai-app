/**
 * License & Plan Types
 *
 * Shared types for the license module, Plan page, and feature gating.
 * Separate file to avoid circular imports when components need just the types.
 */

// ---------------------------------------------------------------------------
// Tier
// ---------------------------------------------------------------------------

export type Tier = "FREE" | "TRIAL" | "PRO" | "HOSTED";

// ---------------------------------------------------------------------------
// License validation response (from platform)
// ---------------------------------------------------------------------------

export interface LicenseInfo {
  valid: boolean;
  tier: Tier;
  features: string[];
  trialEndsAt: string | null;
  managedBy: string | null;
  compatibility: "full" | "partial";
  warnings: string[];
  usage: UsageInfo | null;
  gaConfig: GAConfig;
}

export interface UsageInfo {
  tokensUsed: number;
  tokenBudget: number;
  hourlyRemaining: number;
  billingRequired: boolean;
}

export interface GAConfig {
  connected: boolean;
  measurementId: string | null;
  propertyName: string | null;
  lastSynced: string | null;
}

// ---------------------------------------------------------------------------
// Usage budget (derived from UsageInfo)
// ---------------------------------------------------------------------------

export interface UsageBudgetResult {
  tokensUsed: number;
  tokenBudget: number;
  percentUsed: number;
  isExhausted: boolean;
  billingRequired: boolean;
}

// ---------------------------------------------------------------------------
// Feature catalog (from platform)
// ---------------------------------------------------------------------------

export interface CatalogFeature {
  slug: string;
  name: string;
  description: string;
  category: string;
  minAppVersion: string;
}

// ---------------------------------------------------------------------------
// Capabilities (sent to platform during validation)
// ---------------------------------------------------------------------------

export interface Capabilities {
  licenseModule: boolean;
  settingsTable: boolean;
  aiProxy: boolean;
  gaInjection: boolean;
}

/**
 * Version management for Artisan Roast
 * Used for update notifications and telemetry
 *
 * APP_VERSION is derived from git tags at build time (see next.config.ts)
 * Fallback for local dev when env var not set
 */

export const APP_VERSION = process.env.APP_VERSION || "0.0.0-dev";

export type Edition = "community" | "pro";

export const EDITION: Edition =
  (process.env.EDITION as Edition) || "community";

export interface VersionInfo {
  current: string;
  latest: string;
  edition: Edition;
  updateAvailable: boolean;
  releaseNotes?: string;
  changelogUrl?: string;
}

/**
 * Compare two semver version strings
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
}

/**
 * Check if an update is available
 */
export function isUpdateAvailable(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}

/**
 * Plans Module — Fetches available subscription plans from the platform.
 *
 * Public endpoint, no auth required. Cached for 24 hours.
 * Returns empty array on error (graceful fallback).
 */

import type { Plan, PlansResponse } from "./plan-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_URL = (
  process.env.PLATFORM_URL || "https://manage.artisanroast.app"
).replace(/\/+$/, "");

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let cached: { data: Plan[]; expiresAt: number } | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch available plans from the platform. Cached 24h. */
export async function fetchPlans(): Promise<Plan[]> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/plans`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Plans fetch failed:", response.status);
      return [];
    }

    const data = (await response.json()) as PlansResponse;
    const plans = data.plans || [];
    cached = { data: plans, expiresAt: Date.now() + CACHE_TTL };
    return plans;
  } catch (error) {
    console.error("Plans fetch error:", error);
    return [];
  }
}

/** Clear plans cache. */
export function invalidatePlansCache(): void {
  cached = null;
}

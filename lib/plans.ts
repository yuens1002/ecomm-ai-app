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
  // Dev mock override
  if (process.env.MOCK_LICENSE_TIER) {
    return MOCK_PLANS;
  }

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

// ---------------------------------------------------------------------------
// Mock plans (for MOCK_LICENSE_TIER env var)
// ---------------------------------------------------------------------------

const MOCK_PLANS: Plan[] = [
  {
    slug: "free",
    name: "Community",
    description: "Open-source self-hosted store with community support",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [],
    highlight: false,
    details: {
      benefits: [
        "Full e-commerce platform",
        "Unlimited products & orders",
        "Community support via GitHub",
        "Self-hosted — you own your data",
      ],
      excludes: [
        "Priority support tickets",
        "1:1 video sessions",
        "AI-powered features",
        "Google Analytics integration",
      ],
    },
  },
  {
    slug: "priority-support",
    name: "Priority Support",
    description: "Dedicated support with guaranteed response times",
    price: 4900,
    currency: "USD",
    interval: "month",
    features: ["priority-support"],
    highlight: true,
    salePrice: 2900,
    saleEndsAt: "2026-04-25T00:00:00Z",
    saleLabel: "Launch Special",
    details: {
      benefits: [
        "Priority email support with 48-hr SLA",
        "5 support tickets per month",
        "1 one-on-one session per month (30 min)",
        "Anonymous GitHub issue tracking & transparency",
      ],
      sla: {
        responseTime: "48 hours",
        availability: "Business days (Mon\u2013Fri)",
      },
      quotas: { SupportTickets: 5, OneOnOneSessions: 1 },
      scope: [
        "Setup & configuration",
        "Troubleshooting",
        "Platform guidance",
      ],
      excludes: [
        "Custom development",
        "Feature requests",
        "Third-party integrations",
      ],
      terms: [
        "Billed monthly, cancel anytime from your billing dashboard",
        "Unused tickets do not roll over to the next billing period",
        "Purchased add-on credits never expire",
      ],
    },
  },
  {
    slug: "enterprise-support",
    name: "Enterprise Support",
    description: "White-glove support for mission-critical deployments",
    price: 29900,
    currency: "USD",
    interval: "month",
    features: ["priority-support", "enterprise-support"],
    highlight: false,
    details: {
      benefits: [
        "Everything in Priority Support",
        "4-hour response time SLA",
        "Unlimited support tickets",
        "4 one-on-one sessions per month (60 min)",
        "Dedicated account manager",
        "Custom integration guidance",
      ],
      sla: {
        responseTime: "4 hours",
        availability: "24/7",
        videoCallDuration: "60 min",
        videoCallBooking: "Self-service",
      },
      quotas: { SupportTickets: -1, OneOnOneSessions: 4 },
      scope: [
        "Setup & configuration",
        "Troubleshooting",
        "Platform guidance",
        "Custom integration support",
        "Performance optimization",
      ],
      excludes: ["Custom development", "Managed hosting migrations"],
      terms: [
        "Billed monthly, 30-day notice to cancel",
        "Annual billing available at 15% discount",
        "Unused sessions do not roll over",
      ],
    },
  },
];

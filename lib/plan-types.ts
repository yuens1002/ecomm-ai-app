/**
 * Plan Types
 *
 * Types for the plan catalog fetched from the platform API.
 * Used by `lib/plans.ts` and the Plan settings page.
 */

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export interface Plan {
  /** URL-safe plan identifier (e.g. "pro", "hosted") */
  slug: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Price in cents (2900 = $29.00) */
  price: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Billing interval */
  interval: "month" | "year";
  /** Feature slugs included in this plan */
  features: string[];
  /** Plan details for display */
  details: {
    benefits: string[];
    quotas: Record<string, number>;
  };
  /** Whether to visually highlight this plan (e.g. "recommended") */
  highlight: boolean;
}

// ---------------------------------------------------------------------------
// API response
// ---------------------------------------------------------------------------

export interface PlansResponse {
  plans: Plan[];
}

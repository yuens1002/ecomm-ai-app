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
  /** URL-safe plan identifier (e.g. "priority-support") */
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
  details: PlanDetails;
  /** Whether to visually highlight this plan (e.g. "recommended") */
  highlight: boolean;
}

export interface PlanDetails {
  /** SLA information */
  sla?: {
    availability?: string;
    responseTime?: string;
    videoCallBooking?: string;
    videoCallDuration?: string;
  };
  /** What the plan covers */
  scope?: string[];
  /** Billing terms and conditions */
  terms?: string[];
  /** Usage quotas (e.g. tickets-per-month: 5) */
  quotas?: Record<string, number>;
  /** Benefit bullet points */
  benefits?: string[];
  /** What the plan does NOT cover */
  excludes?: string[];
}

// ---------------------------------------------------------------------------
// API response
// ---------------------------------------------------------------------------

export interface PlansResponse {
  plans: Plan[];
}

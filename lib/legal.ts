/**
 * Legal Document Module
 *
 * Fetches platform-hosted legal documents and tracks acceptance.
 * Used by the Support & Services pages for terms acceptance gates.
 */

import { getLicenseKey } from "./license";
import type { LegalDocument } from "./legal-utils";

// Re-export client-safe types and helpers
export type { LegalDocument } from "./legal-utils";
export { getLegalUrl } from "./legal-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_URL = (
  process.env.PLATFORM_URL || "https://manage.artisanroast.app"
).replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// Fetch legal document
// ---------------------------------------------------------------------------

/**
 * Fetch a legal document from the platform.
 * No auth required — legal documents are public.
 * Returns null if platform is unreachable.
 */
export async function fetchLegalDoc(
  slug: string
): Promise<LegalDocument | null> {
  if (process.env.MOCK_LICENSE_TIER) {
    return MOCK_LEGAL_DOCS[slug] ?? null;
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/legal/${slug}`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86400 }, // 24h cache
    });

    if (!response.ok) {
      console.error(`Legal doc fetch failed [${response.status}]:`, slug);
      return null;
    }

    return (await response.json()) as LegalDocument;
  } catch (error) {
    console.error("Legal doc fetch error:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Accept legal documents
// ---------------------------------------------------------------------------

/**
 * Track acceptance of legal documents.
 * Sends document slugs + versions to the platform.
 */
export async function acceptLegalDocs(
  documents: Array<{ slug: string; version: string }>
): Promise<{ success: boolean; error?: string }> {
  if (process.env.MOCK_LICENSE_TIER) {
    console.log("[mock] acceptLegalDocs:", documents);
    return { success: true };
  }

  const key = await getLicenseKey();
  if (!key) {
    return { success: false, error: "No license key configured" };
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/legal/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ documents }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`Legal acceptance failed [${response.status}]:`, text);
      return { success: false, error: "Failed to record acceptance" };
    }

    return { success: true };
  } catch (error) {
    console.error("Legal acceptance error:", error);
    return { success: false, error: "Platform unreachable" };
  }
}

// ---------------------------------------------------------------------------
// Mock data (for MOCK_LICENSE_TIER env var)
// ---------------------------------------------------------------------------

const MOCK_LEGAL_DOCS: Record<string, LegalDocument> = {
  "support-terms": {
    slug: "support-terms",
    title: "Support Service Terms",
    version: "1.0.0",
    format: "markdown",
    effectiveDate: "2026-03-01T00:00:00Z",
    lastUpdated: "2026-03-01T00:00:00Z",
    content: [
      "# Support Service Terms",
      "",
      "**Effective:** March 1, 2026 · **Version:** 1.0.0",
      "",
      "## 1. Service Scope",
      "",
      "Priority Support provides email-based technical support for your Artisan Roast store instance. Support covers setup, configuration, troubleshooting, and platform guidance.",
      "",
      "## 2. Response Times",
      "",
      "| Plan | Response Time | Availability |",
      "|------|--------------|--------------|",
      "| Priority Support | 48 hours | Business days (Mon–Fri) |",
      "| Enterprise Support | 4 hours | 24/7 |",
      "",
      "## 3. Credit Policy",
      "",
      "- Plan credits reset at the start of each billing cycle",
      "- Purchased add-on credits never expire",
      "- Plan credits are consumed first; purchased credits are used only after plan credits are exhausted",
      "",
      "## 4. Exclusions",
      "",
      "Support does not cover custom development, feature requests, or third-party integrations.",
      "",
      "## 5. Termination",
      "",
      "You may cancel your support subscription at any time from your billing dashboard. Cancellation takes effect at the end of the current billing period.",
    ].join("\n"),
  },
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    version: "1.0.0",
    format: "markdown",
    effectiveDate: "2026-03-01T00:00:00Z",
    lastUpdated: "2026-03-01T00:00:00Z",
    content: [
      "# Privacy Policy",
      "",
      "**Effective:** March 1, 2026",
      "",
      "We collect anonymous telemetry data (install events, heartbeats) to improve the platform. No personal data or store content is transmitted. You can opt out via the Data Privacy settings in your admin panel.",
    ].join("\n"),
  },
};


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

async function fetchLiveLegalDoc(
  slug: string,
  timeoutMs: number,
  revalidateSeconds: number
): Promise<LegalDocument | null> {
  try {
    const response = await fetch(`${PLATFORM_URL}/api/legal/${slug}`, {
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: revalidateSeconds },
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
// Fetch legal document(s)
// ---------------------------------------------------------------------------

/**
 * Fetch a legal document from the platform.
 * No auth required — legal documents are public.
 * Returns null if platform is unreachable.
 */
export async function fetchLegalDoc(
  slug: string
): Promise<LegalDocument | null> {
  const mockDoc = MOCK_LEGAL_DOCS[slug] ?? null;

  if (process.env.MOCK_LICENSE_TIER) {
    // In local dev, prefer live platform legal payload for realistic Terms rendering.
    // Keep tests deterministic and keep mock fallback for offline work.
    if (process.env.NODE_ENV === "test") {
      return mockDoc;
    }

    const liveDoc = await fetchLiveLegalDoc(slug, 4_000, 3600);
    return liveDoc ?? mockDoc;
  }

  return fetchLiveLegalDoc(slug, 10_000, 86400);
}

const ALL_LEGAL_SLUGS = [
  "support-terms",
  "terms-of-service",
  "privacy-policy",
  "acceptable-use",
] as const;

/**
 * Fetch all active legal documents from the platform in a single request.
 * Falls back to parallel individual fetches if the bulk endpoint is unavailable.
 */
export async function fetchAllLegalDocs(): Promise<LegalDocument[]> {
  if (process.env.NODE_ENV === "test") {
    return Object.values(MOCK_LEGAL_DOCS);
  }

  const timeoutMs = process.env.MOCK_LICENSE_TIER ? 4_000 : 10_000;
  const revalidate = process.env.MOCK_LICENSE_TIER ? 3600 : 86400;

  try {
    const response = await fetch(`${PLATFORM_URL}/api/legal`, {
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
    });

    if (response.ok) {
      return (await response.json()) as LegalDocument[];
    }
  } catch {
    // bulk endpoint unavailable — fall through to parallel individual fetches
  }

  // Fallback: parallel individual slug fetches
  const results = await Promise.all(
    ALL_LEGAL_SLUGS.map((slug) => fetchLegalDoc(slug))
  );
  return results.filter((d): d is LegalDocument => d !== null);
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
      "<h1>Support Service Terms</h1>",
      "<p><strong>Effective:</strong> March 1, 2026 · <strong>Version:</strong> 1.0.0</p>",
      "<h2>1. Service Scope</h2>",
      "<p>Priority Support provides email-based technical support for your Artisan Roast store instance. Support covers setup, configuration, troubleshooting, and platform guidance.</p>",
      "<h2>2. Response Times</h2>",
      "<table><thead><tr><th>Plan</th><th>Response Time</th><th>Availability</th></tr></thead><tbody><tr><td>Priority Support</td><td>48 hours</td><td>Business days (Mon–Fri)</td></tr><tr><td>Enterprise Support</td><td>4 hours</td><td>24/7</td></tr></tbody></table>",
      "<h2>3. Credit Policy</h2>",
      "<ul><li>Plan credits reset at the start of each billing cycle</li><li>Purchased add-on credits never expire</li><li>Plan credits are consumed first; purchased credits are used only after plan credits are exhausted</li></ul>",
      "<h2>4. Exclusions</h2>",
      "<p>Support does not cover custom development, feature requests, or third-party integrations.</p>",
      "<h2>5. Termination</h2>",
      "<p>You may cancel your support subscription at any time from your billing dashboard. Cancellation takes effect at the end of the current billing period.</p>",
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
      "<h1>Privacy Policy</h1>",
      "<p><strong>Effective:</strong> March 1, 2026</p>",
      "<p>We collect anonymous telemetry data (install events, heartbeats) to improve the platform. No personal data or store content is transmitted. You can opt out via the Data Privacy settings in your admin panel.</p>",
    ].join("\n"),
  },
};


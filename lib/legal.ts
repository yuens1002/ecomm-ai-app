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


/**
 * Client-safe legal utilities.
 *
 * Contains types and helpers that can be imported from client components.
 * Server-only functions (fetchLegalDoc, acceptLegalDocs) stay in lib/legal.ts.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_URL = (
  process.env.PLATFORM_URL ||
  process.env.NEXT_PUBLIC_APP_URL?.replace("localhost:3000", "manage.artisanroast.app") ||
  "https://manage.artisanroast.app"
).replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LegalDocument {
  slug: string;
  title: string;
  version: string;
  content: string;
  format: "markdown";
  effectiveDate: string;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the platform URL for direct legal document links (fallback).
 */
export function getLegalUrl(slug: string): string {
  return `${PLATFORM_URL}/legal/${slug}`;
}

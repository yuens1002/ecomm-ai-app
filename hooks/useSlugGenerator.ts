// Deprecated: useSlugGenerator has been retired.
// Use the reusable app component `NameSlugField` instead,
// or call `generateSlug()` directly where needed.

/**
 * Generates a URL-safe slug from a string by:
 * - Converting to lowercase
 * - Normalizing unicode characters
 * - Removing diacritics/accents
 * - Trimming whitespace
 * - Removing non-alphanumeric characters (except spaces and hyphens)
 * - Replacing spaces/underscores with hyphens
 * - Removing leading/trailing hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
// The hook has been removed to encourage a single source of truth
// (the NameSlugField component) and simpler form logic.
// If you need slug generation, import and use generateSlug directly.

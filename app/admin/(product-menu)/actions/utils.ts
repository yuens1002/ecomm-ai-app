import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// NAMING CONVENTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Strip copy suffix from a name
 * @param name - Original name (e.g., "Blends copy (2)")
 * @returns Base name without suffix (e.g., "Blends")
 *
 * @example
 * stripCopySuffix("Blends") // "Blends"
 * stripCopySuffix("Blends copy") // "Blends"
 * stripCopySuffix("Blends copy (2)") // "Blends"
 * stripCopySuffix("Blends copy (10)") // "Blends"
 */
export function stripCopySuffix(name: string): string {
  // Pattern: " copy" OR " copy (n)"
  const copySuffixPattern = /(.*)\s+copy(?:\s*\(\d+\))?\s*$/i;
  const match = name.match(copySuffixPattern);
  return match ? match[1].trim() : name.trim();
}

/**
 * Generate clone name following convention: "copy", "copy (2)", "copy (3)", ...
 * @param baseName - Base name without suffix (e.g., "Blends")
 * @param attempt - Attempt number (0-indexed)
 * @returns Clone name (e.g., "Blends copy" on first attempt, "Blends copy (2)" on second)
 *
 * @example
 * makeCloneName("Blends", 0) // "Blends copy"
 * makeCloneName("Blends", 1) // "Blends copy (2)"
 * makeCloneName("Blends", 2) // "Blends copy (3)"
 */
export function makeCloneName(baseName: string, attempt: number): string {
  if (attempt === 0) {
    return `${baseName} copy`;
  }
  return `${baseName} copy (${attempt + 1})`;
}

/**
 * Generate new item name following convention: "New [Type]", "New [Type] (2)", ...
 * @param entityType - Entity type (e.g., "Label", "Category")
 * @param attempt - Attempt number (0-indexed)
 * @returns New item name (e.g., "New Label" on first attempt, "New Label (2)" on second)
 *
 * @example
 * makeNewItemName("Label", 0) // "New Label"
 * makeNewItemName("Label", 1) // "New Label (2)"
 * makeNewItemName("Category", 0) // "New Category"
 */
export function makeNewItemName(entityType: string, attempt: number): string {
  if (attempt === 0) {
    return `New ${entityType}`;
  }
  return `New ${entityType} (${attempt + 1})`;
}

// ─────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────

/**
 * Check if error is a Prisma unique constraint violation
 * @param error - Error to check
 * @returns True if error is P2002 (unique constraint failed)
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// ─────────────────────────────────────────────────────────────
// RETRY LOGIC
// ─────────────────────────────────────────────────────────────

export type RetryOptions<T> = {
  /** Function to generate name for each attempt (0-indexed) */
  makeName: (attempt: number) => string;
  /** Function to create entity with the generated name */
  create: (name: string) => Promise<T>;
  /** Maximum number of attempts (default: 50) */
  maxAttempts?: number;
  /** Custom error message when all attempts fail */
  errorMessage?: string;
};

/**
 * Retry entity creation with unique constraint handling
 * Automatically retries with different names when unique constraint is violated
 *
 * @param options - Retry configuration
 * @returns Result object with ok/error status
 *
 * @example
 * ```typescript
 * const result = await retryWithUniqueConstraint({
 *   makeName: (attempt) => makeCloneName("Blends", attempt),
 *   create: async (name) => {
 *     return await prisma.label.create({ data: { name } });
 *   }
 * });
 * ```
 */
export async function retryWithUniqueConstraint<T>(
  options: RetryOptions<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const maxAttempts = options.maxAttempts ?? 50;
  const errorMessage = options.errorMessage ?? "Could not generate unique name";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const name = options.makeName(attempt);

    try {
      const data = await options.create(name);
      return { ok: true, data };
    } catch (err) {
      // If unique constraint error, try next name
      if (isUniqueConstraintError(err)) {
        continue;
      }
      // Re-throw other errors
      throw err;
    }
  }

  return { ok: false, error: errorMessage };
}

import { createHash } from "crypto";

/**
 * Hash a prompt string for versioning.
 * Used to detect when generation prompts change across deploys
 * so cached outputs can be auto-regenerated.
 */
export function hashPrompt(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

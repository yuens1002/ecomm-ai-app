import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

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

type UseSlugGeneratorOptions = {
  sourceField: string;
  targetField: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
};

/**
 * Hook that automatically generates a slug from a source field
 * and updates the target field when the source changes.
 *
 * Only generates slug when the source field is dirty (user has modified it).
 */
export function useSlugGenerator({
  sourceField,
  targetField,
  form,
}: UseSlugGeneratorOptions) {
  const sourceValue = form.watch(sourceField);

  useEffect(() => {
    // Generate slug from source value
    const slug =
      sourceValue &&
      typeof sourceValue === "string" &&
      sourceValue.trim() !== ""
        ? generateSlug(sourceValue)
        : "";

    // Always update the slug field to keep it in sync
    const currentSlug = form.getValues(targetField);
    if (currentSlug !== slug) {
      form.setValue(targetField, slug, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [sourceValue, form, sourceField, targetField]);
}

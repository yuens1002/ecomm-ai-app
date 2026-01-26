import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * useRelationshipToggle - Handles relationship attach/detach for context menu submenus.
 *
 * This hook handles toggling relationships in manage-categories/manage-labels submenus:
 * - Labels ↔ Categories (AllLabelsTableView: attach/detach category to label)
 * - Categories ↔ Labels (AllCategoriesTableView: attach/detach category to label)
 * - Products ↔ Categories (CategoryTableView: attach/detach product to category)
 *
 * @example
 * ```tsx
 * // For managing categories on a label
 * const { handleToggle: handleCategoryToggle } = useRelationshipToggle({
 *   attach: (labelId, categoryId) => attachCategory(labelId, categoryId),
 *   detach: (labelId, categoryId) => detachCategory(labelId, categoryId),
 *   relationshipLabel: "category",
 * });
 *
 * // In RowContextMenu:
 * <RowContextMenu
 *   onCategoryToggle={(categoryId, shouldAttach) =>
 *     handleCategoryToggle(labelId, categoryId, shouldAttach)
 *   }
 * />
 * ```
 */

export type UseRelationshipToggleOptions = {
  /**
   * Function to attach the relationship.
   * @param primaryId - The entity being managed (label, category, product)
   * @param relatedId - The related entity to attach (category, label, category)
   */
  attach: (primaryId: string, relatedId: string) => Promise<{ ok: boolean }>;
  /**
   * Function to detach the relationship.
   * @param primaryId - The entity being managed
   * @param relatedId - The related entity to detach
   */
  detach: (primaryId: string, relatedId: string) => Promise<{ ok: boolean }>;
  /** Label for toast messages (e.g., "category", "label") */
  relationshipLabel: string;
};

export type UseRelationshipToggleReturn = {
  /**
   * Handler for toggling relationship.
   * @param primaryId - The entity being managed
   * @param relatedId - The related entity to toggle
   * @param shouldAttach - true to attach, false to detach
   */
  handleToggle: (
    primaryId: string,
    relatedId: string,
    shouldAttach: boolean
  ) => Promise<void>;
};

export function useRelationshipToggle({
  attach,
  detach,
  relationshipLabel,
}: UseRelationshipToggleOptions): UseRelationshipToggleReturn {
  const { toast } = useToast();

  const handleToggle = useCallback(
    async (primaryId: string, relatedId: string, shouldAttach: boolean) => {
      if (shouldAttach) {
        const result = await attach(primaryId, relatedId);
        if (!result.ok) {
          toast({
            title: "Error",
            description: `Could not add ${relationshipLabel}`,
            variant: "destructive",
          });
        }
      } else {
        const result = await detach(primaryId, relatedId);
        if (!result.ok) {
          toast({
            title: "Error",
            description: `Could not remove ${relationshipLabel}`,
            variant: "destructive",
          });
        }
      }
      // No success toast - the checkbox state change is feedback enough
    },
    [attach, detach, relationshipLabel, toast]
  );

  return useMemo(() => ({ handleToggle }), [handleToggle]);
}

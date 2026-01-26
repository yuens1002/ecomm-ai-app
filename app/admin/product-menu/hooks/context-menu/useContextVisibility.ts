import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * useContextVisibility - Handles visibility toggle for context menu.
 *
 * This hook handles both:
 * 1. Visibility toggle (show/hide) in All* views
 * 2. "Remove from menu" action for labels (which is just isVisible: false)
 *
 * Supports both single-item and bulk operations.
 *
 * Used by:
 * - AllLabelsTableView (labels, bulk)
 * - AllCategoriesTableView (categories, bulk)
 * - MenuTableView (labels single, categories single)
 * - LabelTableView (categories, single)
 *
 * Note: For labels in menu view, "remove" semantically means "hide from menu",
 * which is the same mutation as visibility toggle (isVisible: false).
 *
 * @example
 * ```tsx
 * const { handleVisibilityToggle } = useContextVisibility({
 *   updateEntity: (id, visible) => updateLabel(id, { isVisible: visible }),
 *   getTargetIds, // For bulk support
 *   entityLabel: { singular: "Label", plural: "labels" },
 * });
 *
 * // In RowContextMenu:
 * <RowContextMenu onVisibilityToggle={(visible) => handleVisibilityToggle(entityId, visible)} />
 * ```
 */

export type EntityLabel = {
  singular: string;
  plural: string;
};

export type UseContextVisibilityOptions = {
  /** Function to update entity visibility */
  updateEntity: (id: string, isVisible: boolean) => Promise<{ ok: boolean }>;
  /**
   * Optional function to get target IDs for bulk operations.
   * If not provided or returns single ID, operates in single-item mode.
   */
  getTargetIds?: (entityId: string) => string[];
  /** Labels for toast messages */
  entityLabel: EntityLabel;
};

export type UseContextVisibilityReturn = {
  /** Handler for visibility toggle - call with entity ID and new visibility state */
  handleVisibilityToggle: (entityId: string, visible: boolean) => Promise<void>;
};

export function useContextVisibility({
  updateEntity,
  getTargetIds,
  entityLabel,
}: UseContextVisibilityOptions): UseContextVisibilityReturn {
  const { toast } = useToast();

  const handleVisibilityToggle = useCallback(
    async (entityId: string, visible: boolean) => {
      const targetIds = getTargetIds?.(entityId) ?? [entityId];
      const isBulk = targetIds.length > 1;

      if (isBulk) {
        // Bulk operation
        const results = await Promise.all(
          targetIds.map((id) => updateEntity(id, visible))
        );
        const successCount = results.filter((r) => r.ok).length;
        const failCount = results.length - successCount;

        if (failCount === 0) {
          toast({
            title: `${successCount} ${entityLabel.plural} ${visible ? "shown" : "hidden"}`,
          });
        } else if (successCount === 0) {
          toast({
            title: "Error",
            description: `Could not update ${entityLabel.plural}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Partial success",
            description: `${successCount} updated, ${failCount} failed`,
            variant: "destructive",
          });
        }
      } else {
        // Single operation
        const result = await updateEntity(entityId, visible);
        if (!result.ok) {
          toast({
            title: "Error",
            description: `Could not update visibility`,
            variant: "destructive",
          });
        }
        // No success toast for single visibility toggle (it's obvious from UI)
      }
    },
    [updateEntity, getTargetIds, entityLabel, toast]
  );

  return useMemo(() => ({ handleVisibilityToggle }), [handleVisibilityToggle]);
}

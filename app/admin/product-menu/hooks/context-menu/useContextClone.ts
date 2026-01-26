import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * useContextClone - Handles clone operations for context menu.
 *
 * Supports both single-item and bulk clone operations.
 * When entity is part of a bulk selection, clones all selected items.
 *
 * Used by all table views that support clone:
 * - AllLabelsTableView (labels, bulk)
 * - AllCategoriesTableView (categories, bulk)
 * - MenuTableView (labels bulk, categories single)
 * - LabelTableView (categories, single)
 *
 * @example
 * ```tsx
 * const { handleClone } = useContextClone({
 *   cloneEntity: (id) => cloneLabel({ id }),
 *   getTargetIds,
 *   entityLabel: { singular: "Label", plural: "labels" },
 * });
 *
 * // In RowContextMenu:
 * <RowContextMenu onClone={() => handleClone(entityId)} />
 * ```
 */

export type EntityLabel = {
  singular: string;
  plural: string;
};

export type UseContextCloneOptions = {
  /** Function to clone a single entity */
  cloneEntity: (id: string) => Promise<{ ok: boolean }>;
  /**
   * Optional function to get target IDs for bulk operations.
   * If not provided or returns single ID, operates in single-item mode.
   */
  getTargetIds?: (entityId: string) => string[];
  /** Labels for toast messages */
  entityLabel: EntityLabel;
};

export type UseContextCloneReturn = {
  /** Handler for clone action - call with entity ID */
  handleClone: (entityId: string) => Promise<void>;
};

export function useContextClone({
  cloneEntity,
  getTargetIds,
  entityLabel,
}: UseContextCloneOptions): UseContextCloneReturn {
  const { toast } = useToast();

  const handleClone = useCallback(
    async (entityId: string) => {
      const targetIds = getTargetIds?.(entityId) ?? [entityId];
      const isBulk = targetIds.length > 1;

      if (isBulk) {
        // Bulk clone
        const results = await Promise.all(targetIds.map((id) => cloneEntity(id)));
        const successCount = results.filter((r) => r.ok).length;
        const failCount = results.length - successCount;

        if (failCount === 0) {
          toast({
            title: `${successCount} ${entityLabel.plural} cloned`,
          });
        } else if (successCount === 0) {
          toast({
            title: "Error",
            description: `Could not clone ${entityLabel.plural}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Partial success",
            description: `${successCount} cloned, ${failCount} failed`,
            variant: "destructive",
          });
        }
      } else {
        // Single clone
        const result = await cloneEntity(entityId);
        if (result.ok) {
          toast({ title: `${entityLabel.singular} cloned` });
        } else {
          toast({
            title: "Error",
            description: `Could not clone ${entityLabel.singular.toLowerCase()}`,
            variant: "destructive",
          });
        }
      }
    },
    [cloneEntity, getTargetIds, entityLabel, toast]
  );

  return useMemo(() => ({ handleClone }), [handleClone]);
}

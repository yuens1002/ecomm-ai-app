import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * useContextRemove - Handles remove/detach operations for context menu.
 *
 * This hook handles detaching an entity from its parent container:
 * - Categories from labels (LabelTableView)
 * - Products from categories (CategoryTableView)
 *
 * Note: This is different from "remove" for labels in menu view,
 * which is just a visibility toggle (use useContextVisibility for that).
 *
 * Supports both single-item and bulk operations.
 *
 * @example
 * ```tsx
 * const { handleRemove } = useContextRemove({
 *   parentId: currentLabelId,
 *   detachEntity: (parentId, childId) => detachCategory(parentId, childId),
 *   getTargetIds, // For bulk support
 *   entityLabel: { singular: "Category", plural: "categories" },
 * });
 *
 * // In RowContextMenu:
 * <RowContextMenu onRemove={() => handleRemove(categoryId)} />
 * ```
 */

export type EntityLabel = {
  singular: string;
  plural: string;
};

export type UseContextRemoveOptions = {
  /** The parent container ID (label ID, category ID, etc.) */
  parentId: string | undefined;
  /** Function to detach entity from parent */
  detachEntity: (parentId: string, childId: string) => Promise<{ ok: boolean }>;
  /**
   * Optional function to get target IDs for bulk operations.
   * If not provided or returns single ID, operates in single-item mode.
   */
  getTargetIds?: (entityId: string) => string[];
  /** Labels for toast messages */
  entityLabel: EntityLabel;
};

export type UseContextRemoveReturn = {
  /** Handler for remove action - call with entity ID */
  handleRemove: (entityId: string) => Promise<void>;
};

export function useContextRemove({
  parentId,
  detachEntity,
  getTargetIds,
  entityLabel,
}: UseContextRemoveOptions): UseContextRemoveReturn {
  const { toast } = useToast();

  const handleRemove = useCallback(
    async (entityId: string) => {
      if (!parentId) return;

      const targetIds = getTargetIds?.(entityId) ?? [entityId];
      const isBulk = targetIds.length > 1;

      if (isBulk) {
        // Bulk operation
        const results = await Promise.all(
          targetIds.map((id) => detachEntity(parentId, id))
        );
        const successCount = results.filter((r) => r.ok).length;
        const failCount = results.length - successCount;

        if (failCount === 0) {
          toast({
            title: `${successCount} ${entityLabel.plural} removed`,
          });
        } else if (successCount === 0) {
          toast({
            title: "Error",
            description: `Could not remove ${entityLabel.plural}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Partial success",
            description: `${successCount} removed, ${failCount} failed`,
            variant: "destructive",
          });
        }
      } else {
        // Single operation
        const result = await detachEntity(parentId, entityId);
        if (result.ok) {
          toast({ title: `${entityLabel.singular} removed` });
        } else {
          toast({
            title: "Error",
            description: `Could not remove ${entityLabel.singular.toLowerCase()}`,
            variant: "destructive",
          });
        }
      }
    },
    [parentId, detachEntity, getTargetIds, entityLabel, toast]
  );

  return useMemo(() => ({ handleRemove }), [handleRemove]);
}

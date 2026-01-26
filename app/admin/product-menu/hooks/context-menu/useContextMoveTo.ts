import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * useContextMoveTo - Handles move-to operations for context menu.
 *
 * This hook handles moving an entity from one parent to another:
 * - Categories: LabelTableView, MenuTableView (move to another label)
 * - Products: CategoryTableView (move to another category)
 *
 * Supports two patterns:
 * 1. Detach + Attach (for categories): detach from source, attach to target, revert on failure
 * 2. Single mutation (for products): single moveEntity function
 *
 * For hierarchical views (MenuTableView), sourceParentId can be passed at call time
 * since each row may have a different parent.
 *
 * @example
 * ```tsx
 * // For detail views (fixed parent)
 * const { handleMoveTo } = useContextMoveTo({
 *   sourceParentId: currentLabelId,
 *   detach: detachCategory,
 *   attach: attachCategory,
 *   ...
 * });
 * // Usage: handleMoveTo(categoryId, targetLabelId)
 *
 * // For hierarchical views (dynamic parent)
 * const { handleMoveToFrom } = useContextMoveTo({
 *   detach: detachCategory,
 *   attach: attachCategory,
 *   ...
 * });
 * // Usage: handleMoveToFrom(categoryId, fromLabelId, toLabelId)
 * ```
 */

export type UseContextMoveToOptions = {
  /** The source parent ID (current label/category). Optional for hierarchical views. */
  sourceParentId?: string | undefined;
  /** Optional: Single mutation function (for products) */
  moveEntity?: (entityId: string, targetParentId: string) => Promise<{ ok: boolean }>;
  /** Optional: Detach function (for detach+attach pattern) */
  detach?: (parentId: string, entityId: string) => Promise<{ ok: boolean }>;
  /** Optional: Attach function (for detach+attach pattern) */
  attach?: (parentId: string, entityId: string) => Promise<{ ok: boolean }>;
  /** Function to get entity name for toast message */
  getEntityName?: (entityId: string) => string | undefined;
  /** Function to get target parent name for toast message */
  getTargetName?: (targetId: string) => string | undefined;
  /** Label for the entity being moved (e.g., "Category", "Product") */
  entityLabel: string;
};

export type UseContextMoveToReturn = {
  /**
   * Handler for move-to action (uses sourceParentId from options).
   * @param entityId - The entity to move
   * @param targetParentId - The target parent to move to
   */
  handleMoveTo: (entityId: string, targetParentId: string) => Promise<void>;
  /**
   * Handler for move-to action with explicit source parent (for hierarchical views).
   * @param entityId - The entity to move
   * @param sourceParentId - The current parent to move from
   * @param targetParentId - The target parent to move to
   */
  handleMoveToFrom: (entityId: string, sourceParentId: string, targetParentId: string) => Promise<void>;
};

export function useContextMoveTo({
  sourceParentId: defaultSourceParentId,
  moveEntity,
  detach,
  attach,
  getEntityName,
  getTargetName,
  entityLabel,
}: UseContextMoveToOptions): UseContextMoveToReturn {
  const { toast } = useToast();

  const executeMove = useCallback(
    async (entityId: string, fromParentId: string, targetParentId: string) => {
      const entityName = getEntityName?.(entityId) ?? entityLabel;
      const targetName = getTargetName?.(targetParentId) ?? "target";

      // Pattern 1: Single mutation (e.g., moveProductToCategory)
      if (moveEntity) {
        const result = await moveEntity(entityId, targetParentId);
        if (result.ok) {
          toast({
            title: `${entityLabel} moved`,
            description: `Moved "${entityName}" to "${targetName}"`,
          });
        } else {
          toast({
            title: "Move failed",
            description: `Could not move ${entityLabel.toLowerCase()}`,
            variant: "destructive",
          });
        }
        return;
      }

      // Pattern 2: Detach + Attach (e.g., category between labels)
      if (detach && attach) {
        // Detach from source
        const detachResult = await detach(fromParentId, entityId);
        if (!detachResult.ok) {
          toast({
            title: "Move failed",
            description: "Failed to remove from source",
            variant: "destructive",
          });
          return;
        }

        // Attach to target
        const attachResult = await attach(targetParentId, entityId);
        if (!attachResult.ok) {
          // Try to revert the detach
          await attach(fromParentId, entityId);
          toast({
            title: "Move failed",
            description: "Failed to add to target",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: `${entityLabel} moved`,
          description: `Moved "${entityName}" to "${targetName}"`,
        });
        return;
      }

      // Neither pattern provided
      console.error("useContextMoveTo: Either moveEntity or detach+attach must be provided");
    },
    [moveEntity, detach, attach, getEntityName, getTargetName, entityLabel, toast]
  );

  // Handler using default source parent (for detail views)
  const handleMoveTo = useCallback(
    async (entityId: string, targetParentId: string) => {
      if (!defaultSourceParentId) {
        console.error("useContextMoveTo: sourceParentId not provided. Use handleMoveToFrom instead.");
        return;
      }
      await executeMove(entityId, defaultSourceParentId, targetParentId);
    },
    [defaultSourceParentId, executeMove]
  );

  // Handler with explicit source parent (for hierarchical views)
  const handleMoveToFrom = useCallback(
    async (entityId: string, sourceParentId: string, targetParentId: string) => {
      await executeMove(entityId, sourceParentId, targetParentId);
    },
    [executeMove]
  );

  return useMemo(
    () => ({ handleMoveTo, handleMoveToFrom }),
    [handleMoveTo, handleMoveToFrom]
  );
}

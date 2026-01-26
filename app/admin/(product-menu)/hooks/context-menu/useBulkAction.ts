import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SelectedEntityKind } from "../../types/builder-state";

/**
 * useBulkAction - Generic bulk operation executor with consistent toast messaging.
 *
 * Used by views that support bulk operations from context menu:
 * - AllLabelsTableView (bulk delete, clone, visibility toggle)
 * - AllCategoriesTableView (bulk delete, clone, visibility toggle)
 *
 * NOT used by single-item views (LabelTableView, CategoryTableView, MenuTableView).
 *
 * @example
 * ```tsx
 * const { getTargetIds, isBulkOperation, executeBulkAction } = useBulkAction({
 *   isSelected,
 *   actionableRoots,
 *   isSameKind,
 *   entityKind: "label",
 * });
 *
 * // In context menu handler:
 * const handleClone = async (labelId: string) => {
 *   await executeBulkAction(labelId, cloneLabel, {
 *     successMessage: (count) => count > 1 ? `${count} labels cloned` : "Label cloned",
 *     errorMessage: "Some labels could not be cloned",
 *   });
 * };
 * ```
 */
export type UseBulkActionOptions = {
  /** Check if a key is selected */
  isSelected: (key: string) => boolean;
  /** Array of actionable root keys from selection model */
  actionableRoots: readonly string[];
  /** Whether all selected items are the same kind */
  isSameKind: boolean;
  /** The entity kind for key creation */
  entityKind: SelectedEntityKind;
};

export type BulkActionToastOptions = {
  /** Success message generator based on count */
  successMessage: (count: number) => string;
  /** Error message when some operations fail */
  errorMessage: string;
};

export type UseBulkActionReturn = {
  /**
   * Get target IDs for an operation.
   * Returns all selected IDs if entity is in selection with multiple items,
   * otherwise returns just the single entity ID.
   */
  getTargetIds: (entityId: string) => string[];
  /** Check if an operation on this entity would be a bulk operation */
  isBulkOperation: (entityId: string) => boolean;
  /**
   * Execute an action on target entities with consistent toast messaging.
   * Handles both single and bulk operations.
   */
  executeBulkAction: <T>(
    entityId: string,
    action: (id: string) => Promise<T>,
    options: BulkActionToastOptions
  ) => Promise<T[]>;
};

/**
 * Create a key from entity kind and ID.
 * Matches the pattern used by identity-registry.
 */
function createKey(kind: SelectedEntityKind, entityId: string): string {
  return `${kind}:${entityId}`;
}

export function useBulkAction({
  isSelected,
  actionableRoots,
  isSameKind,
  entityKind,
}: UseBulkActionOptions): UseBulkActionReturn {
  const { toast } = useToast();

  const getTargetIds = useCallback(
    (entityId: string): string[] => {
      const entityKey = createKey(entityKind, entityId);
      const inSelection = isSelected(entityKey);
      const isBulk = inSelection && actionableRoots.length > 1 && isSameKind;

      if (isBulk) {
        // Extract entity IDs from actionable root keys (format: "kind:id")
        return actionableRoots.map((key) => key.split(":")[1]);
      }

      return [entityId];
    },
    [isSelected, actionableRoots, isSameKind, entityKind]
  );

  const isBulkOperation = useCallback(
    (entityId: string): boolean => {
      const entityKey = createKey(entityKind, entityId);
      const inSelection = isSelected(entityKey);
      return inSelection && actionableRoots.length > 1 && isSameKind;
    },
    [isSelected, actionableRoots, isSameKind, entityKind]
  );

  const executeBulkAction = useCallback(
    async <T>(
      entityId: string,
      action: (id: string) => Promise<T>,
      options: BulkActionToastOptions
    ): Promise<T[]> => {
      const targetIds = getTargetIds(entityId);
      const results = await Promise.all(targetIds.map((id) => action(id)));

      // Check if all operations succeeded (assuming result has 'ok' property)
      const allOk = results.every((result) => {
        if (typeof result === "object" && result !== null && "ok" in result) {
          return (result as { ok: boolean }).ok;
        }
        return true; // Assume success if no 'ok' property
      });

      if (allOk) {
        toast({ title: options.successMessage(targetIds.length) });
      } else {
        toast({
          title: "Error",
          description: options.errorMessage,
          variant: "destructive",
        });
      }

      return results;
    },
    [getTargetIds, toast]
  );

  return useMemo(
    () => ({
      getTargetIds,
      isBulkOperation,
      executeBulkAction,
    }),
    [getTargetIds, isBulkOperation, executeBulkAction]
  );
}

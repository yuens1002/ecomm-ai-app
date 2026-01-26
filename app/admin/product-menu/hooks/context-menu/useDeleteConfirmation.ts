import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SelectedEntityKind } from "../../types/builder-state";

/**
 * useDeleteConfirmation - Generic delete dialog state and handlers.
 *
 * Works like action bar - operates on a single entity kind at a time.
 * The entity kind is passed at request time, not hook instantiation.
 *
 * Used by:
 * - AllLabelsTableView (labels only)
 * - LabelTableView (categories only)
 * - AllCategoriesTableView (categories only)
 * - MenuTableView (labels or categories, determined at request time)
 *
 * @example
 * ```tsx
 * // Single entity kind (most views)
 * const { requestDelete, ... } = useDeleteConfirmation({
 *   deleteEntity: (kind, id) => deleteLabel(id),
 * });
 *
 * // Multiple entity kinds (MenuTableView)
 * const { requestDelete, ... } = useDeleteConfirmation({
 *   deleteEntity: (kind, id) =>
 *     kind === "label" ? deleteLabel(id) : deleteCategory(id),
 * });
 *
 * // In context menu:
 * <ContextMenuItem onSelect={() => requestDelete(label.id, "label")}>
 *   Delete
 * </ContextMenuItem>
 * ```
 */
export type DeleteEntityKind = "label" | "category";

export type UseDeleteConfirmationOptions = {
  /** Function to delete a single entity by kind and ID */
  deleteEntity: (kind: DeleteEntityKind, id: string) => Promise<{ ok: boolean }>;
  /** Optional callback after successful delete */
  onSuccess?: (count: number, kind: DeleteEntityKind) => void;
};

export type DeleteConfirmationState = {
  /** Whether the confirmation dialog is open */
  open: boolean;
  /** IDs of entities to be deleted */
  targetIds: string[];
  /** The entity kind being deleted */
  entityKind: DeleteEntityKind;
};

export type UseDeleteConfirmationReturn = {
  /** Current state of the delete confirmation dialog */
  deleteConfirmation: DeleteConfirmationState;
  /** Whether delete operation is in progress */
  isDeleting: boolean;
  /**
   * Request delete for an entity.
   * @param entityId - The entity ID to delete
   * @param entityKind - The kind of entity ("label" | "category")
   * @param getTargetIds - Optional function to get bulk target IDs
   */
  requestDelete: (
    entityId: string,
    entityKind: DeleteEntityKind,
    getTargetIds?: (id: string) => string[]
  ) => void;
  /** Confirm and execute the delete */
  confirmDelete: () => Promise<void>;
  /** Cancel the delete operation */
  cancelDelete: () => void;
};

function getEntityNames(kind: DeleteEntityKind): { singular: string; plural: string } {
  return kind === "label"
    ? { singular: "Label", plural: "labels" }
    : { singular: "Category", plural: "categories" };
}

export function useDeleteConfirmation({
  deleteEntity,
  onSuccess,
}: UseDeleteConfirmationOptions): UseDeleteConfirmationReturn {
  const { toast } = useToast();

  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    open: false,
    targetIds: [],
    entityKind: "label", // Default, will be set properly on request
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = useCallback(
    (entityId: string, entityKind: DeleteEntityKind, getTargetIds?: (id: string) => string[]) => {
      const targetIds = getTargetIds ? getTargetIds(entityId) : [entityId];
      setDeleteConfirmation({ open: true, targetIds, entityKind });
    },
    []
  );

  const confirmDelete = useCallback(async () => {
    const { targetIds, entityKind } = deleteConfirmation;
    if (!targetIds || targetIds.length === 0) return;

    setIsDeleting(true);
    try {
      const results = await Promise.all(targetIds.map((id) => deleteEntity(entityKind, id)));
      const allOk = results.every((r) => r.ok);
      const { singular, plural } = getEntityNames(entityKind);

      if (allOk) {
        toast({
          title:
            targetIds.length > 1
              ? `${targetIds.length} ${plural} deleted`
              : `${singular} deleted`,
        });
        onSuccess?.(targetIds.length, entityKind);
      } else {
        toast({
          title: "Error",
          description: `Some ${plural} could not be deleted`,
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, targetIds: [], entityKind: "label" });
    }
  }, [deleteConfirmation, deleteEntity, toast, onSuccess]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ open: false, targetIds: [], entityKind: "label" });
  }, []);

  return useMemo(
    () => ({
      deleteConfirmation,
      isDeleting,
      requestDelete,
      confirmDelete,
      cancelDelete,
    }),
    [deleteConfirmation, isDeleting, requestDelete, confirmDelete, cancelDelete]
  );
}

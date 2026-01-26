import { useCallback, useMemo } from "react";

/**
 * useMoveHandlers - Unified move up/down logic for both flat and nested lists.
 *
 * Supports two usage patterns:
 *
 * 1. **Flat list pattern** (items known at hook time):
 *    ```tsx
 *    const { handleMoveUp, handleMoveDown, getPositionFlags } = useMoveHandlers({
 *      getItems: () => labels,
 *      reorder: (ids) => reorderLabels(ids),
 *    });
 *    // Usage: handleMoveUp(labelId)
 *    ```
 *
 * 2. **Nested list pattern** (parent resolved at call time):
 *    ```tsx
 *    const { handleMoveUp, handleMoveDown, getPositionFlags } = useMoveHandlers({
 *      getItems: (parentId) => getLabel(parentId)?.categories ?? [],
 *      reorder: (ids, parentId) => reorderCategoriesInLabel(parentId!, ids),
 *    });
 *    // Usage: handleMoveUp(categoryId, labelId)
 *    ```
 *
 * Used by:
 * - AllLabelsTableView (labels - flat)
 * - LabelTableView (categories within a label - flat, context is fixed)
 * - CategoryTableView (products within a category - flat, context is fixed)
 * - MenuTableView (labels - flat; categories - nested, parent at call time)
 *
 * NOT used by AllCategoriesTableView (no manual reordering, sort-only).
 */

export type UseMoveHandlersOptions<T extends { id: string; order?: number }> = {
  /**
   * Get items to reorder.
   * - For flat lists: parentId will be undefined, return the full list
   * - For nested lists: parentId will be provided, return items under that parent
   */
  getItems: (parentId?: string) => T[];
  /**
   * Persist new order.
   * - For flat lists: parentId will be undefined
   * - For nested lists: parentId will be provided (non-null)
   */
  reorder: (ids: string[], parentId?: string) => Promise<unknown>;
  /** Optional callback after reorder completes (e.g., clear sorting) */
  onReorderComplete?: () => void;
};

export type UseMoveHandlersReturn = {
  /** Move item one position up. Pass parentId for nested lists. */
  handleMoveUp: (itemId: string, parentId?: string) => Promise<void>;
  /** Move item one position down. Pass parentId for nested lists. */
  handleMoveDown: (itemId: string, parentId?: string) => Promise<void>;
  /** Get first/last position flags. Pass parentId for nested lists. */
  getPositionFlags: (itemId: string, parentId?: string) => { isFirst: boolean; isLast: boolean };
};

/**
 * Backward-compatible options for flat list usage (legacy pattern).
 * Allows passing `items` directly instead of `getItems`.
 */
export type UseMoveHandlersLegacyOptions<T extends { id: string; order?: number }> = {
  /** Array of items in current order (legacy flat-list API) */
  items: T[];
  /** Function to persist new order (receives array of IDs) */
  reorder: (ids: string[]) => Promise<unknown>;
  /** Optional callback after reorder completes */
  onReorderComplete?: () => void;
};

// Type guard for legacy options
function isLegacyOptions<T extends { id: string; order?: number }>(
  options: UseMoveHandlersOptions<T> | UseMoveHandlersLegacyOptions<T>
): options is UseMoveHandlersLegacyOptions<T> {
  return "items" in options;
}

export function useMoveHandlers<T extends { id: string; order?: number }>(
  options: UseMoveHandlersOptions<T> | UseMoveHandlersLegacyOptions<T>
): UseMoveHandlersReturn {
  // Normalize to unified options
  const getItems = isLegacyOptions(options) ? () => options.items : options.getItems;
  const reorder = isLegacyOptions(options)
    ? (ids: string[], _parentId?: string) => options.reorder(ids)
    : options.reorder;
  const { onReorderComplete } = options;

  /**
   * Get sorted items, handling both pre-sorted arrays and order-based sorting.
   */
  const getSortedItems = useCallback(
    (parentId?: string): T[] => {
      const items = getItems(parentId);
      // Sort by order field if present, otherwise assume already sorted
      if (items.length > 0 && items[0]?.order !== undefined) {
        return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
      return items;
    },
    [getItems]
  );

  const handleMoveUp = useCallback(
    async (itemId: string, parentId?: string) => {
      const items = getSortedItems(parentId);
      const ids = items.map((item) => item.id);
      const index = ids.indexOf(itemId);
      if (index <= 0) return; // Already at top or not found

      // Swap with previous
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      await reorder(ids, parentId);
      onReorderComplete?.();
    },
    [getSortedItems, reorder, onReorderComplete]
  );

  const handleMoveDown = useCallback(
    async (itemId: string, parentId?: string) => {
      const items = getSortedItems(parentId);
      const ids = items.map((item) => item.id);
      const index = ids.indexOf(itemId);
      if (index < 0 || index >= ids.length - 1) return; // Not found or at bottom

      // Swap with next
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
      await reorder(ids, parentId);
      onReorderComplete?.();
    },
    [getSortedItems, reorder, onReorderComplete]
  );

  const getPositionFlags = useCallback(
    (itemId: string, parentId?: string): { isFirst: boolean; isLast: boolean } => {
      const items = getSortedItems(parentId);
      const ids = items.map((item) => item.id);
      const index = ids.indexOf(itemId);

      // If not found, treat as both first and last (disable both buttons)
      if (index < 0) return { isFirst: true, isLast: true };

      return {
        isFirst: index === 0,
        isLast: index === ids.length - 1,
      };
    },
    [getSortedItems]
  );

  return useMemo(
    () => ({
      handleMoveUp,
      handleMoveDown,
      getPositionFlags,
    }),
    [handleMoveUp, handleMoveDown, getPositionFlags]
  );
}

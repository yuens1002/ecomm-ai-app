"use client";

import { useCallback } from "react";
import { calculateMultiReorder } from "./multiSelectValidation";
import { useGroupedReorder } from "./useGroupedReorder";
import type { DnDEligibility } from "./useDnDEligibility";

export type { GroupedReorderHandlers, GroupedReorderClasses } from "./useGroupedReorder";

export type UseSingleEntityDndOptions<TItem extends { id: string }> = {
  /** List of items that can be reordered */
  items: TItem[];
  /** Callback to persist the new order (receives array of ids) */
  onReorder: (ids: string[]) => Promise<void>;
  /** Optional callback fired after successful reorder */
  onReorderComplete?: () => void;
  /** DnD eligibility state from useDnDEligibility hook */
  eligibility: DnDEligibility;
};

/**
 * DnD hook for single-entity (flat) table views.
 *
 * Use this for tables that display a flat list of one entity type:
 * - AllLabelsTableView (list of labels)
 * - CategoryTableView (list of products in a category)
 * - LabelTableView (list of categories in a label)
 *
 * Wraps useGroupedReorder to provide reorder functionality for flat lists.
 * For hierarchical tables with cross-boundary moves, use useMultiEntityDnd instead.
 *
 * @example
 * ```tsx
 * const { getDragHandlers, getDragClasses } = useSingleEntityDnd({
 *   items: labels,
 *   onReorder: async (ids) => await reorderLabels(ids),
 *   eligibility,
 * });
 *
 * // In row render:
 * const handlers = getDragHandlers(label.id);
 * const classes = getDragClasses(label.id);
 *
 * <TableRow
 *   draggable
 *   onDragStart={handlers.onDragStart}
 *   onDragOver={handlers.onDragOver}
 *   onDrop={handlers.onDrop}
 *   onDragEnd={handlers.onDragEnd}
 *   className={cn(classes.isInDragSet && "opacity-50")}
 * />
 * ```
 */
export function useSingleEntityDnd<TItem extends { id: string }>({
  items,
  onReorder,
  onReorderComplete,
  eligibility,
}: UseSingleEntityDndOptions<TItem>) {
  // Handle drop by calculating new order and persisting
  const handleDrop = useCallback(
    async (targetId: string, dropPosition: "before" | "after", draggedIds: readonly string[]) => {
      const newOrder = calculateMultiReorder(items, draggedIds as string[], targetId, dropPosition);
      await onReorder(newOrder);
    },
    [items, onReorder]
  );

  const { dragState, getDragHandlers, getDragClasses, getIsDraggable, clearDragState, eligibleEntityIds } =
    useGroupedReorder({
      eligibility,
      onDrop: handleDrop,
      onDropComplete: onReorderComplete,
    });

  return {
    /** Current drag state including multi-select info */
    dragState,
    /** Get drag handlers for a specific item id */
    getDragHandlers,
    /** Get drag-related CSS classes for a specific item id */
    getDragClasses,
    /** Get isDraggable state for cursor styling (true=can drag, false=can't drag) */
    getIsDraggable,
    /** Manually clear drag state */
    clearDragState,
    /** Set of entity IDs eligible for dragging */
    eligibleEntityIds,
  };
}

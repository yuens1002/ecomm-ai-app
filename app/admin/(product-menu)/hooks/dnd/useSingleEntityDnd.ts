"use client";

import { useGroupedReorder, type UseGroupedReorderOptions } from "./useGroupedReorder";

export type { GroupedReorderHandlers, GroupedReorderClasses } from "./useGroupedReorder";

export type UseSingleEntityDndOptions<TItem extends { id: string }> = UseGroupedReorderOptions<TItem>;

/**
 * DnD hook for single-entity (flat) table views.
 *
 * Use this for tables that display a flat list of one entity type:
 * - AllLabelsTableView (list of labels)
 * - CategoryTableView (list of products in a category)
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
export function useSingleEntityDnd<TItem extends { id: string }>(
  options: UseSingleEntityDndOptions<TItem>
) {
  const { dragState, getDragHandlers, getDragClasses, eligibleEntityIds } = useGroupedReorder(options);

  return {
    /** Current drag state including multi-select info */
    dragState,
    /** Get drag handlers for a specific item id */
    getDragHandlers,
    /** Get drag-related CSS classes for a specific item id */
    getDragClasses,
    /** Set of entity IDs eligible for dragging */
    eligibleEntityIds,
  };
}

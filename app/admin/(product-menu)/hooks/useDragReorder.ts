"use client";

import { useCallback, useState } from "react";

/**
 * Utility: reorder array moving dragId before targetId
 */
function reorderList<T extends { id: string }>(list: T[], dragId: string, targetId: string): T[] {
  const copy = [...list];
  const from = copy.findIndex((i) => i.id === dragId);
  const to = copy.findIndex((i) => i.id === targetId);
  if (from === -1 || to === -1) return list;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export type UseDragReorderOptions<TItem extends { id: string }> = {
  /** List of items that can be reordered */
  items: TItem[];
  /** Callback to persist the new order (receives array of ids) */
  onReorder: (ids: string[]) => Promise<void>;
  /** Optional callback fired after successful reorder (useful for resetting sort state) */
  onReorderComplete?: () => void;
};

export type DragHandlers = {
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

/**
 * Hook for managing drag-and-drop row reordering in tables.
 *
 * @example
 * ```tsx
 * const { dragState, getDragHandlers, getDragClasses } = useDragReorder({
 *   items: labels,
 *   onReorder: async (ids) => await reorderLabels(ids),
 * });
 *
 * // In row render:
 * <TableRow
 *   draggable
 *   {...getDragHandlers(item.id)}
 *   className={getDragClasses(item.id)}
 * >
 * ```
 */
export function useDragReorder<TItem extends { id: string }>({
  items,
  onReorder,
  onReorderComplete,
}: UseDragReorderOptions<TItem>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("before");

  const handleDragStart = useCallback((itemId: string) => {
    setDragId(itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    // Calculate if drop should be before or after target based on mouse position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const position = e.clientY < midPoint ? "before" : "after";

    setDragOverId(targetId);
    setDropPosition(position);
  }, []);

  const handleDragLeave = useCallback(() => {
    // Don't clear drag-over state on leave - this prevents border flicker
    // when dragging to the bottom edge of the last row. The state will be
    // updated by the next onDragOver event, or cleared on drop/end.
  }, []);

  const handleDrop = useCallback(
    async (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setDragOverId(null);
        return;
      }

      // If dropping after, insert after the target instead of before
      const reordered = reorderList(items, dragId, targetId);

      // If position is "after", move one position further
      if (dropPosition === "after") {
        const dragIndex = reordered.findIndex((item) => item.id === dragId);
        const targetIndex = reordered.findIndex((item) => item.id === targetId);

        if (dragIndex !== -1 && targetIndex !== -1 && dragIndex < targetIndex) {
          // Already in correct position due to reorderList logic
        } else if (dragIndex !== -1 && targetIndex !== -1) {
          // Need to move one position further
          const [item] = reordered.splice(dragIndex, 1);
          reordered.splice(targetIndex + 1, 0, item);
        }
      }

      await onReorder(reordered.map((item) => item.id));

      setDragId(null);
      setDragOverId(null);

      // Notify parent that reorder is complete (e.g., to reset column sorting)
      onReorderComplete?.();
    },
    [dragId, items, onReorder, dropPosition, onReorderComplete]
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
  }, []);

  /**
   * Get drag event handlers for a specific item
   */
  const getDragHandlers = useCallback(
    (itemId: string): DragHandlers => ({
      onDragStart: () => handleDragStart(itemId),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, itemId),
      onDragLeave: handleDragLeave,
      onDrop: () => handleDrop(itemId),
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]
  );

  /**
   * Get CSS classes for drag state styling
   */
  const getDragClasses = useCallback(
    (itemId: string) => {
      const isDragging = dragId === itemId;
      const isDragOver = dragOverId === itemId && dragId !== itemId;
      const borderClass =
        isDragOver && dropPosition === "after"
          ? "border-b-2 border-b-primary"
          : "border-t-2 border-t-primary";

      return {
        isDragging,
        isDragOver,
        dropPosition: isDragOver ? dropPosition : null,
        className: [isDragging && "opacity-50", isDragOver && borderClass].filter(Boolean).join(" "),
      };
    },
    [dragId, dragOverId, dropPosition]
  );

  return {
    /** Current drag state */
    dragState: { dragId, dragOverId, dropPosition },
    /** Get drag handlers for a specific item id */
    getDragHandlers,
    /** Get drag-related CSS classes for a specific item id */
    getDragClasses,
  };
}

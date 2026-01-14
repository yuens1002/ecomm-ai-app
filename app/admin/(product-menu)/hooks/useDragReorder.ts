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
}: UseDragReorderOptions<TItem>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((itemId: string) => {
    setDragId(itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(targetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    async (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setDragOverId(null);
        return;
      }

      const reordered = reorderList(items, dragId, targetId);
      await onReorder(reordered.map((item) => item.id));

      setDragId(null);
      setDragOverId(null);
    },
    [dragId, items, onReorder]
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
      return {
        isDragging,
        isDragOver,
        className: [isDragging && "opacity-50", isDragOver && "border-t-2 border-t-primary"]
          .filter(Boolean)
          .join(" "),
      };
    },
    [dragId, dragOverId]
  );

  return {
    /** Current drag state */
    dragState: { dragId, dragOverId },
    /** Get drag handlers for a specific item id */
    getDragHandlers,
    /** Get drag-related CSS classes for a specific item id */
    getDragClasses,
  };
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { calculateMultiReorder, isInDragSet as checkIsInDragSet } from "./dnd/multiSelectValidation";
import { useThrottledCallback } from "./dnd/useThrottledCallback";
import type { DnDEligibility } from "./dnd/useDnDEligibility";

/** Throttle delay for dragOver events (ms) */
const DRAG_OVER_THROTTLE_MS = 50;

export type UseDragReorderOptions<TItem extends { id: string }> = {
  /** List of items that can be reordered */
  items: TItem[];
  /** Callback to persist the new order (receives array of ids) */
  onReorder: (ids: string[]) => Promise<void>;
  /** Optional callback fired after successful reorder (useful for resetting sort state) */
  onReorderComplete?: () => void;
  /** DnD eligibility state from useDnDEligibility hook */
  eligibility: DnDEligibility;
  /** Function to convert key to item id (for extracting entityId from key) */
  getIdFromKey?: (key: string) => string;
};

export type DragHandlers = {
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

/** State tracked during drag operations */
type DragState = {
  dragId: string | null;
  draggedIds: readonly string[];
  dragOverId: string | null;
  dropPosition: "before" | "after";
};

const INITIAL_DRAG_STATE: DragState = {
  dragId: null,
  draggedIds: [],
  dragOverId: null,
  dropPosition: "before",
};

/**
 * Hook for managing drag-and-drop row reordering in flat tables.
 *
 * Follows the action-bar pattern: eligibility is pre-computed from selection,
 * DnD reacts to this state rather than managing selection.
 *
 * Key behaviors:
 * - Drag only initiates when eligibility.canDrag is true
 * - Uses eligibility.draggedEntities to determine what to drag
 * - Selection state is never modified by DnD
 *
 * @example
 * ```tsx
 * const eligibility = useDnDEligibility({ actionableRoots, selectedKind, isSameKind, registry });
 *
 * const { dragState, getDragHandlers, getDragClasses } = useDragReorder({
 *   items: labels,
 *   onReorder: async (ids) => await reorderLabels(ids),
 *   eligibility,
 *   getIdFromKey: (key) => key.split(':')[1],
 * });
 * ```
 */
export function useDragReorder<TItem extends { id: string }>({
  items,
  onReorder,
  onReorderComplete,
  eligibility,
  getIdFromKey: _getIdFromKey = (key) => key,
}: UseDragReorderOptions<TItem>) {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

  // Extract entity IDs from eligibility for drag operations
  const eligibleEntityIds = useMemo(
    () => eligibility.draggedEntities.map((e) => e.entityId),
    [eligibility.draggedEntities]
  );

  /**
   * Handle drag start.
   * Only initiates if eligibility.canDrag is true.
   * Uses eligibility.draggedEntities as the items to drag.
   */
  const handleDragStart = useCallback(
    (itemId: string, e: React.DragEvent) => {
      // Rule: No drag if not eligible
      if (!eligibility.canDrag) {
        e.preventDefault();
        e.dataTransfer.effectAllowed = "none";
        return;
      }

      // Rule: Can only drag items that are in the selection
      if (!eligibleEntityIds.includes(itemId)) {
        e.preventDefault();
        e.dataTransfer.effectAllowed = "none";
        return;
      }

      // Set drag state with all eligible entities
      setDragState({
        dragId: itemId,
        draggedIds: eligibleEntityIds,
        dragOverId: null,
        dropPosition: "before",
      });
    },
    [eligibility.canDrag, eligibleEntityIds]
  );

  // Memoize draggedIds set for O(1) lookup in throttled handler
  const draggedIdsSet = useMemo(() => new Set(dragState.draggedIds), [dragState.draggedIds]);

  // Core drag over logic (called by throttled handler)
  const updateDragOver = useCallback(
    (targetId: string, clientY: number, rect: DOMRect) => {
      // Cannot drop on items that are being dragged
      if (draggedIdsSet.has(targetId)) {
        setDragState((prev) => ({ ...prev, dragOverId: null }));
        return;
      }

      // Calculate if drop should be before or after target based on mouse position
      const midPoint = rect.top + rect.height / 2;
      const position = clientY < midPoint ? "before" : "after";

      setDragState((prev) => ({
        ...prev,
        dragOverId: targetId,
        dropPosition: position,
      }));
    },
    [draggedIdsSet]
  );

  // Throttled version to prevent 60fps state updates
  const throttledUpdateDragOver = useThrottledCallback(updateDragOver, DRAG_OVER_THROTTLE_MS);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      // Only allow drag over if we're in an active drag
      if (!dragState.dragId) return;

      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      throttledUpdateDragOver(targetId, e.clientY, rect);
    },
    [dragState.dragId, throttledUpdateDragOver]
  );

  const handleDragLeave = useCallback(() => {
    // Don't clear drag-over state on leave - this prevents border flicker
    // when dragging to the bottom edge of the last row. The state will be
    // updated by the next onDragOver event, or cleared on drop/end.
  }, []);

  const clearDragState = useCallback(() => {
    setDragState(INITIAL_DRAG_STATE);
  }, []);

  const handleDrop = useCallback(
    async (targetId: string) => {
      const { dragId, draggedIds, dropPosition } = dragState;

      if (!dragId || draggedIds.length === 0) {
        clearDragState();
        return;
      }

      // Cannot drop on items that are being dragged
      if (draggedIds.includes(targetId)) {
        clearDragState();
        return;
      }

      // Use multi-reorder utility for both single and multi-item drags
      const newOrder = calculateMultiReorder(items, draggedIds as string[], targetId, dropPosition);

      await onReorder(newOrder);

      clearDragState();

      // Notify parent that reorder is complete (e.g., to reset column sorting)
      onReorderComplete?.();
    },
    [dragState, items, onReorder, onReorderComplete, clearDragState]
  );

  const handleDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  /**
   * Get drag event handlers for a specific item.
   */
  const getDragHandlers = useCallback(
    (itemId: string): DragHandlers => ({
      onDragStart: (e: React.DragEvent) => handleDragStart(itemId, e),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, itemId),
      onDragLeave: handleDragLeave,
      onDrop: () => handleDrop(itemId),
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]
  );

  /**
   * Get CSS classes for drag state styling.
   */
  const getDragClasses = useCallback(
    (itemId: string) => {
      const { dragId, draggedIds, dragOverId, dropPosition } = dragState;

      const isDragging = dragId === itemId;
      const isInDragSet = checkIsInDragSet(itemId, draggedIds);
      const isDragOver = dragOverId === itemId && !isInDragSet;
      const borderClass =
        isDragOver && dropPosition === "after"
          ? "border-b-2 border-b-primary"
          : "border-t-2 border-t-primary";

      return {
        isDragging,
        isInDragSet,
        isDragOver,
        dropPosition: isDragOver ? dropPosition : null,
        className: [isInDragSet && "opacity-50", isDragOver && borderClass].filter(Boolean).join(" "),
      };
    },
    [dragState]
  );

  return {
    /** Current drag state including multi-select info */
    dragState: {
      dragId: dragState.dragId,
      draggedIds: dragState.draggedIds,
      dragOverId: dragState.dragOverId,
      dropPosition: dragState.dropPosition,
      isMultiDrag: dragState.draggedIds.length > 1,
      dragCount: dragState.draggedIds.length,
    },
    /** Get drag handlers for a specific item id */
    getDragHandlers,
    /** Get drag-related CSS classes for a specific item id */
    getDragClasses,
  };
}

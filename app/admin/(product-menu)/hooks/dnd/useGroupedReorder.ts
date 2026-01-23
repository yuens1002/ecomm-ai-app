"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { calculateMultiReorder, isInDragSet as checkIsInDragSet } from "./multiSelectValidation";
import { useThrottledCallback } from "./useThrottledCallback";
import type { DnDEligibility } from "./useDnDEligibility";

/** Throttle delay for dragOver events (ms) */
const DRAG_OVER_THROTTLE_MS = 50;

/**
 * Drag state tracked during reorder operations.
 */
export type GroupedReorderState = {
  /** ID of the primary drag item */
  dragId: string | null;
  /** All IDs being dragged */
  draggedIds: readonly string[];
  /** ID of the current drop target */
  dragOverId: string | null;
  /** Drop position relative to target */
  dropPosition: "before" | "after";
};

const INITIAL_STATE: GroupedReorderState = {
  dragId: null,
  draggedIds: [],
  dragOverId: null,
  dropPosition: "before",
};

/**
 * Drag handlers returned by the hook.
 */
export type GroupedReorderHandlers = {
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

/**
 * CSS class state for a row during drag operations.
 */
export type GroupedReorderClasses = {
  /** This row is the primary drag item */
  isDragging: boolean;
  /** This row is part of the group being dragged */
  isInDragSet: boolean;
  /** Currently being hovered as a drop target */
  isDragOver: boolean;
  /** Drop position relative to this row */
  dropPosition: "before" | "after" | null;
};

export type UseGroupedReorderOptions<TItem extends { id: string }> = {
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
 * Core hook for grouped entity reorder operations.
 *
 * Provides the shared reorder logic used by both single-entity and
 * multi-entity DnD hooks. Handles:
 * - Drag state management
 * - Throttled drag-over for performance
 * - Drop validation (can't drop on items in drag set)
 * - Multi-item reorder positioning via calculateMultiReorder
 * - Visual feedback classes
 *
 * Does NOT handle:
 * - Ghost rendering (use GroupedEntitiesGhost + useGroupedEntitiesGhost)
 * - Cross-boundary moves (use useMultiEntityDnd)
 * - Auto-expand/collapse (use useMultiEntityDnd)
 *
 * @example
 * ```tsx
 * const { dragState, getDragHandlers, getDragClasses, clearDragState } = useGroupedReorder({
 *   items: labels,
 *   onReorder: reorderLabels,
 *   eligibility,
 * });
 * ```
 */
export function useGroupedReorder<TItem extends { id: string }>({
  items,
  onReorder,
  onReorderComplete,
  eligibility,
}: UseGroupedReorderOptions<TItem>) {
  const [dragState, setDragState] = useState<GroupedReorderState>(INITIAL_STATE);

  // Track if a drop is in progress (prevents dragEnd from interfering during async drop)
  const dropInProgressRef = useRef<boolean>(false);

  // Extract entity IDs from eligibility for drag operations
  const eligibleEntityIds = useMemo(
    () => eligibility.draggedEntities.map((e) => e.entityId),
    [eligibility.draggedEntities]
  );

  // Memoize draggedIds set for O(1) lookup in throttled handler
  const draggedIdsSet = useMemo(() => new Set(dragState.draggedIds), [dragState.draggedIds]);

  /**
   * Clear all drag state.
   */
  const clearDragState = useCallback(() => {
    dropInProgressRef.current = false;
    setDragState(INITIAL_STATE);
  }, []);

  /**
   * Handle drag start.
   * Only initiates if eligibility.canDrag is true and there are valid targets.
   */
  const handleDragStart = useCallback(
    (itemId: string, e: React.DragEvent) => {
      // Rule: No drag if not eligible or no valid targets
      if (!eligibility.canDrag || !eligibility.hasValidTargets) {
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
    [eligibility.canDrag, eligibility.hasValidTargets, eligibleEntityIds]
  );

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
    // Don't clear drag-over state on leave - prevents border flicker
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

      // Mark drop as in progress
      dropInProgressRef.current = true;

      // Calculate new order using multi-reorder utility
      const newOrder = calculateMultiReorder(items, draggedIds as string[], targetId, dropPosition);

      await onReorder(newOrder);

      clearDragState();

      // Notify parent that reorder is complete
      onReorderComplete?.();
    },
    [dragState, items, onReorder, onReorderComplete, clearDragState]
  );

  const handleDragEnd = useCallback(() => {
    // Skip if drop is in progress (async operation still running)
    if (dropInProgressRef.current) {
      return;
    }
    clearDragState();
  }, [clearDragState]);

  /**
   * Get drag event handlers for a specific item.
   */
  const getDragHandlers = useCallback(
    (itemId: string): GroupedReorderHandlers => ({
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
    (itemId: string): GroupedReorderClasses => {
      const { dragId, draggedIds, dragOverId, dropPosition } = dragState;

      const isDragging = dragId === itemId;
      const isInDragSet = checkIsInDragSet(itemId, draggedIds);
      const isDragOver = dragOverId === itemId && !isInDragSet;

      return {
        isDragging,
        isInDragSet,
        isDragOver,
        dropPosition: isDragOver ? dropPosition : null,
      };
    },
    [dragState]
  );

  return {
    /** Current drag state */
    dragState: {
      ...dragState,
      isMultiDrag: dragState.draggedIds.length > 1,
      dragCount: dragState.draggedIds.length,
    },
    /** Get drag handlers for a specific item id */
    getDragHandlers,
    /** Get drag-related CSS classes for a specific item id */
    getDragClasses,
    /** Manually clear drag state (useful for external control) */
    clearDragState,
    /** Set of entity IDs eligible for dragging */
    eligibleEntityIds: new Set(eligibleEntityIds),
  };
}

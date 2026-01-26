"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { isInDragSet as checkIsInDragSet } from "./multiSelectValidation";
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

/**
 * Drop handler callback signature.
 * Called when a valid drop occurs with all necessary info.
 */
export type OnDropCallback = (
  targetId: string,
  dropPosition: "before" | "after",
  draggedIds: readonly string[]
) => Promise<void>;

export type UseGroupedReorderOptions = {
  /** DnD eligibility state from useDnDEligibility hook */
  eligibility: DnDEligibility;
  /** Callback to handle drop - receives targetId, position, and dragged IDs */
  onDrop: OnDropCallback;
  /** Optional callback fired after successful drop */
  onDropComplete?: () => void;
  /**
   * Optional callback for custom dragOver handling (e.g., auto-expand).
   * Called on every valid dragOver with current position info.
   * Return false to prevent updating drag state (e.g., for invalid targets).
   */
  onDragOver?: (
    targetId: string,
    dropPosition: "before" | "after",
    e: React.DragEvent
  ) => boolean | void;
};

/**
 * Core hook for grouped entity reorder operations.
 *
 * Provides shared drag state management and position tracking used by both
 * single-entity and multi-entity DnD hooks. Handles:
 * - Drag state management (dragId, draggedIds, dragOverId, dropPosition)
 * - Throttled drag-over for performance
 * - Drop validation (can't drop on items in drag set)
 * - Visual feedback classes
 *
 * Does NOT handle:
 * - Reorder calculation (use calculateMultiReorder in your onDrop)
 * - Ghost rendering (use GroupedEntitiesGhost + useGroupedEntitiesGhost)
 * - Cross-boundary moves (implement in onDrop callback)
 * - Auto-expand/collapse (use onDragOver callback)
 *
 * @example
 * ```tsx
 * const { dragState, getDragHandlers, getDragClasses } = useGroupedReorder({
 *   eligibility,
 *   onDrop: async (targetId, dropPosition, draggedIds) => {
 *     const newOrder = calculateMultiReorder(items, draggedIds, targetId, dropPosition);
 *     await reorderItems(newOrder);
 *   },
 * });
 * ```
 */
export function useGroupedReorder({
  eligibility,
  onDrop,
  onDropComplete,
  onDragOver: onDragOverCallback,
}: UseGroupedReorderOptions) {
  const [dragState, setDragState] = useState<GroupedReorderState>(INITIAL_STATE);

  // Track if a drop is in progress (prevents dragEnd from interfering during async drop)
  const dropInProgressRef = useRef<boolean>(false);

  // Extract entity IDs from eligibility for drag operations
  const eligibleEntityIds = useMemo(
    () => eligibility.draggedEntities.map((e) => e.entityId),
    [eligibility.draggedEntities]
  );

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

  // Core drag over logic - matches useMultiEntityDnd pattern
  // Position calculation and state update together (called by throttle)
  const updateDragOver = useCallback(
    (targetId: string, clientY: number, rect: DOMRect) => {
      // Cannot drop on items that are being dragged
      // Use functional update to get current draggedIds
      setDragState((prev) => {
        if (prev.draggedIds.includes(targetId)) {
          return { ...prev, dragOverId: null };
        }

        // Calculate drop position based on mouse position
        const midPoint = rect.top + rect.height / 2;
        const position = clientY < midPoint ? "before" : "after";

        return {
          ...prev,
          dragOverId: targetId,
          dropPosition: position,
        };
      });
    },
    []
  );

  // Throttled version to prevent 60fps state updates
  const { throttled: throttledUpdateDragOver } = useThrottledCallback(
    updateDragOver,
    DRAG_OVER_THROTTLE_MS
  );

  // Matches useMultiEntityDnd pattern: uses dragState.dragId (not ref)
  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      // Check dragState.dragId (same pattern as working useMultiEntityDnd)
      if (!dragState.dragId) return;

      e.preventDefault();

      // Allow parent hook to intercept dragOver (e.g., for auto-expand, custom validation)
      if (onDragOverCallback) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        const position = e.clientY < midPoint ? "before" : "after";
        const shouldContinue = onDragOverCallback(targetId, position, e);
        if (shouldContinue === false) {
          setDragState((prev) => ({ ...prev, dragOverId: null }));
          return;
        }
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      throttledUpdateDragOver(targetId, e.clientY, rect);
    },
    [dragState.dragId, throttledUpdateDragOver, onDragOverCallback]
  );

  const handleDragLeave = useCallback(() => {
    // Don't clear drag-over state on leave - prevents border flicker
  }, []);

  // Matches useMultiEntityDnd pattern: reads dropPosition from dragState
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

      // Call the provided drop handler
      await onDrop(targetId, dropPosition, draggedIds);

      clearDragState();

      // Notify parent that drop is complete
      onDropComplete?.();
    },
    [dragState, onDrop, onDropComplete, clearDragState]
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

  /**
   * Get isDraggable state for cursor styling on a row.
   * Returns:
   * - undefined: no selection (no DnD context, show default pointer)
   * - true: row can be dragged (show grab cursor on intent)
   * - false: row cannot be dragged (show not-allowed cursor on intent)
   */
  const getIsDraggable = useCallback(
    (itemId: string): boolean | undefined => {
      // No selection = no DnD context
      if (eligibleEntityIds.length === 0) {
        return undefined;
      }
      // Has selection - check if this row can be dragged
      return eligibility.canDrag && eligibility.hasValidTargets && eligibleEntityIds.includes(itemId);
    },
    [eligibility.canDrag, eligibility.hasValidTargets, eligibleEntityIds]
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
    /** Get isDraggable state for cursor styling (undefined=no context, true=can drag, false=can't drag) */
    getIsDraggable,
    /** Manually clear drag state (useful for external control) */
    clearDragState,
    /** Set of entity IDs eligible for dragging */
    eligibleEntityIds: new Set(eligibleEntityIds),
  };
}

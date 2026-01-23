"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_GHOST_ID = "multi-drag-ghost";

/**
 * Hook for setting up custom drag ghost images.
 *
 * Works with the MultiDragGhost component to display a custom
 * drag image with a count badge for multi-select operations.
 *
 * @param ghostId - Optional custom ID for the ghost element (must match MultiDragGhost ghostId prop)
 *
 * @example
 * ```tsx
 * const { setGhostImage } = useMultiDragGhost("menu-view-ghost");
 *
 * // In drag start handler:
 * onDragStart={(e) => {
 *   setGhostImage(e);
 *   // ... rest of drag start logic
 * }}
 *
 * // Render ghost (with matching ghostId):
 * <MultiDragGhost ghostId="menu-view-ghost" count={dragCount}>
 *   <RowContent />
 * </MultiDragGhost>
 * ```
 */
export function useMultiDragGhost(ghostId: string = DEFAULT_GHOST_ID) {
  const ghostRef = useRef<HTMLElement | null>(null);

  // Update ref to ghost container after render
  useEffect(() => {
    const updateRef = () => {
      ghostRef.current = document.getElementById(ghostId);
    };

    // Initial update
    updateRef();

    // Also update on any DOM changes (in case ghost is added/removed)
    const observer = new MutationObserver(updateRef);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [ghostId]);

  /**
   * Set the custom drag image from the ghost element.
   *
   * Call this in the onDragStart handler to use the custom ghost.
   * Falls back to browser default if ghost element not found.
   *
   * IMPORTANT: Must be called synchronously during dragstart event.
   */
  const setGhostImage = useCallback((e: React.DragEvent) => {
    // Try ref first, then fallback to getElementById
    const ghost = ghostRef.current ?? document.getElementById(ghostId);
    if (ghost && e.dataTransfer) {
      // Position ghost at cursor with small offset
      e.dataTransfer.setDragImage(ghost, 20, 20);
    }
  }, [ghostId]);

  return {
    /** Ref to the ghost container element */
    ghostRef,
    /** Function to set the drag image in onDragStart */
    setGhostImage,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuLabel, MenuProduct } from "../types/menu";
import type { FlatMenuRow, MenuRowLevel } from "../menu-builder/components/table-views/MenuTableView.types";

/** Delay in ms before auto-expanding a collapsed item on hover */
const HOVER_EXPAND_DELAY_MS = 500;

type ReorderResult = { ok: boolean; error?: string };

type ReorderFunctions = {
  reorderLabels: (ids: string[]) => Promise<ReorderResult>;
  reorderCategoriesInLabel: (labelId: string, ids: string[]) => Promise<ReorderResult>;
  reorderProductsInCategory: (categoryId: string, ids: string[]) => Promise<ReorderResult>;
};

type UseMenuTableDragReorderOptions = {
  rows: FlatMenuRow[];
  labels: MenuLabel[];
  products: MenuProduct[];
  reorderFunctions: ReorderFunctions;
  pushUndoAction: (action: {
    action: string;
    timestamp: Date;
    data: { undo: () => Promise<void>; redo: () => Promise<void> };
  }) => void;
  /** Callback to expand a collapsed item (for hover-to-expand) */
  onExpandItem?: (id: string) => void;
};

export type HierarchicalDragHandlers = {
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

type DragState = {
  dragId: string | null;
  dragLevel: MenuRowLevel | null;
  dragParentId: string | null;
  dragOverId: string | null;
  dropPosition: "before" | "after";
  /** ID of item that was just auto-expanded (for animation) */
  autoExpandedId: string | null;
};

/**
 * Hook for managing hierarchical drag-and-drop reordering in the menu table.
 *
 * Constraints:
 * - Items can only be dropped within the same level AND same parent
 * - Labels can reorder among themselves (no parent constraint)
 * - Categories can only reorder within the same label
 * - Products can only reorder within the same category
 */
export function useMenuTableDragReorder({
  rows,
  labels,
  products,
  reorderFunctions,
  pushUndoAction,
  onExpandItem,
}: UseMenuTableDragReorderOptions) {
  const [dragState, setDragState] = useState<DragState>({
    dragId: null,
    dragLevel: null,
    dragParentId: null,
    dragOverId: null,
    dropPosition: "before",
    autoExpandedId: null,
  });

  // Ref for hover-to-expand timer
  const hoverExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which item we're timing for (to avoid re-starting timer)
  const hoverExpandTargetRef = useRef<string | null>(null);

  // Clear hover expand timer
  const clearHoverExpandTimer = useCallback(() => {
    if (hoverExpandTimerRef.current) {
      clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
    hoverExpandTargetRef.current = null;
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearHoverExpandTimer();
    };
  }, [clearHoverExpandTimer]);

  // Clear auto-expanded animation state after a delay
  useEffect(() => {
    if (dragState.autoExpandedId) {
      const timer = setTimeout(() => {
        setDragState((prev) => ({ ...prev, autoExpandedId: null }));
      }, 600); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [dragState.autoExpandedId]);

  // Get row by ID
  const getRow = useCallback(
    (id: string): FlatMenuRow | undefined => rows.find((r) => r.id === id),
    [rows]
  );

  // Check if drop is valid (same level and same parent)
  const isValidDrop = useCallback(
    (targetId: string): boolean => {
      if (!dragState.dragId || dragState.dragId === targetId) return false;

      const targetRow = getRow(targetId);
      if (!targetRow) return false;

      // Must be same level
      if (targetRow.level !== dragState.dragLevel) return false;

      // Must have same parent (for categories and products)
      if (dragState.dragLevel !== "label" && targetRow.parentId !== dragState.dragParentId) {
        return false;
      }

      return true;
    },
    [dragState.dragId, dragState.dragLevel, dragState.dragParentId, getRow]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (row: FlatMenuRow) => {
      setDragState({
        dragId: row.id,
        dragLevel: row.level,
        dragParentId: row.parentId,
        dragOverId: null,
        dropPosition: "before",
        autoExpandedId: null,
      });
    },
    []
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();

      const targetRow = getRow(targetId);

      // Check if this is a collapsed expandable item (for hover-to-expand)
      // Only expand if the dragged item could potentially be dropped inside
      const canExpandForDrop =
        targetRow &&
        targetRow.isExpandable &&
        !targetRow.isExpanded &&
        onExpandItem &&
        dragState.dragId;

      if (canExpandForDrop) {
        // Start hover expand timer if not already timing this target
        if (hoverExpandTargetRef.current !== targetId) {
          clearHoverExpandTimer();
          hoverExpandTargetRef.current = targetId;
          hoverExpandTimerRef.current = setTimeout(() => {
            // Build expand key: labels use id, categories use composite key (parentId-id)
            const expandKey =
              targetRow.level === "category" && targetRow.parentId
                ? `${targetRow.parentId}-${targetRow.id}`
                : targetRow.id;
            onExpandItem(expandKey);
            setDragState((prev) => ({ ...prev, autoExpandedId: targetId }));
            hoverExpandTargetRef.current = null;
          }, HOVER_EXPAND_DELAY_MS);
        }
      } else if (hoverExpandTargetRef.current !== targetId) {
        // Clear timer if hovering a different non-expandable item
        clearHoverExpandTimer();
      }

      if (!isValidDrop(targetId)) {
        // Clear drag over state if invalid
        setDragState((prev) => ({
          ...prev,
          dragOverId: null,
        }));
        return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      const position = e.clientY < midPoint ? "before" : "after";

      setDragState((prev) => ({
        ...prev,
        dragOverId: targetId,
        dropPosition: position,
      }));
    },
    [isValidDrop, getRow, onExpandItem, dragState.dragId, clearHoverExpandTimer]
  );

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    // Don't clear immediately to prevent flicker
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    async (targetId: string) => {
      const { dragId, dragLevel, dragParentId, dropPosition } = dragState;

      if (!dragId || !isValidDrop(targetId)) {
        clearHoverExpandTimer();
        setDragState({
          dragId: null,
          dragLevel: null,
          dragParentId: null,
          dragOverId: null,
          dropPosition: "before",
          autoExpandedId: null,
        });
        return;
      }

      // Get items to reorder based on level
      let itemsToReorder: { id: string }[] = [];
      let previousIds: string[] = [];

      if (dragLevel === "label") {
        // Reorder labels
        itemsToReorder = labels;
        previousIds = labels.map((l) => l.id);
      } else if (dragLevel === "category" && dragParentId) {
        // Reorder categories within label
        const parentLabel = labels.find((l) => l.id === dragParentId);
        if (parentLabel) {
          itemsToReorder = [...parentLabel.categories].sort((a, b) => a.order - b.order);
          previousIds = itemsToReorder.map((c) => c.id);
        }
      } else if (dragLevel === "product" && dragParentId) {
        // Reorder products within category
        const categoryProducts = products.filter((p) =>
          p.categoryIds.includes(dragParentId)
        );
        // Sort by their order in this category
        itemsToReorder = categoryProducts.sort((a, b) => {
          const orderA =
            a.categoryOrders.find((co) => co.categoryId === dragParentId)?.order ?? 0;
          const orderB =
            b.categoryOrders.find((co) => co.categoryId === dragParentId)?.order ?? 0;
          return orderA - orderB;
        });
        previousIds = itemsToReorder.map((p) => p.id);
      }

      // Perform reorder
      const reordered = [...itemsToReorder];
      const fromIndex = reordered.findIndex((item) => item.id === dragId);
      const toIndex = reordered.findIndex((item) => item.id === targetId);

      if (fromIndex === -1 || toIndex === -1) {
        clearHoverExpandTimer();
        setDragState({
          dragId: null,
          dragLevel: null,
          dragParentId: null,
          dragOverId: null,
          dropPosition: "before",
          autoExpandedId: null,
        });
        return;
      }

      // Remove item from current position
      const [item] = reordered.splice(fromIndex, 1);

      // Calculate new position based on drop position
      let newIndex = toIndex;
      if (dropPosition === "after") {
        newIndex = fromIndex < toIndex ? toIndex : toIndex + 1;
      } else {
        newIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      }

      // Insert at new position
      reordered.splice(newIndex, 0, item);

      const newIds = reordered.map((i) => i.id);

      // Execute reorder based on level
      try {
        if (dragLevel === "label") {
          await reorderFunctions.reorderLabels(newIds);
          pushUndoAction({
            action: "reorder:labels",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await reorderFunctions.reorderLabels(previousIds);
              },
              redo: async () => {
                await reorderFunctions.reorderLabels(newIds);
              },
            },
          });
        } else if (dragLevel === "category" && dragParentId) {
          await reorderFunctions.reorderCategoriesInLabel(dragParentId, newIds);
          const labelId = dragParentId;
          pushUndoAction({
            action: "reorder:categories-in-label",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await reorderFunctions.reorderCategoriesInLabel(labelId, previousIds);
              },
              redo: async () => {
                await reorderFunctions.reorderCategoriesInLabel(labelId, newIds);
              },
            },
          });
        } else if (dragLevel === "product" && dragParentId) {
          await reorderFunctions.reorderProductsInCategory(dragParentId, newIds);
          const categoryId = dragParentId;
          pushUndoAction({
            action: "reorder:products-in-category",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await reorderFunctions.reorderProductsInCategory(categoryId, previousIds);
              },
              redo: async () => {
                await reorderFunctions.reorderProductsInCategory(categoryId, newIds);
              },
            },
          });
        }
      } catch (error) {
        console.error("[useMenuTableDragReorder] Reorder failed:", error);
      }

      // Clear drag state
      clearHoverExpandTimer();
      setDragState({
        dragId: null,
        dragLevel: null,
        dragParentId: null,
        dragOverId: null,
        dropPosition: "before",
        autoExpandedId: null,
      });
    },
    [dragState, isValidDrop, labels, products, reorderFunctions, pushUndoAction, clearHoverExpandTimer]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    clearHoverExpandTimer();
    setDragState({
      dragId: null,
      dragLevel: null,
      dragParentId: null,
      dragOverId: null,
      dropPosition: "before",
      autoExpandedId: null,
    });
  }, [clearHoverExpandTimer]);

  /**
   * Get drag event handlers for a specific row
   */
  const getDragHandlers = useCallback(
    (row: FlatMenuRow): HierarchicalDragHandlers => ({
      onDragStart: () => handleDragStart(row),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, row.id),
      onDragLeave: handleDragLeave,
      onDrop: () => handleDrop(row.id),
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]
  );

  /**
   * Get drag state classes for a specific row
   */
  const getDragClasses = useCallback(
    (row: FlatMenuRow) => {
      const isDragging = dragState.dragId === row.id;
      const isDragOver = dragState.dragOverId === row.id && isValidDrop(row.id);
      const isAutoExpanded = dragState.autoExpandedId === row.id;

      return {
        isDragging,
        isDragOver,
        dropPosition: isDragOver ? dragState.dropPosition : null,
        /** True when this row was just auto-expanded via hover (for animation) */
        isAutoExpanded,
      };
    },
    [dragState.dragId, dragState.dragOverId, dragState.dropPosition, dragState.autoExpandedId, isValidDrop]
  );

  return {
    dragState,
    getDragHandlers,
    getDragClasses,
  };
}

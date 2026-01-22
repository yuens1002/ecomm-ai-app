import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuLabel } from "../types/menu";
import type { FlatMenuRow } from "../menu-builder/components/table-views/MenuTableView.types";


type ReorderResult = { ok: boolean; error?: string };

/**
 * Reorder functions for each level in the 2-level hierarchy.
 */
type ReorderFunctions = {
  reorderLabels: (ids: string[]) => Promise<ReorderResult>;
  reorderCategoriesInLabel: (labelId: string, ids: string[]) => Promise<ReorderResult>;
  /** Move a category from one label to another (cross-boundary) */
  moveCategoryToLabel: (
    categoryId: string,
    fromLabelId: string,
    toLabelId: string
  ) => Promise<ReorderResult>;
};

type UseMenuTableDragReorderOptions = {
  rows: FlatMenuRow[];
  labels: MenuLabel[];
  reorderFunctions: ReorderFunctions;
  pushUndoAction: (action: {
    action: string;
    timestamp: Date;
    data: { undo: () => Promise<void>; redo: () => Promise<void> };
  }) => void;
  /** Callback to expand a collapsed item (on drag enter) */
  onExpandItem?: (id: string) => void;
  /** Callback to collapse an item (on drag leave) */
  onCollapseItem?: (id: string) => void;
};

export type HierarchicalDragHandlers = {
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

type DropType = "reorder" | "move-to-label";

/** The two levels in the menu hierarchy */
type MenuLevel = "label" | "category";

type DragState = {
  dragId: string | null;
  dragLevel: MenuLevel | null;
  dragParentId: string | null;
  dragOverId: string | null;
  dropPosition: "before" | "after";
  /** Type of drop operation: 'reorder' (same parent) or 'move-to-label' (cross-boundary) */
  dropType: DropType;
  /** ID of item that was just auto-expanded (for animation) */
  autoExpandedId: string | null;
  /** True when dragging a label - disables chevrons during drag */
  isDraggingLabel: boolean;
};

const INITIAL_DRAG_STATE: DragState = {
  dragId: null,
  dragLevel: null,
  dragParentId: null,
  dragOverId: null,
  dropPosition: "before",
  dropType: "reorder",
  autoExpandedId: null,
  isDraggingLabel: false,
};

/**
 * Hook for managing hierarchical drag-and-drop reordering in the menu table.
 *
 * 2-level hierarchy: Labels → Categories
 *
 * Features:
 * - Same-level reordering (labels among labels, categories within same label)
 * - Cross-boundary moves (categories between different labels)
 * - Auto-expand collapsed labels on drag enter (immediate)
 * - Auto-collapse on drag leave territory (label + its categories)
 * - Undo/redo support for all operations
 *
 * Drop rules:
 * - Labels: reorder among labels only
 * - Categories: reorder within same label, OR move to different label
 *
 * Note: Single-item drag only. Multi-select drag is not supported.
 */
export function useMenuTableDragReorder({
  rows,
  labels,
  reorderFunctions,
  pushUndoAction,
  onExpandItem,
  onCollapseItem,
}: UseMenuTableDragReorderOptions) {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

  // Track the currently auto-expanded label ID (singular - collapse when leaving its territory)
  const autoExpandedLabelRef = useRef<string | null>(null);

  // Clear auto-expanded animation state after a delay
  useEffect(() => {
    if (dragState.autoExpandedId) {
      const timer = setTimeout(() => {
        setDragState((prev) => ({ ...prev, autoExpandedId: null }));
      }, 600); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [dragState.autoExpandedId]);

  // Helper to clear drag state
  const clearDragState = useCallback(() => {
    autoExpandedLabelRef.current = null;
    setDragState(INITIAL_DRAG_STATE);
  }, []);

  // Get row by ID
  const getRow = useCallback(
    (id: string): FlatMenuRow | undefined => rows.find((r) => r.id === id),
    [rows]
  );

  /**
   * Determine if a drop is valid and what type of drop it would be.
   *
   * Label drops: only valid on other labels (reorder)
   * Category drops: valid on categories (reorder/move) or labels (move)
   */
  const getDropInfo = useCallback(
    (targetId: string): { valid: false } | { valid: true; dropType: DropType } => {
      const { dragId, dragLevel, dragParentId } = dragState;

      if (!dragId || dragId === targetId) return { valid: false };

      const targetRow = getRow(targetId);
      if (!targetRow) return { valid: false };

      // Label drag: only valid target is another label
      if (dragLevel === "label") {
        return targetRow.level === "label"
          ? { valid: true, dropType: "reorder" }
          : { valid: false };
      }

      // Category drag: valid targets are categories or labels (for cross-boundary)
      if (dragLevel === "category") {
        // Drop on a category
        if (targetRow.level === "category") {
          const isSameParent = targetRow.parentId === dragParentId;
          return {
            valid: true,
            dropType: isSameParent ? "reorder" : "move-to-label",
          };
        }

        // Drop on a label (move to that label)
        if (targetRow.level === "label") {
          // Can't drop on own parent label
          return targetRow.id === dragParentId
            ? { valid: false }
            : { valid: true, dropType: "move-to-label" };
        }
      }

      return { valid: false };
    },
    [dragState, getRow]
  );

  // Simplified isValidDrop for compatibility
  const isValidDrop = useCallback(
    (targetId: string): boolean => getDropInfo(targetId).valid,
    [getDropInfo]
  );

  // Handle drag start
  const handleDragStart = useCallback((row: FlatMenuRow) => {
    // Only handle label and category levels
    if (row.level !== "label" && row.level !== "category") return;

    setDragState({
      ...INITIAL_DRAG_STATE,
      dragId: row.id,
      dragLevel: row.level,
      dragParentId: row.parentId,
      isDraggingLabel: row.level === "label",
    });
  }, []);

  /**
   * Get the label ID that "owns" a row's territory.
   * - Label rows own themselves
   * - Category rows belong to their parent label
   */
  const getLabelOwner = useCallback(
    (row: FlatMenuRow): string | null => {
      if (row.level === "label") return row.id;
      if (row.level === "category") return row.parentId;
      return null;
    },
    []
  );

  // Handle drag over - expand on enter territory, collapse when leaving territory
  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();

      const targetRow = getRow(targetId);
      if (!targetRow) return;

      // Determine which label's territory we're now in
      const targetLabelOwner = getLabelOwner(targetRow);
      const currentAutoExpanded = autoExpandedLabelRef.current;

      // Collapse previous auto-expanded label if we've moved to a different label's territory
      if (
        currentAutoExpanded &&
        currentAutoExpanded !== targetLabelOwner &&
        onCollapseItem
      ) {
        onCollapseItem(currentAutoExpanded);
        autoExpandedLabelRef.current = null;
      }

      // Auto-expand collapsed labels immediately when dragging categories over them
      const shouldExpand =
        targetRow.level === "label" &&
        targetRow.isExpandable &&
        !targetRow.isExpanded &&
        onExpandItem &&
        dragState.dragLevel === "category";

      if (shouldExpand) {
        autoExpandedLabelRef.current = targetRow.id;
        onExpandItem(targetRow.id);
        setDragState((prev) => ({ ...prev, autoExpandedId: targetId }));
      }

      const dropInfo = getDropInfo(targetId);
      if (!dropInfo.valid) {
        setDragState((prev) => ({
          ...prev,
          dragOverId: null,
          dropType: "reorder",
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
        dropType: dropInfo.dropType,
      }));
    },
    [getDropInfo, getRow, getLabelOwner, onExpandItem, onCollapseItem, dragState.dragLevel]
  );

  // Handle drag leave - no-op (collapse handled in dragOver when entering new territory)
  const handleDragLeave = useCallback(() => {}, []);

  /**
   * Execute a cross-boundary category move.
   */
  const executeCrossBoundaryMove = useCallback(
    async (categoryId: string, fromLabelId: string, toLabelId: string) => {
      await reorderFunctions.moveCategoryToLabel(categoryId, fromLabelId, toLabelId);

      pushUndoAction({
        action: "move:category-to-label",
        timestamp: new Date(),
        data: {
          undo: async () => {
            await reorderFunctions.moveCategoryToLabel(categoryId, toLabelId, fromLabelId);
          },
          redo: async () => {
            await reorderFunctions.moveCategoryToLabel(categoryId, fromLabelId, toLabelId);
          },
        },
      });
    },
    [reorderFunctions, pushUndoAction]
  );

  /**
   * Execute a same-parent reorder operation.
   */
  const executeReorder = useCallback(
    async (
      level: MenuLevel,
      parentId: string | null,
      dragId: string,
      targetId: string,
      dropPosition: "before" | "after"
    ) => {
      // Get items to reorder based on level
      const items =
        level === "label"
          ? labels
          : labels.find((l) => l.id === parentId)?.categories.slice().sort((a, b) => a.order - b.order) ?? [];

      const previousIds = items.map((i) => i.id);

      // Calculate new order
      const reordered = [...items];
      const fromIndex = reordered.findIndex((item) => item.id === dragId);
      const toIndex = reordered.findIndex((item) => item.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return;

      const [item] = reordered.splice(fromIndex, 1);
      let newIndex = toIndex;
      if (dropPosition === "after") {
        newIndex = fromIndex < toIndex ? toIndex : toIndex + 1;
      } else {
        newIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      }
      reordered.splice(newIndex, 0, item);

      const newIds = reordered.map((i) => i.id);

      // Execute reorder based on level
      if (level === "label") {
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
      } else if (parentId) {
        await reorderFunctions.reorderCategoriesInLabel(parentId, newIds);
        pushUndoAction({
          action: "reorder:categories-in-label",
          timestamp: new Date(),
          data: {
            undo: async () => {
              await reorderFunctions.reorderCategoriesInLabel(parentId, previousIds);
            },
            redo: async () => {
              await reorderFunctions.reorderCategoriesInLabel(parentId, newIds);
            },
          },
        });
      }
    },
    [labels, reorderFunctions, pushUndoAction]
  );

  // Handle drop
  const handleDrop = useCallback(
    async (targetId: string) => {
      const { dragId, dragLevel, dragParentId, dropPosition } = dragState;

      const dropInfo = getDropInfo(targetId);
      if (!dragId || !dragLevel || !dropInfo.valid) {
        clearDragState();
        return;
      }

      const targetRow = getRow(targetId);
      if (!targetRow) {
        clearDragState();
        return;
      }

      try {
        // Cross-boundary move: category to different label
        if (dropInfo.dropType === "move-to-label" && dragLevel === "category" && dragParentId) {
          const targetLabelId =
            targetRow.level === "label" ? targetRow.id : targetRow.parentId;

          if (targetLabelId && targetLabelId !== dragParentId) {
            await executeCrossBoundaryMove(dragId, dragParentId, targetLabelId);
          }
        } else {
          // Same-parent reorder
          await executeReorder(dragLevel, dragParentId, dragId, targetId, dropPosition);
        }
      } catch (error) {
        console.error("[useMenuTableDragReorder] Drop operation failed:", error);
      }

      clearDragState();
    },
    [dragState, getDropInfo, getRow, clearDragState, executeCrossBoundaryMove, executeReorder]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

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
        /** Type of drop: 'reorder' (same parent) or 'move-to-label' (cross-boundary) */
        dropType: isDragOver ? dragState.dropType : null,
        /** True when this row was just auto-expanded via hover (for animation) */
        isAutoExpanded,
      };
    },
    [dragState.dragId, dragState.dragOverId, dragState.dropPosition, dragState.dropType, dragState.autoExpandedId, isValidDrop]
  );

  return {
    dragState,
    getDragHandlers,
    getDragClasses,
  };
}

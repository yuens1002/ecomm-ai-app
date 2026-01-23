"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuLabel } from "../types/menu";
import type { FlatMenuRow } from "../menu-builder/components/table-views/MenuTableView.types";
import type { IdentityRegistry } from "../types/identity-registry";
import { createKey } from "../types/identity-registry";
import { calculateMultiReorder, isInDragSet as checkIsInDragSet } from "./dnd/multiSelectValidation";
import { useThrottledCallback } from "./dnd/useThrottledCallback";
import type { DnDEligibility, DraggedEntity } from "./dnd/useDnDEligibility";

/** Throttle delay for dragOver events (ms) */
const DRAG_OVER_THROTTLE_MS = 50;

/** Delay before auto-expanding a collapsed label on drag hover (ms) */
const AUTO_EXPAND_DELAY_MS = 500;

type ReorderResult = { ok: boolean; error?: string };

/** Info about a category being dragged (for batch moves) */
type DraggedCategoryInfo = {
  categoryId: string;
  fromLabelId: string;
};

/**
 * Reorder functions for each level in the 2-level hierarchy.
 */
type ReorderFunctions = {
  reorderLabels: (ids: string[]) => Promise<ReorderResult>;
  reorderCategoriesInLabel: (labelId: string, ids: string[]) => Promise<ReorderResult>;
  /** Move a category from one label to another (cross-boundary) with position */
  moveCategoryToLabel: (
    categoryId: string,
    fromLabelId: string,
    toLabelId: string,
    targetCategoryId: string | null,
    dropPosition: "before" | "after"
  ) => Promise<ReorderResult>;
  /** Batch move multiple categories to a label (optional, for multi-select) */
  batchMoveCategoriesToLabel?: (
    moves: DraggedCategoryInfo[],
    toLabelId: string,
    targetCategoryId: string | null,
    dropPosition: "before" | "after"
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
  /** DnD eligibility state from useDnDEligibility hook */
  eligibility: DnDEligibility;
  /** Identity registry for entity lookups and drop validation */
  registry: IdentityRegistry;
  /**
   * Callback to update selection after cross-boundary moves.
   * Called with the new keys after categories move to a different label.
   * This is needed because category keys include the parent label ID.
   */
  onSelectionUpdate?: (newKeys: string[]) => void;
};

export type HierarchicalDragHandlers = {
  onDragStart: (e?: React.DragEvent) => void;
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
  dropType: DropType;
  autoExpandedId: string | null;
  isDraggingLabel: boolean;
  draggedIds: readonly string[];
  draggedCategories: readonly DraggedCategoryInfo[];
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
  draggedIds: [],
  draggedCategories: [],
};

/**
 * Extract parent ID from a dragged entity.
 * For categories, parentKey is "label:labelId", so we extract the labelId.
 */
function extractParentId(entity: DraggedEntity): string | null {
  if (!entity.parentKey) return null;
  // parentKey format: "label:labelId"
  const colonIndex = entity.parentKey.indexOf(":");
  return colonIndex > -1 ? entity.parentKey.slice(colonIndex + 1) : entity.parentKey;
}

/**
 * Hook for managing hierarchical drag-and-drop reordering in the menu table.
 *
 * Follows the action-bar pattern: eligibility is pre-computed from selection,
 * DnD reacts to this state rather than managing selection.
 *
 * Key behaviors:
 * - Drag only initiates when eligibility.canDrag is true
 * - Uses eligibility.draggedEntities to determine what to drag
 * - Selection state is never modified by DnD
 *
 * Features:
 * - Same-level reordering (labels among labels, categories within same label)
 * - Cross-boundary moves (categories between different labels)
 * - Multi-select drag support
 * - Auto-expand collapsed labels on drag enter
 * - Undo/redo support
 */
export function useMenuTableDragReorder({
  rows,
  labels,
  reorderFunctions,
  pushUndoAction,
  onExpandItem,
  onCollapseItem,
  eligibility,
  registry,
  onSelectionUpdate,
}: UseMenuTableDragReorderOptions) {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

  // Track the currently auto-expanded label ID
  const autoExpandedLabelRef = useRef<string | null>(null);

  // Timer for delayed auto-expansion
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which label the expansion timer is for
  const pendingExpandLabelRef = useRef<string | null>(null);

  // Clear auto-expanded animation state after a delay
  useEffect(() => {
    if (dragState.autoExpandedId) {
      const timer = setTimeout(() => {
        setDragState((prev) => ({ ...prev, autoExpandedId: null }));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [dragState.autoExpandedId]);

  // Helper to clear any pending expansion timer
  const clearExpandTimer = useCallback(() => {
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
    pendingExpandLabelRef.current = null;
  }, []);

  // Helper to clear drag state and collapse auto-expanded labels
  const clearDragState = useCallback(
    (wasDropped: boolean = false) => {
      clearExpandTimer();

      // Collapse auto-expanded label if drag ended without a drop
      if (!wasDropped && autoExpandedLabelRef.current && onCollapseItem) {
        onCollapseItem(autoExpandedLabelRef.current);
      }

      autoExpandedLabelRef.current = null;
      setDragState(INITIAL_DRAG_STATE);
    },
    [clearExpandTimer, onCollapseItem]
  );

  // Memoize rows lookup for O(1) access
  const rowsById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const getRow = useCallback((id: string): FlatMenuRow | undefined => rowsById.get(id), [rowsById]);

  // Extract eligible entity IDs for drag validation
  const eligibleEntityIds = useMemo(
    () => new Set(eligibility.draggedEntities.map((e) => e.entityId)),
    [eligibility.draggedEntities]
  );

  // Build dragged categories info from eligibility, sorted by visual order
  const draggedCategoriesFromEligibility = useMemo((): DraggedCategoryInfo[] => {
    if (eligibility.dragKind !== "category") return [];

    const categoryInfos = eligibility.draggedEntities
      .filter((e) => e.parentKey !== null)
      .map((e) => ({
        categoryId: e.entityId,
        fromLabelId: extractParentId(e)!,
      }));

    // Sort by visual order (position in rows array)
    // This ensures consistent ordering regardless of selection order
    const rowIndexMap = new Map(rows.map((r, i) => [r.id, i]));
    categoryInfos.sort((a, b) => {
      const indexA = rowIndexMap.get(a.categoryId) ?? Infinity;
      const indexB = rowIndexMap.get(b.categoryId) ?? Infinity;
      return indexA - indexB;
    });

    return categoryInfos;
  }, [eligibility.dragKind, eligibility.draggedEntities, rows]);

  /**
   * Determine if a drop is valid and what type of drop it would be.
   */
  const getDropInfo = useCallback(
    (targetId: string): { valid: false } | { valid: true; dropType: DropType } => {
      const { dragId, dragLevel, draggedIds, draggedCategories } = dragState;

      if (!dragId || dragId === targetId) return { valid: false };
      if (draggedIds.includes(targetId)) return { valid: false };

      const targetRow = getRow(targetId);
      if (!targetRow || !dragLevel) return { valid: false };

      const targetKey =
        targetRow.level === "label"
          ? createKey("label", targetRow.id)
          : targetRow.level === "category" && targetRow.parentId
            ? createKey("category", targetRow.parentId, targetRow.id)
            : "";

      if (!targetKey) return { valid: false };

      const targetKind = targetRow.level;

      // Same kind - reorder among siblings
      if (targetKind === dragLevel) {
        if (dragLevel === "label") {
          return { valid: true, dropType: "reorder" };
        }

        if (dragLevel === "category") {
          const allFromSameParent = draggedCategories.every(
            (info) => info.fromLabelId === targetRow.parentId
          );
          return {
            valid: true,
            dropType: allFromSameParent ? "reorder" : "move-to-label",
          };
        }
      }

      // Different kind - check if target can receive this drag kind
      if (registry.canReceiveDrop(targetKey, dragLevel)) {
        if (targetKind === "label" && dragLevel === "category") {
          const allFromTargetLabel = draggedCategories.every(
            (info) => info.fromLabelId === targetRow.id
          );
          return allFromTargetLabel ? { valid: false } : { valid: true, dropType: "move-to-label" };
        }
        return { valid: true, dropType: "move-to-label" };
      }

      return { valid: false };
    },
    [dragState, getRow, registry]
  );

  const isValidDrop = useCallback((targetId: string): boolean => getDropInfo(targetId).valid, [getDropInfo]);

  /**
   * Handle drag start.
   * Only initiates if eligibility.canDrag is true.
   */
  const handleDragStart = useCallback(
    (row: FlatMenuRow, e?: React.DragEvent) => {
      // Only handle label and category levels
      if (row.level !== "label" && row.level !== "category") return;

      // Rule: No drag if not eligible
      if (!eligibility.canDrag) {
        if (e) {
          e.preventDefault();
          e.dataTransfer.effectAllowed = "none";
        }
        return;
      }

      // Rule: Can only drag items that are in the selection
      if (!eligibleEntityIds.has(row.id)) {
        if (e) {
          e.preventDefault();
          e.dataTransfer.effectAllowed = "none";
        }
        return;
      }

      // Build drag state from eligibility
      const draggedIds = eligibility.draggedEntities.map((ent) => ent.entityId);

      setDragState({
        ...INITIAL_DRAG_STATE,
        dragId: row.id,
        dragLevel: eligibility.dragKind as MenuLevel,
        dragParentId: row.parentId,
        isDraggingLabel: eligibility.dragKind === "label",
        draggedIds,
        draggedCategories: draggedCategoriesFromEligibility,
      });
    },
    [eligibility, eligibleEntityIds, draggedCategoriesFromEligibility]
  );

  /**
   * Get the label ID that "owns" a row's territory.
   */
  const getLabelOwner = useCallback((row: FlatMenuRow): string | null => {
    if (row.level === "label") return row.id;
    if (row.level === "category") return row.parentId;
    return null;
  }, []);

  // Core drag over logic
  const updateDragOver = useCallback(
    (targetId: string, clientY: number, rect: DOMRect) => {
      const targetRow = rowsById.get(targetId);
      if (!targetRow) return;

      // Collapse previous auto-expanded label if we've moved to a different territory
      const targetLabelOwner = getLabelOwner(targetRow);
      const currentAutoExpanded = autoExpandedLabelRef.current;

      if (currentAutoExpanded && currentAutoExpanded !== targetLabelOwner && onCollapseItem) {
        onCollapseItem(currentAutoExpanded);
        autoExpandedLabelRef.current = null;
      }

      // Clear pending expansion timer if we've moved to a different label
      if (pendingExpandLabelRef.current && pendingExpandLabelRef.current !== targetLabelOwner) {
        clearExpandTimer();
      }

      // Check if this is a collapsed label that could be expanded
      const isCollapsedExpandableLabel =
        targetRow.level === "label" &&
        targetRow.isExpandable &&
        !targetRow.isExpanded &&
        dragState.dragLevel === "category";

      // Start delayed expansion timer if hovering over a collapsed label
      if (isCollapsedExpandableLabel && onExpandItem) {
        // Only start timer if not already pending for this label
        if (pendingExpandLabelRef.current !== targetRow.id) {
          clearExpandTimer();
          pendingExpandLabelRef.current = targetRow.id;

          autoExpandTimerRef.current = setTimeout(() => {
            // Double-check the label is still collapsed (user might have expanded manually)
            const currentRow = rowsById.get(targetRow.id);
            if (currentRow && !currentRow.isExpanded) {
              autoExpandedLabelRef.current = targetRow.id;
              onExpandItem(targetRow.id);
              // Flash animation only when actually expanding
              setDragState((prev) => ({ ...prev, autoExpandedId: targetRow.id }));
            }
            pendingExpandLabelRef.current = null;
            autoExpandTimerRef.current = null;
          }, AUTO_EXPAND_DELAY_MS);
        }
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

      const midPoint = rect.top + rect.height / 2;
      const position = clientY < midPoint ? "before" : "after";

      setDragState((prev) => ({
        ...prev,
        dragOverId: targetId,
        dropPosition: position,
        dropType: dropInfo.dropType,
      }));
    },
    [rowsById, getDropInfo, getLabelOwner, onExpandItem, onCollapseItem, dragState.dragLevel, clearExpandTimer]
  );

  const throttledUpdateDragOver = useThrottledCallback(updateDragOver, DRAG_OVER_THROTTLE_MS);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      if (!dragState.dragId) return;
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      throttledUpdateDragOver(targetId, e.clientY, rect);
    },
    [dragState.dragId, throttledUpdateDragOver]
  );

  const handleDragLeave = useCallback(() => {}, []);

  /**
   * Execute a same-parent reorder operation.
   */
  const executeReorder = useCallback(
    async (
      level: MenuLevel,
      parentId: string | null,
      draggedIds: readonly string[],
      targetId: string,
      dropPosition: "before" | "after"
    ) => {
      const dragCount = draggedIds.length;

      if (level === "label") {
        const previousIds = labels.map((l) => l.id);
        const newIds = calculateMultiReorder(labels, draggedIds as string[], targetId, dropPosition);

        await reorderFunctions.reorderLabels(newIds);
        pushUndoAction({
          action: dragCount > 1 ? `reorder:${dragCount}-labels` : "reorder:labels",
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
        return;
      }

      if (parentId) {
        const categories =
          labels
            .find((l) => l.id === parentId)
            ?.categories.slice()
            .sort((a, b) => a.order - b.order) ?? [];
        const previousIds = categories.map((c) => c.id);
        const newIds = calculateMultiReorder(categories, draggedIds as string[], targetId, dropPosition);

        await reorderFunctions.reorderCategoriesInLabel(parentId, newIds);
        pushUndoAction({
          action: dragCount > 1 ? `reorder:${dragCount}-categories-in-label` : "reorder:categories-in-label",
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

  /**
   * Execute a batch cross-boundary category move (may also include same-label reorders).
   *
   * Handles mixed operations where some categories are from the target label (reorder)
   * and some are from other labels (cross-boundary move).
   *
   * Strategy:
   * 1. Separate categories into: already in target (reorder) vs from other labels (move)
   * 2. Move cross-boundary categories to target label
   * 3. Compute final order with ALL dragged categories at the target position
   * 4. Apply single reorder
   *
   * After successful moves, updates selection with new keys (since category keys
   * include parent label ID, they change when moving to a different label).
   */
  const executeBatchCrossBoundaryMove = useCallback(
    async (
      moves: readonly DraggedCategoryInfo[],
      toLabelId: string,
      targetCategoryId: string | null,
      dropPosition: "before" | "after"
    ) => {
      // Separate: categories to move (from other labels) vs categories to reorder (already in target)
      const crossBoundaryMoves = moves.filter((m) => m.fromLabelId !== toLabelId);
      const sameParentMoves = moves.filter((m) => m.fromLabelId === toLabelId);

      // All category IDs being dragged (in visual order from the sorted moves)
      const allDraggedIds = moves.map((m) => m.categoryId);

      if (crossBoundaryMoves.length === 0 && sameParentMoves.length === 0) return;

      const totalCount = moves.length;
      const crossBoundaryCount = crossBoundaryMoves.length;

      // Get the target label's current categories BEFORE any moves
      const targetLabel = labels.find((l) => l.id === toLabelId);
      const existingCategoryIds = targetLabel
        ? targetLabel.categories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((c) => c.id)
        : [];

      // Step 1: Move cross-boundary categories to target label (no positioning yet)
      for (const { categoryId, fromLabelId } of crossBoundaryMoves) {
        await reorderFunctions.moveCategoryToLabel(
          categoryId,
          fromLabelId,
          toLabelId,
          null, // No positioning yet
          "after"
        );
      }

      // Step 2: Compute the final order
      // - Remove all dragged categories from their current positions
      // - Insert all dragged categories (in visual order) at the target position
      const remainingIds = existingCategoryIds.filter((id) => !allDraggedIds.includes(id));

      let finalOrder: string[];
      if (targetCategoryId && !allDraggedIds.includes(targetCategoryId)) {
        // Target is not being dragged - insert relative to it
        const targetIndex = remainingIds.indexOf(targetCategoryId);
        if (targetIndex !== -1) {
          const insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
          finalOrder = [...remainingIds];
          finalOrder.splice(insertIndex, 0, ...allDraggedIds);
        } else {
          // Target not found in remaining, append to end
          finalOrder = [...remainingIds, ...allDraggedIds];
        }
      } else if (targetCategoryId && allDraggedIds.includes(targetCategoryId)) {
        // Target IS being dragged - use drop position relative to where target WAS
        const originalTargetIndex = existingCategoryIds.indexOf(targetCategoryId);
        if (originalTargetIndex !== -1) {
          // Count how many dragged items were before the target in original order
          const draggedBeforeTarget = allDraggedIds.filter((id) => {
            const idx = existingCategoryIds.indexOf(id);
            return idx !== -1 && idx < originalTargetIndex;
          }).length;
          // Adjust insert index based on how many dragged items were removed before target
          const adjustedIndex = originalTargetIndex - draggedBeforeTarget;
          const insertIndex = dropPosition === "before" ? adjustedIndex : adjustedIndex;
          finalOrder = [...remainingIds];
          finalOrder.splice(insertIndex, 0, ...allDraggedIds);
        } else {
          finalOrder = [...remainingIds, ...allDraggedIds];
        }
      } else {
        // No target specified, append to end
        finalOrder = [...remainingIds, ...allDraggedIds];
      }

      // Step 3: Apply the final order
      await reorderFunctions.reorderCategoriesInLabel(toLabelId, finalOrder);

      // Push undo action
      const actionName = crossBoundaryCount > 0
        ? (totalCount > 1 ? `move:${totalCount}-categories` : "move:category-to-label")
        : (totalCount > 1 ? `reorder:${totalCount}-categories` : "reorder:category");

      pushUndoAction({
        action: actionName,
        timestamp: new Date(),
        data: {
          undo: async () => {
            // Move cross-boundary categories back to their original labels
            for (const { categoryId, fromLabelId } of crossBoundaryMoves) {
              await reorderFunctions.moveCategoryToLabel(categoryId, toLabelId, fromLabelId, null, "after");
            }
            // Restore original order in target label
            await reorderFunctions.reorderCategoriesInLabel(toLabelId, existingCategoryIds);
          },
          redo: async () => {
            // Re-execute the batch move
            for (const { categoryId, fromLabelId } of crossBoundaryMoves) {
              await reorderFunctions.moveCategoryToLabel(categoryId, fromLabelId, toLabelId, null, "after");
            }
            await reorderFunctions.reorderCategoriesInLabel(toLabelId, finalOrder);
          },
        },
      });

      // Update selection with new keys for cross-boundary moves
      // (same-label categories keep their keys, cross-boundary ones get new keys)
      if (onSelectionUpdate && crossBoundaryMoves.length > 0) {
        const newKeys = moves.map((m) => createKey("category", toLabelId, m.categoryId));
        onSelectionUpdate(newKeys);
      }
    },
    [labels, reorderFunctions, pushUndoAction, onSelectionUpdate]
  );

  const handleDrop = useCallback(
    async (targetId: string) => {
      const { dragId, dragLevel, dragParentId, dropPosition, draggedIds, draggedCategories } = dragState;

      const dropInfo = getDropInfo(targetId);
      if (!dragId || !dragLevel || !dropInfo.valid) {
        clearDragState(false);
        return;
      }

      const targetRow = getRow(targetId);
      if (!targetRow) {
        clearDragState(false);
        return;
      }

      try {
        if (dropInfo.dropType === "move-to-label" && dragLevel === "category") {
          const targetLabelId = targetRow.level === "label" ? targetRow.id : targetRow.parentId;

          if (targetLabelId) {
            const targetCategoryId = targetRow.level === "category" ? targetRow.id : null;
            await executeBatchCrossBoundaryMove(draggedCategories, targetLabelId, targetCategoryId, dropPosition);
          }
        } else {
          await executeReorder(dragLevel, dragParentId, draggedIds, targetId, dropPosition);
        }
      } catch (error) {
        console.error("[useMenuTableDragReorder] Drop operation failed:", error);
      }

      // Pass true to indicate successful drop - don't collapse auto-expanded label
      clearDragState(true);
    },
    [dragState, getDropInfo, getRow, clearDragState, executeBatchCrossBoundaryMove, executeReorder]
  );

  const handleDragEnd = useCallback(() => {
    // Pass false to indicate drag ended without drop - collapse auto-expanded label
    clearDragState(false);
  }, [clearDragState]);

  const getDragHandlers = useCallback(
    (row: FlatMenuRow): HierarchicalDragHandlers => ({
      onDragStart: (e?: React.DragEvent) => handleDragStart(row, e),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, row.id),
      onDragLeave: handleDragLeave,
      onDrop: () => handleDrop(row.id),
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]
  );

  const getDragClasses = useCallback(
    (row: FlatMenuRow) => {
      const { dragId, draggedIds, dragOverId, dropPosition, dropType, autoExpandedId } = dragState;

      const isDragging = dragId === row.id;
      const isInDragSet = checkIsInDragSet(row.id, draggedIds);
      const isDragOver = dragOverId === row.id && isValidDrop(row.id);
      const isAutoExpanded = autoExpandedId === row.id;

      return {
        isDragging,
        isInDragSet,
        isDragOver,
        dropPosition: isDragOver ? dropPosition : null,
        dropType: isDragOver ? dropType : null,
        isAutoExpanded,
      };
    },
    [dragState, isValidDrop]
  );

  return {
    dragState: {
      ...dragState,
      isMultiDrag: dragState.draggedIds.length > 1,
      dragCount: dragState.draggedIds.length,
    },
    getDragHandlers,
    getDragClasses,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuLabel } from "../../types/menu";
import type { FlatMenuRow } from "../../menu-builder/components/table-views/MenuTableView.types";
import type { IdentityRegistry } from "../../types/identity-registry";
import { createKey } from "../../types/identity-registry";
import { calculateMultiReorder, isInDragSet as checkIsInDragSet } from "./multiSelectValidation";
import { useThrottledCallback } from "./useThrottledCallback";
import type { DnDEligibility, DraggedEntity } from "./useDnDEligibility";

/** Throttle delay for dragOver events (ms) */
const DRAG_OVER_THROTTLE_MS = 50;

/** Delay before auto-expanding a collapsed parent on drag hover (ms) */
const AUTO_EXPAND_DELAY_MS = 500;

type ReorderResult = { ok: boolean; error?: string };

/** Info about a child entity being dragged (for batch moves) */
export type DraggedChildInfo = {
  childId: string;
  fromParentId: string;
};

/**
 * Reorder functions for the 2-level hierarchy.
 */
export type MultiEntityReorderFunctions = {
  reorderLabels: (ids: string[]) => Promise<ReorderResult>;
  reorderCategoriesInLabel: (labelId: string, ids: string[]) => Promise<ReorderResult>;
  /** Move a category from one label to another (cross-boundary) */
  moveCategoryToLabel: (
    categoryId: string,
    fromLabelId: string,
    toLabelId: string,
    targetCategoryId: string | null,
    dropPosition: "before" | "after"
  ) => Promise<ReorderResult>;
};

export type UseMultiEntityDndOptions = {
  rows: FlatMenuRow[];
  labels: MenuLabel[];
  reorderFunctions: MultiEntityReorderFunctions;
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
   * Called with the new keys after children move to a different parent.
   */
  onSelectionUpdate?: (newKeys: string[]) => void;
};

export type MultiEntityDragHandlers = {
  onDragStart: (e?: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

export type DropType = "reorder" | "move-to-label";

/** The two levels in the hierarchy */
export type EntityLevel = "label" | "category";

export type MultiEntityDragState = {
  dragId: string | null;
  dragLevel: EntityLevel | null;
  dragParentId: string | null;
  dragOverId: string | null;
  dropPosition: "before" | "after";
  dropType: DropType;
  autoExpandedId: string | null;
  isDraggingLabel: boolean;
  isDraggingCategory: boolean;
  draggedIds: readonly string[];
  draggedChildren: readonly DraggedChildInfo[];
};

export type MultiEntityDragClasses = {
  isDragging: boolean;
  isInDragSet: boolean;
  isDragOver: boolean;
  dropPosition: "before" | "after" | null;
  dropType: DropType | null;
  isAutoExpanded: boolean;
};

export type UseMultiEntityDndReturn = {
  dragState: MultiEntityDragState & {
    isMultiDrag: boolean;
    dragCount: number;
  };
  getDragHandlers: (row: FlatMenuRow) => MultiEntityDragHandlers;
  getDragClasses: (row: FlatMenuRow) => MultiEntityDragClasses;
  eligibleEntityIds: Set<string>;
};

const INITIAL_DRAG_STATE: MultiEntityDragState = {
  dragId: null,
  dragLevel: null,
  dragParentId: null,
  dragOverId: null,
  dropPosition: "before",
  dropType: "reorder",
  autoExpandedId: null,
  isDraggingLabel: false,
  isDraggingCategory: false,
  draggedIds: [],
  draggedChildren: [],
};

/**
 * Extract parent ID from a dragged entity.
 */
function extractParentId(entity: DraggedEntity): string | null {
  if (!entity.parentKey) return null;
  const colonIndex = entity.parentKey.indexOf(":");
  return colonIndex > -1 ? entity.parentKey.slice(colonIndex + 1) : entity.parentKey;
}

/**
 * DnD hook for multi-entity (hierarchical) table views.
 *
 * Use this for tables that display hierarchical data with parent-child relationships:
 * - MenuTableView (labels → categories)
 *
 * Features:
 * - Same-level reordering (parents among parents, children within same parent)
 * - Cross-boundary moves (children between different parents)
 * - Multi-select drag support
 * - Auto-expand collapsed parents on drag hover (500ms delay)
 * - Auto-collapse on drag end without drop
 * - Undo/redo support
 * - Selection key updates after cross-boundary moves
 *
 * For flat tables without hierarchy, use useSingleEntityDnd instead.
 */
export function useMultiEntityDnd({
  rows,
  labels,
  reorderFunctions,
  pushUndoAction,
  onExpandItem,
  onCollapseItem,
  eligibility,
  registry,
  onSelectionUpdate,
}: UseMultiEntityDndOptions): UseMultiEntityDndReturn {
  const [dragState, setDragState] = useState<MultiEntityDragState>(INITIAL_DRAG_STATE);

  // Track the currently auto-expanded parent ID
  const autoExpandedParentRef = useRef<string | null>(null);

  // Timer for delayed auto-expansion
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which parent the expansion timer is for
  const pendingExpandParentRef = useRef<string | null>(null);

  // Track drag level in a ref for stable access in callbacks (avoids stale closure)
  const dragLevelRef = useRef<EntityLevel | null>(null);

  // Track if a drop is in progress (prevents dragEnd from collapsing during async drop)
  const dropInProgressRef = useRef<boolean>(false);

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
    pendingExpandParentRef.current = null;
  }, []);

  // Helper to clear drag state and collapse auto-expanded parents
  // Note: Does NOT reset dropInProgressRef - that's managed by handleDrop/handleDragEnd
  const clearDragState = useCallback(
    (wasDropped: boolean = false) => {
      clearExpandTimer();

      // Collapse auto-expanded parent if drag ended without a drop
      if (!wasDropped && autoExpandedParentRef.current && onCollapseItem) {
        onCollapseItem(autoExpandedParentRef.current);
      }

      autoExpandedParentRef.current = null;
      dragLevelRef.current = null;
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

  // Build dragged children info from eligibility, sorted by visual order
  const draggedChildrenFromEligibility = useMemo((): DraggedChildInfo[] => {
    if (eligibility.dragKind !== "category") return [];

    const childInfos = eligibility.draggedEntities
      .filter((e) => e.parentKey !== null)
      .map((e) => ({
        childId: e.entityId,
        fromParentId: extractParentId(e)!,
      }));

    // Sort by visual order (position in rows array)
    const rowIndexMap = new Map(rows.map((r, i) => [r.id, i]));
    childInfos.sort((a, b) => {
      const indexA = rowIndexMap.get(a.childId) ?? Infinity;
      const indexB = rowIndexMap.get(b.childId) ?? Infinity;
      return indexA - indexB;
    });

    return childInfos;
  }, [eligibility.dragKind, eligibility.draggedEntities, rows]);

  /**
   * Determine if a drop is valid and what type of drop it would be.
   */
  const getDropInfo = useCallback(
    (targetId: string): { valid: false } | { valid: true; dropType: DropType } => {
      const { dragId, dragLevel, draggedIds, draggedChildren } = dragState;

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
          const allFromSameParent = draggedChildren.every(
            (info) => info.fromParentId === targetRow.parentId
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
          const allFromTargetParent = draggedChildren.every(
            (info) => info.fromParentId === targetRow.id
          );
          return allFromTargetParent ? { valid: false } : { valid: true, dropType: "move-to-label" };
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
   */
  const handleDragStart = useCallback(
    (row: FlatMenuRow, e?: React.DragEvent) => {
      if (row.level !== "label" && row.level !== "category") return;

      if (!eligibility.canDrag || !eligibility.hasValidTargets) {
        if (e) {
          e.preventDefault();
          e.dataTransfer.effectAllowed = "none";
        }
        return;
      }

      if (!eligibleEntityIds.has(row.id)) {
        if (e) {
          e.preventDefault();
          e.dataTransfer.effectAllowed = "none";
        }
        return;
      }

      const draggedIds = eligibility.draggedEntities.map((ent) => ent.entityId);
      const dragLevel = eligibility.dragKind as EntityLevel;

      dragLevelRef.current = dragLevel;

      setDragState({
        ...INITIAL_DRAG_STATE,
        dragId: row.id,
        dragLevel,
        dragParentId: row.parentId,
        isDraggingLabel: eligibility.dragKind === "label",
        isDraggingCategory: eligibility.dragKind === "category",
        draggedIds,
        draggedChildren: draggedChildrenFromEligibility,
      });
    },
    [eligibility, eligibleEntityIds, draggedChildrenFromEligibility]
  );

  /**
   * Get the parent ID that "owns" a row's territory.
   */
  const getParentOwner = useCallback((row: FlatMenuRow): string | null => {
    if (row.level === "label") return row.id;
    if (row.level === "category") return row.parentId;
    return null;
  }, []);

  // Core drag over logic
  const updateDragOver = useCallback(
    (targetId: string, clientY: number, rect: DOMRect) => {
      const targetRow = rowsById.get(targetId);
      if (!targetRow) return;

      const targetParentOwner = getParentOwner(targetRow);
      const currentAutoExpanded = autoExpandedParentRef.current;

      // Collapse previous auto-expanded parent if moved to different territory
      if (currentAutoExpanded && currentAutoExpanded !== targetParentOwner && onCollapseItem) {
        onCollapseItem(currentAutoExpanded);
        autoExpandedParentRef.current = null;
      }

      // Clear pending expansion timer if moved to different parent
      if (pendingExpandParentRef.current && pendingExpandParentRef.current !== targetParentOwner) {
        clearExpandTimer();
      }

      // Check if this is a collapsed parent that could be expanded
      const isCollapsedExpandableParent =
        targetRow.level === "label" &&
        targetRow.isExpandable &&
        !targetRow.isExpanded &&
        dragLevelRef.current === "category";

      // Start delayed expansion timer if hovering over a collapsed parent
      if (isCollapsedExpandableParent && onExpandItem) {
        if (pendingExpandParentRef.current !== targetRow.id) {
          clearExpandTimer();
          pendingExpandParentRef.current = targetRow.id;

          autoExpandTimerRef.current = setTimeout(() => {
            const currentRow = rowsById.get(targetRow.id);
            if (currentRow && !currentRow.isExpanded) {
              autoExpandedParentRef.current = targetRow.id;
              onExpandItem(targetRow.id);
              setDragState((prev) => ({ ...prev, autoExpandedId: targetRow.id }));
            }
            pendingExpandParentRef.current = null;
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
    [rowsById, getDropInfo, getParentOwner, onExpandItem, onCollapseItem, clearExpandTimer]
  );

  const { throttled: throttledUpdateDragOver } = useThrottledCallback(updateDragOver, DRAG_OVER_THROTTLE_MS);

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
      level: EntityLevel,
      parentId: string | null,
      draggedIds: readonly string[],
      targetId: string,
      dropPosition: "before" | "after"
    ) => {
      const dragCount = draggedIds.length;

      if (level === "label") {
        const previousIds = labels.map((p) => p.id);
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
        const children =
          labels
            .find((p) => p.id === parentId)
            ?.categories.slice()
            .sort((a, b) => a.order - b.order) ?? [];
        const previousIds = children.map((c) => c.id);
        const newIds = calculateMultiReorder(children, draggedIds as string[], targetId, dropPosition);

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
   * Execute a batch cross-boundary move.
   */
  const executeBatchCrossBoundaryMove = useCallback(
    async (
      moves: readonly DraggedChildInfo[],
      toLabelId: string,
      targetCategoryId: string | null,
      dropPosition: "before" | "after"
    ) => {
      const crossBoundaryMoves = moves.filter((m) => m.fromParentId !== toLabelId);
      const allDraggedIds = moves.map((m) => m.childId);

      if (crossBoundaryMoves.length === 0 && moves.length === 0) return;

      const totalCount = moves.length;
      const crossBoundaryCount = crossBoundaryMoves.length;

      const targetLabel = labels.find((p) => p.id === toLabelId);
      const existingCategoryIds = targetLabel
        ? targetLabel.categories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((c) => c.id)
        : [];

      // Move cross-boundary categories first
      for (const { childId, fromParentId } of crossBoundaryMoves) {
        await reorderFunctions.moveCategoryToLabel(
          childId,
          fromParentId,
          toLabelId,
          null,
          "after"
        );
      }

      // Compute final order
      const remainingIds = existingCategoryIds.filter((id) => !allDraggedIds.includes(id));

      let finalOrder: string[];
      if (targetCategoryId && !allDraggedIds.includes(targetCategoryId)) {
        const targetIndex = remainingIds.indexOf(targetCategoryId);
        if (targetIndex !== -1) {
          const insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
          finalOrder = [...remainingIds];
          finalOrder.splice(insertIndex, 0, ...allDraggedIds);
        } else {
          finalOrder = [...remainingIds, ...allDraggedIds];
        }
      } else if (targetCategoryId && allDraggedIds.includes(targetCategoryId)) {
        const originalTargetIndex = existingCategoryIds.indexOf(targetCategoryId);
        if (originalTargetIndex !== -1) {
          const draggedBeforeTarget = allDraggedIds.filter((id) => {
            const idx = existingCategoryIds.indexOf(id);
            return idx !== -1 && idx < originalTargetIndex;
          }).length;
          const adjustedIndex = originalTargetIndex - draggedBeforeTarget;
          finalOrder = [...remainingIds];
          finalOrder.splice(adjustedIndex, 0, ...allDraggedIds);
        } else {
          finalOrder = [...remainingIds, ...allDraggedIds];
        }
      } else {
        finalOrder = [...remainingIds, ...allDraggedIds];
      }

      await reorderFunctions.reorderCategoriesInLabel(toLabelId, finalOrder);

      const actionName = crossBoundaryCount > 0
        ? (totalCount > 1 ? `move:${totalCount}-categories` : "move:category-to-label")
        : (totalCount > 1 ? `reorder:${totalCount}-categories` : "reorder:category");

      pushUndoAction({
        action: actionName,
        timestamp: new Date(),
        data: {
          undo: async () => {
            for (const { childId, fromParentId } of crossBoundaryMoves) {
              await reorderFunctions.moveCategoryToLabel(childId, toLabelId, fromParentId, null, "after");
            }
            await reorderFunctions.reorderCategoriesInLabel(toLabelId, existingCategoryIds);
          },
          redo: async () => {
            for (const { childId, fromParentId } of crossBoundaryMoves) {
              await reorderFunctions.moveCategoryToLabel(childId, fromParentId, toLabelId, null, "after");
            }
            await reorderFunctions.reorderCategoriesInLabel(toLabelId, finalOrder);
          },
        },
      });

      if (onSelectionUpdate && crossBoundaryMoves.length > 0) {
        const newKeys = moves.map((m) => createKey("category", toLabelId, m.childId));
        onSelectionUpdate(newKeys);
      }
    },
    [labels, reorderFunctions, pushUndoAction, onSelectionUpdate]
  );

  const handleDrop = useCallback(
    async (targetId: string) => {
      const { dragId, dragLevel, dragParentId, dropPosition, draggedIds, draggedChildren } = dragState;

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

      dropInProgressRef.current = true;

      try {
        if (dropInfo.dropType === "move-to-label" && dragLevel === "category") {
          const targetLabelId = targetRow.level === "label" ? targetRow.id : targetRow.parentId;

          if (targetLabelId) {
            const targetCategoryId = targetRow.level === "category" ? targetRow.id : null;
            await executeBatchCrossBoundaryMove(draggedChildren, targetLabelId, targetCategoryId, dropPosition);

            // Expand target label after successful cross-boundary move
            // This ensures the moved category is visible, especially for empty labels
            const targetLabel = rowsById.get(targetLabelId);
            if (targetLabel && !targetLabel.isExpanded && onExpandItem) {
              onExpandItem(targetLabelId);
            }
          }
        } else {
          await executeReorder(dragLevel, dragParentId, draggedIds, targetId, dropPosition);
        }
      } catch (error) {
        console.error("[useMultiEntityDnd] Drop operation failed:", error);
      }

      clearDragState(true);
      dropInProgressRef.current = false;
    },
    [dragState, getDropInfo, getRow, clearDragState, executeBatchCrossBoundaryMove, executeReorder, rowsById, onExpandItem]
  );

  const handleDragEnd = useCallback(() => {
    if (dropInProgressRef.current) {
      return;
    }
    clearDragState(false);
  }, [clearDragState]);

  const getDragHandlers = useCallback(
    (row: FlatMenuRow): MultiEntityDragHandlers => ({
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
    eligibleEntityIds,
  };
}

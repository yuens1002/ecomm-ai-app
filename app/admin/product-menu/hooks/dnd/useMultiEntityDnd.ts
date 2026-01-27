"use client";
"use no memo";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlatMenuRow } from "../../menu-builder/components/table-views/MenuTableView.types";
import type { IdentityRegistry } from "../../types/identity-registry";
import { createKey } from "../../types/identity-registry";
import type { MenuLabel } from "../../types/menu";
import { calculateMultiReorder } from "./multiSelectValidation";
import type { DnDEligibility, DraggedEntity } from "./useDnDEligibility";
import { useGroupedReorder } from "./useGroupedReorder";

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

/** Entity kinds that support DnD in the hierarchy */
export type EntityKind = "label" | "category";

export type MultiEntityDragState = {
  dragId: string | null;
  dragKind: EntityKind | null;
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
  /** Get isDraggable state for cursor styling (true=can drag, false=can't drag) */
  getIsDraggable: (entityId: string) => boolean;
  eligibleEntityIds: Set<string>;
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
 * Built on useGroupedReorder for core drag state management, adding:
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
  // UI-specific state that changes during drag (drop type and auto-expand feedback)
  const [uiState, setUiState] = useState<{
    dropType: DropType;
    autoExpandedId: string | null;
  }>({
    dropType: "reorder",
    autoExpandedId: null,
  });

  // Track the currently auto-expanded parent ID
  const autoExpandedParentRef = useRef<string | null>(null);

  // Timer for delayed auto-expansion
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which parent the expansion timer is for
  const pendingExpandParentRef = useRef<string | null>(null);

  // Clear auto-expanded animation state after a delay
  useEffect(() => {
    if (uiState.autoExpandedId) {
      const timer = setTimeout(() => {
        setUiState((prev) => ({ ...prev, autoExpandedId: null }));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [uiState.autoExpandedId]);

  // Helper to clear any pending expansion timer
  const clearExpandTimer = useCallback(() => {
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
    pendingExpandParentRef.current = null;
  }, []);

  // Memoize rows lookup for O(1) access
  const rowsById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const getRow = useCallback((id: string): FlatMenuRow | undefined => rowsById.get(id), [rowsById]);

  // Derive drag kind directly from eligibility (source of truth)
  const dragKind = useMemo((): EntityKind | null => {
    const kind = eligibility.dragKind;
    return kind === "label" || kind === "category" ? kind : null;
  }, [eligibility.dragKind]);

  // Derive drag parent ID from first dragged entity's parent key
  const dragParentId = useMemo((): string | null => {
    if (!eligibility.draggedEntities.length) return null;
    const firstEntity = eligibility.draggedEntities[0];
    return extractParentId(firstEntity);
  }, [eligibility.draggedEntities]);

  // Build dragged children info from eligibility, sorted by visual order
  const draggedChildren = useMemo((): DraggedChildInfo[] => {
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
   * Get the parent ID that "owns" a row's territory.
   */
  const getParentOwner = useCallback((row: FlatMenuRow): string | null => {
    if (row.kind === "label") return row.id;
    if (row.kind === "category") return row.parentId;
    return null;
  }, []);

  /**
   * Determine if a drop is valid and what type of drop it would be.
   */
  const getDropInfo = useCallback(
    (
      targetId: string,
      dragKind: EntityKind | null,
      draggedIds: readonly string[],
      draggedChildren: readonly DraggedChildInfo[]
    ): { valid: false } | { valid: true; dropType: DropType } => {
      if (!dragKind) return { valid: false };
      if (draggedIds.includes(targetId)) return { valid: false };

      const targetRow = getRow(targetId);
      if (!targetRow) return { valid: false };

      const targetKey =
        targetRow.kind === "label"
          ? createKey("label", targetRow.id)
          : targetRow.kind === "category" && targetRow.parentId
            ? createKey("category", targetRow.parentId, targetRow.id)
            : "";

      if (!targetKey) return { valid: false };

      const targetKind = targetRow.kind;

      // Same kind - reorder among siblings
      if (targetKind === dragKind) {
        if (dragKind === "label") {
          return { valid: true, dropType: "reorder" };
        }

        if (dragKind === "category") {
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
      if (registry.canReceiveDrop(targetKey, dragKind)) {
        if (targetKind === "label" && dragKind === "category") {
          const allFromTargetParent = draggedChildren.every(
            (info) => info.fromParentId === targetRow.id
          );
          return allFromTargetParent
            ? { valid: false }
            : { valid: true, dropType: "move-to-label" };
        }
        return { valid: true, dropType: "move-to-label" };
      }

      return { valid: false };
    },
    [getRow, registry]
  );

  /**
   * Execute a same-parent reorder operation.
   */
  const executeReorder = useCallback(
    async (
      kind: EntityKind,
      parentId: string | null,
      draggedIds: readonly string[],
      targetId: string,
      dropPosition: "before" | "after"
    ) => {
      const dragCount = draggedIds.length;

      if (kind === "label") {
        const previousIds = labels.map((p) => p.id);
        const newIds = calculateMultiReorder(
          labels,
          draggedIds as string[],
          targetId,
          dropPosition
        );

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
        const newIds = calculateMultiReorder(
          children,
          draggedIds as string[],
          targetId,
          dropPosition
        );

        await reorderFunctions.reorderCategoriesInLabel(parentId, newIds);
        pushUndoAction({
          action:
            dragCount > 1
              ? `reorder:${dragCount}-categories-in-label`
              : "reorder:categories-in-label",
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
        await reorderFunctions.moveCategoryToLabel(childId, fromParentId, toLabelId, null, "after");
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

      const actionName =
        crossBoundaryCount > 0
          ? totalCount > 1
            ? `move:${totalCount}-categories`
            : "move:category-to-label"
          : totalCount > 1
            ? `reorder:${totalCount}-categories`
            : "reorder:category";

      pushUndoAction({
        action: actionName,
        timestamp: new Date(),
        data: {
          undo: async () => {
            for (const { childId, fromParentId } of crossBoundaryMoves) {
              await reorderFunctions.moveCategoryToLabel(
                childId,
                toLabelId,
                fromParentId,
                null,
                "after"
              );
            }
            await reorderFunctions.reorderCategoriesInLabel(toLabelId, existingCategoryIds);
          },
          redo: async () => {
            for (const { childId, fromParentId } of crossBoundaryMoves) {
              await reorderFunctions.moveCategoryToLabel(
                childId,
                fromParentId,
                toLabelId,
                null,
                "after"
              );
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

  // Handle dragOver - auto-expand logic and drop type detection
  const handleDragOverCallback = useCallback(
    (targetId: string, _dropPosition: "before" | "after", _e: React.DragEvent): boolean | void => {
      const targetRow = rowsById.get(targetId);
      if (!targetRow) return false;

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
        targetRow.kind === "label" &&
        targetRow.isExpandable &&
        !targetRow.isExpanded &&
        dragKind === "category";

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
              setUiState((prev) => ({ ...prev, autoExpandedId: targetRow.id }));
            }
            pendingExpandParentRef.current = null;
            autoExpandTimerRef.current = null;
          }, AUTO_EXPAND_DELAY_MS);
        }
      }

      // Get dragged IDs from eligibility (source of truth)
      const draggedEntityIds = eligibility.draggedEntities.map((e) => e.entityId);

      // Check drop validity and update drop type
      const dropInfo = getDropInfo(
        targetId,
        dragKind,
        draggedEntityIds,
        draggedChildren
      );

      if (!dropInfo.valid) {
        setUiState((prev) => ({ ...prev, dropType: "reorder" }));
        return false; // Tell useGroupedReorder to not show drop indicator
      }

      setUiState((prev) => ({ ...prev, dropType: dropInfo.dropType }));
      return true; // Allow drop indicator
    },
    [
      rowsById,
      getParentOwner,
      onCollapseItem,
      onExpandItem,
      clearExpandTimer,
      dragKind,
      draggedChildren,
      getDropInfo,
      eligibility.draggedEntities,
    ]
  );

  // Handle drop - hierarchical logic
  const handleDrop = useCallback(
    async (targetId: string, dropPosition: "before" | "after", draggedIds: readonly string[]) => {
      const dropInfo = getDropInfo(targetId, dragKind, draggedIds, draggedChildren);
      if (!dragKind || !dropInfo.valid) {
        return;
      }

      const targetRow = getRow(targetId);
      if (!targetRow) {
        return;
      }

      try {
        if (dropInfo.dropType === "move-to-label" && dragKind === "category") {
          const targetLabelId = targetRow.kind === "label" ? targetRow.id : targetRow.parentId;

          if (targetLabelId) {
            const targetCategoryId = targetRow.kind === "category" ? targetRow.id : null;
            await executeBatchCrossBoundaryMove(
              draggedChildren,
              targetLabelId,
              targetCategoryId,
              dropPosition
            );

            // Expand target label after successful cross-boundary move
            // This ensures the moved category is visible, especially for empty labels
            const targetLabel = rowsById.get(targetLabelId);
            if (targetLabel && !targetLabel.isExpanded && onExpandItem) {
              onExpandItem(targetLabelId);
            }
          }
        } else {
          await executeReorder(dragKind, dragParentId, draggedIds, targetId, dropPosition);
        }
      } catch (error) {
        console.error("[useMultiEntityDnd] Drop operation failed:", error);
      }
    },
    [
      dragKind,
      dragParentId,
      draggedChildren,
      getDropInfo,
      getRow,
      executeBatchCrossBoundaryMove,
      executeReorder,
      rowsById,
      onExpandItem,
    ]
  );

  // Handle drop complete - clear UI state
  const handleDropComplete = useCallback(() => {
    clearExpandTimer();
    autoExpandedParentRef.current = null;
    setUiState({
      dropType: "reorder",
      autoExpandedId: null,
    });
  }, [clearExpandTimer]);

  // Use core grouped reorder hook
  const coreReorder = useGroupedReorder({
    eligibility,
    onDrop: handleDrop,
    onDropComplete: handleDropComplete,
    onDragOver: handleDragOverCallback,
  });

  // Track previous drag ID to detect drag end
  const prevDragIdRef = useRef<string | null>(null);

  // Handle drag end cleanup (collapse auto-expanded parent)
  useEffect(() => {
    const currentDragId = coreReorder.dragState.dragId;
    const prevDragId = prevDragIdRef.current;

    // Drag just ended (was dragging, now not) - reset UI state
    if (prevDragId && !currentDragId) {
      if (autoExpandedParentRef.current && onCollapseItem) {
        onCollapseItem(autoExpandedParentRef.current);
      }
      clearExpandTimer();
      autoExpandedParentRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional cleanup on drag end
      setUiState({ dropType: "reorder", autoExpandedId: null });
    }

    prevDragIdRef.current = currentDragId;
  }, [coreReorder.dragState.dragId, onCollapseItem, clearExpandTimer]);

  // Wrap getDragHandlers to use row-based API
  const getDragHandlers = useCallback(
    (row: FlatMenuRow): MultiEntityDragHandlers => {
      const baseHandlers = coreReorder.getDragHandlers(row.id);
      return {
        // Wrap to handle optional event parameter
        onDragStart: (e?: React.DragEvent) => {
          if (e) baseHandlers.onDragStart(e);
        },
        onDragOver: baseHandlers.onDragOver,
        onDragLeave: baseHandlers.onDragLeave,
        onDrop: baseHandlers.onDrop,
        onDragEnd: baseHandlers.onDragEnd,
      };
    },
    [coreReorder]
  );

  // Wrap getDragClasses to add hierarchy-specific classes
  const getDragClasses = useCallback(
    (row: FlatMenuRow): MultiEntityDragClasses => {
      const baseClasses = coreReorder.getDragClasses(row.id);

      // Check if this is a valid drop target for drop type
      const dropInfo = getDropInfo(
        row.id,
        dragKind,
        coreReorder.dragState.draggedIds,
        draggedChildren
      );

      return {
        isDragging: baseClasses.isDragging,
        isInDragSet: baseClasses.isInDragSet,
        isDragOver: baseClasses.isDragOver && dropInfo.valid,
        dropPosition: baseClasses.isDragOver && dropInfo.valid ? baseClasses.dropPosition : null,
        dropType: baseClasses.isDragOver && dropInfo.valid ? uiState.dropType : null,
        isAutoExpanded: uiState.autoExpandedId === row.id,
      };
    },
    [coreReorder, dragKind, draggedChildren, uiState, getDropInfo]
  );

  // Combined drag state for consumers
  const combinedDragState: MultiEntityDragState = {
    dragId: coreReorder.dragState.dragId,
    dragKind,
    dragParentId,
    dragOverId: coreReorder.dragState.dragOverId,
    dropPosition: coreReorder.dragState.dropPosition,
    dropType: uiState.dropType,
    autoExpandedId: uiState.autoExpandedId,
    isDraggingLabel: coreReorder.dragState.dragId !== null && dragKind === "label",
    isDraggingCategory: coreReorder.dragState.dragId !== null && dragKind === "category",
    draggedIds: coreReorder.dragState.draggedIds,
    draggedChildren,
  };

  return {
    dragState: {
      ...combinedDragState,
      isMultiDrag: coreReorder.dragState.draggedIds.length > 1,
      dragCount: coreReorder.dragState.draggedIds.length,
    },
    getDragHandlers,
    getDragClasses,
    getIsDraggable: coreReorder.getIsDraggable,
    eligibleEntityIds: coreReorder.eligibleEntityIds,
  };
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ALL_VIEWS, type HistoryEntry, type SelectedEntityKind, type ViewType } from "../types/builder-state";
import { getActionableKind } from "../types/identity-registry";

type ActiveRow = {
  kind: SelectedEntityKind;
  id: string;
};

/**
 * Menu Builder UI State Hook
 *
 * Provides ONLY UI-specific state for the menu builder:
 * - Navigation state (URL-backed)
 * - Selection state (local)
 * - Expand/collapse state (local)
 *
 * Does NOT handle data fetching - that's in ProductMenuProvider
 */
export function useMenuBuilderState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ==================== NAVIGATION STATE (URL-BACKED) ====================
  // Persists across refresh via URL params
  const viewParam = searchParams.get("view");
  const currentView: ViewType = ALL_VIEWS.includes(viewParam as ViewType) ? (viewParam as ViewType) : "menu";
  const currentLabelId = searchParams.get("labelId") || undefined;
  const currentCategoryId = searchParams.get("categoryId") || undefined;

  // ==================== SELECTION STATE (LOCAL) ====================
  // Intentionally cleared on refresh
  const [selection, setSelection] = useState<{
    ids: string[];
    kind: SelectedEntityKind | null;
  }>({ ids: [], kind: null });

  // ==================== EXPAND/COLLAPSE STATE (LOCAL) ====================
  // Intentionally cleared on refresh
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ==================== ROW UI STATE (LOCAL) ====================
  // Intentionally cleared on refresh
  const [editingRow, setEditingRow] = useState<ActiveRow | null>(null);
  const [pinnedNewRow, setPinnedNewRow] = useState<ActiveRow | null>(null);

  // ==================== UNDO/REDO STATE (LOCAL) ====================
  // View-specific stacks (max 10 operations per view)
  const [undoStacks, setUndoStacks] = useState<Record<ViewType, HistoryEntry[]>>({
    menu: [],
    label: [],
    category: [],
    "all-labels": [],
    "all-categories": [],
  });
  const [redoStacks, setRedoStacks] = useState<Record<ViewType, HistoryEntry[]>>({
    menu: [],
    label: [],
    category: [],
    "all-labels": [],
    "all-categories": [],
  });

  // Get current view's stacks
  const undoStack = useMemo(() => undoStacks[currentView] || [], [undoStacks, currentView]);
  const redoStack = useMemo(() => redoStacks[currentView] || [], [redoStacks, currentView]);

  // ==================== NAVIGATION ACTIONS ====================
  const navigateToView = useCallback(
    (view: ViewType) => {
      router.push(`/admin/product-menu?view=${view}`);
      setSelection({ ids: [], kind: null }); // Clear selections on navigation
      setEditingRow(null);
      setPinnedNewRow(null);
    },
    [router]
  );

  const navigateToLabel = useCallback(
    (labelId: string) => {
      const params = new URLSearchParams();
      params.set("view", "label");
      params.set("labelId", labelId);
      router.push(`/admin/product-menu?${params}`);
      setSelection({ ids: [], kind: null });
      setEditingRow(null);
      setPinnedNewRow(null);
    },
    [router]
  );

  const navigateToCategory = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams();
      params.set("view", "category");
      params.set("categoryId", categoryId);
      router.push(`/admin/product-menu?${params}`);
      setSelection({ ids: [], kind: null });
      setEditingRow(null);
      setPinnedNewRow(null);
    },
    [router]
  );

  const navigateBack = useCallback(() => {
    if (currentView === "category" && currentLabelId) {
      navigateToLabel(currentLabelId);
    } else if (currentView === "label") {
      navigateToView("menu");
    }
  }, [currentView, currentLabelId, navigateToLabel, navigateToView]);

  // ==================== SELECTION ACTIONS ====================
  // Note: Kind is now derived from prefixed keys, so we allow mixed kinds
  // and let the action bar handle disabling actions when mixed.
  const toggleSelection = useCallback((id: string) => {
    setSelection((prev) => {
      const isRemoving = prev.ids.includes(id);
      const nextIds = isRemoving ? prev.ids.filter((i) => i !== id) : [...prev.ids, id];
      return { ids: nextIds, kind: null }; // Kind derived from keys, not stored
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelection({ ids, kind: null }); // Kind derived from keys, not stored
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({ ids: [], kind: null });
  }, []);

  const setEditing = useCallback((next: ActiveRow | null) => {
    setEditingRow(next);
  }, []);

  const setPinnedNew = useCallback((next: ActiveRow | null) => {
    setPinnedNewRow(next);
  }, []);

  // ==================== EXPAND/COLLAPSE ACTIONS ====================
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // ==================== UNDO/REDO ACTIONS ====================
  const pushUndoAction = useCallback(
    (action: HistoryEntry) => {
      setUndoStacks((prev) => {
        const viewStack = prev[currentView] || [];
        const newStack = [...viewStack, action].slice(-10); // Keep last 10
        return { ...prev, [currentView]: newStack };
      });
      // Clear redo stack when new action is pushed
      setRedoStacks((prev) => ({ ...prev, [currentView]: [] }));
    },
    [currentView]
  );

  const undo = useCallback(async () => {
    const action = undoStack[undoStack.length - 1];
    if (!action || typeof action.data !== "object" || !action.data) return;

    const undoable = action.data as { undo?: () => Promise<void> };
    if (undoable.undo) {
      await undoable.undo();

      // Move action from undo to redo stack
      setUndoStacks((prev) => {
        const viewStack = prev[currentView] || [];
        return { ...prev, [currentView]: viewStack.slice(0, -1) };
      });
      setRedoStacks((prev) => {
        const viewStack = prev[currentView] || [];
        return { ...prev, [currentView]: [...viewStack, action] };
      });
    }
  }, [undoStack, currentView]);

  const redo = useCallback(async () => {
    const action = redoStack[redoStack.length - 1];
    if (!action || typeof action.data !== "object" || !action.data) return;

    const redoable = action.data as { redo?: () => Promise<void> };
    if (redoable.redo) {
      await redoable.redo();

      // Move action from redo to undo stack
      setRedoStacks((prev) => {
        const viewStack = prev[currentView] || [];
        return { ...prev, [currentView]: viewStack.slice(0, -1) };
      });
      setUndoStacks((prev) => {
        const viewStack = prev[currentView] || [];
        return { ...prev, [currentView]: [...viewStack, action] };
      });
    }
  }, [redoStack, currentView]);

  // Derive selectedKind from actionable root keys - returns null if mixed kinds
  // Uses getActionableKind to filter out descendants and only consider root items
  const derivedSelectedKind = useMemo((): SelectedEntityKind | null => {
    if (selection.ids.length === 0) return null;
    const kind = getActionableKind(selection.ids);
    return kind as SelectedEntityKind | null;
  }, [selection.ids]);

  return {
    // Navigation state
    currentView,
    currentLabelId,
    currentCategoryId,

    // UI state
    selectedIds: selection.ids,
    selectedKind: derivedSelectedKind,
    expandedIds,
    editingRow,
    pinnedNewRow,
    undoStack,
    redoStack,

    // Navigation actions
    navigateToView,
    navigateToLabel,
    navigateToCategory,
    navigateBack,

    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,

    // Row UI actions
    setEditing,
    setPinnedNew,

    // Expand/collapse actions
    toggleExpand,
    expandAll,
    collapseAll,

    // Undo/redo actions
    pushUndoAction,
    undo,
    redo,
  };
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ViewType, HistoryEntry } from "../types/builder-state";

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
  const currentView = (searchParams.get("view") as ViewType) || "menu";
  const currentLabelId = searchParams.get("labelId") || undefined;
  const currentCategoryId = searchParams.get("categoryId") || undefined;

  // ==================== SELECTION STATE (LOCAL) ====================
  // Intentionally cleared on refresh
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ==================== EXPAND/COLLAPSE STATE (LOCAL) ====================
  // Intentionally cleared on refresh
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
      router.push(`/admin/menu-builder?view=${view}`);
      setSelectedIds([]); // Clear selections on navigation
    },
    [router]
  );

  const navigateToLabel = useCallback(
    (labelId: string) => {
      const params = new URLSearchParams();
      params.set("view", "label");
      params.set("labelId", labelId);
      router.push(`/admin/menu-builder?${params}`);
      setSelectedIds([]);
    },
    [router]
  );

  const navigateToCategory = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams();
      params.set("view", "category");
      params.set("categoryId", categoryId);
      router.push(`/admin/menu-builder?${params}`);
      setSelectedIds([]);
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
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
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

  return {
    // Navigation state
    currentView,
    currentLabelId,
    currentCategoryId,

    // UI state
    selectedIds,
    expandedIds,
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

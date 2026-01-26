import type { BuilderState } from "../../types/builder-state";

// Platform detection for keyboard shortcuts
const isMac =
  typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export const modKey = isMac ? "⌘" : "Ctrl";

// State helpers
export const hasSelection = (state: BuilderState): boolean => state.selectedIds.length > 0;
/** Returns true if there's a selection AND all selected items are the same kind (not mixed) */
export const hasSameKindSelection = (state: BuilderState): boolean =>
  state.selectedIds.length > 0 && state.selectedKind !== null;
export const hasUndoHistory = (state: BuilderState): boolean => state.undoStack.length > 0;
export const hasRedoHistory = (state: BuilderState): boolean => state.redoStack.length > 0;

// Expand/collapse helpers
export const allExpanded = (state: BuilderState): boolean => {
  const { expandedIds, expandableIds } = state;
  if (expandableIds.length === 0) return true;
  return expandableIds.every((id) => expandedIds.has(id));
};

export const allCollapsed = (state: BuilderState): boolean => {
  return state.expandedIds.size === 0;
};

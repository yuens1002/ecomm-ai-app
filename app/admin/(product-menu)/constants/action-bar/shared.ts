import type { BuilderState } from "../../types/builder-state";

// Platform detection for keyboard shortcuts
const isMac =
  typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export const modKey = isMac ? "⌘" : "Ctrl";

// State helpers
export const hasSelection = (state: BuilderState): boolean => state.selectedIds.length > 0;
export const hasUndoHistory = (state: BuilderState): boolean => state.undoStack.length > 0;
export const hasRedoHistory = (state: BuilderState): boolean => state.redoStack.length > 0;

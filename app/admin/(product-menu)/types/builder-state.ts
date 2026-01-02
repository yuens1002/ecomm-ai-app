/**
 * Builder State Types
 *
 * Central state management types for Menu Builder.
 */

export type ViewType =
  | "menu"
  | "label"
  | "category"
  | "all-labels"
  | "all-categories";

export type BuilderState = {
  // Selection state
  selectedIds: string[];

  // Undo/Redo history
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // View context
  currentView: ViewType;
  currentLabelId?: string;
  currentCategoryId?: string;

  // Data counts (for conditional actions)
  totalLabels: number;
  totalCategories: number;
  totalProducts: number;
};

export type HistoryEntry = {
  action: string;
  timestamp: Date;
  data: unknown; // Serializable state snapshot
};

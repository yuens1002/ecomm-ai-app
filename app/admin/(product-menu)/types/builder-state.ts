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

/**
 * Menu Builder Actions
 *
 * Actions available in the menu builder for manipulating state and data.
 */
export interface MenuBuilderActions {
  // Selection
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Expand/collapse
  toggleExpand: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;

  // CRUD operations
  cloneSelected: () => Promise<void>;
  removeSelected: () => Promise<void>;
  toggleVisibility: () => Promise<void>;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Navigation
  navigateToView: (view: "menu" | "label" | "category") => void;
  navigateToLabel: (labelId: string) => void;
  navigateToCategory: (labelId: string, categoryId: string) => void;
  navigateBack: () => void;
}

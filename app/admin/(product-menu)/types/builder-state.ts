/**
 * Builder State Types
 *
 * Central state management types for Menu Builder.
 */

/**
 * Single source of truth for available views.
 *
 * These are UI views (not pages) and are intentionally treated as peer states
 * rather than a strict hierarchy.
 */
export const ALL_VIEWS = ["menu", "label", "category", "all-labels", "all-categories"] as const;

export type ViewType = (typeof ALL_VIEWS)[number];

export type NavigableEntityView = Extract<ViewType, "menu" | "label" | "category">;

export type SelectedEntityKind = "label" | "category" | "product";

export type BuilderState = {
  // Selection state
  selectedIds: string[];
  selectedKind: SelectedEntityKind | null;

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

  // Expand/collapse state (for menu view)
  expandedIds: Set<string>;
  expandableIds: string[];
};

export type HistoryEntry = {
  action: string;
  timestamp: Date;
  data: unknown; // Serializable state snapshot
};

/**
 * Undoable Action
 *
 * Represents a reversible operation with undo/redo logic.
 */
export type UndoableAction = {
  type: "create" | "update" | "delete" | "detach" | "bulk";
  view: ViewType;
  description: string;
  timestamp: number;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

/**
 * Menu Builder Actions
 *
 * Actions available in the menu builder for manipulating state and data.
 */
export interface MenuBuilderActions {
  // Selection (kind is derived from prefixed keys, not passed explicitly)
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Expand/collapse
  toggleExpand: (id: string) => void;
  /** Expand all expandable items. If ids not provided, expands all labels and categories with children. */
  expandAll: (ids?: string[]) => void;
  collapseAll: () => void;

  // CRUD operations
  cloneSelected: () => Promise<void>;
  removeSelected: () => Promise<void>;
  toggleVisibility: () => Promise<void>;
  createNewLabel: () => Promise<void>;
  createNewCategory: () => Promise<void>;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Navigation
  navigateToView: (view: NavigableEntityView) => void;
  navigateToLabel: (labelId: string) => void;
  navigateToCategory: (labelId: string, categoryId: string) => void;
  navigateBack: () => void;
}

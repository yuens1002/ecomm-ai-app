/**
 * Menu Builder Types
 *
 * Shared types for menu builder state and actions.
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

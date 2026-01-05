/**
 * Action Bar Configuration
 *
 * Data-driven configuration for MenuActionBar component.
 * Defines all available actions per view without conditionals.
 */

import {
  Plus,
  Copy,
  CornerUpLeft,
  Eye,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Undo,
  Redo,
  ArrowUpDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  BuilderState,
  ViewType,
  MenuBuilderActions,
} from "../types/builder-state";
import type { MenuLabel, MenuCategory, MenuProduct } from "../types/menu";

export type ActionPosition = "left" | "right";

export type ActionType = "button" | "combo" | "dropdown";

// Subset of mutations from useProductMenuMutations used in actions
export type ProductMenuMutations = {
  updateLabel: (id: string, payload: { isVisible?: boolean }) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  updateCategory: (id: string, payload: { isVisible?: boolean }) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachCategory: (labelId: string, categoryId: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachProductFromCategory: (productId: string, categoryId: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
};

// Context passed to execute functions
export type ActionContext = {
  selectedIds: string[];
  currentLabelId?: string;
  currentCategoryId?: string;
  mutations: ProductMenuMutations;
  labels: MenuLabel[];
  categories: MenuCategory[];
  products: MenuProduct[];
};

export type ActionDefinition = {
  id: string;
  type: ActionType;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd: string[]; // Keyboard shortcut keys
  position: ActionPosition;
  disabled: (state: BuilderState) => boolean;
  ariaLabel?: (state: BuilderState) => string; // For disabled state explanation
  onClick: (
    state: BuilderState,
    actions: MenuBuilderActions
  ) => void | Promise<void>;
  // For combo buttons
  comboWith?: string; // ID of the paired action
  // For dropdown buttons
  hasDropdown?: boolean;
  // View-specific execution logic (alternative to onClick for shared actions)
  execute?: Partial<Record<ViewType, (context: ActionContext) => Promise<void>>>;
  refresh?: Partial<Record<ViewType, ("labels" | "categories" | "products")[]>>;
  errorMessage?: Partial<Record<ViewType, string>>;
};

// Platform detection for keyboard shortcuts
const isMac =
  typeof window !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";

// Helper functions for disabled state
const hasSelection = (state: BuilderState): boolean => {
  return state.selectedIds.length > 0;
};

const hasUndoHistory = (state: BuilderState): boolean => {
  return state.undoStack.length > 0;
};

const hasRedoHistory = (state: BuilderState): boolean => {
  return state.redoStack.length > 0;
};

// ==================== SHARED ACTIONS ====================
// Define common actions once, reuse across all views
const SHARED_ACTIONS = {
  clone: {
    id: "clone",
    type: "button" as ActionType,
    icon: Copy,
    label: "Clone",
    tooltip: "Duplicate selected items",
    kbd: [modKey, "D"],
    position: "left" as ActionPosition,
    disabled: (state: BuilderState) => !hasSelection(state),
    ariaLabel: (state: BuilderState) =>
      hasSelection(state)
        ? "Clone selected items"
        : "Clone disabled - no items selected",
    onClick: async (state: BuilderState, actions: MenuBuilderActions) => {
      await actions.cloneSelected();
    },
    execute: {
      menu: async ({ selectedIds }: ActionContext) => {
        // TODO: Implement label cloning with categories
        console.log("[Clone] Menu Labels:", selectedIds);
      },
      "all-labels": async ({ selectedIds }: ActionContext) => {
        // TODO: Implement label cloning
        console.log("[Clone] All Labels:", selectedIds);
      },
      "all-categories": async ({ selectedIds }: ActionContext) => {
        // TODO: Implement category cloning
        console.log("[Clone] All Categories:", selectedIds);
      },
    },
    refresh: {
      menu: ["labels" as const],
      "all-labels": ["labels" as const],
      "all-categories": ["categories" as const],
    },
    errorMessage: {
      menu: "Failed to clone labels",
      "all-labels": "Failed to clone labels",
      "all-categories": "Failed to clone categories",
    },
  },
  remove: {
    id: "remove",
    type: "button" as ActionType,
    icon: CornerUpLeft,
    label: "Remove",
    tooltip: "Remove from menu",
    kbd: [modKey, "⌫"],
    position: "left" as ActionPosition,
    disabled: (state: BuilderState) => !hasSelection(state),
    ariaLabel: (state: BuilderState) =>
      hasSelection(state)
        ? "Remove selected items"
        : "Remove disabled - no items selected",
    onClick: async (state: BuilderState, actions: MenuBuilderActions) => {
      await actions.removeSelected();
    },
    execute: {
      menu: async ({ selectedIds, mutations }: ActionContext) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateLabel(id, { isVisible: false })
          )
        );
      },
      label: async ({ selectedIds, currentLabelId, mutations }: ActionContext) => {
        if (!currentLabelId) return;
        await Promise.all(
          selectedIds.map((id) => mutations.detachCategory(currentLabelId, id))
        );
      },
      category: async ({ selectedIds, currentCategoryId, mutations }: ActionContext) => {
        if (!currentCategoryId) return;
        await Promise.all(
          selectedIds.map((id) =>
            mutations.detachProductFromCategory(id, currentCategoryId)
          )
        );
      },
      "all-labels": async ({ selectedIds, mutations }: ActionContext) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateLabel(id, { isVisible: false })
          )
        );
      },
      "all-categories": async ({ selectedIds, mutations }: ActionContext) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateCategory(id, { isVisible: false })
          )
        );
      },
    },
    refresh: {
      menu: ["labels" as const],
      label: ["labels" as const],
      category: ["products" as const],
      "all-labels": ["labels" as const],
      "all-categories": ["categories" as const],
    },
    errorMessage: {
      menu: "Failed to hide labels from menu",
      label: "Failed to detach categories from label",
      category: "Failed to detach products from category",
      "all-labels": "Failed to hide labels",
      "all-categories": "Failed to hide categories",
    },
  },
  visibility: {
    id: "visibility",
    type: "button" as ActionType,
    icon: Eye,
    label: "Visibility",
    tooltip: "Toggle visibility",
    kbd: ["Space"],
    position: "right" as ActionPosition,
    disabled: (state: BuilderState) => !hasSelection(state),
    ariaLabel: (state: BuilderState) =>
      hasSelection(state)
        ? "Toggle visibility of selected items"
        : "Visibility disabled - no items selected",
    onClick: async (state: BuilderState, actions: MenuBuilderActions) => {
      await actions.toggleVisibility();
    },
    execute: {
      menu: async ({ selectedIds, mutations, labels }: ActionContext) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const label = labels.find((l) => l.id === id);
            if (label) {
              await mutations.updateLabel(id, { isVisible: !label.isVisible });
            }
          })
        );
      },
      "all-labels": async ({ selectedIds, mutations, labels }: ActionContext) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const label = labels.find((l) => l.id === id);
            if (label) {
              await mutations.updateLabel(id, { isVisible: !label.isVisible });
            }
          })
        );
      },
      "all-categories": async ({ selectedIds, mutations, categories }: ActionContext) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const category = categories.find((c) => c.id === id);
            if (category) {
              await mutations.updateCategory(id, {
                isVisible: !category.isVisible,
              });
            }
          })
        );
      },
    },
    refresh: {
      menu: ["labels" as const],
      "all-labels": ["labels" as const],
      "all-categories": ["categories" as const],
    },
    errorMessage: {
      menu: "Failed to toggle label visibility",
      "all-labels": "Failed to toggle label visibility",
      "all-categories": "Failed to toggle category visibility",
    },
  },
  expandAll: {
    id: "expand-all",
    type: "button" as ActionType,
    icon: ListChevronsDownUp,
    label: "Expand All",
    tooltip: "Expand all sections",
    kbd: [modKey, "↓"],
    position: "right" as ActionPosition,
    disabled: () => false,
    onClick: (state: BuilderState, actions: MenuBuilderActions) => {
      actions.expandAll([]);
    },
  },
  collapseAll: {
    id: "collapse-all",
    type: "button" as ActionType,
    icon: ListChevronsUpDown,
    label: "Collapse All",
    tooltip: "Collapse all sections",
    kbd: [modKey, "↑"],
    position: "right" as ActionPosition,
    disabled: () => false,
    onClick: (state: BuilderState, actions: MenuBuilderActions) => {
      actions.collapseAll();
    },
  },
  undo: {
    id: "undo",
    type: "button" as ActionType,
    icon: Undo,
    label: "Undo",
    tooltip: "Undo last change",
    kbd: [modKey, "Z"],
    position: "right" as ActionPosition,
    disabled: (state: BuilderState) => !hasUndoHistory(state),
    ariaLabel: (state: BuilderState) =>
      hasUndoHistory(state)
        ? "Undo last operation"
        : "Undo disabled - no changes to undo",
    onClick: (state: BuilderState, actions: MenuBuilderActions) => {
      actions.undo();
    },
  },
  redo: {
    id: "redo",
    type: "button" as ActionType,
    icon: Redo,
    label: "Redo",
    tooltip: "Redo last change",
    kbd: [modKey, "Shift", "Z"],
    position: "right" as ActionPosition,
    disabled: (state: BuilderState) => !hasRedoHistory(state),
    ariaLabel: (state: BuilderState) =>
      hasRedoHistory(state)
        ? "Redo last undone operation"
        : "Redo disabled - no changes to redo",
    onClick: (state: BuilderState, actions: MenuBuilderActions) => {
      actions.redo();
    },
  },
} satisfies Record<string, ActionDefinition>;

// Action definitions by view
export const ACTION_BAR_CONFIG: Record<ViewType, ActionDefinition[]> = {
  // ==================== MENU VIEW ====================
  menu: [
    // LEFT SIDE
    {
      id: "new-label",
      type: "combo",
      icon: Plus,
      label: "New Label",
      tooltip: "Add new label",
      kbd: [modKey, "N"],
      position: "left",
      disabled: () => false, // Always enabled
      comboWith: "add-labels",
      onClick: async (state) => {
        // TODO: Open new label modal
        console.log("New Label clicked", state);
      },
    },
    {
      id: "add-labels",
      type: "combo",
      icon: Plus,
      label: "Add Label(s)",
      tooltip: "Add labels to menu",
      kbd: [],
      position: "left",
      disabled: (state) => state.totalLabels === 0, // Disabled when no labels in DB
      comboWith: "new-label",
      onClick: () => {}, // Dropdown handled by DROPDOWN_REGISTRY
    },
    SHARED_ACTIONS.clone,
    SHARED_ACTIONS.remove,
    // RIGHT SIDE
    SHARED_ACTIONS.visibility,
    SHARED_ACTIONS.expandAll,
    SHARED_ACTIONS.collapseAll,
    SHARED_ACTIONS.undo,
    SHARED_ACTIONS.redo,
  ],

  // ==================== LABEL VIEW ====================
  label: [
    // LEFT SIDE
    {
      id: "add-categories",
      type: "dropdown",
      icon: Plus,
      label: "Categories",
      tooltip: "Add categories to label",
      kbd: [],
      position: "left",
      disabled: (state) => state.totalCategories === 0, // Disabled when no categories in DB
      onClick: () => {}, // Dropdown handled by DROPDOWN_REGISTRY
    },
    {
      id: "sort-mode",
      type: "dropdown",
      icon: ArrowUpDown,
      label: "Sort Mode",
      tooltip: "Category ordering mode",
      kbd: [modKey, "R"],
      position: "left",
      disabled: () => false, // Always enabled
      onClick: async (state) => {
        // TODO: Toggle sort mode (Auto A-Z vs Manual)
        console.log("Sort Mode clicked", state);
      },
    },
    SHARED_ACTIONS.remove,
    // RIGHT SIDE
    SHARED_ACTIONS.undo,
    SHARED_ACTIONS.redo,
  ],

  // ==================== CATEGORY VIEW ====================
  category: [
    // LEFT SIDE
    {
      id: "add-products",
      type: "dropdown",
      icon: Plus,
      label: "Products",
      tooltip: "Add products to category",
      kbd: [],
      position: "left",
      disabled: (state) => state.totalProducts === 0, // Disabled when no products in DB
      onClick: () => {}, // Dropdown handled by DROPDOWN_REGISTRY
    },
    {
      id: "sort-order",
      type: "dropdown",
      icon: ArrowUpDown,
      label: "Sort Order",
      tooltip: "Product ordering",
      kbd: [modKey, "R"],
      position: "left",
      disabled: () => false, // Always enabled
      onClick: async (state) => {
        // TODO: Open sort order dropdown (Manual, A-Z, Z-A, First, Last)
        console.log("Sort Order clicked", state);
      },
    },
    SHARED_ACTIONS.remove,
    // RIGHT SIDE
    SHARED_ACTIONS.expandAll,
    SHARED_ACTIONS.collapseAll,
    SHARED_ACTIONS.undo,
    SHARED_ACTIONS.redo,
  ],

  // ==================== ALL-LABELS VIEW ====================
  "all-labels": [
    // LEFT SIDE
    {
      id: "new-label",
      type: "button",
      icon: Plus,
      label: "New Label",
      tooltip: "Add new label",
      kbd: [modKey, "N"],
      position: "left",
      disabled: () => false, // Always enabled
      onClick: async (state, _actions) => {
        // TODO: Open new label modal
        console.log("New Label clicked", state);
      },
    },
    SHARED_ACTIONS.clone,
    SHARED_ACTIONS.remove,
    // RIGHT SIDE
    SHARED_ACTIONS.visibility,
    SHARED_ACTIONS.undo,
    SHARED_ACTIONS.redo,
  ],

  // ==================== ALL-CATEGORIES VIEW ====================
  "all-categories": [
    // LEFT SIDE
    {
      id: "new-category",
      type: "button",
      icon: Plus,
      label: "New Category",
      tooltip: "Add new category",
      kbd: [modKey, "N"],
      position: "left",
      disabled: () => false, // Always enabled
      onClick: async (state, _actions) => {
        // TODO: Open new category modal
        console.log("New Category clicked", state);
      },
    },
    SHARED_ACTIONS.clone,
    SHARED_ACTIONS.remove,
    // RIGHT SIDE
    SHARED_ACTIONS.visibility,
    SHARED_ACTIONS.undo,
    SHARED_ACTIONS.redo,
  ],
};

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
import type { BuilderState, ViewType } from "../types/builder-state";

export type ActionPosition = "left" | "right";

export type ActionType = "button" | "combo" | "dropdown";

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
  onClick: (state: BuilderState) => void | Promise<void>;
  // For combo buttons
  comboWith?: string; // ID of the paired action
  // For dropdown buttons
  hasDropdown?: boolean;
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
      onClick: async (state) => {
        // TODO: Open label picker dropdown
        console.log("Add Labels clicked", state);
      },
    },
    {
      id: "clone",
      type: "button",
      icon: Copy,
      label: "Clone",
      tooltip: "Duplicate selected items",
      kbd: [modKey, "D"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Clone selected items"
          : "Clone disabled - no items selected",
      onClick: async (state) => {
        // TODO: Clone selected labels with all categories/products
        console.log("Clone clicked", state.selectedIds);
      },
    },
    {
      id: "remove",
      type: "button",
      icon: CornerUpLeft,
      label: "Remove",
      tooltip: "Remove from menu",
      kbd: [modKey, "⌫"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Remove selected items from menu"
          : "Remove disabled - no items selected",
      onClick: async (state) => {
        // TODO: Detach selected labels from menu
        console.log("Remove clicked", state.selectedIds);
      },
    },
    // RIGHT SIDE
    {
      id: "visibility",
      type: "button",
      icon: Eye,
      label: "Visibility",
      tooltip: "Toggle visibility",
      kbd: ["Space"],
      position: "right",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Toggle visibility of selected items"
          : "Visibility disabled - no items selected",
      onClick: async (state) => {
        // TODO: Toggle visibility of selected labels
        console.log("Visibility clicked", state.selectedIds);
      },
    },
    {
      id: "expand-all",
      type: "button",
      icon: ListChevronsDownUp,
      label: "Expand All",
      tooltip: "Expand all sections",
      kbd: [modKey, "↓"],
      position: "right",
      disabled: () => false, // Always enabled
      onClick: (state) => {
        // TODO: Expand all label sections
        console.log("Expand All clicked", state);
      },
    },
    {
      id: "collapse-all",
      type: "button",
      icon: ListChevronsUpDown,
      label: "Collapse All",
      tooltip: "Collapse all sections",
      kbd: [modKey, "↑"],
      position: "right",
      disabled: () => false, // Always enabled
      onClick: (state) => {
        // TODO: Collapse all label sections
        console.log("Collapse All clicked", state);
      },
    },
    {
      id: "undo",
      type: "button",
      icon: Undo,
      label: "Undo",
      tooltip: "Undo last change",
      kbd: [modKey, "Z"],
      position: "right",
      disabled: (state) => !hasUndoHistory(state),
      ariaLabel: (state) =>
        hasUndoHistory(state)
          ? "Undo last operation"
          : "Undo disabled - no changes to undo",
      onClick: (state) => {
        // TODO: Undo last operation
        console.log("Undo clicked", state.undoStack);
      },
    },
    {
      id: "redo",
      type: "button",
      icon: Redo,
      label: "Redo",
      tooltip: "Redo last change",
      kbd: [modKey, "Shift", "Z"],
      position: "right",
      disabled: (state) => !hasRedoHistory(state),
      ariaLabel: (state) =>
        hasRedoHistory(state)
          ? "Redo last undone operation"
          : "Redo disabled - no changes to redo",
      onClick: (state) => {
        // TODO: Redo last operation
        console.log("Redo clicked", state.redoStack);
      },
    },
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
      onClick: async (state) => {
        // TODO: Open category picker dropdown
        console.log("Add Categories clicked", state);
      },
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
    {
      id: "remove",
      type: "button",
      icon: CornerUpLeft,
      label: "Remove",
      tooltip: "Remove from label",
      kbd: [modKey, "⌫"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Remove selected categories from label"
          : "Remove disabled - no categories selected",
      onClick: async (state) => {
        // TODO: Detach selected categories from label
        console.log("Remove clicked", state.selectedIds);
      },
    },
    // RIGHT SIDE
    {
      id: "undo",
      type: "button",
      icon: Undo,
      label: "Undo",
      tooltip: "Undo last change",
      kbd: [modKey, "Z"],
      position: "right",
      disabled: (state) => !hasUndoHistory(state),
      ariaLabel: (state) =>
        hasUndoHistory(state)
          ? "Undo last operation"
          : "Undo disabled - no changes to undo",
      onClick: (state) => {
        console.log("Undo clicked", state.undoStack);
      },
    },
    {
      id: "redo",
      type: "button",
      icon: Redo,
      label: "Redo",
      tooltip: "Redo last change",
      kbd: [modKey, "Shift", "Z"],
      position: "right",
      disabled: (state) => !hasRedoHistory(state),
      ariaLabel: (state) =>
        hasRedoHistory(state)
          ? "Redo last undone operation"
          : "Redo disabled - no changes to redo",
      onClick: (state) => {
        console.log("Redo clicked", state.redoStack);
      },
    },
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
      onClick: async (state) => {
        // TODO: Open product picker dropdown
        console.log("Add Products clicked", state);
      },
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
    {
      id: "remove",
      type: "button",
      icon: CornerUpLeft,
      label: "Remove",
      tooltip: "Remove from category",
      kbd: [modKey, "⌫"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Remove selected products from category"
          : "Remove disabled - no products selected",
      onClick: async (state) => {
        // TODO: Detach selected products from category
        console.log("Remove clicked", state.selectedIds);
      },
    },
    // RIGHT SIDE
    {
      id: "expand-all",
      type: "button",
      icon: ListChevronsDownUp,
      label: "Expand All",
      tooltip: "Expand all rows",
      kbd: [modKey, "↓"],
      position: "right",
      disabled: () => false, // Always enabled
      onClick: (state) => {
        // TODO: Expand all product rows
        console.log("Expand All clicked", state);
      },
    },
    {
      id: "collapse-all",
      type: "button",
      icon: ListChevronsUpDown,
      label: "Collapse All",
      tooltip: "Collapse all rows",
      kbd: [modKey, "↑"],
      position: "right",
      disabled: () => false, // Always enabled
      onClick: (state) => {
        // TODO: Collapse all product rows
        console.log("Collapse All clicked", state);
      },
    },
    {
      id: "undo",
      type: "button",
      icon: Undo,
      label: "Undo",
      tooltip: "Undo last change",
      kbd: [modKey, "Z"],
      position: "right",
      disabled: (state) => !hasUndoHistory(state),
      ariaLabel: (state) =>
        hasUndoHistory(state)
          ? "Undo last operation"
          : "Undo disabled - no changes to undo",
      onClick: (state) => {
        console.log("Undo clicked", state.undoStack);
      },
    },
    {
      id: "redo",
      type: "button",
      icon: Redo,
      label: "Redo",
      tooltip: "Redo last change",
      kbd: [modKey, "Shift", "Z"],
      position: "right",
      disabled: (state) => !hasRedoHistory(state),
      ariaLabel: (state) =>
        hasRedoHistory(state)
          ? "Redo last undone operation"
          : "Redo disabled - no changes to redo",
      onClick: (state) => {
        console.log("Redo clicked", state.redoStack);
      },
    },
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
      onClick: async (state) => {
        // TODO: Open new label modal
        console.log("New Label clicked", state);
      },
    },
    {
      id: "clone",
      type: "button",
      icon: Copy,
      label: "Clone",
      tooltip: "Duplicate selected items",
      kbd: [modKey, "D"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Clone selected labels with categories"
          : "Clone disabled - no labels selected",
      onClick: async (state) => {
        // TODO: Clone selected labels with all categories
        console.log("Clone clicked", state.selectedIds);
      },
    },
    {
      id: "remove",
      type: "button",
      icon: CornerUpLeft,
      label: "Remove",
      tooltip: "Hide from menu",
      kbd: [modKey, "⌫"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Hide selected labels from menu"
          : "Remove disabled - no labels selected",
      onClick: async (state) => {
        // TODO: Detach selected labels from menu
        console.log("Remove clicked", state.selectedIds);
      },
    },
    // RIGHT SIDE
    {
      id: "visibility",
      type: "button",
      icon: Eye,
      label: "Visibility",
      tooltip: "Toggle visibility",
      kbd: ["Space"],
      position: "right",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Toggle visibility of selected labels"
          : "Visibility disabled - no labels selected",
      onClick: async (state) => {
        // TODO: Toggle visibility of selected labels
        console.log("Visibility clicked", state.selectedIds);
      },
    },
    {
      id: "undo",
      type: "button",
      icon: Undo,
      label: "Undo",
      tooltip: "Undo last change",
      kbd: [modKey, "Z"],
      position: "right",
      disabled: (state) => !hasUndoHistory(state),
      ariaLabel: (state) =>
        hasUndoHistory(state)
          ? "Undo last operation"
          : "Undo disabled - no changes to undo",
      onClick: (state) => {
        console.log("Undo clicked", state.undoStack);
      },
    },
    {
      id: "redo",
      type: "button",
      icon: Redo,
      label: "Redo",
      tooltip: "Redo last change",
      kbd: [modKey, "Shift", "Z"],
      position: "right",
      disabled: (state) => !hasRedoHistory(state),
      ariaLabel: (state) =>
        hasRedoHistory(state)
          ? "Redo last undone operation"
          : "Redo disabled - no changes to redo",
      onClick: (state) => {
        console.log("Redo clicked", state.redoStack);
      },
    },
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
      onClick: async (state) => {
        // TODO: Open new category modal
        console.log("New Category clicked", state);
      },
    },
    {
      id: "clone",
      type: "button",
      icon: Copy,
      label: "Clone",
      tooltip: "Duplicate selected items",
      kbd: [modKey, "D"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Clone selected categories with products"
          : "Clone disabled - no categories selected",
      onClick: async (state) => {
        // TODO: Clone selected categories with all products
        console.log("Clone clicked", state.selectedIds);
      },
    },
    {
      id: "remove",
      type: "button",
      icon: CornerUpLeft,
      label: "Remove",
      tooltip: "Hide from menu",
      kbd: [modKey, "⌫"],
      position: "left",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Hide selected categories from menu"
          : "Remove disabled - no categories selected",
      onClick: async (state) => {
        // TODO: Detach selected categories from menu
        console.log("Remove clicked", state.selectedIds);
      },
    },
    // RIGHT SIDE
    {
      id: "visibility",
      type: "button",
      icon: Eye,
      label: "Visibility",
      tooltip: "Toggle visibility",
      kbd: ["Space"],
      position: "right",
      disabled: (state) => !hasSelection(state),
      ariaLabel: (state) =>
        hasSelection(state)
          ? "Toggle visibility of selected categories"
          : "Visibility disabled - no categories selected",
      onClick: async (state) => {
        // TODO: Toggle visibility of selected categories
        console.log("Visibility clicked", state.selectedIds);
      },
    },
    {
      id: "undo",
      type: "button",
      icon: Undo,
      label: "Undo",
      tooltip: "Undo last change",
      kbd: [modKey, "Z"],
      position: "right",
      disabled: (state) => !hasUndoHistory(state),
      ariaLabel: (state) =>
        hasUndoHistory(state)
          ? "Undo last operation"
          : "Undo disabled - no changes to undo",
      onClick: (state) => {
        console.log("Undo clicked", state.undoStack);
      },
    },
    {
      id: "redo",
      type: "button",
      icon: Redo,
      label: "Redo",
      tooltip: "Redo last change",
      kbd: [modKey, "Shift", "Z"],
      position: "right",
      disabled: (state) => !hasRedoHistory(state),
      ariaLabel: (state) =>
        hasRedoHistory(state)
          ? "Redo last undone operation"
          : "Redo disabled - no changes to redo",
      onClick: (state) => {
        console.log("Redo clicked", state.redoStack);
      },
    },
  ],
};

/**
 * Action Builders - Reusable factories that output configs for existing UI components
 * 
 * These builders create configs for ActionButton, ActionComboButton, ActionDropdownButton
 * Preserves all existing UI/UX patterns while eliminating duplication
 */

import {
  Plus,
  Copy,
  Trash2,
  Eye,
  Undo,
  Redo,
  Link,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActionId } from "./view-registry";

/**
 * Action output types that map to our existing UI components
 */
export type ActionButtonConfig = {
  type: "button";
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd?: string[];
  disabled?: boolean;
  onClick: () => void;
};

export type ActionComboButtonConfig = {
  type: "combo";
  newButton: {
    icon: LucideIcon;
    label: string;
    tooltip: string;
    kbd?: string[];
    disabled?: boolean;
    onClick: () => void;
  };
  addButton: {
    label: string;
    tooltip: string;
    disabled?: boolean;
    dropdownContent: React.ReactNode;
  };
};

export type ActionDropdownButtonConfig = {
  type: "dropdown";
  icon: LucideIcon;
  label: string;
  tooltip: string;
  disabled?: boolean;
  dropdownContent: React.ReactNode;
};

export type ActionConfig =
  | ActionButtonConfig
  | ActionComboButtonConfig
  | ActionDropdownButtonConfig;

/**
 * Context passed to action builders
 */
export interface ActionBuilderContext {
  // State
  selectedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  currentView: string;
  currentLabelId?: string;
  currentCategoryId?: string;

  // Action handlers (injected from MenuActionBar)
  onNewLabel?: () => void;
  onNewCategory?: () => void;
  onAddCategories?: () => void;
  onAddProducts?: () => void;
  onClone?: () => void;
  onRemove?: () => void;
  onToggleVisibility?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;

  // Dropdown content (React nodes built in MenuActionBar)
  addCategoriesDropdown?: React.ReactNode;
  addProductsDropdown?: React.ReactNode;
}

/**
 * Action Builders - One function per action ID
 * Each returns a config for ActionButton/ActionComboButton/ActionDropdownButton
 */

export function buildNewLabelAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Plus,
    label: "New Label",
    tooltip: "Create new label",
    kbd: ["Ctrl", "N"],
    disabled: false,
    onClick: ctx.onNewLabel || (() => {}),
  };
}

export function buildNewCategoryAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Plus,
    label: "New Category",
    tooltip: "Create new category",
    kbd: ["Ctrl", "N"],
    disabled: false,
    onClick: ctx.onNewCategory || (() => {}),
  };
}

export function buildAddCategoriesAction(ctx: ActionBuilderContext): ActionConfig {
  // Combo button: "New Category" + "Add Existing" dropdown
  return {
    type: "combo",
    newButton: {
      icon: Plus,
      label: "New Category",
      tooltip: "Create new category",
      kbd: ["Ctrl", "N"],
      disabled: false,
      onClick: ctx.onNewCategory || (() => {}),
    },
    addButton: {
      label: "Add Categories",
      tooltip: "Add existing categories to this label",
      disabled: false,
      dropdownContent: ctx.addCategoriesDropdown || null,
    },
  };
}

export function buildAddProductsAction(ctx: ActionBuilderContext): ActionConfig {
  // Dropdown: "Add Products"
  return {
    type: "dropdown",
    icon: Link,
    label: "Add Products",
    tooltip: "Add products to this category",
    disabled: false,
    dropdownContent: ctx.addProductsDropdown || null,
  };
}

export function buildCloneAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Copy,
    label: "Clone",
    tooltip: ctx.hasSelection
      ? `Clone ${ctx.selectedCount} selected`
      : "Clone selected items",
    kbd: ["Ctrl", "D"],
    disabled: !ctx.hasSelection,
    onClick: ctx.onClone || (() => {}),
  };
}

export function buildRemoveAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Trash2,
    label: "Remove",
    tooltip: ctx.hasSelection
      ? `Remove ${ctx.selectedCount} selected`
      : "Remove selected items",
    kbd: ["Delete"],
    disabled: !ctx.hasSelection,
    onClick: ctx.onRemove || (() => {}),
  };
}

export function buildToggleVisibilityAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Eye,
    label: "Toggle Visibility",
    tooltip: ctx.hasSelection
      ? `Toggle visibility for ${ctx.selectedCount} selected`
      : "Toggle visibility",
    disabled: !ctx.hasSelection,
    onClick: ctx.onToggleVisibility || (() => {}),
  };
}

export function buildUndoAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Undo,
    label: "Undo",
    tooltip: "Undo last action",
    kbd: ["Ctrl", "Z"],
    disabled: !ctx.canUndo,
    onClick: ctx.onUndo || (() => {}),
  };
}

export function buildRedoAction(ctx: ActionBuilderContext): ActionConfig {
  return {
    type: "button",
    icon: Redo,
    label: "Redo",
    tooltip: "Redo last action",
    kbd: ["Ctrl", "Shift", "Z"],
    disabled: !ctx.canRedo,
    onClick: ctx.onRedo || (() => {}),
  };
}

/**
 * Action Builders Registry
 * Maps action IDs to builder functions
 */
export const ACTION_BUILDERS: Record<ActionId, (ctx: ActionBuilderContext) => ActionConfig> = {
  "new-label": buildNewLabelAction,
  "new-category": buildNewCategoryAction,
  "add-categories": buildAddCategoriesAction,
  "add-products": buildAddProductsAction,
  clone: buildCloneAction,
  remove: buildRemoveAction,
  "toggle-visibility": buildToggleVisibilityAction,
  undo: buildUndoAction,
  redo: buildRedoAction,
  settings: () => ({ type: "button", icon: Plus, label: "Settings", tooltip: "Settings", onClick: () => {} }), // Stub
};

/**
 * Build multiple actions from IDs
 */
export function buildActions(actionIds: ActionId[], ctx: ActionBuilderContext): ActionConfig[] {
  return actionIds.map((id) => ACTION_BUILDERS[id](ctx));
}

import type { LucideIcon } from "lucide-react";
import type { BuilderState, MenuBuilderActions, ViewType } from "../../types/builder-state";
import type { CloneCategory } from "../../types/category";
import type { MenuCategory, MenuLabel, MenuProduct } from "../../types/menu";

export const ALL_ACTION_IDS = [
  "clone",
  "remove",
  "visibility",
  "expand-all",
  "collapse-all",
  "undo",
  "redo",
  "new-label",
  "add-labels",
  "add-categories",
  "sort-mode",
  "add-products",
  "sort-order",
  "new-category",
] as const;

export type ActionId = (typeof ALL_ACTION_IDS)[number];

export type ActionPosition = "left" | "right";

export type ActionType = "button" | "combo" | "dropdown";

export type RefreshKey = "labels" | "categories" | "products";

// Subset of mutations from useProductMenuMutations used in actions
export type ProductMenuMutations = {
  updateLabel: (
    id: string,
    payload: { isVisible?: boolean }
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  updateCategory: (
    id: string,
    payload: { isVisible?: boolean }
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  createCategory: (payload: {
    name: string;
    slug: string;
    isVisible?: boolean;
  }) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  cloneCategory: (
    payload: CloneCategory
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachCategory: (
    labelId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachProductFromCategory: (
    productId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  attachCategory?: (
    labelId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
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

export type ActionExecuteResult =
  | void
  | {
      createdIds?: string[];
    };

export type ActionDefinition = {
  id: ActionId;
  type: ActionType;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd: string[];
  position: ActionPosition;
  disabled: (state: BuilderState) => boolean;
  ariaLabel?: (state: BuilderState) => string;
  onClick: (state: BuilderState, actions: MenuBuilderActions) => void | Promise<void>;
  comboWith?: ActionId;
  hasDropdown?: boolean;
  execute?: Partial<Record<ViewType, (context: ActionContext) => Promise<ActionExecuteResult>>>;
  refresh?: Partial<Record<ViewType, RefreshKey[]>>;
  errorMessage?: Partial<Record<ViewType, string>>;
};

// Split model primitives (used for incremental refactor)
export type ActionUiDefinition = {
  id: ActionId;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd: string[];
};

export type ActionPresentation = {
  type: ActionType;
  position: ActionPosition;
  comboWith?: ActionId;
  hasDropdown?: boolean;
};

export type ActionBehavior = {
  disabled: (state: BuilderState) => boolean;
  ariaLabel?: (state: BuilderState) => string;
  onClick: (state: BuilderState, actions: MenuBuilderActions) => void | Promise<void>;
  execute?: Partial<Record<ViewType, (context: ActionContext) => Promise<ActionExecuteResult>>>;
};

export type ActionEffects = {
  refresh?: Partial<Record<ViewType, RefreshKey[]>>;
  errorMessage?: Partial<Record<ViewType, string>>;
};

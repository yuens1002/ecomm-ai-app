import type { LucideIcon } from "lucide-react";
import type { BuilderState, MenuBuilderActions, ViewType } from "../../types/builder-state";
import type { CloneCategory } from "../../types/category";
import type { MenuCategory, MenuLabel, MenuProduct } from "../../types/menu";

// ─────────────────────────────────────────────────────────────
// ACTION IDS
// ─────────────────────────────────────────────────────────────

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
  "add-products",
  "sort-order",
  "new-category",
  "help",
  "delete",
] as const;

export type ActionId = (typeof ALL_ACTION_IDS)[number];

// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────

export type ActionType = "button" | "combo" | "dropdown";
export type ActionPosition = "left" | "right";
export type RefreshKey = "labels" | "categories" | "products";

export type ToastSpec = {
  title: string;
  description?: string;
};

// ─────────────────────────────────────────────────────────────
// MUTATIONS & CONTEXT
// ─────────────────────────────────────────────────────────────

export type ProductMenuMutations = {
  updateLabel: (
    id: string,
    payload: { isVisible?: boolean }
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  cloneLabel?: (payload: { id: string }) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  deleteLabel?: (id: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
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
  deleteCategory?: (id: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachCategory: (
    labelId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachProductFromCategory: (
    productId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  attachProductToCategory?: (
    productId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  attachCategory?: (
    labelId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
};

export type ActionContext = {
  selectedIds: string[];
  currentLabelId?: string;
  currentCategoryId?: string;
  mutations: ProductMenuMutations;
  labels: MenuLabel[];
  categories: MenuCategory[];
  products: MenuProduct[];
};

export type ActionExecuteResult = void | {
  createdIds?: string[];
};

// ─────────────────────────────────────────────────────────────
// UNDO/REDO SYSTEM
// ─────────────────────────────────────────────────────────────

export type UndoAction = {
  action: string;
  timestamp: Date;
  data: {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
  };
};

export type CaptureUndoFn = (
  context: ActionContext,
  result: ActionExecuteResult
) => UndoAction | null;

// ─────────────────────────────────────────────────────────────
// ACTION BASE (colocated in actions.ts)
// ─────────────────────────────────────────────────────────────

export type ActionEffects = {
  refresh?: Partial<Record<ViewType, RefreshKey[]>>;
  errorMessage?: Partial<Record<ViewType, string>>;
  successToast?: Partial<Record<ViewType, ToastSpec>>;
  failureToast?: ToastSpec;
};

export type ActionBase = {
  id: ActionId;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd: string[];
  disabled: (state: BuilderState) => boolean;
  ariaLabel?: (state: BuilderState) => string;
  onClick: (state: BuilderState, actions: MenuBuilderActions) => void | Promise<void>;
  execute?: Partial<Record<ViewType, (context: ActionContext) => Promise<ActionExecuteResult>>>;
  captureUndo?: Partial<Record<ViewType, CaptureUndoFn>>;
  effects?: ActionEffects;
};

// ─────────────────────────────────────────────────────────────
// VIEW CONFIG (defined in views.ts)
// ─────────────────────────────────────────────────────────────

export type ActionSlot = {
  id: ActionId;
  type?: ActionType;
  comboWith?: ActionId;
  hasDropdown?: boolean;
  tooltip?: string;
  label?: string;
};

export type ViewActionBar = {
  left: ActionSlot[];
  right: ActionSlot[];
};

export type ViewConfig = Record<ViewType, ViewActionBar>;

// ─────────────────────────────────────────────────────────────
// HYDRATED ACTION (output of getActionsForView)
// ─────────────────────────────────────────────────────────────

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
  captureUndo?: Partial<Record<ViewType, CaptureUndoFn>>;
  refresh?: Partial<Record<ViewType, RefreshKey[]>>;
  errorMessage?: Partial<Record<ViewType, string>>;
  successToast?: Partial<Record<ViewType, ToastSpec>>;
  failureToast?: ToastSpec;
};

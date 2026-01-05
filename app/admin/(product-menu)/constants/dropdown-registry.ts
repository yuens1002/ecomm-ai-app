/**
 * Dropdown Registry
 *
 * Maps action IDs to their dropdown components and props builders.
 * Used by MenuActionBar to render data-list dropdowns declaratively.
 */

import { AddLabelsDropdown } from "../menu-builder/components/menu-action-bar/AddLabelsDropdown";
import { AddCategoriesDropdown } from "../menu-builder/components/menu-action-bar/AddCategoriesDropdown";
import { AddProductsDropdown } from "../menu-builder/components/menu-action-bar/AddProductsDropdown";
import type { BuilderState } from "../types/builder-state";
import type { MenuLabel, MenuCategory, MenuProduct } from "../types/menu";

/**
 * Mutation function types from useProductMenuMutations
 */
type UpdateLabelFn = (id: string, payload: { isVisible: boolean }) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
type AttachCategoryFn = (labelId: string, categoryId: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
type DetachCategoryFn = (labelId: string, categoryId: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
type AttachProductToCategoryFn = (productId: string, categoryId: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
type DetachProductFromCategoryFn = (productId: string, categoryId: string) => Promise<{ ok: boolean; error?: string; data?: unknown }>;

/**
 * Context passed to dropdown registry for building props
 */
export type DropdownContext = {
  state: BuilderState;
  labels: MenuLabel[];
  categories: MenuCategory[];
  products: MenuProduct[];
  updateLabel: UpdateLabelFn;
  attachCategory: AttachCategoryFn;
  detachCategory: DetachCategoryFn;
  attachProductToCategory: AttachProductToCategoryFn;
  detachProductFromCategory: DetachProductFromCategoryFn;
};

/**
 * Registry of dropdown components for data-list actions
 */
export const DROPDOWN_REGISTRY = {
  "add-labels": {
    Component: AddLabelsDropdown,
    buildProps: (context: DropdownContext) => ({
      labels: context.labels,
      updateLabel: context.updateLabel,
    }),
  },
  "add-categories": {
    Component: AddCategoriesDropdown,
    buildProps: (context: DropdownContext) => ({
      currentLabelId: context.state.currentLabelId!,
      labels: context.labels,
      categories: context.categories,
      attachCategory: context.attachCategory,
      detachCategory: context.detachCategory,
    }),
  },
  "add-products": {
    Component: AddProductsDropdown,
    buildProps: (context: DropdownContext) => ({
      currentCategoryId: context.state.currentCategoryId!,
      products: context.products,
      attachProductToCategory: context.attachProductToCategory,
      detachProductFromCategory: context.detachProductFromCategory,
    }),
  },
} as const;

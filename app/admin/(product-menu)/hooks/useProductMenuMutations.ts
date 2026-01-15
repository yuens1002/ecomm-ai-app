"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import * as categoryActions from "../actions/categories";
import * as labelActions from "../actions/labels";
import * as productActions from "../actions/products";
import { updateProductMenuSettings } from "../actions/settings";
import type { CloneCategory } from "../types/category";
import { PRODUCT_MENU_DATA_KEY } from "./useProductMenuData";

export function useProductMenuMutations() {
  const { mutate } = useSWRConfig();
  const [isSaving, setIsSaving] = useState(false);

  async function refresh() {
    await mutate(PRODUCT_MENU_DATA_KEY);
  }

  return {
    refresh,
    isSaving,

    // Labels
    createLabel: async (payload: unknown) => {
      const res = await labelActions.createLabel(payload);
      if (res.ok) await refresh();
      return res;
    },
    updateLabel: async (id: unknown, payload: unknown) => {
      const res = await labelActions.updateLabel(id, payload);
      if (res.ok) await refresh();
      return res;
    },
    deleteLabel: async (id: unknown) => {
      const res = await labelActions.deleteLabel(id);
      if (res.ok) await refresh();
      return res;
    },
    reorderLabels: async (ids: unknown) => {
      const res = await labelActions.reorderLabels(ids);
      if (res.ok) await refresh();
      return res;
    },
    createNewLabel: async (): Promise<string | undefined> => {
      const res = await labelActions.createNewLabel();
      if (!res.ok) {
        console.error("[useProductMenuMutations] Failed to create new label:", res.error);
        return undefined;
      }

      await refresh();
      if ("data" in res) {
        return (res.data as { id?: string } | undefined)?.id;
      }

      return undefined;
    },
    attachCategory: async (labelId: unknown, categoryId: unknown) => {
      const res = await labelActions.attachCategory(labelId, categoryId);
      if (res.ok) await refresh();
      return res;
    },
    detachCategory: async (labelId: unknown, categoryId: unknown) => {
      const res = await labelActions.detachCategory(labelId, categoryId);
      if (res.ok) await refresh();
      return res;
    },
    reorderCategoriesInLabel: async (labelId: unknown, categoryIds: unknown) => {
      const res = await labelActions.reorderCategoriesInLabel(labelId, categoryIds);
      if (res.ok) await refresh();
      return res;
    },

    autoSortCategoriesInLabel: async (labelId: unknown) => {
      const res = await labelActions.autoSortCategoriesInLabel(labelId);
      if (res.ok) await refresh();
      return res;
    },
    cloneLabel: async (payload: unknown) => {
      const res = await labelActions.cloneLabel(payload);
      if (res.ok) await refresh();
      return res;
    },

    // Categories
    createCategory: async (payload: unknown) => {
      const res = await categoryActions.createCategory(payload);
      if (res.ok) await refresh();
      return res;
    },

    createNewCategory: async (): Promise<string | undefined> => {
      const res = await categoryActions.createNewCategory(undefined);
      if (!res.ok) {
        console.error("[useProductMenuMutations] Failed to create new category:", res.error);
        return undefined;
      }

      await refresh();
      if ("data" in res) {
        return (res.data as { id?: string } | undefined)?.id;
      }

      return undefined;
    },
    cloneCategory: async (payload: CloneCategory) => {
      const res = await categoryActions.cloneCategory(payload);
      if (res.ok) await refresh();
      return res;
    },
    updateCategory: async (id: unknown, payload: unknown) => {
      const res = await categoryActions.updateCategory(id, payload);
      if (res.ok) await refresh();
      return res;
    },
    deleteCategory: async (id: unknown) => {
      const res = await categoryActions.deleteCategory(id);
      if (res.ok) await refresh();
      return res;
    },

    // Products
    attachProductToCategory: async (productId: unknown, categoryId: unknown) => {
      const res = await productActions.attachProductToCategory(productId, categoryId);
      if (res.ok) await refresh();
      return res;
    },
    detachProductFromCategory: async (productId: unknown, categoryId: unknown) => {
      const res = await productActions.detachProductFromCategory(productId, categoryId);
      if (res.ok) await refresh();
      return res;
    },
    reorderProductsInCategory: async (categoryId: unknown, productIds: unknown) => {
      const res = await productActions.reorderProductsInCategory(categoryId, productIds);
      if (res.ok) await refresh();
      return res;
    },
    sortProductsInCategory: async (
      categoryId: unknown,
      sortBy: productActions.SortProductsBy,
      direction: productActions.SortProductsDirection
    ) => {
      const res = await productActions.sortProductsInCategory(categoryId, sortBy, direction);
      if (res.ok) await refresh();
      return res;
    },

    // Settings (server-backed)
    updateSettings: async (payload: unknown) => {
      setIsSaving(true);
      const res = await updateProductMenuSettings(payload);
      if (res.ok) await refresh();
      setIsSaving(false);
      return res;
    },
  };
}

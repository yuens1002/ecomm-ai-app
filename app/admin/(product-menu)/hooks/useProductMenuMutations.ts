"use client";

import { useSWRConfig } from "swr";
import { PRODUCT_MENU_DATA_KEY } from "./useProductMenuData";
import * as labelActions from "../actions/labels";
import * as categoryActions from "../actions/categories";
import { updateProductMenuSettings } from "../actions/productMenuSettings";

export function useProductMenuMutations() {
  const { mutate } = useSWRConfig();

  async function refresh() {
    await mutate(PRODUCT_MENU_DATA_KEY);
  }

  return {
    refresh,

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
    reorderCategoriesInLabel: async (
      labelId: unknown,
      categoryIds: unknown
    ) => {
      const res = await labelActions.reorderCategoriesInLabel(
        labelId,
        categoryIds
      );
      if (res.ok) await refresh();
      return res;
    },

    autoSortCategoriesInLabel: async (labelId: unknown) => {
      const res = await labelActions.autoSortCategoriesInLabel(labelId);
      if (res.ok) await refresh();
      return res;
    },

    // Categories
    createCategory: async (payload: unknown) => {
      const res = await categoryActions.createCategory(payload);
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

    // Settings (server-backed)
    updateSettings: async (payload: unknown) => {
      const res = await updateProductMenuSettings(payload);
      if (res.ok) await refresh();
      return res;
    },
  };
}

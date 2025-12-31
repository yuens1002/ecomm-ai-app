"use client";

import useSWR from "swr";
import { listMenuData } from "../actions/menu";
import { productMenuDataSchema, type ProductMenuData } from "../types/menu";

export const PRODUCT_MENU_DATA_KEY = "product-menu:data";

async function fetchProductMenuData(): Promise<ProductMenuData> {
  const res = await listMenuData();
  if (!res.ok) throw new Error(res.error || "Failed to load product menu data");
  return productMenuDataSchema.parse(res.data);
}

export function useProductMenuData() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    PRODUCT_MENU_DATA_KEY,
    fetchProductMenuData,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Apply defaults: empty string for icon if none, "Menu" for text if none
  const settings = data?.settings
    ? {
        icon: data.settings.icon || "",
        title: data.settings.text || "Menu",
      }
    : undefined;

  return {
    data,
    labels: data?.labels ?? [],
    categories: data?.categories ?? [],
    settings,
    isLoading,
    isValidating,
    error: error as Error | undefined,
    mutate,
  };
}

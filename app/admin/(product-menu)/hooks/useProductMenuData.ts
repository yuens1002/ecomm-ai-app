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
  const { data, error, isLoading, mutate } = useSWR(
    PRODUCT_MENU_DATA_KEY,
    fetchProductMenuData,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return {
    data,
    labels: data?.labels ?? [],
    categories: data?.categories ?? [],
    settings: data?.settings ?? { icon: "ShoppingBag", text: "Shop" },
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

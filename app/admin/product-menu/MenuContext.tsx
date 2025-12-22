"use client";

import { createContext, useContext, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  listMenuData,
  createLabel as createLabelAction,
  updateLabel as updateLabelAction,
  deleteLabel as deleteLabelAction,
  reorderLabels as reorderLabelsAction,
  attachCategory as attachCategoryAction,
  detachCategory as detachCategoryAction,
  reorderCategoriesInLabel as reorderCategoriesInLabelAction,
  createCategory as createCategoryAction,
} from "./actions";
import { z } from "zod";

const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  order: z.number(),
});
const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  order: z.number(),
  labelId: z.string().nullable().optional(),
});

const StateSchema = z.object({
  labels: z.array(LabelSchema),
  categories: z.array(CategorySchema),
});

type Label = z.infer<typeof LabelSchema>;
type Category = z.infer<typeof CategorySchema>;

// Fetcher function for SWR: throws on error so SWR catches it
async function fetchMenuData() {
  const res = await listMenuData();

  if (!res.ok) {
    throw new Error(res.error || "Failed to load menu data");
  }

  const parsed = StateSchema.safeParse(res.data);
  if (!parsed.success) {
    console.error("Schema Validation Failed:", parsed.error);
    throw new Error("Invalid server payload");
  }

  return parsed.data;
}

type MenuContextValue = {
  labels: Label[];
  categories: Category[];
  menuTitle: string;
  menuIcon: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createLabel: (payload: unknown) => Promise<void>;
  updateLabel: (id: unknown, payload: unknown) => Promise<void>;
  deleteLabel: (id: unknown) => Promise<void>;
  reorderLabels: (ids: unknown) => Promise<void>;
  attachCategory: (labelId: unknown, categoryId: unknown) => Promise<void>;
  detachCategory: (labelId: unknown, categoryId: unknown) => Promise<void>;
  reorderCategoriesInLabel: (
    labelId: unknown,
    categoryIds: unknown
  ) => Promise<void>;
  createCategory: (payload: unknown) => Promise<void>;
  setMenuTitle: (s: string) => void;
  setMenuIcon: (s: string) => void;
};

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("MenuContext missing provider");
  return ctx;
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  // Use SWR to fetch menu data
  const { data, error, isLoading } = useSWR("menu-data", fetchMenuData, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Local state for UI-only properties (not from server)
  const [menuTitle, setMenuTitle] = useState("");
  const [menuIcon, setMenuIcon] = useState("");

  // Extracted for readability
  const labels = data?.labels ?? [];
  const categories = data?.categories ?? [];
  const errorMessage = error ? error.message : null;

  // Mutation helpers: call server action and revalidate cache
  async function createLabel(payload: unknown) {
    const res = await createLabelAction(payload);
    if (res.ok) await mutate("menu-data");
  }
  async function updateLabel(id: unknown, payload: unknown) {
    const res = await updateLabelAction(id, payload);
    if (res.ok) await mutate("menu-data");
  }
  async function deleteLabel(id: unknown) {
    const res = await deleteLabelAction(id);
    if (res.ok) await mutate("menu-data");
  }
  async function reorderLabels(ids: unknown) {
    const res = await reorderLabelsAction(ids);
    if (res.ok) await mutate("menu-data");
  }
  async function attachCategory(labelId: unknown, categoryId: unknown) {
    const res = await attachCategoryAction(labelId, categoryId);
    if (res.ok) await mutate("menu-data");
  }
  async function detachCategory(labelId: unknown, categoryId: unknown) {
    const res = await detachCategoryAction(labelId, categoryId);
    if (res.ok) await mutate("menu-data");
  }
  async function reorderCategoriesInLabel(
    labelId: unknown,
    categoryIds: unknown
  ) {
    const res = await reorderCategoriesInLabelAction(labelId, categoryIds);
    if (res.ok) await mutate("menu-data");
  }
  async function createCategory(payload: unknown) {
    const res = await createCategoryAction(payload);
    if (res.ok) await mutate("menu-data");
  }

  // Expose manual refresh function
  const refresh = () => mutate("menu-data");

  const value: MenuContextValue = {
    labels,
    categories,
    menuTitle,
    menuIcon,
    isLoading,
    error: errorMessage,
    refresh,
    createLabel,
    updateLabel,
    deleteLabel,
    reorderLabels,
    attachCategory,
    detachCategory,
    reorderCategoriesInLabel,
    createCategory,
    setMenuTitle,
    setMenuIcon,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

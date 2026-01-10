"use client";

import { generateSlug } from "@/hooks/useSlugGenerator";
import { createContext, useContext } from "react";
import { useMenuBuilderState } from "../hooks/useMenuBuilderState";
import { useProductMenuData } from "../hooks/useProductMenuData";
import { useProductMenuMutations } from "../hooks/useProductMenuMutations";

type MenuBuilderContextValue = ReturnType<typeof useProductMenuData> &
  ReturnType<typeof useProductMenuMutations> & {
    builder: ReturnType<typeof useMenuBuilderState>;
    createNewCategory: () => Promise<void>;
  };

const MenuBuilderContext = createContext<MenuBuilderContextValue | undefined>(undefined);

export function useMenuBuilder() {
  const ctx = useContext(MenuBuilderContext);
  if (!ctx) throw new Error("MenuBuilderProvider missing");
  return ctx;
}

export function MenuBuilderProvider({ children }: { children: React.ReactNode }) {
  const data = useProductMenuData();
  const mutations = useProductMenuMutations();
  const builderState = useMenuBuilderState();

  const createNewCategory = async () => {
    const existingNames = data.categories.map((c) => c.name);
    let counter = 1;
    let newName = "New Category";
    while (existingNames.includes(newName)) {
      newName = `New Category ${counter}`;
      counter++;
    }
    const slug = generateSlug(newName);
    await mutations.createCategory({ name: newName, slug });
  };

  const value: MenuBuilderContextValue = {
    ...data,
    ...mutations,
    builder: builderState,
    createNewCategory,
  };

  return <MenuBuilderContext.Provider value={value}>{children}</MenuBuilderContext.Provider>;
}

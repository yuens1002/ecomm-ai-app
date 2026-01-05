"use client";

import { createContext, useContext } from "react";
import { useProductMenuData } from "../hooks/useProductMenuData";
import { useProductMenuMutations } from "../hooks/useProductMenuMutations";
import { useMenuBuilderState } from "../hooks/useMenuBuilderState";

type MenuBuilderContextValue = ReturnType<typeof useProductMenuData> &
  ReturnType<typeof useProductMenuMutations> & {
    builder: ReturnType<typeof useMenuBuilderState>;
  };

const MenuBuilderContext = createContext<MenuBuilderContextValue | undefined>(
  undefined
);

export function useMenuBuilder() {
  const ctx = useContext(MenuBuilderContext);
  if (!ctx) throw new Error("MenuBuilderProvider missing");
  return ctx;
}

export function MenuBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = useProductMenuData();
  const mutations = useProductMenuMutations();
  const builderState = useMenuBuilderState();

  const value: MenuBuilderContextValue = {
    ...data,
    ...mutations,
    builder: builderState,
  };

  return (
    <MenuBuilderContext.Provider value={value}>
      {children}
    </MenuBuilderContext.Provider>
  );
}

"use client";

import { createContext, useContext } from "react";
import { useProductMenuData } from "./hooks/useProductMenuData";
import { useProductMenuMutations } from "./hooks/useProductMenuMutations";
import { useMenuBuilderState } from "./hooks/useMenuBuilderState";

type ProductMenuContextValue = ReturnType<typeof useProductMenuData> &
  ReturnType<typeof useProductMenuMutations> & {
    builder: ReturnType<typeof useMenuBuilderState>;
  };

const ProductMenuContext = createContext<ProductMenuContextValue | undefined>(
  undefined
);

export function useProductMenu() {
  const ctx = useContext(ProductMenuContext);
  if (!ctx) throw new Error("ProductMenuProvider missing");
  return ctx;
}

export function ProductMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = useProductMenuData();
  const mutations = useProductMenuMutations();
  const builderState = useMenuBuilderState();

  const value: ProductMenuContextValue = {
    ...data,
    ...mutations,
    builder: builderState,
  };

  return (
    <ProductMenuContext.Provider value={value}>
      {children}
    </ProductMenuContext.Provider>
  );
}

"use client";

import { createContext, useContext } from "react";
import { useProductMenuData } from "./hooks/useProductMenuData";
import { useProductMenuMutations } from "./hooks/useProductMenuMutations";

type ProductMenuContextValue = ReturnType<typeof useProductMenuData> &
  ReturnType<typeof useProductMenuMutations>;

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

  const value: ProductMenuContextValue = {
    ...data,
    ...mutations,
  };

  return (
    <ProductMenuContext.Provider value={value}>
      {children}
    </ProductMenuContext.Provider>
  );
}

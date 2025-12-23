"use client";

import { createContext, useContext, useState } from "react";
import { useProductMenu } from "../ProductMenuProvider";

type PreviewMode = "desktop" | "mobile";

type MenuBuilderContextValue = {
  previewMode: PreviewMode;
  setPreviewMode: (v: PreviewMode) => void;

  menuTitleDraft: string;
  setMenuTitleDraft: (v: string) => void;
  menuIconDraft: string;
  setMenuIconDraft: (v: string) => void;
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
  const menu = useProductMenu();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  const [menuTitleDraft, setMenuTitleDraft] = useState(
    menu.settings?.text || "Shop"
  );
  const [menuIconDraft, setMenuIconDraft] = useState(
    menu.settings?.icon || "ShoppingBag"
  );

  return (
    <MenuBuilderContext.Provider
      value={{
        previewMode,
        setPreviewMode,
        menuTitleDraft,
        setMenuTitleDraft,
        menuIconDraft,
        setMenuIconDraft,
      }}
    >
      {children}
    </MenuBuilderContext.Provider>
  );
}

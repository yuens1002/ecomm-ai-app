"use client";

import { createContext, useContext, useState } from "react";

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
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  // Draft states start as empty strings (not initialized from DB)
  const [menuTitleDraft, setMenuTitleDraft] = useState("");
  const [menuIconDraft, setMenuIconDraft] = useState("");

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

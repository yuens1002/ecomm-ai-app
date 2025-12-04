"use client";

import { createContext, useContext, ReactNode } from "react";

interface PageContextValue {
  pageSlug: string;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageProvider({
  pageSlug,
  children,
}: {
  pageSlug: string;
  children: ReactNode;
}) {
  return (
    <PageContext.Provider value={{ pageSlug }}>{children}</PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within a PageProvider");
  }
  return context;
}

/**
 * Safe version that returns null if not in a PageProvider
 * Useful for components that may be used outside of page editing context
 */
export function usePageContextSafe() {
  return useContext(PageContext);
}

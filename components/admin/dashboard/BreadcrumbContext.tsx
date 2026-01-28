"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbContextValue = {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Sets dynamic breadcrumb items for the current view.
 * Items are automatically cleared on unmount.
 *
 * @param items - Memoized array of breadcrumb items (use useMemo to prevent re-renders)
 *
 * @example
 * const crumbs = useMemo(() =>
 *   product ? [{ label: product.name }] : []
 * , [product]);
 * useBreadcrumb(crumbs);
 */
export function useBreadcrumb(items: BreadcrumbItem[]) {
  const context = useContext(BreadcrumbContext);

  useEffect(() => {
    context?.setItems(items);
    return () => context?.setItems([]);
  }, [items, context]);
}

/**
 * Reads current breadcrumb items from context.
 * Used internally by AdminBreadcrumb.
 */
export function useBreadcrumbItems(): BreadcrumbItem[] {
  const context = useContext(BreadcrumbContext);
  return context?.items ?? [];
}

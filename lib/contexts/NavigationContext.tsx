"use client";

import {
  createContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { RouteEntry, BreadcrumbItem } from "@/lib/navigation/types";
import {
  resolveRoute,
  getAncestorIds,
  buildBreadcrumbChain,
} from "@/lib/navigation/navigation-core";

/**
 * Navigation Context Value
 *
 * This is the internal state shape. Consumers should use purpose-built hooks
 * from lib/navigation/hooks.ts instead of accessing this directly.
 */
interface NavigationContextValue {
  /** The currently active route, or null if no match */
  activeRoute: RouteEntry | null;
  /** Set of all ancestor route IDs for the active route */
  activeAncestorIds: Set<string>;
  /** Current pathname */
  pathname: string;
  /** Current search params */
  searchParams: URLSearchParams;
  /** Breadcrumb trail for the current route */
  breadcrumbs: BreadcrumbItem[];
}

/**
 * Navigation Context
 *
 * Provides navigation state to all admin components.
 * Use hooks from lib/navigation/hooks.ts to access this state.
 */
export const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * Navigation Provider
 *
 * Listens to URL changes and resolves the current route.
 * Computes ancestor IDs and breadcrumbs for the active route.
 *
 * Usage: Wrap your admin layout with this provider.
 *
 * @example
 * <NavigationProvider>
 *   <AdminShell>...</AdminShell>
 * </NavigationProvider>
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve the current route
  const resolved = useMemo(() => {
    return resolveRoute(pathname, searchParams);
  }, [pathname, searchParams]);

  const activeRoute = resolved?.route ?? null;

  // Compute ancestor IDs for the active route
  const activeAncestorIds = useMemo(() => {
    if (!activeRoute) return new Set<string>();
    return getAncestorIds(activeRoute.id);
  }, [activeRoute]);

  // Build breadcrumbs (now synchronous - no server-side data fetching)
  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbChain(activeRoute, pathname, searchParams);
  }, [activeRoute, pathname, searchParams]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<NavigationContextValue>(
    () => ({
      activeRoute,
      activeAncestorIds,
      pathname,
      searchParams,
      breadcrumbs,
    }),
    [activeRoute, activeAncestorIds, pathname, searchParams, breadcrumbs]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

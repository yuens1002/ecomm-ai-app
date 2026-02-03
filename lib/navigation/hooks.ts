"use client";

import { useContext } from "react";
import { NavigationContext } from "@/lib/contexts/NavigationContext";
import type { BreadcrumbItem, RouteEntry, MenuBuilderView } from "./types";
import {
  isRouteActive as checkIsRouteActive,
  hasActiveDescendant as checkHasActiveDescendant,
  getMenuBuilderView,
} from "./navigation-core";

/**
 * Purpose-Built Navigation Hooks
 *
 * These hooks provide a clean API for navigation consumers.
 * Each hook answers a specific question - no translation code needed in components.
 */

/**
 * Internal hook to get navigation context.
 * Throws if used outside NavigationProvider.
 */
function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigationContext must be used within NavigationProvider");
  }
  return context;
}

/**
 * Check if a specific route is active or is an ancestor of the active route.
 *
 * Use this for nav items: "Am I active or is one of my children active?"
 *
 * @param routeId - The route ID to check (e.g., "admin.menu-builder.categories")
 * @returns boolean - True if the route is active or contains the active route
 *
 * @example
 * const isActive = useIsRouteActive('admin.products.coffees');
 * <NavItem className={isActive ? 'active' : ''}>Coffees</NavItem>
 */
export function useIsRouteActive(routeId: string): boolean {
  const { activeRoute, activeAncestorIds } = useNavigationContext();
  return checkIsRouteActive(routeId, activeRoute, activeAncestorIds);
}

/**
 * Check if a route ID has an active descendant (but is not itself active).
 *
 * Use this for parent nav groups: "Should I be visually highlighted because my child is active?"
 *
 * @param routeId - The route ID to check (e.g., "admin.products")
 * @returns boolean - True if an active route is a descendant of this route
 *
 * @example
 * const hasActiveChild = useHasActiveDescendant('admin.products');
 * <ParentMenu className={hasActiveChild ? 'has-active-child' : ''}>Products</ParentMenu>
 */
export function useHasActiveDescendant(routeId: string): boolean {
  const { activeRoute, activeAncestorIds } = useNavigationContext();
  return checkHasActiveDescendant(routeId, activeRoute, activeAncestorIds);
}

/**
 * Get the breadcrumb trail for the current route.
 *
 * Use this for breadcrumbs: "What's the path from root to current?"
 *
 * @returns BreadcrumbItem[] - Array of breadcrumb items from root to current page
 *
 * @example
 * const crumbs = useBreadcrumbTrail();
 * // [{ id: 'admin', label: 'Home', href: '/admin' },
 * //  { id: 'admin.products', label: 'Products', href: null },
 * //  { id: 'admin.products.coffees', label: 'Coffees', href: null }]
 */
export function useBreadcrumbTrail(): BreadcrumbItem[] {
  const { breadcrumbs } = useNavigationContext();
  return breadcrumbs;
}

/**
 * Get the currently active Menu Builder view.
 *
 * Use this for Menu Builder tabs: "Which view tab is currently selected?"
 *
 * @returns MenuBuilderView | null - The active view type, or null if not on Menu Builder
 *
 * @example
 * const activeView = useActiveMenuBuilderView();
 * // 'menu' | 'label' | 'category' | 'all-labels' | 'all-categories' | null
 */
export function useActiveMenuBuilderView(): MenuBuilderView | null {
  const { pathname, searchParams } = useNavigationContext();
  return getMenuBuilderView(pathname, searchParams) as MenuBuilderView | null;
}

/**
 * Get the currently active route entry.
 *
 * Use this when you need full route information.
 *
 * @returns RouteEntry | null - The active route, or null if no match
 */
export function useActiveRoute(): RouteEntry | null {
  const { activeRoute } = useNavigationContext();
  return activeRoute;
}

/**
 * Get the current pathname.
 *
 * Use this when you need the raw pathname.
 *
 * @returns string - The current pathname
 */
export function useCurrentPathname(): string {
  const { pathname } = useNavigationContext();
  return pathname;
}

/**
 * Get the current search params.
 *
 * Use this when you need the raw search params.
 *
 * @returns URLSearchParams - The current search params
 */
export function useCurrentSearchParams(): URLSearchParams {
  const { searchParams } = useNavigationContext();
  return searchParams;
}

/**
 * Check if a specific href matches the active route.
 *
 * This is useful for backward compatibility with existing nav items
 * that use hrefs instead of route IDs.
 *
 * @param href - The href to check (e.g., "/admin/product-menu?view=all-categories")
 * @returns boolean - True if the href matches the active route
 */
export function useIsHrefActive(href: string): boolean {
  const { pathname, searchParams, activeRoute } = useNavigationContext();

  if (!activeRoute) return false;

  // Parse the href
  const [hrefPathname, hrefQueryString] = href.split("?");
  const hrefParams = new URLSearchParams(hrefQueryString || "");

  // Check pathname match
  if (pathname !== hrefPathname) return false;

  // For hrefs with query params, all params must match
  if (hrefQueryString) {
    for (const [key, value] of hrefParams.entries()) {
      if (searchParams.get(key) !== value) {
        return false;
      }
    }
  }

  return true;
}

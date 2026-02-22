import type { RouteEntry, ResolvedRoute, BreadcrumbItem } from "./types";
import { getAllRoutes, getRouteById, getChildRoutes } from "./route-registry";

/**
 * Navigation Core - Pure Functions for Route Resolution
 *
 * These functions are the heart of the navigation system.
 * They resolve URLs to routes and build breadcrumb chains.
 */

/**
 * Calculate match score for a route against a URL.
 * Higher score = better match.
 *
 * Scoring (more specific = higher priority):
 * - param match (pathname + all query params): 110+ points (most specific)
 * - exact match (pathname only): 100 points
 * - prefix-nested match (nested paths only): 70 points + (pathname length / 10)
 * - prefix match: 50 points + (pathname length / 10)
 * - no match: -1 (invalid)
 *
 * Param matches score highest because they require BOTH pathname AND query
 * params to match, making them more specific than exact pathname-only matches.
 */
function calculateMatchScore(
  route: RouteEntry,
  pathname: string,
  searchParams: URLSearchParams
): number {
  const routePathname = route.pathname;

  switch (route.matchMode) {
    case "exact": {
      if (pathname === routePathname) {
        return 100;
      }
      return -1;
    }

    case "param": {
      // Pathname must match
      if (pathname !== routePathname) {
        return -1;
      }

      // All specified query params must match
      if (route.queryParams) {
        for (const [key, value] of Object.entries(route.queryParams)) {
          if (searchParams.get(key) !== value) {
            return -1;
          }
        }
        // Score higher than exact (110+) because param matches are more specific
        // More params = even more specific
        return 110 + Object.keys(route.queryParams).length;
      }

      return 110;
    }

    case "prefix": {
      if (pathname === routePathname) {
        return 50 + routePathname.length / 10;
      }
      if (pathname.startsWith(routePathname + "/")) {
        return 50 + routePathname.length / 10;
      }
      return -1;
    }

    case "prefix-nested": {
      // Only matches when there's more path AFTER the route pathname
      // Used for path-segment dynamic routes like /admin/orders/[id]
      // Does NOT match the base path itself (unlike regular prefix)
      if (pathname.startsWith(routePathname + "/") && pathname !== routePathname) {
        // Score higher than regular prefix to win over grouping routes
        return 70 + routePathname.length / 10;
      }
      return -1;
    }

    default:
      return -1;
  }
}

/**
 * Resolve the current URL to the best matching route.
 * Returns null if no route matches.
 */
export function resolveRoute(
  pathname: string,
  searchParams: URLSearchParams
): ResolvedRoute | null {
  const routes = getAllRoutes();
  let bestMatch: ResolvedRoute | null = null;

  for (const route of routes) {
    const score = calculateMatchScore(route, pathname, searchParams);

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { route, score };
    }
  }

  return bestMatch;
}

/**
 * Get all ancestor IDs for a route by walking up the parentId chain.
 * Returns a Set for O(1) lookup.
 */
export function getAncestorIds(routeId: string): Set<string> {
  const ancestors = new Set<string>();
  let currentId: string | undefined | null = routeId;

  while (currentId) {
    const route = getRouteById(currentId);
    if (!route || route.parentId === undefined) break;

    if (route.parentId) {
      ancestors.add(route.parentId);
      currentId = route.parentId;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Build the breadcrumb chain for a resolved route.
 *
 * Builds static breadcrumbs from the parent chain. For routes with dynamic
 * labels (like product edit pages), this provides the base chain - components
 * should use BreadcrumbContext's useBreadcrumb() to add entity-specific names.
 *
 * Note: Breadcrumb resolvers are NOT called on the client side to avoid
 * bundling Prisma into the client. Dynamic entity names should be added
 * via BreadcrumbContext from the page components that already have the data.
 */
export function buildBreadcrumbChain(
  route: RouteEntry | null,
  _pathname: string,
  _searchParams: URLSearchParams
): BreadcrumbItem[] {
  if (!route) {
    // Fallback: just show Home
    return [{ id: "admin", label: "Home", href: "/admin" }];
  }

  // Build from parent chain (static breadcrumbs only)
  const chain: BreadcrumbItem[] = [];
  let currentRoute: RouteEntry | undefined = route;

  // Walk up the parent chain
  while (currentRoute) {
    // Only add if the route has a label
    if (currentRoute.label) {
      chain.unshift({
        id: currentRoute.id,
        label: currentRoute.label,
        href: currentRoute.isNavigable && currentRoute !== route
          ? buildHref(currentRoute)
          : null,
      });
    }

    // Move to parent
    if (currentRoute.parentId) {
      currentRoute = getRouteById(currentRoute.parentId);
    } else {
      break;
    }
  }

  // Ensure Home is always first
  if (chain.length === 0 || chain[0].id !== "admin") {
    chain.unshift({ id: "admin", label: "Home", href: "/admin" });
  }

  // Note: We don't set the last item's href to null here.
  // The consumer (AdminBreadcrumb) handles this via the `isLast` prop,
  // which correctly accounts for BreadcrumbContext custom items.

  return chain;
}

/**
 * Build href for a route entry.
 */
export function buildHref(route: RouteEntry): string {
  if (!route.isNavigable) return "#";

  let href = route.pathname;

  if (route.queryParams && Object.keys(route.queryParams).length > 0) {
    const params = new URLSearchParams(route.queryParams);
    href += "?" + params.toString();
  }

  return href;
}

/**
 * Check if a route ID matches the active route or is an ancestor of it.
 * This is used by navigation components to determine active state.
 */
export function isRouteActive(
  routeId: string,
  activeRoute: RouteEntry | null,
  activeAncestorIds: Set<string>
): boolean {
  if (!activeRoute) return false;
  return activeRoute.id === routeId || activeAncestorIds.has(routeId);
}

/**
 * Check if a route ID has an active descendant.
 * Used for parent menu items to show they contain the active route.
 */
export function hasActiveDescendant(
  routeId: string,
  activeRoute: RouteEntry | null,
  activeAncestorIds: Set<string>
): boolean {
  if (!activeRoute) return false;
  // Route is an ancestor of the active route
  return activeAncestorIds.has(routeId);
}

/**
 * Get the current Menu Builder view from URL.
 * Returns null if not on a Menu Builder page.
 */
export function getMenuBuilderView(
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  if (pathname !== "/admin/product-menu") {
    return null;
  }

  const view = searchParams.get("view");
  const validViews = ["menu", "label", "category", "all-labels", "all-categories"];

  if (view && validViews.includes(view)) {
    return view;
  }

  // Default to "menu" if on product-menu page without valid view
  return "menu";
}

/**
 * Find a route by its href (for backward compatibility with admin-nav.ts links).
 */
export function findRouteByHref(href: string): RouteEntry | null {
  const routes = getAllRoutes();
  const [pathname, queryString] = href.split("?");
  const searchParams = new URLSearchParams(queryString || "");

  for (const route of routes) {
    // Check exact pathname match
    if (route.pathname !== pathname) continue;

    // For param routes, check query params
    if (route.matchMode === "param" && route.queryParams) {
      let allMatch = true;
      for (const [key, value] of Object.entries(route.queryParams)) {
        if (searchParams.get(key) !== value) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return route;
    }

    // For exact routes, check no extra query params needed
    if (route.matchMode === "exact") {
      return route;
    }
  }

  return null;
}

/**
 * Get navigable child routes with labels for a given route ID.
 * Used by breadcrumb dropdowns to build menu items.
 * Returns { label, href } pairs for children that are both navigable and have static labels.
 */
export function getNavigableChildren(
  routeId: string
): Array<{ label: string; href: string }> {
  return getChildRoutes(routeId)
    .filter((r) => r.isNavigable && r.label !== null)
    .map((r) => ({ label: r.label!, href: buildHref(r) }));
}

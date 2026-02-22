/**
 * Unified Admin Navigation System
 *
 * This module provides a centralized navigation system using a pub/sub architecture.
 * The Route Registry is the single source of truth for all navigation data.
 *
 * ## Usage
 *
 * ```tsx
 * // In components, use the purpose-built hooks:
 * import { useIsRouteActive, useBreadcrumbTrail } from '@/lib/navigation';
 *
 * function MyNavItem({ routeId, label }) {
 *   const isActive = useIsRouteActive(routeId);
 *   return <div className={isActive ? 'active' : ''}>{label}</div>;
 * }
 *
 * function Breadcrumbs() {
 *   const crumbs = useBreadcrumbTrail();
 *   return <nav>{crumbs.map(c => <span key={c.id}>{c.label}</span>)}</nav>;
 * }
 * ```
 *
 * ## Architecture
 *
 * - **Route Registry**: Defines all navigable routes with parent/child hierarchy
 * - **Navigation Core**: Pure functions for route resolution and breadcrumb building
 * - **Hooks**: Purpose-built hooks for components (useIsRouteActive, useBreadcrumbTrail, etc.)
 * - **Context**: NavigationProvider that listens to URL changes and provides state
 * - **Resolvers**: Async functions for dynamic breadcrumb labels (products, categories, labels)
 */

// Types
export type {
  RouteEntry,
  RouteMatchMode,
  BreadcrumbItem,
  BreadcrumbResolver,
  ResolvedRoute,
  NavigationState,
  MenuBuilderView,
  RouteRegistry,
} from "./types";

// Route Registry
export {
  routeRegistry,
  getAllRoutes,
  getRouteById,
  getChildRoutes,
  getNavigableRoutes,
  getTopLevelGroups,
} from "./route-registry";

// Navigation Core (pure functions)
export {
  resolveRoute,
  getAncestorIds,
  buildBreadcrumbChain,
  buildHref,
  getNavigableChildren,
  isRouteActive,
  hasActiveDescendant,
  getMenuBuilderView,
  findRouteByHref,
} from "./navigation-core";

// Purpose-built Hooks
export {
  useIsRouteActive,
  useHasActiveDescendant,
  useBreadcrumbTrail,
  useActiveMenuBuilderView,
  useActiveRoute,
  useCurrentPathname,
  useCurrentSearchParams,
  useIsHrefActive,
} from "./hooks";

// Note: Breadcrumb resolvers are NOT exported here as they use Prisma
// and should only be used server-side. For dynamic entity names in breadcrumbs,
// use BreadcrumbContext's useBreadcrumb() hook from page components.

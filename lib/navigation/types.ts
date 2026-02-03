import type { LucideIcon } from "lucide-react";

/**
 * Route matching modes:
 * - "exact": Pathname must match exactly
 * - "prefix": Pathname must start with the route pathname (for nested routes)
 * - "prefix-nested": Like prefix, but only matches when there's more path after (for /orders/[id] style routes)
 * - "param": Pathname matches AND all specified queryParams must match
 */
export type RouteMatchMode = "exact" | "prefix" | "prefix-nested" | "param";

/**
 * A route entry in the navigation registry.
 * Routes can be static (known at build time) or pattern routes (matched by shape).
 */
export interface RouteEntry {
  /** Unique identifier using dot notation (e.g., "admin.menu-builder.all-categories") */
  id: string;
  /** The pathname to match (e.g., "/admin/product-menu") */
  pathname: string;
  /** Query params to match for "param" mode routes */
  queryParams?: Record<string, string>;
  /** How to match this route */
  matchMode: RouteMatchMode;
  /** Display label - null means resolved at runtime by breadcrumb resolver */
  label: string | null;
  /** Parent route ID - null means resolved at runtime, undefined means no parent */
  parentId?: string | null;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Whether this route is navigable (true = clickable link, false = grouping only) */
  isNavigable: boolean;
  /** Named resolver for dynamic routes */
  breadcrumbResolver?: string;
}

/**
 * A breadcrumb item for display.
 */
export interface BreadcrumbItem {
  /** Unique identifier for this breadcrumb */
  id: string;
  /** Display label */
  label: string;
  /** Link href - null means current page (not clickable) */
  href: string | null;
}

/**
 * Breadcrumb resolver function type.
 * Used for dynamic entity routes where labels must be fetched at runtime.
 */
export type BreadcrumbResolver = (
  pathname: string,
  searchParams: URLSearchParams
) => Promise<BreadcrumbItem[]>;

/**
 * Resolved route with match score.
 * Higher score = better match.
 */
export interface ResolvedRoute {
  route: RouteEntry;
  score: number;
}

/**
 * Navigation state exposed to consumers via context.
 * This is the internal state shape - consumers should use purpose-built hooks instead.
 */
export interface NavigationState {
  /** The currently active route, or null if no match */
  activeRoute: RouteEntry | null;
  /** Set of all ancestor route IDs for the active route */
  activeAncestorIds: Set<string>;
  /** Current pathname */
  pathname: string;
  /** Current search params */
  searchParams: URLSearchParams;
}

/**
 * Menu Builder view types (for specialized hook)
 */
export type MenuBuilderView = "menu" | "label" | "category" | "all-labels" | "all-categories";

/**
 * Route registry configuration.
 * Maps route IDs to their entries for efficient lookup.
 */
export type RouteRegistry = Map<string, RouteEntry>;

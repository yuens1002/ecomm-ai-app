# Route Registry

The Route Registry (`lib/navigation/route-registry.ts`) is the single source of truth for all navigable admin routes.

## Route Entry Structure

```typescript
interface RouteEntry {
  id: string;                              // Unique identifier
  pathname: string;                        // URL pathname to match
  queryParams?: Record<string, string>;    // Query params for "param" mode
  matchMode: RouteMatchMode;               // How to match this route
  label: string | null;                    // Display label (null = dynamic)
  parentId?: string | null;                // Parent route for hierarchy
  icon?: LucideIcon;                       // Optional icon component
  isNavigable: boolean;                    // true = clickable, false = grouping
  breadcrumbResolver?: string;             // Named resolver for dynamic routes
}
```

## Match Modes

### `exact`

Pathname must match exactly. No query params considered.

```typescript
{
  id: "admin.products.coffees",
  pathname: "/admin/products",
  matchMode: "exact",
  label: "Coffees",
}
// Matches: /admin/products
// No match: /admin/products/123, /admin/products?view=edit
```

### `prefix`

Pathname must start with the route pathname. Used for nested routes and grouping.

```typescript
{
  id: "admin.settings",
  pathname: "/admin/settings",
  matchMode: "prefix",
  label: "Settings",
}
// Matches: /admin/settings, /admin/settings/storefront, /admin/settings/contact
// No match: /admin/settingsXYZ
```

### `prefix-nested`

Like `prefix`, but only matches when there's more path after the base. Used for path-segment dynamic routes like `/orders/[id]`.

```typescript
{
  id: "admin.orders.detail",
  pathname: "/admin/orders",
  matchMode: "prefix-nested",
  label: null,  // Dynamic - use BreadcrumbContext
  parentId: "admin.orders.all",
}
// Matches: /admin/orders/abc123, /admin/orders/xyz/items
// No match: /admin/orders (use exact or prefix for list page)
```

This ensures list pages (`exact`) and detail pages (`prefix-nested`) don't conflict:

| URL | `exact` on `/admin/orders` | `prefix-nested` on `/admin/orders` |
|-----|----------------------------|-----------------------------------|
| `/admin/orders` | Match (100 pts) | No match |
| `/admin/orders/abc` | No match | Match (71.3 pts) |

### `param`

Pathname matches AND all specified query params must match. Used for view-based navigation.

```typescript
{
  id: "admin.menu-builder.all-categories",
  pathname: "/admin/product-menu",
  queryParams: { view: "all-categories" },
  matchMode: "param",
  label: "Categories",
}
// Matches: /admin/product-menu?view=all-categories
// No match: /admin/product-menu?view=all-labels
// No match: /admin/product-menu?view=all-categories&other=param (still matches - extra params OK)
```

## Route Hierarchy

Routes form a tree via `parentId`:

```text
admin (root)
├── admin.dashboard
│   ├── admin.dashboard.overview
│   └── admin.dashboard.analytics
├── admin.products
│   ├── admin.products.coffees
│   ├── admin.products.merch
│   └── admin.menu-builder
│       ├── admin.menu-builder.all-categories
│       ├── admin.menu-builder.all-labels
│       ├── admin.menu-builder.menu
│       ├── admin.menu-builder.category (dynamic)
│       └── admin.menu-builder.label (dynamic)
├── admin.orders
│   ├── admin.orders.all
│   └── admin.orders.subscriptions
├── admin.pages
│   ├── admin.pages.about
│   ├── admin.pages.cafe
│   └── admin.pages.faq
├── admin.management
│   ├── admin.management.users
│   ├── admin.management.newsletter
│   └── admin.management.support
└── admin.settings
    ├── admin.settings.general
    ├── admin.settings.storefront
    ├── admin.settings.location
    ├── admin.settings.commerce
    ├── admin.settings.marketing
    ├── admin.settings.contact
    └── admin.settings.social-links
```

## Grouping Routes

Routes with `isNavigable: false` are used for grouping in the hierarchy but aren't clickable links:

```typescript
{
  id: "admin.products",
  pathname: "/admin/products",
  matchMode: "prefix",
  label: "Products",
  parentId: undefined,
  isNavigable: false,  // Just a parent category
}
```

## Dynamic Routes

Routes with `label: null` have labels resolved at runtime:

```typescript
{
  id: "admin.menu-builder.category",
  pathname: "/admin/product-menu",
  queryParams: { view: "category" },
  matchMode: "param",
  label: null,  // Will be "Origins", "Roasts", etc.
  parentId: "admin.menu-builder.all-categories",
  breadcrumbResolver: "categoryView",
}
```

Note: The `breadcrumbResolver` is server-only. For client-side, use `BreadcrumbContext` to add the entity name.

## Adding New Routes

1. Add the route entry to `routeEntries` array in `route-registry.ts`:

```typescript
{
  id: "admin.new-feature",
  pathname: "/admin/new-feature",
  matchMode: "exact",
  label: "New Feature",
  parentId: "admin.products",  // or appropriate parent
  isNavigable: true,
}
```

1. If it's a view-based route, add query params:

```typescript
{
  id: "admin.new-feature.view-a",
  pathname: "/admin/new-feature",
  queryParams: { view: "a" },
  matchMode: "param",
  label: "View A",
  parentId: "admin.new-feature",
  isNavigable: true,
}
```

1. Update `admin-nav.ts` if the route should appear in the nav menu (the nav menu still uses the old config for rendering structure).

## API Functions

```typescript
// Get all routes
getAllRoutes(): RouteEntry[]

// Get a route by ID
getRouteById(id: string): RouteEntry | undefined

// Get children of a route
getChildRoutes(parentId: string): RouteEntry[]

// Get only navigable routes
getNavigableRoutes(): RouteEntry[]

// Get top-level groups (for nav structure)
getTopLevelGroups(): RouteEntry[]
```

## Example: Menu Builder Routes

```typescript
// All Categories view
{
  id: "admin.menu-builder.all-categories",
  pathname: "/admin/product-menu",
  queryParams: { view: "all-categories" },
  matchMode: "param",
  label: "Categories",
  parentId: "admin.products",
  isNavigable: true,
}

// Single category view (dynamic)
{
  id: "admin.menu-builder.category",
  pathname: "/admin/product-menu",
  queryParams: { view: "category" },  // Note: categoryId not specified
  matchMode: "param",
  label: null,  // Resolved from context
  parentId: "admin.menu-builder.all-categories",
  breadcrumbResolver: "categoryView",
  isNavigable: true,
}
```

When on `/admin/product-menu?view=category&categoryId=abc123`:

- Route resolves to `admin.menu-builder.category`
- Breadcrumb shows: Home > Products > Categories > [Category Name]
- The category name comes from `BreadcrumbContext`, not the resolver

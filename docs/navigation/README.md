# Unified Admin Navigation System

A centralized navigation system using a pub/sub architecture where all navigation consumers (top nav, mobile nav, breadcrumbs, Menu Builder) subscribe to a single source of truth.

## Start Here

**New to the navigation system?** Read the [Use Cases Guide](./use-cases.md) - it covers every scenario with complete examples.

## Quick Reference

| I want to... | What to do |
|--------------|------------|
| Add a new admin page | [Use Case 1](./use-cases.md#use-case-1-adding-a-new-static-admin-page) - Add route to registry |
| Add view-based navigation | [Use Case 2](./use-cases.md#use-case-2-adding-a-view-based-page-query-params) - Add param routes |
| Show entity name in breadcrumb | [Use Case 3](./use-cases.md#use-case-3-adding-dynamic-entity-breadcrumbs) - Call `useBreadcrumb()` |
| Add path-segment dynamic page | [Use Case 4](./use-cases.md#use-case-4-path-segment-dynamic-routes-eg-ordersid) - Use `prefix-nested` match mode |
| Build custom nav component | [Use Case 5](./use-cases.md#use-case-5-building-a-custom-nav-component) - Use navigation hooks |
| Debug navigation state | [Use Case 7](./use-cases.md#use-case-7-debugging-navigation-state) - Use `useActiveRoute()` |

## Documentation

- **[Use Cases Guide](./use-cases.md)** - All opt-in scenarios with examples (start here)
- [Architecture](./architecture.md) - Pub/sub pattern, diagrams, design decisions
- [Route Registry](./route-registry.md) - Route types, match modes, adding routes
- [Hooks API](./hooks-api.md) - Purpose-built hooks reference
- [Dynamic Breadcrumbs](./breadcrumb-resolvers.md) - Entity names in breadcrumbs

## Quick Start

```tsx
// In components, use the purpose-built hooks:
import { useIsRouteActive, useBreadcrumbTrail } from '@/lib/navigation';

// Check if a route is active
function NavItem({ routeId, label }) {
  const isActive = useIsRouteActive(routeId);
  return <div className={isActive ? 'active' : ''}>{label}</div>;
}

// Get breadcrumb trail
function Breadcrumbs() {
  const crumbs = useBreadcrumbTrail();
  return (
    <nav>
      {crumbs.map(c => (
        <span key={c.id}>{c.label}</span>
      ))}
    </nav>
  );
}
```

## File Structure

```text
lib/
├── navigation/
│   ├── index.ts              # Barrel exports
│   ├── types.ts              # Type definitions
│   ├── route-registry.ts     # Single source of truth for routes
│   ├── navigation-core.ts    # Pure functions for route resolution
│   ├── hooks.ts              # Purpose-built React hooks
│   └── resolvers.ts          # Server-only breadcrumb resolvers
└── contexts/
    └── NavigationContext.tsx # Provider + internal state
```

## The Bug This System Fixes

Previously, when navigating to `/admin/product-menu?view=all-categories`, **all three** Menu Builder nav items (Categories, Labels, Menu) would show as active because the old `matchesNavChild` function only checked pathname, ignoring query params.

The new system uses proper query param matching:

```typescript
// Old buggy behavior
if (pathname === childPathname) return true;  // All /admin/product-menu routes match!

// New correct behavior
if (route.matchMode === "param") {
  for (const [key, value] of Object.entries(route.queryParams)) {
    if (searchParams.get(key) !== value) return -1;  // No match
  }
}
```

## Key Concepts

### Route Registry

All navigable routes are defined in `route-registry.ts` with:

- Unique IDs (e.g., `admin.menu-builder.all-categories`)
- Parent/child hierarchy via `parentId`
- Match modes: `exact`, `prefix`, `param`
- Query params for view-based navigation

### Purpose-Built Hooks

Instead of exposing raw navigation state, we provide hooks that answer specific questions:

| Hook | Returns | Use Case |
|------|---------|----------|
| `useIsRouteActive(id)` | `boolean` | Nav item highlighting |
| `useHasActiveDescendant(id)` | `boolean` | Parent menu highlighting |
| `useBreadcrumbTrail()` | `BreadcrumbItem[]` | Breadcrumb rendering |
| `useActiveMenuBuilderView()` | `string \| null` | Menu Builder tab state |
| `useIsHrefActive(href)` | `boolean` | Legacy href-based checking |

### Static vs Dynamic Breadcrumbs

The navigation system provides **static** breadcrumbs (e.g., Home > Products > Categories). For **dynamic** entity names (e.g., "Midnight Espresso Blend"), use `BreadcrumbContext`:

```tsx
// In page component that has entity data
const crumbs = useMemo(() => [{ label: product.name }], [product]);
useBreadcrumb(crumbs);
```

## Migration from Old System

The old functions in `admin-nav.ts` are deprecated:

| Old Function | New Hook |
|--------------|----------|
| `isNavItemActive()` | `useHasActiveDescendant()` |
| `isNavChildActive()` | `useIsHrefActive()` |
| `findActiveNavigation()` | `useBreadcrumbTrail()` |
| `getActiveChild()` | `useIsHrefActive()` for each child |

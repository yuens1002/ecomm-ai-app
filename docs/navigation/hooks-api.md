# Navigation Hooks API

Purpose-built hooks that answer specific questions about navigation state. These hooks encapsulate all matching logic so components don't need to understand the internal state structure.

## Available Hooks

### `useIsRouteActive(routeId: string): boolean`

Check if a specific route is active or is an ancestor of the active route.

**Use case:** Nav item highlighting - "Am I active or is one of my children active?"

```tsx
import { useIsRouteActive } from '@/lib/navigation';

function NavItem({ routeId, label }) {
  const isActive = useIsRouteActive(routeId);

  return (
    <Link
      href={...}
      className={isActive ? 'bg-accent font-medium' : ''}
    >
      {label}
    </Link>
  );
}

// Usage
<NavItem routeId="admin.products.coffees" label="Coffees" />
```

---

### `useHasActiveDescendant(routeId: string): boolean`

Check if a route ID has an active descendant (but is not itself the active route).

**Use case:** Parent menu highlighting - "Should I be highlighted because my child is active?"

```tsx
import { useHasActiveDescendant } from '@/lib/navigation';

function ParentNavItem({ routeId, label, children }) {
  const hasActiveChild = useHasActiveDescendant(routeId);

  return (
    <div className={hasActiveChild ? 'bg-accent/50' : ''}>
      <span>{label}</span>
      <ChevronDown />
      {/* dropdown children */}
    </div>
  );
}

// Usage
<ParentNavItem routeId="admin.products" label="Products">
  <NavItem routeId="admin.products.coffees" label="Coffees" />
  <NavItem routeId="admin.products.merch" label="Merch" />
</ParentNavItem>
```

---

### `useBreadcrumbTrail(): BreadcrumbItem[]`

Get the breadcrumb trail for the current route.

**Use case:** Breadcrumb rendering - "What's the path from root to current page?"

```tsx
import { useBreadcrumbTrail } from '@/lib/navigation';

function Breadcrumbs() {
  const crumbs = useBreadcrumbTrail();

  return (
    <nav>
      {crumbs.map((crumb, index) => (
        <span key={crumb.id}>
          {index > 0 && <span> / </span>}
          {crumb.href ? (
            <Link href={crumb.href}>{crumb.label}</Link>
          ) : (
            <span>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// Returns:
// [
//   { id: 'admin', label: 'Home', href: '/admin' },
//   { id: 'admin.products', label: 'Products', href: null },
//   { id: 'admin.products.coffees', label: 'Coffees', href: null }
// ]
```

**BreadcrumbItem type:**

```typescript
interface BreadcrumbItem {
  id: string;         // Route ID or custom ID
  label: string;      // Display text
  href: string | null; // Link URL or null for current page
}
```

---

### `useActiveMenuBuilderView(): MenuBuilderView | null`

Get the currently active Menu Builder view.

**Use case:** Menu Builder tabs - "Which view tab is currently selected?"

```tsx
import { useActiveMenuBuilderView } from '@/lib/navigation';

function MenuBuilderTabs() {
  const activeView = useActiveMenuBuilderView();

  return (
    <div>
      <Tab active={activeView === 'all-categories'}>Categories</Tab>
      <Tab active={activeView === 'all-labels'}>Labels</Tab>
      <Tab active={activeView === 'menu'}>Menu</Tab>
    </div>
  );
}

// Returns: 'menu' | 'label' | 'category' | 'all-labels' | 'all-categories' | null
```

---

### `useIsHrefActive(href: string): boolean`

Check if a specific href matches the active route. Useful for backward compatibility with href-based nav items.

**Use case:** Legacy nav items that use hrefs instead of route IDs.

```tsx
import { useIsHrefActive } from '@/lib/navigation';

function LegacyNavItem({ href, label }) {
  const isActive = useIsHrefActive(href);

  return (
    <Link
      href={href}
      className={isActive ? 'active' : ''}
    >
      {label}
    </Link>
  );
}

// Usage
<LegacyNavItem href="/admin/product-menu?view=all-categories" label="Categories" />
```

**Important:** This hook properly compares query params, fixing the Menu Builder bug:

```tsx
// On /admin/product-menu?view=all-categories:
useIsHrefActive('/admin/product-menu?view=all-categories')  // true
useIsHrefActive('/admin/product-menu?view=all-labels')      // false
useIsHrefActive('/admin/product-menu?view=menu')            // false
```

---

### `useActiveRoute(): RouteEntry | null`

Get the currently active route entry. Use when you need full route information.

```tsx
import { useActiveRoute } from '@/lib/navigation';

function DebugInfo() {
  const route = useActiveRoute();

  return (
    <pre>
      Route: {route?.id}
      Label: {route?.label}
      Parent: {route?.parentId}
    </pre>
  );
}
```

---

### `useCurrentPathname(): string`

Get the current pathname. Equivalent to `usePathname()` from Next.js but from navigation context.

```tsx
import { useCurrentPathname } from '@/lib/navigation';

function CurrentPage() {
  const pathname = useCurrentPathname();
  return <span>Current: {pathname}</span>;
}
```

---

### `useCurrentSearchParams(): URLSearchParams`

Get the current search params. Equivalent to `useSearchParams()` from Next.js but from navigation context.

```tsx
import { useCurrentSearchParams } from '@/lib/navigation';

function ViewParam() {
  const searchParams = useCurrentSearchParams();
  return <span>View: {searchParams.get('view')}</span>;
}
```

## Provider Requirement

All hooks require `NavigationProvider` to be in the component tree:

```tsx
// In AdminShell.tsx
import { NavigationProvider } from '@/lib/contexts/NavigationContext';

function AdminShell({ children }) {
  return (
    <NavigationProvider>
      {children}
    </NavigationProvider>
  );
}
```

If a hook is used outside the provider, it will throw:

```text
Error: useNavigationContext must be used within NavigationProvider
```

## Combining with BreadcrumbContext

For dynamic entity names (product names, category names), combine navigation hooks with `BreadcrumbContext`:

```tsx
import { useBreadcrumbTrail } from '@/lib/navigation';
import { useBreadcrumbItems, useBreadcrumb } from '@/app/admin/_components/dashboard/BreadcrumbContext';

function ProductPage({ product }) {
  // Static breadcrumbs from navigation
  const navCrumbs = useBreadcrumbTrail();

  // Add dynamic product name
  const customCrumbs = useMemo(() => [{ label: product.name }], [product]);
  useBreadcrumb(customCrumbs);

  // In AdminBreadcrumb component:
  const customItems = useBreadcrumbItems();
  // Combine: [...navCrumbs, ...customItems]
}
```

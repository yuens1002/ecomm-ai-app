# Navigation System Use Cases

This guide covers all scenarios where you need to opt into the navigation system. Each use case includes when it applies, what you get automatically, and what you need to do.

## Quick Reference

| Scenario | What's Automatic | What You Opt Into |
|----------|------------------|-------------------|
| New static page | Nothing | Add route to registry |
| New view-based page | Nothing | Add param route to registry |
| Path-segment dynamic page (`/orders/[id]`) | Nothing | Add `prefix-nested` route + `useBreadcrumb()` |
| Dynamic entity page | Static breadcrumb trail | Call `useBreadcrumb()` with entity name |
| Custom nav component | Nothing | Use navigation hooks |
| Existing static page | Breadcrumbs, nav highlighting | Nothing (it just works) |

---

## Use Case 1: Adding a New Static Admin Page

**When:** You create a new admin page with a fixed URL like `/admin/reports`.

**What you get automatically:** Nothing until you register the route.

**What you do:**

### Step 1: Add route to registry

```typescript
// lib/navigation/route-registry.ts

{
  id: "admin.reports",
  pathname: "/admin/reports",
  matchMode: "exact",
  label: "Reports",
  parentId: "admin",  // or appropriate parent
  isNavigable: true,
}
```

### Step 2: Add to nav menu (if it should appear in sidebar)

```typescript
// lib/config/admin-nav.ts

{
  label: "Reports",
  href: "/admin/reports",
  icon: BarChart,
}
```

### Step 3: Create the page

```tsx
// app/admin/reports/page.tsx

export default function ReportsPage() {
  // Breadcrumb is handled automatically: Home > Reports
  return (
    <div>
      <PageTitle title="Reports" />
      {/* page content */}
    </div>
  );
}
```

**Result:** Breadcrumb shows `Home > Reports`. Nav item highlights when active.

---

## Use Case 2: Adding a View-Based Page (Query Params)

**When:** You have multiple views at the same pathname, differentiated by query params like `/admin/reports?view=sales` and `/admin/reports?view=inventory`.

**What you get automatically:** Nothing until you register the routes.

**What you do:**

### Step 1: Add parent route (grouping)

```typescript
// lib/navigation/route-registry.ts

{
  id: "admin.reports",
  pathname: "/admin/reports",
  matchMode: "prefix",
  label: "Reports",
  parentId: "admin",
  isNavigable: false,  // Just a grouping, not clickable
}
```

### Step 2: Add view routes

```typescript
{
  id: "admin.reports.sales",
  pathname: "/admin/reports",
  queryParams: { view: "sales" },
  matchMode: "param",
  label: "Sales",
  parentId: "admin.reports",
  isNavigable: true,
},
{
  id: "admin.reports.inventory",
  pathname: "/admin/reports",
  queryParams: { view: "inventory" },
  matchMode: "param",
  label: "Inventory",
  parentId: "admin.reports",
  isNavigable: true,
}
```

### Step 3: Use hooks for view tabs

```tsx
// app/admin/reports/page.tsx

import { useIsHrefActive } from '@/lib/navigation';

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'sales';

  return (
    <div>
      <PageTitle title="Reports" />
      <ViewTabs />
      {view === 'sales' && <SalesReport />}
      {view === 'inventory' && <InventoryReport />}
    </div>
  );
}

function ViewTabs() {
  const isSalesActive = useIsHrefActive('/admin/reports?view=sales');
  const isInventoryActive = useIsHrefActive('/admin/reports?view=inventory');

  return (
    <nav>
      <Link
        href="/admin/reports?view=sales"
        className={isSalesActive ? 'active' : ''}
      >
        Sales
      </Link>
      <Link
        href="/admin/reports?view=inventory"
        className={isInventoryActive ? 'active' : ''}
      >
        Inventory
      </Link>
    </nav>
  );
}
```

**Result:**

- On `/admin/reports?view=sales`: Breadcrumb shows `Home > Reports > Sales`, only Sales tab is active
- On `/admin/reports?view=inventory`: Breadcrumb shows `Home > Reports > Inventory`, only Inventory tab is active

---

## Use Case 3: Adding Dynamic Entity Breadcrumbs

**When:** Your page displays a specific entity (product, category, user) and you want its name in the breadcrumb.

**What you get automatically:** Static breadcrumb trail from the route registry.

**What you do:** Call `useBreadcrumb()` with the entity name.

### Example: Product Edit Page

```tsx
// app/admin/products/product-form-client/ProductFormClient.tsx

import { useMemo } from 'react';
import { useBreadcrumb } from '@/app/admin/_components/dashboard/BreadcrumbContext';

export default function ProductFormClient({ productId }) {
  const { data: product } = useSWR(`/api/admin/products/${productId}`);

  // Add product name to breadcrumb
  const breadcrumbItems = useMemo(
    () => (product?.name ? [{ label: product.name }] : []),
    [product?.name]
  );
  useBreadcrumb(breadcrumbItems);

  return <ProductForm product={product} />;
}
```

**Result:** Breadcrumb shows `Home > Products > Coffees > Midnight Espresso Blend`

### Example: Category View in Menu Builder

```tsx
// In CategoryView component

import { useMemo } from 'react';
import { useBreadcrumb } from '@/app/admin/_components/dashboard/BreadcrumbContext';

function CategoryView() {
  const { categories, builder: { currentCategoryId } } = useMenuBuilder();
  const currentCategory = categories.find(c => c.id === currentCategoryId);

  const breadcrumbItems = useMemo(
    () => (currentCategory ? [{ label: currentCategory.name }] : []),
    [currentCategory]
  );
  useBreadcrumb(breadcrumbItems);

  return <CategoryTable />;
}
```

**Result:** Breadcrumb shows `Home > Products > Categories > Origins`

### Important: Don't duplicate static labels

```tsx
// WRONG - Profile already has label in route registry
function ProfilePage() {
  useBreadcrumb([{ label: "Profile" }]); // Causes "Profile > Profile"
}

// CORRECT - Let navigation system handle static labels
function ProfilePage() {
  // No useBreadcrumb needed - route has label: "Profile"
}

// CORRECT - Dynamic route needs entity name
function ProductEditPage({ product }) {
  useBreadcrumb([{ label: product.name }]); // Adds dynamic name
}
```

**Rule:** Only use `useBreadcrumb()` when the route has `label: null` in the registry.

---

## Use Case 4: Path-Segment Dynamic Routes (e.g., /orders/[id])

**When:** You have a detail page using Next.js dynamic segments like `/admin/orders/[id]` instead of query params.

**What you get automatically:** Nothing until you register the route.

**What you do:** Use `matchMode: "prefix-nested"` which only matches nested paths.

### Step 1: Add the list page route (exact match)

```typescript
// lib/navigation/route-registry.ts

{
  id: "admin.orders.all",
  pathname: "/admin/orders",
  matchMode: "exact",
  label: "All Orders",
  parentId: "admin.orders",
  isNavigable: true,
}
```

### Step 2: Add the detail page route (prefix-nested match)

```typescript
{
  id: "admin.orders.detail",
  pathname: "/admin/orders",
  matchMode: "prefix-nested",  // Only matches /admin/orders/xxx, NOT /admin/orders
  label: null,  // Resolved at runtime via BreadcrumbContext
  parentId: "admin.orders.all",
  breadcrumbResolver: "orderDetail",
  isNavigable: true,
}
```

### Step 3: Add dynamic breadcrumb in the page component

```tsx
// app/admin/orders/[id]/page.tsx

import { useMemo } from 'react';
import { useBreadcrumb } from '@/app/admin/_components/dashboard/BreadcrumbContext';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order } = useSWR(`/api/admin/orders/${params.id}`);

  // Add order identifier to breadcrumb
  const breadcrumbItems = useMemo(
    () => (order ? [{ label: `Order #${order.orderNumber}` }] : []),
    [order]
  );
  useBreadcrumb(breadcrumbItems);

  return <OrderDetails order={order} />;
}
```

**How `prefix-nested` differs from `prefix`:**

| Match Mode | `/admin/orders` | `/admin/orders/abc123` |
|------------|-----------------|------------------------|
| `prefix` | Matches | Matches |
| `prefix-nested` | No match | Matches |

This ensures the list page (`exact`) wins for `/admin/orders`, while the detail page (`prefix-nested`) wins for `/admin/orders/abc123`.

**Result:**

- On `/admin/orders`: Breadcrumb shows `Home > Orders > All Orders`
- On `/admin/orders/abc123`: Breadcrumb shows `Home > Orders > All Orders > Order #12345`
- Nav highlighting: Orders group is highlighted in both cases

---

## Use Case 5: Building a Custom Nav Component

**When:** You're creating a navigation UI that needs to show active states.

**What you get automatically:** Nothing - you consume the navigation state via hooks.

**What you do:** Use the appropriate hook for your need.

### For individual nav items

```tsx
import { useIsRouteActive } from '@/lib/navigation';

function NavItem({ routeId, label, href }) {
  const isActive = useIsRouteActive(routeId);

  return (
    <Link
      href={href}
      className={isActive ? 'bg-accent text-accent-foreground' : ''}
    >
      {label}
    </Link>
  );
}

// Usage
<NavItem routeId="admin.products.coffees" label="Coffees" href="/admin/products" />
```

### For parent nav groups (dropdowns)

```tsx
import { useHasActiveDescendant } from '@/lib/navigation';

function NavDropdown({ routeId, label, children }) {
  const hasActiveChild = useHasActiveDescendant(routeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={hasActiveChild ? 'bg-accent/50' : ''}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Usage
<NavDropdown routeId="admin.products" label="Products">
  <NavItem routeId="admin.products.coffees" ... />
  <NavItem routeId="admin.products.merch" ... />
</NavDropdown>
```

### For href-based nav items (legacy or simple cases)

```tsx
import { useIsHrefActive } from '@/lib/navigation';

function SimpleNavLink({ href, label }) {
  const isActive = useIsHrefActive(href);

  return (
    <Link
      href={href}
      className={isActive ? 'font-bold' : ''}
    >
      {label}
    </Link>
  );
}

// Usage - works with query params!
<SimpleNavLink href="/admin/product-menu?view=all-categories" label="Categories" />
<SimpleNavLink href="/admin/product-menu?view=all-labels" label="Labels" />
```

---

## Use Case 6: Building Custom Breadcrumbs

**When:** You need breadcrumbs in a non-standard location or with custom styling.

**What you get automatically:** The breadcrumb trail via hook.

**What you do:** Use `useBreadcrumbTrail()` and optionally `useBreadcrumbItems()`.

```tsx
import { useBreadcrumbTrail } from '@/lib/navigation';
import { useBreadcrumbItems } from '@/app/admin/_components/dashboard/BreadcrumbContext';

function CustomBreadcrumb() {
  // Static trail from route registry
  const navCrumbs = useBreadcrumbTrail();

  // Dynamic entity names from page components
  const customItems = useBreadcrumbItems();

  // Combine them
  const allItems = [
    ...navCrumbs,
    ...customItems.map((item, i) => ({
      id: `custom-${i}`,
      label: item.label,
      href: item.href || null,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb">
      {allItems.map((item, index) => (
        <span key={item.id}>
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

---

## Use Case 7: Debugging Navigation State

**When:** You need to understand what the navigation system thinks is active.

**What you do:** Use `useActiveRoute()` to inspect the current state.

```tsx
import { useActiveRoute } from '@/lib/navigation';

function NavDebug() {
  const route = useActiveRoute();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <pre className="text-xs bg-muted p-2 rounded">
      {JSON.stringify({
        id: route?.id,
        label: route?.label,
        pathname: route?.pathname,
        queryParams: route?.queryParams,
        parentId: route?.parentId,
      }, null, 2)}
    </pre>
  );
}
```

---

## Common Mistakes

### Mistake 1: Forgetting to register the route

```tsx
// Page exists at /admin/analytics but breadcrumb shows nothing

// Fix: Add to route-registry.ts
{
  id: "admin.analytics",
  pathname: "/admin/analytics",
  matchMode: "exact",
  label: "Analytics",
  parentId: "admin",
  isNavigable: true,
}
```

### Mistake 2: Using useBreadcrumb for static labels

```tsx
// WRONG - causes duplicate breadcrumb
useBreadcrumb([{ label: "Settings" }]);

// Check if route already has a label in registry
// If yes, don't call useBreadcrumb
```

### Mistake 3: Wrong matchMode for view-based routes

```tsx
// WRONG - exact mode ignores query params
{
  pathname: "/admin/reports",
  matchMode: "exact",  // Won't distinguish ?view=sales from ?view=inventory
}

// CORRECT - param mode checks query params
{
  pathname: "/admin/reports",
  queryParams: { view: "sales" },
  matchMode: "param",
}
```

### Mistake 4: Missing parentId

```tsx
// WRONG - no parent means flat hierarchy
{
  id: "admin.reports.sales",
  parentId: undefined,  // Breadcrumb: Home > Sales (missing Reports)
}

// CORRECT - proper hierarchy
{
  id: "admin.reports.sales",
  parentId: "admin.reports",  // Breadcrumb: Home > Reports > Sales
}
```

---

## Checklist for New Pages

- [ ] Route added to `lib/navigation/route-registry.ts`
- [ ] Correct `matchMode` chosen (exact, prefix, or param)
- [ ] `parentId` set for proper breadcrumb hierarchy
- [ ] `label` set (or `null` if dynamic)
- [ ] If dynamic label: page calls `useBreadcrumb()` with entity name
- [ ] If view-based: all view routes registered with `queryParams`
- [ ] Nav menu updated in `lib/config/admin-nav.ts` (if should appear in sidebar)
- [ ] Tested: breadcrumb shows correct trail
- [ ] Tested: nav item highlights correctly

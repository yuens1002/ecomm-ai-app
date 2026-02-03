# Dynamic Breadcrumbs

This guide explains how to add dynamic entity names (like product names, category names) to breadcrumbs.

## The Challenge

For routes like `/admin/products?view=edit&id=abc123`, the breadcrumb should show:

```text
Home > Products > Coffees > Midnight Espresso Blend
                            ^^^^^^^^^^^^^^^^^^^^^^^^
                            This comes from the database
```

## Solution: Use BreadcrumbContext

The navigation system provides **static** breadcrumbs (Home > Products > Coffees). For **dynamic** entity names, page components use `BreadcrumbContext`:

```tsx
// In a page component that already has the entity data

import { useMemo } from 'react';
import { useBreadcrumb } from '@/app/admin/_components/dashboard/BreadcrumbContext';

function ProductEditPage({ product }) {
  // Create breadcrumb items from entity data
  const breadcrumbs = useMemo(() =>
    product ? [{ label: product.name }] : []
  , [product]);

  // Register with BreadcrumbContext
  useBreadcrumb(breadcrumbs);

  return (
    // ... page content
  );
}
```

## Why This Approach?

### Why not fetch in the navigation system?

Fetching entity names in `NavigationProvider` would require:

1. **Prisma in client bundle** - Causes "Module not found: dns" errors
2. **Extra database queries** - The page already has the data
3. **Loading states** - Breadcrumbs would flicker on every navigation
4. **Complexity** - Async state management in context

### Benefits of BreadcrumbContext

1. **Data is already available** - Pages fetch entities anyway
2. **No extra requests** - Just pass existing data
3. **Instant updates** - No loading states
4. **Clean separation** - Navigation handles structure, pages handle content

## BreadcrumbContext API

### `useBreadcrumb(items: BreadcrumbItem[])`

Register breadcrumb items. Items are automatically cleared on unmount.

```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;  // Optional - makes it a link
}

// Single item (most common)
useBreadcrumb([{ label: product.name }]);

// Multiple items (for deep hierarchies)
useBreadcrumb([
  { label: category.name, href: `/admin/categories/${category.id}` },
  { label: product.name }
]);
```

### `useBreadcrumbItems(): BreadcrumbItem[]`

Read current custom breadcrumb items. Used internally by `AdminBreadcrumb`.

## Examples

### Product Edit Page

```tsx
function ProductEditPage() {
  const { data: product } = useSWR(`/api/admin/products/${id}`);

  const breadcrumbs = useMemo(() =>
    product ? [{ label: product.name }] : []
  , [product]);

  useBreadcrumb(breadcrumbs);

  // Result: Home > Products > Coffees > Midnight Espresso Blend
  return <ProductForm product={product} />;
}
```

### Category View in Menu Builder

```tsx
function CategoryView() {
  const { categories, builder: { currentCategoryId } } = useMenuBuilder();

  const currentCategory = categories.find(c => c.id === currentCategoryId);

  const breadcrumbs = useMemo(() =>
    currentCategory ? [{ label: currentCategory.name }] : []
  , [currentCategory]);

  useBreadcrumb(breadcrumbs);

  // Result: Home > Products > Categories > Origins
  return <CategoryTable />;
}
```

### Label View in Menu Builder

```tsx
function LabelView() {
  const { labels, builder: { currentLabelId } } = useMenuBuilder();

  const currentLabel = labels.find(l => l.id === currentLabelId);

  const breadcrumbs = useMemo(() =>
    currentLabel ? [{ label: currentLabel.name }] : []
  , [currentLabel]);

  useBreadcrumb(breadcrumbs);

  // Result: Home > Products > Labels > Roasts
  return <LabelTable />;
}
```

## How It All Fits Together

```tsx
// AdminBreadcrumb.tsx combines both sources:

function AdminBreadcrumb() {
  // Static breadcrumbs from navigation system
  const navBreadcrumbs = useBreadcrumbTrail();
  // [{ id: 'admin', label: 'Home', href: '/admin' },
  //  { id: 'admin.products', label: 'Products', href: null },
  //  { id: 'admin.products.coffees', label: 'Coffees', href: null }]

  // Dynamic entity names from page components
  const customItems = useBreadcrumbItems();
  // [{ label: 'Midnight Espresso Blend' }]

  // Combine them
  const allItems = [...navBreadcrumbs, ...customItems];

  return (
    <Breadcrumb>
      {allItems.map((item, index) => (
        <BreadcrumbItem key={item.id || `custom-${index}`}>
          {item.label}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
```

## Server-Side Resolvers (For Reference)

The `lib/navigation/resolvers.ts` file contains server-only breadcrumb resolvers. These are **not used** in the client-side navigation context but are kept for potential server-side rendering scenarios:

```typescript
// lib/navigation/resolvers.ts
"use server";

export const productEditResolver: BreadcrumbResolver = async (pathname, searchParams) => {
  const productId = searchParams.get('id');
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true }
  });

  return [
    { id: 'admin', label: 'Home', href: '/admin' },
    { id: 'admin.products', label: 'Products', href: null },
    { id: 'admin.products.coffees', label: 'Coffees', href: '/admin/products' },
    { id: 'product', label: product?.name || 'Not Found', href: null },
  ];
};
```

These resolvers are:

- Marked with `"use server"` directive
- Not imported in client-side code
- Available for future server component usage

## When to Use `useBreadcrumb`

**Only use `useBreadcrumb` for dynamic entity names** - data from the database that isn't known at build time.

| Route Type | Registry `label` | Use `useBreadcrumb`? | Example |
|------------|------------------|----------------------|---------|
| Static | `"Profile"` | **No** | `/admin/profile` shows "Profile" automatically |
| Static | `"Coffees"` | **No** | `/admin/products` shows "Coffees" automatically |
| Dynamic | `null` | **Yes** | Product edit → add product name |
| Dynamic | `null` | **Yes** | Category view → add category name |

**Common mistake:** Adding `useBreadcrumb([{ label: "Profile" }])` on a page that already has a static label in the route registry. This causes duplicate breadcrumbs like "Profile > Profile".

```tsx
// ❌ WRONG - Profile already has label in route registry
function ProfilePage() {
  useBreadcrumb([{ label: "Profile" }]); // Causes "Profile > Profile"
}

// ✅ CORRECT - Let navigation system handle static labels
function ProfilePage() {
  // Breadcrumb handled by navigation system (route: admin.profile)
}

// ✅ CORRECT - Dynamic route needs entity name
function ProductEditPage({ product }) {
  useBreadcrumb([{ label: product.name }]); // Adds "Midnight Espresso Blend"
}
```

## Summary

| Source | Provides | Example |
|--------|----------|---------|
| Navigation System | Static route labels | "Home", "Products", "Coffees" |
| BreadcrumbContext | Dynamic entity names | "Midnight Espresso Blend" |
| Combined | Full breadcrumb | Home > Products > Coffees > Midnight Espresso Blend |

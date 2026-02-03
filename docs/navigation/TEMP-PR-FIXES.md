# Navigation System - Pre-PR Fixes

**Purpose:** Track bugs and UX improvements to address before merging to main.
**Status:** In Progress
**Delete after:** PR merged

---

## Bugs

### 1. Breadcrumb - Parent nav links not navigable ✅ FIXED

- [x] Stems in breadcrumb should be navigable when there is a route for it
- [x] Should be styled with shadcn variant "link"

**Fix:**

- Removed the code in `buildBreadcrumbChain()` that was setting the last item's href to null
- AdminBreadcrumb already handles this via `isLast` prop in `BreadcrumbItemContent`
- Files changed: `lib/navigation/navigation-core.ts`, `app/admin/_components/dashboard/AdminBreadcrumb.tsx`

### 2. Product edit pages not using navigation system ✅ FIXED

- [x] Coffee product edit (`/admin/products?view=edit&id=xxx`) now uses navigation system
- [x] Merch product edit (`/admin/merch?view=edit&id=xxx`) now uses navigation system
- [x] Product name shows in breadcrumb when editing
- [x] New product pages also registered

**Fix:**

- Updated route registry with proper `parentId` for product edit routes
- Added routes for merch edit/new pages
- Added `useBreadcrumb` hook to `ProductFormClient` to show product name

**Files changed:**

- `lib/navigation/route-registry.ts` - Added proper routes for product/merch edit/new
- `app/admin/products/product-form-client/ProductFormClient.tsx` - Added BreadcrumbContext integration

### 3. Admin homepage navbar uses navigation Links ✅ FIXED

- [x] Navbar at `/admin` now uses navigation Links instead of inline Tabs
- [x] Clicking Users, Orders, Products, Newsletter, Profile navigates to actual pages
- [x] Each page uses the navigation system (breadcrumbs, active state highlighting)
- [x] Profile link goes to `/admin/profile`

**Fix:**

- Converted `AdminDashboardClient.tsx` from Tabs with inline content to navigation Links
- Overview remains on `/admin` with stats cards and analytics
- All other items are Links to their respective pages
- Files changed: `app/admin/AdminDashboardClient.tsx`

---

## UX Improvements

### 1. Mobile nav should open to current route's section ✅ FIXED

- [x] When opening mobile nav, it should expand to show the navigable part of current route
- [x] Example: `/admin` → opens Dashboard section → Overview highlighted

**Fix:**

- Updated `AdminMobileDrawer.tsx` to use `useActiveRoute()` hook
- When drawer opens, determines which section contains the active route
- Expands that section automatically
- File changed: `app/admin/_components/dashboard/AdminMobileDrawer.tsx`

---

## Implementation Notes

### Breadcrumb Fix

The issue was in `buildBreadcrumbChain()` which unconditionally set `chain[chain.length - 1].href = null`. This was problematic because:

- When BreadcrumbContext adds custom items (entity names), the last nav item should remain clickable
- AdminBreadcrumb already handles current page detection via `isLast` prop

### Mobile Nav Fix

The drawer was resetting all sections to collapsed on open. Now it:

1. Gets the active route via `useActiveRoute()`
2. Checks each nav section to see if any child's pathname matches
3. Expands the matching section

---

## Verification Checklist

- [x] Breadcrumb parent links now navigable
- [x] Mobile nav expands to current section
- [x] Product edit pages use navigation system
- [x] Product name shows in breadcrumb when editing
- [x] Admin homepage navbar uses navigation Links
- [x] Tests still passing (41/41)
- [x] TypeScript passes
- [x] ESLint passes
- [ ] Manual testing complete

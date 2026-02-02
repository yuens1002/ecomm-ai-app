# Dashboard Shell Migration Plan

**Created:** 2026-01-27
**Branch:** `feat/dashboard-shell-migration`
**Status:** In Progress

---

## Overview

Enhance the admin layout with breadcrumb navigation following the shadcn dashboard-shell pattern.

## Current State

| Feature | Status |
|---------|--------|
| Collapsible sidebar | ✅ Exists (AdminSidebar.tsx) |
| Theme toggle | ✅ Exists (AdminHeader.tsx) |
| User menu dropdown | ✅ Exists (AdminHeader.tsx) |
| Breadcrumb navigation | ❌ Placeholder only |
| Mobile sidebar sheet | ⚠️ Partial (collapses to icons) |

## Implementation Plan

### 1. Create AdminBreadcrumb Component

**File:** `components/app-components/AdminBreadcrumb.tsx`

**Features:**

- Read current pathname via `usePathname()`
- Map routes to human-readable labels
- Generate breadcrumb trail
- Use existing `components/ui/breadcrumb.tsx` primitives

**Route mapping:**

```typescript

const routeLabels: Record<string, string> = {
  "admin": "Dashboard",
  "analytics": "Analytics",
  "orders": "Orders",
  "products": "Products",
  "merch": "Merchandise",
  "product-menu": "Menu Builder",
  "pages": "Pages",
  "users": "Users",
  "newsletter": "Newsletter",
  "settings": "Settings",
  "storefront": "Store Front",
  "location": "Location",
  "commerce": "Commerce",
  "marketing": "Marketing",
  "contact": "Contact",
  "social-links": "Social Links",
};
```

### 2. Integrate into AdminHeader

**File:** `components/app-components/AdminHeader.tsx`

**Changes:**

- Import and render `AdminBreadcrumb` in the left section
- Replace placeholder comment with actual breadcrumb

### 3. Mobile Responsiveness (Optional Enhancement)

Consider adding a Sheet-based sidebar for mobile instead of just collapsing to icons.

---

## Files to Modify

| File | Action |
|------|--------|
| `components/app-components/AdminBreadcrumb.tsx` | Create |
| `components/app-components/AdminHeader.tsx` | Add breadcrumb |

## Example Output

**Route:** `/admin/settings/commerce`
**Breadcrumb:** `Dashboard > Settings > Commerce`

**Route:** `/admin/product-menu`
**Breadcrumb:** `Dashboard > Menu Builder`

---

## Success Criteria

- [ ] Breadcrumb shows on all admin pages
- [ ] Clicking breadcrumb links navigates correctly
- [ ] Current page is not a link (uses BreadcrumbPage)
- [ ] Mobile-friendly (truncates or wraps gracefully)
- [ ] Matches existing UI styling

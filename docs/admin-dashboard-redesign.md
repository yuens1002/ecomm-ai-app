# Admin Dashboard Redesign - Implementation Plan

**Created:** 2026-01-27
**Branch:** `feat/shadcn-dashboard`
**Status:** Complete

---

## Overview

Replace the current sidebar-based admin layout with a top navbar layout inspired by shadcn dashboard-shell-04. This is a complete redesign of the admin shell.

## Current vs New

| Aspect | Current | New |
|--------|---------|-----|
| Navigation | Left sidebar (collapsible) | Top sticky navbar with dropdowns |
| Layout | Full-width, fixed position | Fixed max-width container |
| Mobile | Sidebar collapses to icons | Left drawer sheet |
| Footer | None | Branding + legal + social |
| Breadcrumb | In header (all pages) | Below navbar (hidden on Overview) |

---

## Navigation Structure

### Top Navbar (Left to Right)

```
[<] Logo │ Dashboard ▼ │ Products ▼ │ Orders ▼ │ Pages ▼ │ Management ▼ │ Settings ▼ │ ☀️ 👤
```

### Dropdown Contents

| Nav Item | Sub-items | Route |
|----------|-----------|-------|
| **Dashboard** | Overview | `/admin` |
| | Analytics | `/admin/analytics` |
| **Products** | Coffees | `/admin/products` |
| | Merch | `/admin/merch` |
| | Categories | `/admin/product-menu?view=all-categories` |
| | Labels | `/admin/product-menu?view=all-labels` |
| | Menu | `/admin/product-menu?view=menu` |
| **Orders** | All Orders | `/admin/orders` |
| | Subscriptions | *(coming soon)* |
| **Pages** | About | `/admin/pages/about` |
| | Cafe | `/admin/pages/cafe` |
| | FAQ | `/admin/pages/faq` |
| **Management** | All Users | `/admin/users` |
| | Newsletter | `/admin/newsletter` |
| **Settings** | General | `/admin/settings` |
| | Store Front | `/admin/settings/storefront` |
| | Location | `/admin/settings/location` |
| | Commerce | `/admin/settings/commerce` |
| | Marketing | `/admin/settings/marketing` |
| | Contact | `/admin/settings/contact` |
| | Social Links | `/admin/social-links` |

### Right Side Elements

| Element | Behavior |
|---------|----------|
| `[<]` Back icon | Opens public site in new browser window (icon only, not logo) |
| Logo/Brand | Site logo from settings if available, fallback to store name text - decorative, not clickable |
| Theme toggle | Sun/Moon icon, toggles light/dark |
| Avatar | Dropdown with: Profile *(coming soon)*, Password *(coming soon)*, Logout |

---

## Footer Structure

### Desktop Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  Artisan Roast    │    Disclaimer • License • Support    │  🐦 📘 📷  │
│     (left)        │            (center)                  │  (right)  │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stacked)
```
┌────────────────────────────────────────┐
│           Artisan Roast                │
│  Disclaimer • License • Support  🐦📘📷  │
└────────────────────────────────────────┘
```

### Footer Links
- **Disclaimer**: Placeholder link
- **License**: Placeholder link
- **Support**: `https://github.com/yuens1002/ecomm-ai-app/issues`
- **Social Icons**: From site settings (dynamic)

---

## Responsive Behavior

### Desktop (≥1024px)
- Full top navbar with all dropdowns visible
- Fixed max-width container (e.g., `max-w-7xl`)
- Footer in 3-column layout

### Tablet (768px - 1023px)
- Top navbar may compress
- Consider hamburger menu trigger
- Left drawer for navigation

### Mobile (<768px)
- Hamburger menu icon in navbar
- Left drawer sheet with full navigation
- Stacked footer (2 rows)

---

## Components to Create

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminTopNav.tsx` | `components/admin/dashboard/` | Main top navbar |
| `AdminMobileDrawer.tsx` | `components/admin/dashboard/` | Mobile navigation drawer |
| `AdminFooter.tsx` | `components/admin/dashboard/` | Footer with branding/legal/social |
| `AdminShell.tsx` | `components/admin/dashboard/` | Layout wrapper combining all pieces |
| `AdminBreadcrumb.tsx` | `components/admin/dashboard/` | Route-based breadcrumb with dynamic items |
| `StoreBrand.tsx` | `components/admin/dashboard/` | Logo + store name branding component |
| `BreadcrumbContext.tsx` | `components/admin/dashboard/` | Context + `useBreadcrumb` hook for dynamic items |
| `index.ts` | `components/admin/dashboard/` | Barrel exports for all dashboard components |

### Components to Modify

| Component | Changes |
|-----------|---------|
| `app/admin/layout.tsx` | Replace sidebar layout with new shell |
| `AdminBreadcrumb.tsx` | Hide on Overview page (`/admin`) |

### Components to Remove/Deprecate

| Component | Action |
|-----------|--------|
| `AdminSidebar.tsx` | Remove (replaced by top nav) |
| `AdminHeader.tsx` | Remove (merged into AdminTopNav) |

---

## Implementation Steps

### Phase 1: Core Shell Components ✅
1. [x] Create `lib/admin-nav-config.ts` with centralized nav structure
2. [x] Create `AdminTopNav.tsx` with logo, nav items, theme toggle, avatar
3. [x] Create `AdminFooter.tsx` with responsive layout
4. [x] Create `AdminShell.tsx` to compose navbar + content + footer

### Phase 2: Integration & Navigation Logic ✅
5. [x] Update `app/admin/layout.tsx` to use new AdminShell
6. [x] Implement dropdown active states (highlight current section)
7. [x] Update `AdminBreadcrumb.tsx` to hide on `/admin`
8. [x] Remove old AdminSidebar and AdminHeader

### Phase 3: Mobile/Responsive ✅
9. [x] Create `AdminMobileDrawer.tsx` using Sheet component
10. [x] Add responsive breakpoints to AdminTopNav (hamburger trigger)
11. [x] Implement stacked footer for mobile

### Phase 4: Validation & Polish ✅
12. [x] Run full test suite (`npm run test:ci`)
13. [x] Run typecheck (`npm run typecheck`)
14. [x] Manual testing and bug fixes

### Phase 5: Component Relocation ✅
15. [x] Relocate dashboard components from `components/app-components/` to `components/admin/dashboard/`
16. [x] Create barrel exports via `index.ts`
17. [x] Consolidate `useBreadcrumb` hook into BreadcrumbContext (single declarative API)

---

## Validation Plan

### Automated Checks (must pass before each commit)
```bash
npm run typecheck   # No TypeScript errors
npm run test:ci     # All 595+ tests pass
npm run lint        # No ESLint errors (warnings OK)
```

### Manual Testing Checklist (Phase 4)

#### Desktop (≥1024px)
- [ ] Top navbar displays with all 6 dropdowns
- [ ] Each dropdown opens and shows correct items
- [ ] Clicking dropdown items navigates to correct route
- [ ] Active nav item highlighted based on current route
- [ ] `[<]` icon opens public site in new tab
- [ ] Logo/store name displays correctly
- [ ] Theme toggle works (light ↔ dark)
- [ ] Avatar dropdown shows: Profile (disabled), Password (disabled), Logout
- [ ] Logout works and redirects to admin sign-in
- [ ] Breadcrumb hidden on `/admin`, visible on other pages
- [ ] Footer displays: branding | disclaimer/license/support | social icons
- [ ] Support link goes to GitHub issues
- [ ] Social icons load from site settings
- [ ] Content area has max-w-7xl constraint

#### Mobile (<768px)
- [ ] Hamburger menu icon visible
- [ ] Clicking hamburger opens left drawer
- [ ] Drawer shows full navigation tree
- [ ] Clicking nav item closes drawer and navigates
- [ ] Footer stacks: branding on line 1, rest on line 2
- [ ] All touch targets are ≥44px

#### Route Testing (verify no broken pages)
- [ ] `/admin` - Overview
- [ ] `/admin/analytics` - Analytics
- [ ] `/admin/products` - Coffees
- [ ] `/admin/merch` - Merchandise
- [ ] `/admin/product-menu` - Menu Builder (all views)
- [ ] `/admin/orders` - Orders
- [ ] `/admin/pages/about` - About page
- [ ] `/admin/pages/cafe` - Cafe page
- [ ] `/admin/pages/faq` - FAQ page
- [ ] `/admin/users` - All Users
- [ ] `/admin/newsletter` - Newsletter
- [ ] `/admin/settings` - General Settings
- [ ] `/admin/settings/storefront` - Store Front
- [ ] `/admin/settings/location` - Location
- [ ] `/admin/settings/commerce` - Commerce
- [ ] `/admin/settings/marketing` - Marketing
- [ ] `/admin/settings/contact` - Contact
- [ ] `/admin/social-links` - Social Links

---

## Commit Plan Summary

| Phase | Commit Message | Validation |
|-------|----------------|------------|
| 1 | `feat(admin): add core shell components for dashboard redesign` | typecheck + lint |
| 2 | `feat(admin): integrate new shell layout and remove sidebar` | typecheck + lint + test:ci |
| 3 | `feat(admin): add mobile drawer and responsive layout` | typecheck + lint + test:ci |
| 4 | `fix(admin): polish and bug fixes for dashboard shell` | full manual testing |
| Final | `chore: bump version to 0.75.0` | CHANGELOG + package.json |

### Final Review Checkpoint
After Phase 4 commit, notify user for final review with:
- Summary of changes
- Screenshot of desktop layout
- Screenshot of mobile layout
- Any issues or deviations from plan

**Do NOT merge to main until user approves.**

---

## Technical Decisions

### Navigation Config Structure
```typescript
type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;           // Direct link (no dropdown)
  children?: {             // Dropdown items
    label: string;
    href: string;
    disabled?: boolean;    // For "coming soon" items
  }[];
};

const adminNavConfig: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Overview", href: "/admin" },
      { label: "Analytics", href: "/admin/analytics" },
    ],
  },
  // ... etc
];
```

### Active State Detection
- Parent nav item highlighted if any child route is active
- Use `usePathname()` and check if path starts with section prefix
- Example: `/admin/settings/commerce` highlights "Settings" nav item

### Sheet Component for Mobile
- Use shadcn `Sheet` with `side="left"`
- Trigger via hamburger icon in navbar (mobile only)
- Full navigation tree in accordion or list format

---

## Files Changed Summary

### New Files
```
components/admin/dashboard/AdminTopNav.tsx
components/admin/dashboard/AdminMobileDrawer.tsx
components/admin/dashboard/AdminFooter.tsx
components/admin/dashboard/AdminShell.tsx
components/admin/dashboard/AdminBreadcrumb.tsx
components/admin/dashboard/StoreBrand.tsx
components/admin/dashboard/BreadcrumbContext.tsx
components/admin/dashboard/index.ts
lib/admin-nav-config.ts
```

### Modified Files
```
app/admin/layout.tsx
```

### Removed Files
```
components/app-components/AdminSidebar.tsx
components/app-components/AdminHeader.tsx
components/app-components/AdminBreadcrumb.tsx (moved to dashboard/)
components/app-components/AdminTopNav.tsx (moved to dashboard/)
components/app-components/AdminMobileDrawer.tsx (moved to dashboard/)
components/app-components/AdminFooter.tsx (moved to dashboard/)
components/app-components/AdminShell.tsx (moved to dashboard/)
```

---

## Success Criteria

- [x] Top navbar displays correctly on desktop
- [x] All nav dropdowns work with correct links
- [x] Avatar dropdown shows Profile, Password, Logout
- [x] Theme toggle works
- [x] `[<]` opens public site in new window
- [x] Breadcrumb hidden on Overview, visible elsewhere
- [x] Footer displays with correct links
- [x] Social icons load from site settings
- [x] Mobile drawer works on small screens
- [x] All existing admin functionality preserved
- [x] No regressions in admin pages
- [x] Dashboard components consolidated in `components/admin/dashboard/`

---

## Decisions Made

1. **Pages dropdown**: Static list for now (About, Cafe, FAQ) - no "+ New Page" until CMS is fully baked
2. **Avatar menu**: Show Profile and Password with "(coming soon)" label, disabled/no link
3. **Max-width**: `max-w-7xl` (1280px)
4. **Back arrow**: Icon only (`ArrowLeft` or `ExternalLink`) as trigger - logo is separate branding, not clickable

---

## References

- [Shadcn Dashboard Shell 04](https://shadcnstudio.com/preview/dashboard-and-application/dashboard-shell/dashboard-shell-04)
- Current admin layout: `app/admin/layout.tsx`
- Current sidebar: `components/app-components/AdminSidebar.tsx`

# Build Variant System — Demo Behavior Reference

> **Reference doc** — describes the implemented build variant system as of v0.97.4.
> For the implementation plan and rationale, see `docs/plans/build-variant-system-ACs.md`.

---

## Build Variant Signal

| Env Var | Value | Result |
|---|---|---|
| `NEXT_PUBLIC_BUILD_VARIANT` | *(unset)* or `LIVE` | Live store — zero demo code |
| `NEXT_PUBLIC_BUILD_VARIANT` | `DEMO` or `demo` | Demo build — all demo infrastructure |

---

## What Each Build Contains

### Absent from live build entirely

| File | Why |
|---|---|
| `app/(site)/_components/content/DemoBanner.tsx` | Demo-only banner |
| `app/admin/_components/shared/AdminDemoBanner.tsx` | Demo-only admin banner |
| `components/auth/DemoSignInButtons.tsx` | One-click demo sign-in |
| `demoSignIn` server action in `app/auth/actions.ts` | Hardcoded demo credentials |
| `lib/demo.ts`, `lib/demo-hooks.ts` | Demo utilities |

### Present in both builds (but gated by `IS_DEMO`)

| File | Demo behavior |
|---|---|
| `app/api/test/reset-cache/route.ts` | Returns 403 unless `NEXT_PUBLIC_BUILD_VARIANT=DEMO` |
| All delete/write handlers | Intercepted — see behavior tables below |

---

## Auth Page Swap

| Page | Demo build | Live build |
|---|---|---|
| `/auth/signin` | `DemoSignInButtons` only (no email form, no OAuth) | Email form + OAuth (no demo buttons) |
| `/auth/admin-signin` | `DemoSignInButtons` only (no email form) | Email form only (no demo buttons) |

---

## Demo Behavior Tables

### Checkout bypass (fake redirect + toast)

| Page | URL | User Action | Demo Behavior |
|---|---|---|---|
| Support Plans | `/admin/support/plans` | Subscribe to paid plan | Redirects to `?demo=success` · toast: "Purchase complete — Demo mode, no charge made." |
| Add-Ons | `/admin/support/add-ons` | Purchase add-on | Redirects to `?demo=success` · toast: "Purchase complete — Demo mode, no charge made." Per-button loading state (not shared). |

### DELETE guard (toast, no execution)

| Page | URL | Action |
|---|---|---|
| Account — Addresses | `/account?tab=addresses` | Delete address |
| Account — Danger Zone | `/account?tab=danger` | Delete My Account |
| Admin — Products | `/admin/products` | Delete product |
| Admin — Products | `/admin/products/[id]` | Delete variant |
| Admin — Products | `/admin/products/[id]` | Delete purchase option |
| Admin — Reviews | `/admin/reviews` | Delete review |
| Admin — Social Links | `/admin/social-links` | Delete link |
| Admin — CMS | `/admin/pages/edit/[id]` | Delete CMS block |
| Admin — Menu Builder | `/admin/product-menu` | Delete menu item(s) |

Toast: "This action is disabled in demo mode."

### Protected write guard (toast, no execution)

| Page | URL | Action |
|---|---|---|
| Admin Profile | `/admin/profile` | Save display name / email |
| Admin Nav dropdown | `/admin` (avatar) | Password (shows toast — feature not yet built) |
| Admin Settings: Store | `/admin/settings` | Store name, logo |
| Admin Settings: Location | `/admin/settings/location` | Location type radio |
| Admin Settings: AI | `/admin/settings/ai` | Save AI settings |
| Admin Settings: Contact | `/admin/settings/contact` | Contact email, From email, Footer email |
| Admin Social Links | `/admin/social-links` | Create link, Edit link |
| Admin Support | `/admin/support` | Submit ticket |
| Account — Profile | `/account?tab=profile` | Save name / email |
| Account — Security | `/account?tab=security` | Change / Set password |
| Account — Connected Accounts | `/account?tab=accounts` | Connect Google / GitHub |

Toast: "Changes are disabled in demo mode."

### Real writes (execute normally in demo)

| Area | Actions that go through |
|---|---|
| Products | Create, edit (name, price, stock, images, variants, options) |
| Orders | All status updates, shipping edits, refunds |
| Reviews | Approve, flag, reply |
| CMS / Pages | Create, edit blocks, publish/unpublish |
| Menu Builder | Reorder, toggle visibility, inline rename, add items |
| Users | Toggle admin status |
| Subscriptions | Skip, resume, cancel |
| Addresses | Create new, set default |
| Newsletter | Export CSV |
| Analytics | All filters and exports |

---

## Utility Set (`lib/demo.ts` + `lib/demo-hooks.ts`)

### `lib/demo.ts` (server-safe)

```ts
// Build-time constant — inlined by Next.js
export const IS_DEMO: boolean

// Checkout bypass — server actions only
// Returns fake redirect result, or null in live builds
export function demoBypassAction(fakeRedirectPath: string): DemoBypassResult | null
```

### `lib/demo-hooks.ts` ("use client" only)

```ts
// Wraps any delete handler — shows toast instead in demo mode
export function useDemoDeleteGuard<T extends (...args: unknown[]) => void>(handler: T): T

// Wraps any write handler — shows toast instead in demo mode
export function useDemoProtectedAction<T extends (...args: unknown[]) => void>(handler: T): T
```

### `SettingsField` prop

```tsx
// Add to any SettingsField to block saves in demo mode
<SettingsField ... demoBlock />
```

---

## OG / Metadata

In demo build, all OG images and page metadata use platform marketing copy instead of store-specific branding.

---

Last updated: 2026-03-27 | Implemented: v0.98.0

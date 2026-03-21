# Artisan Roast — Install Verification

> **Reference stack:** Neon (database) + Vercel (deployment).
> Any hosted PostgreSQL accepting standard Prisma connection strings is supported,
> but results are only guaranteed on the reference stack.
>
> Verified on every merge to main against a fresh install:
> empty Neon database + dedicated QA Vercel deployment.
> Known values are injected from CI secrets — never hardcoded in this file.

---

## Install Flow

| AC | What | How | Pass |
|----|------|-----|------|
| AC-IF-1 | /setup accessible on fresh install | Navigate to /setup, screenshot | Page loads; EULA heading visible; no "Setup Already Complete" |
| AC-IF-2 | Accept button is scroll-gated | Screenshot immediately after page load | "I Accept" button is disabled |
| AC-IF-3 | Accept button enables after scrolling to bottom | Scroll EULA to bottom, screenshot | "I Accept" button is enabled |
| AC-IF-4 | EULA acceptance advances to Store Setup step | Click "I Accept", screenshot | Step indicator shows Store Setup active; form fields visible |
| AC-IF-5 | Admin account creation succeeds with known values | Fill Full Name=$QA_ADMIN_NAME, Email=$QA_ADMIN_EMAIL, Password=$QA_ADMIN_PASSWORD, Confirm=$QA_ADMIN_PASSWORD; submit | Browser navigates to /admin |
| AC-IF-6 | /setup is locked out after admin exists | Navigate to /setup after setup complete | "Setup Already Complete" shown; no form visible |

## Known Value Round-Trips

| AC | What | How | Pass |
|----|------|-----|------|
| AC-KV-1 | Admin name visible in admin UI | Screenshot /admin dashboard or user menu | $QA_ADMIN_NAME appears on screen |
| AC-KV-2 | Admin email and password authenticate | Sign out, navigate to /auth/signin, sign in with $QA_ADMIN_EMAIL + $QA_ADMIN_PASSWORD | Login succeeds; redirected to /admin |
| AC-KV-3 | Store name appears on storefront | Navigate to / (homepage), screenshot | $QA_STORE_NAME visible in page header or title |
| AC-KV-4 | Store name appears in admin settings | Navigate to /admin/settings, screenshot | $QA_STORE_NAME visible in store settings section |

## Initial App State

| AC | What | How | Pass |
|----|------|-----|------|
| AC-IS-1 | Getting Started checklist shows 0 of 4 complete | Screenshot /admin dashboard | Checklist visible; all items unchecked / 0 complete |
| AC-IS-2 | Products section shows empty state | Navigate to /admin/products, screenshot | Empty state message shown; no products listed |
| AC-IS-3 | Orders section shows empty state | Navigate to /admin/orders, screenshot | Empty state message shown; no orders listed |
| AC-IS-4 | Settings page loads without error | Navigate to /admin/settings, screenshot | Page renders; no error page or 500 |
| AC-IS-5 | Storefront homepage loads without error | Navigate to /, screenshot | Page renders; no error page or 500 |
| AC-IS-6 | Admin navigation links are all reachable | Click each main nav item in /admin, screenshot each | No 404 or 500 on Products, Orders, Settings |

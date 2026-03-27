# Build Variant Strategy — Demo Behavior Inventory

> **Reviewing this doc?** Add your notes as HTML comments in the source editor — they won't appear in the preview.
> Format: `<!-- COMMENT: your note here -->`
> Open preview alongside: `Ctrl+K V` (split) or `Ctrl+Shift+V` (tab)

---

## Pre-Planning Context

### How We Got Here

This document captures the rationale, discovery process, and design decisions made before formal planning began on the build variant feature.

The conversation started from a simple observation: Artisan Roast serves two fundamentally different audiences from what is currently a single codebase with a single deployment model:

1. **The demo site** (`demo.artisanroast.app`) — a public showcase for prospective store owners. Its job is to let anyone explore the platform freely, with guardrails to prevent real data mutations.
2. **Self-hosted stores** — actual store owners running their own instance in production. These deployments have no use for demo infrastructure, and shipping that code creates unnecessary surface area.

The trigger for this work was a set of instabilities introduced by the demo mutation-blocking middleware (`middleware.ts`). The middleware was added to protect the demo site from destructive actions, but its presence in all builds caused unpredictable runtime behavior — some of which may not have fully surfaced yet. This made the cost of the current "one codebase, one build" model concrete.

### What the Audit Found

We performed a full audit of the codebase and found **20+ demo-mode checks**, all implemented as runtime guards:

```ts
process.env.NEXT_PUBLIC_DEMO_MODE === "true"
```

Next.js inlines `NEXT_PUBLIC_*` variables at build time (constant folding), so these branches become dead code in live builds — **but only for inline expressions**. Because module imports are unconditional and hoisted, demo-only components (`DemoBanner`, `AdminDemoBanner`, `DemoSignInButtons`) and fake checkout logic still land in every bundle regardless of the env var. A live store build today ships demo credentials, fake payment bypass logic, and a mutation-blocking middleware that serves no purpose.

### Why Two Builds

<!-- COMMENT: -->

**The goal is zero cross-contamination:**

- A **demo build** contains all demo infrastructure. It is the only context where fake checkouts, demo sign-in buttons, and mutation guards make sense.
- A **live store build** contains none of it. No dormant components, no dead branches, no demo credentials in server actions, no middleware that shouldn't be there.

This isn't just about bundle size. It's about correctness: live store code should not contain logic paths that were never meant to run there.

### Decisions Made in Pre-Planning

| Decision | Rationale |
|---|---|
| Remove `middleware.ts` from live build entirely | The entire file is demo-specific (mutation guard). Live stores have no use for it and it caused runtime instabilities. |
| Omit demo sign-in + fake checkout from live build | No stubs needed. These features have no live equivalent — they simply don't exist. |
| Remove VAPI from both builds | Already globally disabled (`showVoiceBarista = false`). Cost-prohibitive for real stores. The AI chat feature already tells the AI integration story. Remove now, revisit if economics change. |
| Use `NEXT_PUBLIC_BUILD_VARIANT` (pending naming decision) | Cleaner signal than `NEXT_PUBLIC_DEMO_MODE=true`. Leaves room for future variants (e.g. `staging`). Naming not yet finalized. |

<!-- COMMENT: -->

---

## Demo Behavior Inventory

The following is a complete catalog of every demo-specific behavior, organized by pattern type. This is the source of truth for what belongs in the demo build and what is absent from the live build.

---

### Pattern 1 — Demo-Only Components

> These components and files have no live equivalent. They are absent from the live build entirely.

<!-- COMMENT: -->

| Component / File | Location | What It Does |
|---|---|---|
| `DemoBanner` | `app/(site)/_components/content/DemoBanner.tsx` | Purple gradient banner on all storefront pages. "This is a live demo. No signup required." Animated CTA cycles "Try Admin Dashboard" ↔ "See User Account" every 4s. Dismissible via localStorage. Hides when user is authenticated. |
| `AdminDemoBanner` | `app/admin/_components/shared/AdminDemoBanner.tsx` | Amber warning bar in admin shell. "Demo mode — Changes are disabled in this environment." Dismissible. Shares localStorage key with `DemoBanner` so dismissal syncs across both. |
| `DemoSignInButtons` | `components/auth/DemoSignInButtons.tsx` | Two one-click buttons on both sign-in pages: "Sign in as Admin" and "Sign in as Demo Customer". Uses hardcoded credentials (server-side only, never exposed to client). |
| `middleware.ts` | `middleware.ts` | Blanket HTTP 403 on all `POST / PUT / PATCH / DELETE` requests to `/api/admin/*`. Entire file is demo-specific — no other routing logic lives here. |
| `reset-cache` route | `app/api/test/reset-cache/route.ts` | Clears license/plan cache and forces FREE tier. Used by E2E tests. Gated by `NEXT_PUBLIC_DEMO_MODE`. |
| `demoSignIn` action | `app/auth/actions.ts` (partial) | Server action that authenticates using hardcoded demo credentials. Not present in live build. |

---

### Pattern 2 — Fake Action + Informational Toast

> The user triggers a real-looking action. The demo build bypasses the real side effect and redirects to a fake success URL with an explanatory toast. No live equivalent.

<!-- COMMENT: -->

| Page | URL | User Action | Demo Behavior | Toast Message |
|---|---|---|---|---|
| Support Plans | `/admin/support/plans` | Clicks "Subscribe" on a paid plan | Returns `{ url: "/admin/support/plans?demo=success" }` instead of calling Stripe | "Purchase complete — Demo mode, no charge made." |
| Add-Ons | `/admin/support/add-ons` | Clicks "Purchase" on an add-on package | Returns `{ url: "/admin/support/add-ons?demo=success" }` instead of calling Stripe | "Purchase complete — Demo mode, no charge made." |

**Note on customer checkout:** The customer-facing Stripe checkout (`/api/checkout`) is **not blocked** in demo mode — the middleware matcher only covers `/api/admin/*`. Real purchases can be made on the demo site. This is intentional (demonstrates the full purchase flow) but worth revisiting.

<!-- COMMENT: -->

---

### Pattern 3 — Read-Only / Disabled UI

> The user sees a form or action that is visually disabled. The middleware would block the mutation anyway, but the UI signals intent proactively.

<!-- COMMENT: -->

| Page | URL | Element | Demo Behavior |
|---|---|---|---|
| Admin Profile | `/admin/profile` | Display name + email inputs, save buttons | Inputs are `readOnly`. Buttons are `disabled` with `opacity-50 cursor-not-allowed`. Description text appended: "(demo - read-only)". |
| Admin Nav (dropdown) | `/admin` | "Password" menu item | Item is `disabled`. Badge shows "(demo - disabled)". Cannot navigate to password change. |

---

### Pattern 4 — Hidden / Replaced UI

> UI elements are swapped or suppressed based on demo context. One-offs — no shared abstraction needed.

<!-- COMMENT: -->

| Page | URL | Element | Demo Behavior |
|---|---|---|---|
| Account — Danger Zone | `/account` → Danger Zone tab | Delete Account button | Button replaced with: "Account deletion is not available for demo accounts. This is a demonstration account used to showcase the platform features." Detection is email-based: `email.includes('demo')`. |
| Admin Dashboard | `/admin` | Setup Checklist | All 3 items (products, payments, email) shown as complete regardless of actual configuration. Prevents the onboarding prompt from showing on the demo site. |

---

### Pattern 5 — OG / Metadata Override

> The demo build surfaces platform marketing copy rather than store-specific branding in social sharing and SEO metadata.

<!-- COMMENT: -->

| File | What Changes |
|---|---|
| `app/layout.tsx` | OG title → platform pitch copy. OG description → platform tagline. Page `<title>` → "Artisan Roast" (not store name). |
| `app/opengraph-image.tsx` | "LIVE DEMO" badge rendered on the OG card image. Alt text and subtitle use platform copy. |
| `app/(site)/features/opengraph-image.tsx` | "LIVE DEMO" badge. |
| `app/(site)/about/opengraph-image.tsx` | "LIVE DEMO" badge. |

---

## Proposed Utility Set

Three utilities cover all repeating patterns. Everything else is either a one-off inline or an absent file.

<!-- COMMENT: -->

### `lib/demo.ts` — Single source of truth (demo build only)

```ts
// 1. Build-time constant
//    Next.js inlines this at build time. Dead branch elimination applies to all
//    inline usages. Import elimination requires dynamic imports (see implementation plan).
export const IS_DEMO = process.env.NEXT_PUBLIC_BUILD_VARIANT === "demo"

// 2. Server action bypass
//    Wraps any server action that should be a no-op in demo mode.
//    Returns a fake redirect path and queues a standardized toast.
//    Covers: plans checkout, add-ons checkout, any future paywall action.
export function demoBypassAction(fakeRedirectPath: string): ActionResult

// 3. Read-only field props
//    Returns HTML input props that visually disable a field in demo mode.
//    Covers: admin profile, any future editable admin form.
export function demoFieldProps(): {
  readOnly: boolean
  disabled: boolean
  "aria-disabled": boolean
}
```

### What doesn't need a utility

| Pattern | Why no utility |
|---|---|
| Demo-only components (Pattern 1) | Absent from live build entirely — no abstraction needed |
| Hidden/replaced UI (Pattern 4) | Two unique one-offs with different logic and copy — inline is clearer |
| OG metadata (Pattern 5) | File-level constants, no shared logic to extract |

---

## Open Questions

<!-- COMMENT: -->

1. **Variant signal naming** — Keep `NEXT_PUBLIC_DEMO_MODE=true` or rename to `NEXT_PUBLIC_BUILD_VARIANT=demo`? Renaming is cleaner but touches every check.
2. **Implementation mechanism** — Module aliases in `next.config.ts` (surgical, webpack-level) vs. dynamic imports (simpler, no config). Given ~10 files in scope, dynamic imports may be sufficient.
3. **Server action coverage** — Which admin mutations go through `/api/admin/*` routes vs. call Prisma directly via server actions? Any direct-Prisma server actions are unguarded by middleware and would need `demoBypassAction` wrappers.
4. **Customer checkout in demo** — Currently unblocked (intentional). Worth a decision on whether to document this explicitly or add a soft UI note to demo users.
5. **VAPI removal scope** — Remove in this PR or separate cleanup PR? 5 source files + docs.

---

*Pre-planning conversation: 2026-03-26 | Author: Claude Code (transcribed from design session)*

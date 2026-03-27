/**
 * Demo build utilities (server + client compatible).
 *
 * Next.js inlines NEXT_PUBLIC_* at build time (constant folding), so IS_DEMO
 * becomes a literal boolean at compile time. Branches guarded by IS_DEMO are
 * eliminated as dead code in the live build.
 *
 * Client-side hooks (useDemoDeleteGuard, useDemoProtectedAction) live in
 * lib/demo-hooks.ts to keep this file server-safe.
 */

// ---------------------------------------------------------------------------
// Build-time constant
// ---------------------------------------------------------------------------
export const IS_DEMO =
  process.env.NEXT_PUBLIC_BUILD_VARIANT === "demo" ||
  process.env.NEXT_PUBLIC_BUILD_VARIANT === "DEMO";

// ---------------------------------------------------------------------------
// demoBypassAction
//   For server actions that initiate external flows (e.g. Stripe checkout).
//   Returns a fake success result when in demo mode; null otherwise (caller
//   should run the real action).
//
//   Usage (server action):
//     export async function startCheckout(planSlug: string) {
//       const bypass = demoBypassAction("/admin/support/plans?demo=success")
//       if (bypass) return bypass
//       // ... real checkout logic
//     }
// ---------------------------------------------------------------------------
export type DemoBypassResult = {
  success: true;
  url: string;
  demoMode: true;
};

export function demoBypassAction(
  fakeRedirectPath: string
): DemoBypassResult | null {
  if (!IS_DEMO) return null;
  return {
    success: true,
    url: fakeRedirectPath,
    demoMode: true,
  };
}

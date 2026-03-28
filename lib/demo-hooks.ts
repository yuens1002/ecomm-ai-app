"use client";

/**
 * Demo build hooks (client components only).
 * Import from here in client components that need to intercept click handlers.
 *
 * Toast messages are standardised — do not customise per-callsite.
 */

import { useToast } from "@/hooks/use-toast";
import { IS_DEMO } from "@/lib/demo";

const DEMO_DELETE_MSG = "This action is disabled in demo mode.";
const DEMO_WRITE_MSG = "Changes are disabled in demo mode.";

// ---------------------------------------------------------------------------
// useDemoDeleteGuard
//   Wraps any delete handler. In demo mode the handler is replaced with a
//   toast and the real action is NOT executed.
//
//   Usage:
//     const handleDelete = useDemoDeleteGuard(() => realDelete(id))
//     <Button onClick={handleDelete}>Delete</Button>
// ---------------------------------------------------------------------------
export function useDemoDeleteGuard<T extends (...args: unknown[]) => void>(
  handler: T
): T {
  const { toast } = useToast();
  if (!IS_DEMO) return handler;
  return ((..._args: unknown[]) => {
    toast({ title: DEMO_DELETE_MSG });
  }) as unknown as T;
}

// ---------------------------------------------------------------------------
// useDemoProtectedAction
//   Wraps any write handler that should be a no-op in demo mode (profile
//   saves, settings saves, OAuth connects, ticket submission, etc.).
//
//   Usage:
//     const handleSave = useDemoProtectedAction(() => realSave(data))
//     <Button onClick={handleSave}>Save</Button>
// ---------------------------------------------------------------------------
export function useDemoProtectedAction<T extends (...args: unknown[]) => void>(
  handler: T
): T {
  const { toast } = useToast();
  if (!IS_DEMO) return handler;
  return ((..._args: unknown[]) => {
    toast({ title: DEMO_WRITE_MSG });
  }) as unknown as T;
}

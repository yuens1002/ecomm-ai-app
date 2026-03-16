"use client";

import { useState, useTransition } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape expected from server actions that interact with paid platform endpoints. */
interface PaidActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: T;
}

interface UsePaidActionOptions<T> {
  /** Called when the action succeeds (success: true). */
  onSuccess?: (data: T) => void | Promise<void>;
  /** Called for non-terms errors (generic failures, 402, etc.). */
  onError?: (error: string) => void;
}

interface UsePaidActionResult<T> {
  /** Wrap your server action call with this — it handles terms gating automatically. */
  execute: (action: () => Promise<PaidActionResponse<T>>) => void;
  /** True while the action is in flight. */
  isPending: boolean;
  /** True when the platform returned 403 terms_acceptance_required. */
  showTermsNotice: boolean;
  /** Dismiss the terms notice (e.g. when navigating to Terms tab). */
  clearTermsNotice: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Wraps any server action that calls a paid platform endpoint.
 *
 * Catches `errorCode === "terms_acceptance_required"` (platform 403) and sets
 * `showTermsNotice` so the consumer can render `<TermsNotice />`. All other
 * errors are forwarded to `onError`.
 */
export function usePaidAction<T = unknown>(
  options?: UsePaidActionOptions<T>
): UsePaidActionResult<T> {
  const [isPending, startTransition] = useTransition();
  const [showTermsNotice, setShowTermsNotice] = useState(false);

  function execute(action: () => Promise<PaidActionResponse<T>>) {
    startTransition(async () => {
      const result = await action();

      if (result.success && result.data !== undefined) {
        await options?.onSuccess?.(result.data);
        return;
      }

      if (result.errorCode === "terms_acceptance_required") {
        setShowTermsNotice(true);
        return;
      }

      options?.onError?.(result.error ?? "Something went wrong");
    });
  }

  function clearTermsNotice() {
    setShowTermsNotice(false);
  }

  return { execute, isPending, showTermsNotice, clearTermsNotice };
}

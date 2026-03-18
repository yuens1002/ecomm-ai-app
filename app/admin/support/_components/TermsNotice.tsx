"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Amber notice shown when a paid platform endpoint returns 403
 * `terms_acceptance_required`. Directs the user to the Terms tab.
 */
export function TermsNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Updated terms require acceptance
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Our terms have been updated. Please{" "}
          <Link
            href="/admin/terms/support-terms"
            className="font-medium underline underline-offset-4"
          >
            review and accept
          </Link>{" "}
          the new terms, then try again.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Demo banner that invites users to try the admin dashboard.
 * Only renders when NEXT_PUBLIC_DEMO_MODE env var is set to "true".
 */
export function DemoBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show in demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true" || isDismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5">
      <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="font-medium">This is a live demo.</span>
        </div>
        <span className="hidden sm:inline text-white/80">
          No signup required.
        </span>
        <Link
          href="/auth/signin"
          className="font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
        >
          Try Admin Dashboard →
        </Link>
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            "p-1 rounded hover:bg-white/20 transition-colors ml-auto sm:ml-0"
          )}
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

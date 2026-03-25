"use client";

import { X } from "lucide-react";
import { useState } from "react";

const STORAGE_KEY = "demo-banner-dismissed";

export function AdminDemoBanner() {
  const [isDismissed, setIsDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true"
  );

  if (isDismissed) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      <span>
        <span className="font-medium">Demo mode</span>
        {" — "}
        Changes are disabled in this environment.
      </span>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setIsDismissed(true);
        }}
        aria-label="Dismiss demo mode banner"
        className="ml-4 rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

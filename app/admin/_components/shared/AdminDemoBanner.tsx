"use client";

import { X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "demo-banner-dismissed";

function subscribeDismiss(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function AdminDemoBanner() {
  const storedDismissed = useSyncExternalStore(
    subscribeDismiss,
    () => localStorage.getItem(STORAGE_KEY) === "true",
    () => false
  );
  const [sessionDismissed, setSessionDismissed] = useState(false);

  if (storedDismissed || sessionDismissed) return null;

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
          setSessionDismissed(true);
        }}
        aria-label="Dismiss demo mode banner"
        className="ml-4 rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

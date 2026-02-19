import { useEffect } from "react";

/**
 * Registers a `beforeunload` listener when `isDirty` is true.
 * Prevents accidental data loss on page refresh, tab close, or external navigation.
 */
export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}

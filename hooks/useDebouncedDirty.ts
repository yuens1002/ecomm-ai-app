import { useState, useEffect } from "react";

/**
 * Hook that delays showing a dirty state indicator.
 * Useful for "unsaved changes" indicators that shouldn't appear immediately
 * when the user is actively editing, but should remind them if they've been
 * sitting with unsaved changes for a while.
 *
 * @param isDirty - The actual dirty state from the form
 * @param delay - Delay in milliseconds before showing the dirty indicator (default: 30000ms / 30s)
 * @returns The debounced dirty state
 *
 * Behavior:
 * - When isDirty becomes true, waits `delay` ms before returning true
 * - When isDirty becomes false (saved), immediately returns false
 * - If user saves before delay completes, indicator never shows
 */
export function useDebouncedDirty(
  isDirty: boolean,
  delay: number = 30000
): boolean {
  const [debouncedDirty, setDebouncedDirty] = useState(false);

  useEffect(() => {
    // If not dirty, immediately clear the indicator
    if (!isDirty) {
      const timeoutId = setTimeout(() => setDebouncedDirty(false), 0);
      return () => clearTimeout(timeoutId);
    }

    // If dirty, set a timer to show the indicator after delay
    const timer = setTimeout(() => {
      setDebouncedDirty(true);
    }, delay);

    // Cleanup timer if isDirty changes or component unmounts
    return () => clearTimeout(timer);
  }, [isDirty, delay]);

  return debouncedDirty;
}

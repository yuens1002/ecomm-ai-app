"use client";

import { useResponsiveValue } from "./useResponsiveValue";

/**
 * Splits an array of navigation items into visible and overflow groups
 * based on responsive breakpoints.
 *
 * @param items - Full list of nav items
 * @param breakpoints - Record of `{ minWidth: maxVisible }` pairs
 * @param defaultMax - Max visible items when no breakpoint matches (smallest screens)
 * @returns `{ visible, overflow }` slices of the original array
 */
export function useNavOverflow<T>(
  items: T[],
  breakpoints: Record<number, number>,
  defaultMax: number
): { visible: T[]; overflow: T[] } {
  const maxVisible = useResponsiveValue(breakpoints, defaultMax);

  return {
    visible: items.slice(0, maxVisible),
    overflow: items.slice(maxVisible),
  };
}

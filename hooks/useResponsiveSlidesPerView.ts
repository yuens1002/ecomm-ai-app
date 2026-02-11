"use client";

import { useState, useEffect } from "react";

/**
 * Returns a responsive number of slides-per-view based on window width breakpoints.
 * Breakpoints are matched largest-first (mobile-last).
 *
 * @param breakpoints - Record of `{ minWidth: slidesPerView }` pairs
 * @param defaultValue - Value returned when no breakpoint matches (smallest screens)
 */
export function useResponsiveSlidesPerView(
  breakpoints: Record<number, number>,
  defaultValue: number
): number {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const sorted = Object.entries(breakpoints)
      .map(([bp, v]) => [Number(bp), v] as [number, number])
      .sort((a, b) => b[0] - a[0]);

    const calc = () => {
      const w = window.innerWidth;
      for (const [bp, v] of sorted) {
        if (w >= bp) {
          setValue(v);
          return;
        }
      }
      setValue(defaultValue);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [JSON.stringify(breakpoints), defaultValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

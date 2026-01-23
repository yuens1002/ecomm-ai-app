"use client";

import { useCallback, useRef } from "react";

/**
 * Returns a throttled version of a callback that only executes at most once
 * per specified delay period.
 *
 * Useful for high-frequency events like dragOver that fire ~60fps.
 *
 * @param callback - The function to throttle
 * @param delay - Minimum time between executions in ms (default: 50ms)
 * @returns Throttled callback function
 *
 * @example
 * ```tsx
 * const throttledDragOver = useThrottledCallback(
 *   (e: React.DragEvent, targetId: string) => {
 *     // This runs at most every 50ms
 *     updateDropTarget(targetId);
 *   },
 *   50
 * );
 * ```
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 50
): T {
  const lastCallRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  const throttled = useCallback(
    function throttledFn(...args: Parameters<T>) {
      const now = Date.now();
      lastArgsRef.current = args;

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );

  return throttled as T;
}

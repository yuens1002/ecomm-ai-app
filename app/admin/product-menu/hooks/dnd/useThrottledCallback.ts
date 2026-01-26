"use client";

import { useCallback, useRef } from "react";

/**
 * Result of useThrottledCallback hook.
 */
export type ThrottledCallbackResult<T extends (...args: Parameters<T>) => void> = {
  /** The throttled callback function */
  throttled: T;
  /** Flush any pending call - executes callback with latest args if any were skipped */
  flush: () => void;
};

/**
 * Returns a throttled version of a callback that only executes at most once
 * per specified delay period.
 *
 * Useful for high-frequency events like dragOver that fire ~60fps.
 * Includes a flush function to execute pending calls immediately (useful before drop).
 *
 * @param callback - The function to throttle
 * @param delay - Minimum time between executions in ms (default: 50ms)
 * @returns Object with throttled callback and flush function
 *
 * @example
 * ```tsx
 * const { throttled, flush } = useThrottledCallback(
 *   (targetId: string, clientY: number) => {
 *     updateDropTarget(targetId, clientY);
 *   },
 *   50
 * );
 *
 * // In dragOver handler:
 * throttled(targetId, e.clientY);
 *
 * // Before drop - ensure latest position is applied:
 * flush();
 * ```
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 50
): ThrottledCallbackResult<T> {
  const lastCallRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const hasPendingRef = useRef<boolean>(false);

  const throttled = useCallback(
    function throttledFn(...args: Parameters<T>) {
      const now = Date.now();
      lastArgsRef.current = args;

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        hasPendingRef.current = false;
        callback(...args);
      } else {
        hasPendingRef.current = true;
      }
    },
    [callback, delay]
  );

  const flush = useCallback(() => {
    if (hasPendingRef.current && lastArgsRef.current) {
      hasPendingRef.current = false;
      lastCallRef.current = Date.now();
      callback(...(lastArgsRef.current as Parameters<T>));
    }
  }, [callback]);

  return { throttled: throttled as T, flush };
}

"use client";

import { useCallback, useRef, useState } from "react";

type UseLongPressOptions = {
  /** Duration in ms before long-press triggers (default: 500) */
  duration?: number;
  /** Movement threshold in px to cancel (for scroll safety, default: 10) */
  movementThreshold?: number;
  /** Callback when long-press completes */
  onLongPress: () => void;
  /** Optional callback when long-press starts (for visual feedback) */
  onStart?: () => void;
  /** Optional callback when long-press is cancelled */
  onCancel?: () => void;
};

type UseLongPressReturn = {
  /** Whether a long-press is currently in progress */
  isPressed: boolean;
  /** Progress value 0-1 for visual feedback (circular progress indicator) */
  progress: number;
  /** Event handlers to spread on the target element */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
};

/**
 * Hook for scroll-safe long-press detection.
 *
 * Cancels if:
 * - Touch moves > threshold (user is scrolling)
 * - Pointer leaves element
 * - Pointer is released before duration
 *
 * @example
 * ```tsx
 * const { isPressed, progress, handlers } = useLongPress({
 *   duration: 500,
 *   onLongPress: () => rangeSelect(targetKey),
 * });
 *
 * return (
 *   <div {...handlers} className={isPressed ? 'pressing' : ''}>
 *     <Checkbox />
 *     {isPressed && <CircularProgress value={progress} />}
 *   </div>
 * );
 * ```
 */
export function useLongPress(options: UseLongPressOptions): UseLongPressReturn {
  const {
    duration = 500,
    movementThreshold = 10,
    onLongPress,
    onStart,
    onCancel,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const completedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    startPosRef.current = null;
    setIsPressed(false);
    setProgress(0);
  }, []);

  const cancel = useCallback(() => {
    if (isPressed && !completedRef.current) {
      onCancel?.();
    }
    completedRef.current = false;
    cleanup();
  }, [isPressed, cleanup, onCancel]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only respond to primary button (left click / touch)
      if (e.button !== 0) return;

      completedRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      setIsPressed(true);
      setProgress(0);
      onStart?.();

      // Start progress animation
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress >= 1) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
      }, 16); // ~60fps

      // Set main timer for long-press completion
      timerRef.current = setTimeout(() => {
        completedRef.current = true;
        cleanup();
        onLongPress();
      }, duration);
    },
    [duration, cleanup, onLongPress, onStart]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      cancel();
    },
    [cancel]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current) return;

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Cancel if moved beyond threshold (user is scrolling)
      if (distance > movementThreshold) {
        cancel();
      }
    },
    [movementThreshold, cancel]
  );

  const handlePointerLeave = useCallback(
    (_e: React.PointerEvent) => {
      cancel();
    },
    [cancel]
  );

  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent) => {
      cancel();
    },
    [cancel]
  );

  return {
    isPressed,
    progress,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      onPointerCancel: handlePointerCancel,
    },
  };
}

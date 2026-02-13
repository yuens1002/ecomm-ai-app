"use client";

import { useCallback, useRef } from "react";

interface HistoryEntry<T> {
  state: T;
  timestamp: number;
}

interface UseFormHistoryOptions {
  /** localStorage key — should be unique per product */
  storageKey: string;
  /** Max entries to keep (default 10) */
  maxEntries?: number;
}

/**
 * Saves form state snapshots to localStorage with undo/redo support.
 * Call `pushSnapshot` before each auto-save to record the pre-save state.
 * Pushing a new snapshot clears the redo stack.
 */
export function useFormHistory<T>({
  storageKey,
  maxEntries = 10,
}: UseFormHistoryOptions) {
  const undoKey = `form-history:${storageKey}:undo`;
  const redoKey = `form-history:${storageKey}:redo`;
  const undoCacheRef = useRef<HistoryEntry<T>[] | null>(null);
  const redoCacheRef = useRef<HistoryEntry<T>[] | null>(null);

  const readStack = useCallback(
    (key: string, cacheRef: React.RefObject<HistoryEntry<T>[] | null>): HistoryEntry<T>[] => {
      if (cacheRef.current) return cacheRef.current;
      try {
        const raw = localStorage.getItem(key);
        const entries = raw ? (JSON.parse(raw) as HistoryEntry<T>[]) : [];
        (cacheRef as React.MutableRefObject<HistoryEntry<T>[] | null>).current = entries;
        return entries;
      } catch {
        return [];
      }
    },
    []
  );

  const writeStack = useCallback(
    (key: string, cacheRef: React.RefObject<HistoryEntry<T>[] | null>, entries: HistoryEntry<T>[]) => {
      (cacheRef as React.MutableRefObject<HistoryEntry<T>[] | null>).current = entries;
      try {
        localStorage.setItem(key, JSON.stringify(entries));
      } catch {
        const trimmed = entries.slice(-Math.floor(maxEntries / 2));
        try {
          localStorage.setItem(key, JSON.stringify(trimmed));
          (cacheRef as React.MutableRefObject<HistoryEntry<T>[] | null>).current = trimmed;
        } catch {
          // Give up silently
        }
      }
    },
    [maxEntries]
  );

  /** Save current state as a snapshot. Clears redo stack. */
  const pushSnapshot = useCallback(
    (state: T) => {
      const history = readStack(undoKey, undoCacheRef);
      const entry: HistoryEntry<T> = { state, timestamp: Date.now() };
      const updated = [...history, entry].slice(-maxEntries);
      writeStack(undoKey, undoCacheRef, updated);
      // New change clears redo
      writeStack(redoKey, redoCacheRef, []);
    },
    [undoKey, redoKey, readStack, writeStack, maxEntries]
  );

  /** Pop the most recent undo entry. Caller should push current state to redo. */
  const undo = useCallback(
    (currentState: T): T | null => {
      const undoStack = readStack(undoKey, undoCacheRef);
      if (undoStack.length === 0) return null;

      const last = undoStack[undoStack.length - 1];
      // Move current state to redo stack
      const redoStack = readStack(redoKey, redoCacheRef);
      writeStack(redoKey, redoCacheRef, [
        ...redoStack,
        { state: currentState, timestamp: Date.now() },
      ].slice(-maxEntries));
      // Pop from undo stack
      writeStack(undoKey, undoCacheRef, undoStack.slice(0, -1));
      return last.state;
    },
    [undoKey, redoKey, readStack, writeStack, maxEntries]
  );

  /** Pop the most recent redo entry. Caller should push current state to undo. */
  const redo = useCallback(
    (currentState: T): T | null => {
      const redoStack = readStack(redoKey, redoCacheRef);
      if (redoStack.length === 0) return null;

      const last = redoStack[redoStack.length - 1];
      // Move current state to undo stack
      const undoStack = readStack(undoKey, undoCacheRef);
      writeStack(undoKey, undoCacheRef, [
        ...undoStack,
        { state: currentState, timestamp: Date.now() },
      ].slice(-maxEntries));
      // Pop from redo stack
      writeStack(redoKey, redoCacheRef, redoStack.slice(0, -1));
      return last.state;
    },
    [undoKey, redoKey, readStack, writeStack, maxEntries]
  );

  const getUndoCount = useCallback(
    (): number => readStack(undoKey, undoCacheRef).length,
    [undoKey, readStack]
  );

  const getRedoCount = useCallback(
    (): number => readStack(redoKey, redoCacheRef).length,
    [redoKey, readStack]
  );

  const clear = useCallback(() => {
    writeStack(undoKey, undoCacheRef, []);
    writeStack(redoKey, redoCacheRef, []);
  }, [undoKey, redoKey, writeStack]);

  return { pushSnapshot, undo, redo, getUndoCount, getRedoCount, clear };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SaveStatusState } from "@/app/admin/_components/forms/SaveStatus";
import { useFormHistory } from "./useFormHistory";

interface UseAutoSaveOptions<T = unknown> {
  /** The async save function to call */
  saveFn: () => Promise<void>;
  /** Debounce delay in ms (default 800) */
  debounceMs?: number;
  /** Whether all required fields are valid — blocks save when false */
  isValid: boolean;
  /** Dependencies to watch for changes */
  deps: unknown[];
  /** Form state to snapshot before each save (for undo history) */
  formState?: T;
  /** localStorage key for history (required if formState is provided) */
  historyKey?: string;
  /** Callback to restore form state on undo/redo */
  onRestore?: (state: T) => void;
}

/**
 * Auto-save hook that triggers a debounced save whenever deps change.
 * Skips the initial render (mount) to avoid saving on load.
 * Snapshots form state to localStorage before each save (last 10).
 * Returns the current save status and undo/redo controls.
 */
export function useAutoSave<T = unknown>({
  saveFn,
  debounceMs = 800,
  isValid,
  deps,
  formState,
  historyKey,
  onRestore,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatusState>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const isRestoringRef = useRef(false);
  // Stable refs to latest values to avoid stale closures
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;
  const isValidRef = useRef(isValid);
  isValidRef.current = isValid;
  const formStateRef = useRef(formState);
  formStateRef.current = formState;
  const lastSavedStateRef = useRef(formState);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const { pushSnapshot, undo: historyUndo, redo: historyRedo, getUndoCount, getRedoCount, clear } =
    useFormHistory<T>({
      storageKey: historyKey ?? "default",
    });

  // Reactive history counts — updated after push/undo/redo
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const refreshCounts = useCallback(() => {
    setHistoryCounts({ undo: getUndoCount(), redo: getRedoCount() });
  }, [getUndoCount, getRedoCount]);

  const doSave = useCallback(async () => {
    // Track whether this save was triggered by an undo/redo restore
    const isRestore = isRestoringRef.current;
    if (isRestore) isRestoringRef.current = false;

    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    if (!isValidRef.current) {
      setStatus("error");
      return;
    }

    isSavingRef.current = true;
    setStatus("saving");

    try {
      await saveFnRef.current();
      setStatus("saved");

      // Snapshot the PREVIOUS saved state for undo (only after successful save)
      // Skip snapshot push for restores to avoid circular undo entries
      if (!isRestore && lastSavedStateRef.current !== undefined && historyKey) {
        pushSnapshot(lastSavedStateRef.current);
        refreshCounts();
      }
      lastSavedStateRef.current = formStateRef.current;
    } catch {
      setStatus("error");
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        doSave();
      }
    }
  }, [pushSnapshot, historyKey, refreshCounts]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (!isValid) {
      setStatus("error");
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      doSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave();
  }, [doSave]);

  const undo = useCallback(() => {
    if (!formStateRef.current || !onRestoreRef.current) return;
    const prev = historyUndo(formStateRef.current);
    if (prev) {
      isRestoringRef.current = true;
      onRestoreRef.current(prev);
      refreshCounts();
    }
  }, [historyUndo, refreshCounts]);

  const redo = useCallback(() => {
    if (!formStateRef.current || !onRestoreRef.current) return;
    const next = historyRedo(formStateRef.current);
    if (next) {
      isRestoringRef.current = true;
      onRestoreRef.current(next);
      refreshCounts();
    }
  }, [historyRedo, refreshCounts]);

  /** Record an external save (e.g. add-on API call) to undo history without triggering saveFn. */
  const markExternalSave = useCallback((newFormState?: T) => {
    if (lastSavedStateRef.current !== undefined && historyKey) {
      pushSnapshot(lastSavedStateRef.current);
      refreshCounts();
    }
    lastSavedStateRef.current = newFormState ?? formStateRef.current;
  }, [pushSnapshot, historyKey, refreshCounts]);

  return {
    status,
    saveNow,
    undo,
    redo,
    canUndo: historyCounts.undo > 0,
    canRedo: historyCounts.redo > 0,
    clearHistory: clear,
    markExternalSave,
  };
}

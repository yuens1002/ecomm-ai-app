import type { VisibilityState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

function loadVisibility(key: string): VisibilityState {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
}

function saveVisibility(key: string, state: VisibilityState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useColumnVisibility(
  storageKey?: string,
  alwaysHidden?: VisibilityState
) {
  const [userVisibility, setUserVisibility] = useState<VisibilityState>(
    () => (storageKey ? loadVisibility(storageKey) : {})
  );

  const handleVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      setUserVisibility((prev) => {
        const next = { ...prev, [columnId]: visible };
        if (storageKey) saveVisibility(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const columnVisibility: VisibilityState = useMemo(
    () => ({ ...userVisibility, ...alwaysHidden }),
    [userVisibility, alwaysHidden]
  );

  return { columnVisibility, handleVisibilityChange };
}

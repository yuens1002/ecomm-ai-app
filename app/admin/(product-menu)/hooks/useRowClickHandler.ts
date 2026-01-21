"use client";

import { useCallback } from "react";
import type { IdentityRegistry } from "../types/identity-registry";
import type { CheckboxState } from "./useContextSelectionModel";

type NavigateHandler = (kind: string, entityId: string) => void;

type RowClickHandlerOptions = {
  /** Toggle selection for a single key */
  onToggle: (key: string) => void;

  /** Toggle selection with hierarchy cascade (for parents) */
  onToggleWithHierarchy?: (key: string) => void;

  /** Get current checkbox state for a key */
  getCheckboxState?: (key: string) => CheckboxState;

  /** Currently expanded keys */
  expandedIds?: Set<string>;

  /** Toggle expand/collapse */
  toggleExpand?: (expandKey: string) => void;

  /** Navigate to entity detail view */
  navigate?: NavigateHandler;
};

/**
 * Unified row click handler for all table views.
 *
 * Works with any IdentityRegistry (flat or hierarchical).
 * Handles:
 * - Selection toggle (single or with hierarchy cascade)
 * - Expand/collapse sync with selection state
 * - Double-click navigation
 *
 * @example Flat table (AllLabelsTableView)
 * ```ts
 * const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
 *   onToggle: builder.toggleSelection,
 *   navigate: (kind, id) => builder.navigateToLabel(id),
 * });
 * ```
 *
 * @example Hierarchical table (MenuTableView)
 * ```ts
 * const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
 *   onToggle: selection.onToggle,
 *   onToggleWithHierarchy: selection.onToggleWithHierarchy,
 *   getCheckboxState: selection.getCheckboxState,
 *   expandedIds: builder.expandedIds,
 *   toggleExpand: builder.toggleExpand,
 *   navigate: handleNavigate,
 * });
 * ```
 */
export function useRowClickHandler(
  registry: IdentityRegistry,
  options: RowClickHandlerOptions
) {
  const {
    onToggle,
    onToggleWithHierarchy,
    getCheckboxState,
    toggleExpand,
    navigate,
  } = options;

  /**
   * Handle single click on a row.
   *
   * Behavior:
   * - Parent rows (expandable): Toggle expand/collapse AND toggle selection with hierarchy
   *   - Exception: If indeterminate, don't collapse (keep expanded to show newly selected children)
   * - Leaf rows: Toggle selection
   */
  const handleClick = useCallback(
    (key: string) => {
      const identity = registry.get(key);
      if (!identity) return;

      // 1. Toggle expand/collapse if this row is expandable
      // Exception: Don't collapse if indeterminate (selecting all children - keep visible)
      if (identity.isExpandable && toggleExpand) {
        const checkboxState = getCheckboxState?.(key);
        const isIndeterminate = checkboxState === "indeterminate";

        // Only toggle expand if NOT indeterminate
        // When indeterminate, clicking selects all children - keep parent expanded
        if (!isIndeterminate) {
          toggleExpand(identity.entityId);
        }
      }

      // 2. Toggle selection
      // Use hierarchy toggle for parent rows (has children), simple toggle for leaf rows
      if (identity.childKeys.length > 0 && onToggleWithHierarchy) {
        onToggleWithHierarchy(key);
      } else {
        onToggle(key);
      }
    },
    [registry, onToggle, onToggleWithHierarchy, getCheckboxState, toggleExpand]
  );

  /**
   * Handle double click on a row.
   *
   * Behavior: Navigate to the entity's detail view.
   */
  const handleDoubleClick = useCallback(
    (key: string) => {
      if (!navigate) return;

      const identity = registry.get(key);
      if (!identity) return;

      navigate(identity.kind, identity.entityId);
    },
    [registry, navigate]
  );

  return {
    handleClick,
    handleDoubleClick,
  };
}

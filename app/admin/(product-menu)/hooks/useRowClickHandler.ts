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
    expandedIds,
    toggleExpand,
    navigate,
  } = options;

  /**
   * Handle single click on a row.
   *
   * Behavior:
   * - Parent rows (expandable): Sync expand state with resulting selection state
   *   - Selecting (→ checked) → Expand
   *   - Deselecting (→ unchecked) → Collapse
   * - Leaf rows: Toggle selection only
   */
  const handleClick = useCallback(
    (key: string) => {
      const identity = registry.get(key);
      if (!identity) return;

      // 1. Sync expand state with selection if this row is expandable
      if (identity.isExpandable && toggleExpand && expandedIds) {
        const checkboxState = getCheckboxState?.(key);
        const isCurrentlyExpanded = expandedIds.has(identity.entityId);

        // Determine what selection state will be AFTER toggle:
        // - unchecked → checked (selecting)
        // - checked → unchecked (deselecting)
        // - indeterminate → checked (selecting all)
        const willBeSelected = checkboxState !== "checked";

        // Sync expand with selection result:
        // - Selecting → Expand (if not already expanded)
        // - Deselecting → Collapse (if not already collapsed)
        if (willBeSelected && !isCurrentlyExpanded) {
          toggleExpand(identity.entityId);
        } else if (!willBeSelected && isCurrentlyExpanded) {
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
    [registry, onToggle, onToggleWithHierarchy, getCheckboxState, expandedIds, toggleExpand]
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

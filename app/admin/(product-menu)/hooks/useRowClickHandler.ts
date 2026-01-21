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
   * 1. If expandable, sync expand/collapse with selection state
   * 2. Toggle selection (cascade to children if parent)
   */
  const handleClick = useCallback(
    (key: string) => {
      const identity = registry.get(key);
      if (!identity) return;

      // 1. Sync expand/collapse with selection state (if expandable)
      if (identity.expandKey && toggleExpand && expandedIds && getCheckboxState) {
        const willSelect = getCheckboxState(key) !== "checked";
        const isExpanded = expandedIds.has(identity.expandKey);

        // Expand when selecting, collapse when deselecting
        if (willSelect !== isExpanded) {
          toggleExpand(identity.expandKey);
        }
      }

      // 2. Toggle selection
      if (identity.childKeys.length > 0 && onToggleWithHierarchy) {
        // Parent row - use hierarchy-aware toggle
        onToggleWithHierarchy(key);
      } else {
        // Leaf row - simple toggle
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

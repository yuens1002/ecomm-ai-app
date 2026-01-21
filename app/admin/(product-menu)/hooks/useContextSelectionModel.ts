"use client";

import { useCallback, useMemo } from "react";
import type { SelectedEntityKind } from "../types/builder-state";
import {
  getActionableRoots,
  getKindFromKey as getKindFromKeyBase,
} from "../types/identity-registry";

type BuilderSelectionApi = {
  selectedIds: string[];
  selectedKind: SelectedEntityKind | null;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
};

export type CheckboxState = "checked" | "indeterminate" | "unchecked";

type BulkSelectionState = {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
};

/**
 * Hierarchy configuration for tri-state checkbox computation.
 *
 * When provided, enables parent checkboxes that show tri-state based on
 * descendant selection, and master-switch toggle behavior.
 */
type HierarchyConfig = {
  /**
   * Get all descendant keys for a parent key.
   * Returns empty array if key is a leaf or has no descendants.
   */
  getDescendants: (key: string) => string[];
};

type UseContextSelectionModelOptions = {
  /** All selectable keys in this context (kind-prefixed) */
  selectableKeys: string[];
  /** Optional hierarchy for tri-state parent checkboxes and master switch behavior */
  hierarchy?: HierarchyConfig;
};

// Type-safe wrapper for identity-registry's getKindFromKey
const getKindFromKey = (key: string): SelectedEntityKind =>
  getKindFromKeyBase(key) as SelectedEntityKind;

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified selection model hook for table views.
 *
 * Uses kind-prefixed keys to track selections across different entity types.
 * Supports both flat tables and hierarchical tables with master switch behavior.
 *
 * Key format: "kind:id" (e.g., "label:abc123", "category:labelId-catId", "product:labelId-catId-prodId")
 *
 * @example Flat table (AllLabels)
 * ```ts
 * const selection = useContextSelectionModel(builder, {
 *   selectableKeys: labels.map(l => createKey("label", l.id)),
 * });
 * ```
 *
 * @example Hierarchical table (MenuTableView)
 * ```ts
 * const selection = useContextSelectionModel(builder, {
 *   selectableKeys: hierarchy.allKeys,
 *   hierarchy: { getDescendants: hierarchy.getDescendants },
 * });
 * ```
 */
export function useContextSelectionModel(
  builder: BuilderSelectionApi,
  options: UseContextSelectionModelOptions
) {
  const { selectableKeys, hierarchy } = options;

  const selectedIdSet = useMemo(() => new Set(builder.selectedIds), [builder.selectedIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compute selected kind from actionable root keys.
   * Returns the kind if all roots are same kind, null if mixed or empty.
   *
   * Actionable roots are selected keys whose parents are NOT selected.
   * This filters out descendants and only considers the items to act on.
   */
  const selectedKind = useMemo((): SelectedEntityKind | null => {
    if (builder.selectedIds.length === 0) return null;

    const roots = getActionableRoots(builder.selectedIds);
    if (roots.length === 0) return null;

    const kinds = new Set(roots.map(getKindFromKey));
    if (kinds.size === 1) {
      return [...kinds][0];
    }
    return null; // Mixed kinds
  }, [builder.selectedIds]);

  const isSameKind = selectedKind !== null;

  // Bulk selection state for header checkbox
  const selectionState: BulkSelectionState = useMemo(() => {
    if (selectableKeys.length === 0 || builder.selectedIds.length === 0) {
      return { allSelected: false, someSelected: false, selectedCount: 0 };
    }

    let selectedCount = 0;
    for (const key of selectableKeys) {
      if (selectedIdSet.has(key)) selectedCount += 1;
    }

    const allSelected = selectedCount === selectableKeys.length;
    const someSelected = selectedCount > 0 && !allSelected;

    return { allSelected, someSelected, selectedCount };
  }, [selectableKeys, builder.selectedIds.length, selectedIdSet]);

  // ─────────────────────────────────────────────────────────────────────────
  // CHECKBOX STATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get tri-state checkbox state for any key.
   *
   * For leaves: returns "checked" or "unchecked" based on direct selection.
   * For parents (when hierarchy provided): computes from descendant selection.
   */
  const getCheckboxState = useCallback(
    (key: string): CheckboxState => {
      // If no hierarchy, treat as leaf
      if (!hierarchy) {
        return selectedIdSet.has(key) ? "checked" : "unchecked";
      }

      // Check if this key has descendants (is a parent)
      const descendants = hierarchy.getDescendants(key);

      if (descendants.length === 0) {
        // Leaf node - directly selected or not
        return selectedIdSet.has(key) ? "checked" : "unchecked";
      }

      // Parent node - compute from descendants
      const selectedCount = descendants.filter((d) => selectedIdSet.has(d)).length;

      if (selectedCount === 0) return "unchecked";
      if (selectedCount === descendants.length) return "checked";
      return "indeterminate";
    },
    [selectedIdSet, hierarchy]
  );

  /**
   * Get actionable root keys - items whose parents are not selected.
   * Memoized for use in multiple checks.
   */
  const actionableRoots = useMemo(
    () => getActionableRoots(builder.selectedIds),
    [builder.selectedIds]
  );

  /**
   * Check if all actionable roots have "checked" state (not indeterminate).
   * Used for action validation - actions require complete selections.
   *
   * A root is "complete" if all its descendants are selected (checked state).
   */
  const allRootsAreChecked = useMemo((): boolean => {
    if (actionableRoots.length === 0) return false;

    return actionableRoots.every((key) => getCheckboxState(key) === "checked");
  }, [actionableRoots, getCheckboxState]);

  /**
   * Whether actions (clone, remove) can be performed.
   * Requires:
   * - Has selection
   * - All actionable roots are same kind
   * - All actionable roots are complete (checked state)
   */
  const canPerformAction = actionableRoots.length > 0 && isSameKind && allRootsAreChecked;

  // ─────────────────────────────────────────────────────────────────────────
  // TOGGLE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Toggle selection for header (select all / clear all).
   */
  const onSelectAll = useCallback(() => {
    if (selectionState.allSelected) {
      builder.clearSelection();
    } else {
      builder.selectAll(selectableKeys);
    }
  }, [builder, selectableKeys, selectionState.allSelected]);

  /**
   * Toggle selection for a single key.
   */
  const onToggle = useCallback(
    (key: string) => {
      builder.toggleSelection(key);
    },
    [builder]
  );

  /**
   * Toggle selection with hierarchy awareness (master switch behavior).
   *
   * For leaves: toggles the single key.
   * For parents: toggles all descendants (checked → clear all, else → select all).
   */
  const onToggleWithHierarchy = useCallback(
    (key: string) => {
      if (!hierarchy) {
        // No hierarchy - simple toggle
        builder.toggleSelection(key);
        return;
      }

      const descendants = hierarchy.getDescendants(key);

      if (descendants.length === 0) {
        // Leaf - simple toggle
        builder.toggleSelection(key);
        return;
      }

      // Parent - master switch behavior: toggle all descendants
      const currentState = getCheckboxState(key);

      if (currentState === "checked") {
        // Deselect parent and all descendants
        const keysToRemove = new Set([key, ...descendants]);
        const remainingIds = builder.selectedIds.filter((id) => !keysToRemove.has(id));
        if (remainingIds.length === 0) {
          builder.clearSelection();
        } else {
          builder.selectAll(remainingIds);
        }
      } else {
        // Select parent and all descendants (handles both unchecked and indeterminate)
        const keysToAdd = new Set([key, ...descendants]);
        const existingOther = builder.selectedIds.filter((id) => !keysToAdd.has(id));
        const newIds = [...existingOther, key, ...descendants];
        builder.selectAll(newIds);
      }
    },
    [builder, hierarchy, getCheckboxState]
  );

  /**
   * Check if a specific key is selected.
   */
  const isSelected = useCallback((key: string) => selectedIdSet.has(key), [selectedIdSet]);

  return {
    // Selectable keys
    selectableKeys,

    // Derived kind info
    selectedKind,
    isSameKind,

    // Header state
    selectionState,
    onSelectAll,

    // Row state and handlers
    getCheckboxState,
    isSelected,
    onToggle,
    onToggleWithHierarchy,

    // Action validation
    canPerformAction,
    allRootsAreChecked,
    actionableRoots,

    // Selection info
    hasSelection: builder.selectedIds.length > 0,
    selectedCount: builder.selectedIds.length,
  };
}

"use client";

import { useCallback, useMemo, useState } from "react";
import type { SelectedEntityKind } from "../types/builder-state";
import {
  getKindFromKey as getKindFromKeyBase,
  getParentKey,
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

  // Track anchor key for range selection (Shift+click or long-press checkbox)
  const [anchorKey, setAnchorKey] = useState<string | null>(null);

  const selectedIdSet = useMemo(() => new Set(builder.selectedIds), [builder.selectedIds]);

  // Filter out stale selections that are no longer in selectableKeys
  // This handles data changes (refetch, filter changes) that remove entities
  const selectableKeySet = useMemo(() => new Set(selectableKeys), [selectableKeys]);
  const validSelectedIds = useMemo(
    () => builder.selectedIds.filter((id) => selectableKeySet.has(id)),
    [builder.selectedIds, selectableKeySet]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CHECKBOX STATE (computed first, needed by actionableRoots)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get tri-state checkbox state for any key.
   *
   * For leaves: returns "checked" or "unchecked" based on direct selection.
   * For parents: "checked" ONLY when explicitly selected (not computed from descendants).
   *
   * This ensures the UI is honest:
   * - "checked" = user explicitly selected this entity (as a unit)
   * - "indeterminate" = some/all descendants selected, but NOT this entity
   * - "unchecked" = nothing selected
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

      // Parent node - only "checked" if EXPLICITLY selected
      // This prevents the UI from lying about user intent
      if (selectedIdSet.has(key)) {
        return "checked";
      }

      // Parent not explicitly selected - check descendants
      const hasSelectedDescendants = descendants.some((d) => selectedIdSet.has(d));
      return hasSelectedDescendants ? "indeterminate" : "unchecked";
    },
    [selectedIdSet, hierarchy]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get actionable root keys for DnD and action operations.
   *
   * A key is an actionable root if:
   * 1. It is "checked" (not indeterminate or unchecked)
   * 2. Its parent is NOT explicitly selected with "checked" state
   *
   * Key insight: We only filter out children if the parent is EXPLICITLY in selection.
   * A parent's computed "checked" state (from all children being selected) doesn't count.
   *
   * This preserves user intent:
   * - Click label → selects label + categories → label is root → drag label
   * - Click all categories → only categories selected → categories are roots → drag categories
   * - Click label, then deselect some → label indeterminate → categories are roots
   */
  const actionableRoots = useMemo(() => {
    const roots: string[] = [];
    const selectedKeySet = new Set(validSelectedIds);

    for (const key of validSelectedIds) {
      // Only "checked" items can be actionable roots
      if (getCheckboxState(key) !== "checked") {
        continue;
      }

      // Check if parent is EXPLICITLY selected AND "checked"
      // Only then do we filter out this child (parent takes precedence)
      const parentKey = getParentKey(key);
      if (
        parentKey !== null &&
        selectedKeySet.has(parentKey) &&
        getCheckboxState(parentKey) === "checked"
      ) {
        continue;
      }

      roots.push(key);
    }

    return roots;
  }, [validSelectedIds, getCheckboxState]);

  /**
   * Compute selected kind from actionable root keys.
   * Returns the kind if all roots are same kind, null if mixed or empty.
   */
  const selectedKind = useMemo((): SelectedEntityKind | null => {
    if (actionableRoots.length === 0) return null;

    const kinds = new Set(actionableRoots.map(getKindFromKey));
    if (kinds.size === 1) {
      return [...kinds][0];
    }
    return null; // Mixed kinds
  }, [actionableRoots]);

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

  /**
   * Check if all actionable roots have "checked" state (not indeterminate).
   *
   * With the new actionableRoots logic, roots are already filtered to only
   * include "checked" items, so this is always true when roots exist.
   */
  const allRootsAreChecked = actionableRoots.length > 0;

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
   * Sets the anchor for subsequent range selections.
   */
  const onToggle = useCallback(
    (key: string) => {
      builder.toggleSelection(key);
      // Set anchor after toggle - if selecting, this becomes the new anchor
      // Check the CURRENT state (before toggle) to determine if we're selecting
      if (!selectedIdSet.has(key)) {
        // Currently not selected, so toggle will select it → set anchor
        setAnchorKey(key);
      }
    },
    [builder, selectedIdSet]
  );

  /**
   * Get visible keys between two keys (inclusive, ordered by selectableKeys).
   * Used for range selection.
   */
  const getKeysBetween = useCallback(
    (fromKey: string, toKey: string): string[] => {
      const fromIndex = selectableKeys.indexOf(fromKey);
      const toIndex = selectableKeys.indexOf(toKey);

      if (fromIndex === -1 || toIndex === -1) return [];

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);

      return selectableKeys.slice(startIndex, endIndex + 1);
    },
    [selectableKeys]
  );

  /**
   * Select a range of keys from anchor to target.
   * Used by Shift+click (desktop) and long-press checkbox (mobile).
   *
   * Behavior:
   * - If range is not fully selected: select all items in range
   * - If range is already fully selected: deselect all items in range (toggle)
   *
   * Returns the count of items affected (positive for select, negative for deselect).
   */
  const rangeSelect = useCallback(
    (targetKey: string): number => {
      if (!anchorKey) {
        // No anchor - treat as single select and set anchor
        if (!selectedIdSet.has(targetKey)) {
          builder.toggleSelection(targetKey);
          setAnchorKey(targetKey);
          return 1;
        }
        return 0;
      }

      const range = getKeysBetween(anchorKey, targetKey);
      if (range.length === 0) return 0;

      // Check if entire range is already selected (for toggle behavior)
      const allSelected = range.every((key) => selectedIdSet.has(key));

      if (allSelected) {
        // Deselect the entire range
        const keysToRemove = new Set(range);
        const remainingIds = builder.selectedIds.filter((id) => !keysToRemove.has(id));
        if (remainingIds.length === 0) {
          builder.clearSelection();
        } else {
          builder.selectAll(remainingIds);
        }
        // Clear anchor since we deselected
        setAnchorKey(null);
        return -range.length;
      } else {
        // Select all items in range (add to existing selection)
        const newSelection = new Set([...builder.selectedIds, ...range]);
        const newCount = newSelection.size - builder.selectedIds.length;
        builder.selectAll([...newSelection]);
        return newCount;
      }
    },
    [anchorKey, getKeysBetween, builder, selectedIdSet]
  );

  /**
   * Clear anchor (call when selection is cleared).
   */
  const clearAnchor = useCallback(() => {
    setAnchorKey(null);
  }, []);

  /**
   * Toggle selection with hierarchy awareness (master switch behavior).
   *
   * For leaves: toggles the single key, and removes parent if it becomes indeterminate.
   * For parents: toggles all descendants (checked → clear all, else → select all).
   *
   * Key behavior: When deselecting a child causes parent to become indeterminate,
   * we also remove the parent from selection. This preserves user intent - they're
   * now working with individual children, not the parent.
   */
  const onToggleWithHierarchy = useCallback(
    (key: string) => {
      if (!hierarchy) {
        // No hierarchy - simple toggle (same as onToggle)
        builder.toggleSelection(key);
        // Set anchor if selecting
        if (!selectedIdSet.has(key)) {
          setAnchorKey(key);
        }
        return;
      }

      const descendants = hierarchy.getDescendants(key);

      if (descendants.length === 0) {
        // Leaf node - toggle with parent demotion logic
        const isCurrentlySelected = selectedIdSet.has(key);
        const parentKey = getParentKey(key);

        if (isCurrentlySelected && parentKey !== null) {
          // Deselecting a child - check if parent should be demoted
          const parentWasChecked = getCheckboxState(parentKey) === "checked";
          const parentInSelection = selectedIdSet.has(parentKey);

          if (parentWasChecked && parentInSelection) {
            // Parent will become indeterminate - remove parent from selection
            // This demotes the selection from parent-level to child-level
            const keysToRemove = new Set([key, parentKey]);
            const remainingIds = builder.selectedIds.filter((id) => !keysToRemove.has(id));
            if (remainingIds.length === 0) {
              builder.clearSelection();
            } else {
              builder.selectAll(remainingIds);
            }
            return;
          }
        }

        // Normal toggle (selecting, or deselecting without parent demotion)
        builder.toggleSelection(key);
        // Set anchor if selecting
        if (!isCurrentlySelected) {
          setAnchorKey(key);
        }
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
        // Set anchor to the parent (user clicked on parent)
        setAnchorKey(key);
      }
    },
    [builder, hierarchy, getCheckboxState, selectedIdSet]
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

    // Range selection (Shift+click, long-press checkbox)
    anchorKey,
    rangeSelect,
    clearAnchor,
    getKeysBetween,

    // Action validation
    canPerformAction,
    allRootsAreChecked,
    actionableRoots,

    // Selection info (uses validSelectedIds to exclude stale selections)
    hasSelection: validSelectedIds.length > 0,
    selectedCount: validSelectedIds.length,
  };
}

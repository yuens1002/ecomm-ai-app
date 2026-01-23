"use client";

import { useMemo } from "react";
import type { IdentityRegistry } from "../../types/identity-registry";

/**
 * Entity info needed for DnD operations.
 */
export type DraggedEntity = {
  /** The selection key (e.g., "label:L1", "category:L1-C1") */
  key: string;
  /** Database entity ID for mutations */
  entityId: string;
  /** Parent key for same-parent checks (null for root-level items) */
  parentKey: string | null;
};

/**
 * DnD eligibility state derived from selection.
 *
 * This is computed once per selection change, not per row.
 * Drag handles read from this to determine their visual state.
 */
export type DnDEligibility = {
  /** Can drag operation be initiated? */
  canDrag: boolean;
  /** The kind being dragged (null if ineligible) */
  dragKind: string | null;
  /** Entities to be dragged (empty if ineligible) */
  draggedEntities: readonly DraggedEntity[];
  /** Whether this is a multi-item drag (count > 1) */
  isMultiDrag: boolean;
  /** Number of items being dragged */
  dragCount: number;
};

/**
 * Ineligible state constant (reused to avoid object recreation).
 */
const INELIGIBLE: DnDEligibility = {
  canDrag: false,
  dragKind: null,
  draggedEntities: [],
  isMultiDrag: false,
  dragCount: 0,
};

type UseDnDEligibilityOptions = {
  /** Actionable root keys from selection model */
  actionableRoots: readonly string[];
  /** Selected kind from selection model (null if mixed or empty) */
  selectedKind: string | null;
  /** Whether all selected items are same kind */
  isSameKind: boolean;
  /** Identity registry for entity lookups */
  registry: IdentityRegistry;
};

/**
 * Hook that derives DnD eligibility from selection state.
 *
 * Follows the action-bar pattern: eligibility is computed from current state,
 * DnD operations react to this state rather than manage selection.
 *
 * Business rules:
 * - No selection → not eligible
 * - Mixed kinds → not eligible
 * - Same kind selection → eligible
 *
 * @example
 * ```tsx
 * const eligibility = useDnDEligibility({
 *   actionableRoots,
 *   selectedKind,
 *   isSameKind,
 *   registry,
 * });
 *
 * // In drag handle:
 * <GripVertical className={eligibility.canDrag ? "text-muted-foreground" : "text-muted-foreground/40"} />
 * ```
 */
export function useDnDEligibility({
  actionableRoots,
  selectedKind,
  isSameKind,
  registry,
}: UseDnDEligibilityOptions): DnDEligibility {
  return useMemo(() => {
    // Rule 1: No selection = no drag
    if (actionableRoots.length === 0) {
      return INELIGIBLE;
    }

    // Rule 2: Mixed kinds = no drag
    if (!isSameKind || selectedKind === null) {
      return INELIGIBLE;
    }

    // Build dragged entities from actionable roots
    const draggedEntities: DraggedEntity[] = [];

    for (const key of actionableRoots) {
      const identity = registry.get(key);
      if (!identity) {
        // Skip keys not in registry (can occur during data transitions)
        continue;
      }

      draggedEntities.push({
        key,
        entityId: identity.entityId,
        parentKey: identity.parentKey,
      });
    }

    // If no valid entities found, not eligible
    if (draggedEntities.length === 0) {
      return INELIGIBLE;
    }

    return {
      canDrag: true,
      dragKind: selectedKind,
      draggedEntities,
      isMultiDrag: draggedEntities.length > 1,
      dragCount: draggedEntities.length,
    };
  }, [actionableRoots, selectedKind, isSameKind, registry]);
}

/**
 * Check if a specific row's drag handle should be enabled.
 *
 * A row's drag handle is enabled if:
 * 1. DnD is eligible (selection is valid for drag)
 * 2. The row is part of the current selection (checked or indeterminate)
 *
 * @param eligibility - Current DnD eligibility state
 * @param rowKey - The row's selection key
 * @param checkboxState - The row's checkbox state ("checked" | "indeterminate" | "unchecked")
 */
export function isDragHandleEnabled(
  eligibility: DnDEligibility,
  checkboxState: "checked" | "indeterminate" | "unchecked"
): boolean {
  // Must have valid selection for DnD
  if (!eligibility.canDrag) {
    return false;
  }

  // Row must be part of selection (checked or has selected descendants)
  // Indeterminate means partial selection - not eligible for drag
  if (checkboxState !== "checked") {
    return false;
  }

  return true;
}

/**
 * Determine if drag handle should always be visible (not just on hover).
 *
 * Matches checkbox visibility behavior:
 * - Always visible when checked or indeterminate
 * - Hover-only when unchecked
 */
export function isDragHandleAlwaysVisible(
  checkboxState: "checked" | "indeterminate" | "unchecked"
): boolean {
  return checkboxState === "checked" || checkboxState === "indeterminate";
}

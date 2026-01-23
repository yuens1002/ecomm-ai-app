/**
 * Multi-Select Drag Validation Utilities
 *
 * Functions for validating multi-select drag operations,
 * enforcing same-level constraints, and filtering valid drag targets.
 */

import type { IdentityRegistry } from "../../types/identity-registry";
import { getEntityIdFromKey } from "../../types/identity-registry";
import type { DraggableEntity, GetDraggableEntitiesResult } from "./types";

/**
 * Build draggable entities from pre-computed actionable roots using registry.
 *
 * Core principle: DnD operates on selection when available, falls back to single item.
 * - If dragStartKey is in actionableRoots → drag all actionableRoots (multi-select)
 * - If dragStartKey is NOT in actionableRoots → drag only dragStartKey (single item)
 * - Registry provides O(1) access to entity info and parent relationships
 *
 * @param actionableRoots - Pre-computed from selection model (keys of items to drag)
 * @param selectedKind - Pre-computed from selection model (null if mixed/invalid)
 * @param registry - Identity registry for entity lookups
 * @param dragStartKey - The key of the item the drag started from
 * @returns Draggable entities with their current parent info
 */
export function getDraggableEntities(
  actionableRoots: string[],
  selectedKind: string | null,
  registry: IdentityRegistry,
  dragStartKey: string
): GetDraggableEntitiesResult {
  /**
   * Helper to build a DraggableEntity from a key using registry.
   * Uses registry for O(1) lookups instead of scanning data.
   */
  const buildEntity = (key: string): DraggableEntity | null => {
    const identity = registry.get(key);
    if (identity) {
      // Get parent entity ID from parent key (parentKey is like "label:L1")
      const parentKey = identity.parentKey;
      const currentParentId = parentKey ? getEntityIdFromKey(parentKey) : null;

      return {
        key,
        entityId: identity.entityId,
        kind: identity.kind,
        currentParentId,
      };
    }
    return null;
  };

  // Check if dragStartKey is in actionableRoots (part of multi-selection)
  const isInSelection = actionableRoots.includes(dragStartKey);

  // Case 1: dragStartKey is NOT in selection → drag only that single item
  // This handles: unselected items, or child items when parent is selected
  if (!isInSelection) {
    const entity = buildEntity(dragStartKey);
    if (!entity) {
      return { entities: [], dragKind: null, count: 0, isValid: false };
    }
    return {
      entities: [entity],
      dragKind: entity.kind,
      count: 1,
      isValid: true,
    };
  }

  // Case 2: dragStartKey IS in selection → drag all actionableRoots
  // But only if they're all the same kind (selectedKind !== null)
  if (selectedKind === null) {
    // Mixed kinds in selection = invalid multi-drag
    return { entities: [], dragKind: null, count: actionableRoots.length, isValid: false };
  }

  // Map all roots to entities using registry lookups
  const entities: DraggableEntity[] = [];
  for (const key of actionableRoots) {
    const entity = buildEntity(key);
    if (entity) {
      entities.push(entity);
    }
  }

  return {
    entities,
    dragKind: selectedKind,
    count: entities.length,
    isValid: entities.length > 0,
  };
}

/**
 * Filter keys to only those at a specific depth level.
 *
 * Used to enforce same-level constraint: only items at the same depth
 * can be dragged together.
 *
 * @param keys - Array of keys to filter
 * @param targetDepth - The depth level to filter for
 * @param getDepth - Function to get depth for a key
 * @returns Keys that are at the target depth
 */
export function filterSameLevelKeys(
  keys: string[],
  targetDepth: number,
  getDepth: (key: string) => number
): string[] {
  return keys.filter((k) => getDepth(k) === targetDepth);
}

/**
 * Validate a multi-item drop operation.
 *
 * Rules:
 * - Cannot drop on any item that is part of the drag set
 * - All dragged items must be at the same level
 *
 * @param params - Validation parameters
 * @returns true if the drop is valid
 */
export function validateMultiDrop(params: {
  draggedKeys: readonly string[];
  targetKey: string;
  getDepth: (key: string) => number;
}): boolean {
  const { draggedKeys, targetKey } = params;

  // Cannot drop on self or within dragged set
  if (draggedKeys.includes(targetKey)) {
    return false;
  }

  return true;
}

/**
 * Get draggable keys from selection, filtered to same level as primary item.
 *
 * @param selectedKeys - All currently selected keys
 * @param primaryKey - The key of the item being dragged (first item)
 * @param getDepth - Function to get depth for a key
 * @returns Array of keys that can be dragged together (same level only)
 */
export function getDraggableKeys(
  selectedKeys: string[],
  primaryKey: string,
  getDepth: (key: string) => number
): string[] {
  if (!primaryKey) return [];

  const primaryDepth = getDepth(primaryKey);

  // If primary is not in selection, only drag the primary
  if (!selectedKeys.includes(primaryKey)) {
    return [primaryKey];
  }

  // Filter to same-level keys
  return filterSameLevelKeys(selectedKeys, primaryDepth, getDepth);
}

/**
 * Check if a key is part of the drag set.
 *
 * @param key - Key to check
 * @param draggedKeys - Array of keys being dragged
 * @returns true if key is in the drag set
 */
export function isInDragSet(key: string, draggedKeys: readonly string[]): boolean {
  return draggedKeys.includes(key);
}

/**
 * Calculate new order after multi-item reorder.
 *
 * Removes all dragged items from their current positions,
 * then inserts them at the target position.
 *
 * @param items - Original array of items with id property
 * @param draggedIds - IDs of items being dragged
 * @param targetId - ID of the drop target
 * @param dropPosition - Whether to insert before or after target
 * @returns New array of item IDs in the desired order
 */
export function calculateMultiReorder<T extends { id: string }>(
  items: T[],
  draggedIds: string[],
  targetId: string,
  dropPosition: "before" | "after"
): string[] {
  // Remove dragged items from the list
  const remaining = items.filter((item) => !draggedIds.includes(item.id));

  // Find target index in remaining list
  let targetIndex = remaining.findIndex((item) => item.id === targetId);
  if (targetIndex === -1) {
    // Target was in dragged set - append to end
    return [...remaining.map((i) => i.id), ...draggedIds];
  }

  // Adjust for drop position
  if (dropPosition === "after") {
    targetIndex += 1;
  }

  // Insert dragged items at target position
  const result = remaining.map((i) => i.id);
  result.splice(targetIndex, 0, ...draggedIds);

  return result;
}

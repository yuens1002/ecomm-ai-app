/**
 * Multi-Select Drag-and-Drop Types
 *
 * Shared types for multi-select DnD operations across table views.
 */

import type { IdentityRegistry } from "../../types/identity-registry";

// ─────────────────────────────────────────────────────────────────────────────
// SELECTION API FOR DND
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Selection API that DnD hooks need to commit/restore selection state.
 *
 * This allows DnD to:
 * 1. Store previous selection on drag start
 * 2. Commit dragged item to selection if not selected
 * 3. Check hasSameKindSelection for drag eligibility
 * 4. Restore previous selection on drag end/cancel
 */
export type DnDSelectionApi = {
  /** Current selected IDs (keys) */
  readonly selectedIds: readonly string[];
  /** Current selected kind (null if mixed or empty) */
  readonly selectedKind: string | null;
  /** Check if selection has same kind (for drag eligibility) */
  readonly hasSameKindSelection: boolean;
  /** Toggle selection for a key (adds if not selected, removes if selected) */
  toggleSelection: (key: string) => void;
  /** Set selection to specific keys */
  setSelection: (keys: string[]) => void;
  /** Clear all selection */
  clearSelection: () => void;
};

/**
 * Previous selection state stored during drag for restoration.
 */
export type PreviousSelectionState = {
  ids: readonly string[];
  kind: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// OPERATION TYPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DnD operation type determined at runtime.
 *
 * - reorder: Items stay within same parent, only position changes
 * - move: Items move to different parent (cross-boundary)
 */
export type DnDOperationType = "reorder" | "move";

/**
 * Determine the DnD operation type based on dragged entities and target.
 *
 * Rules:
 * - If target is same kind as dragged → reorder (sibling reposition)
 * - If target can contain dragged kind → move (cross-boundary)
 * - If all dragged items have same parent as target → reorder
 * - Otherwise → move
 *
 * @param draggedParentKeys - Parent keys of all dragged entities
 * @param targetKey - Key of the drop target
 * @param targetKind - Kind of the drop target
 * @param dragKind - Kind being dragged
 * @param registry - Identity registry for lookups
 */
export function getDnDOperationType(
  draggedParentKeys: readonly (string | null)[],
  targetKey: string,
  targetKind: string,
  dragKind: string,
  registry: IdentityRegistry
): DnDOperationType {
  // If dropping on same kind → reorder among siblings
  if (targetKind === dragKind) {
    // Check if all dragged items share the same parent as target
    const targetParentKey = registry.getParentKey(targetKey);
    const allSameParent = draggedParentKeys.every((pk) => pk === targetParentKey);
    return allSameParent ? "reorder" : "move";
  }

  // If target can contain dragged kind → move (cross-boundary drop)
  if (registry.canReceiveDrop(targetKey, dragKind)) {
    return "move";
  }

  // Default to reorder (this case shouldn't happen if drop validation is correct)
  return "reorder";
}

/**
 * Represents a single entity that can be dragged.
 *
 * Contains all necessary info for executing the drag operation:
 * - key: The selection key (e.g., "label:L1", "category:L1-C1")
 * - entityId: The actual database ID for mutations
 * - kind: Entity type (e.g., "label", "category", "product")
 * - currentParentId: The actual current parent (looked up from data, not key)
 */
export type DraggableEntity = {
  /** Selection key for this entity */
  key: string;
  /** Database ID for mutations */
  entityId: string;
  /** Entity type (label, category, product) */
  kind: string;
  /** Current parent ID (null for root-level items like labels) */
  currentParentId: string | null;
};

/**
 * Result from getDraggableEntities().
 *
 * Provides all information needed to execute a multi-select drag:
 * - entities: The actionable roots with their current parent info
 * - dragKind: The entity type being dragged (null if mixed)
 * - count: Number of items being dragged
 * - isValid: Whether the drag is valid (false if mixed entity types)
 */
export type GetDraggableEntitiesResult = {
  /** Entities to drag (actionable roots only) */
  entities: DraggableEntity[];
  /** Kind of entities being dragged (null if mixed/invalid) */
  dragKind: string | null;
  /** Number of actionable roots */
  count: number;
  /** Whether this is a valid drag (false if mixed entity types) */
  isValid: boolean;
};

/**
 * State for multi-item drag operations.
 *
 * Tracks which items are being dragged and their level for same-level validation.
 */
export type MultiDragState = {
  /** Whether any drag operation is in progress */
  isDragging: boolean;
  /** Whether this is a multi-item drag (more than 1 item) */
  isMultiDrag: boolean;
  /** Key of the primary item (provides the ghost visual) */
  primaryKey: string | null;
  /** All keys being dragged (includes primary) */
  draggedKeys: readonly string[];
  /** Number of items being dragged */
  dragCount: number;
  /** Depth level of dragged items (for same-level constraint) */
  dragLevel: number | null;
};

/**
 * CSS class state for a row during drag operations.
 *
 * Used by getDragClasses to determine visual feedback.
 */
export type MultiDragClasses = {
  /** This row is the primary drag item */
  isDragging: boolean;
  /** This row is part of the multi-select being dragged (not primary) */
  isInDragSet: boolean;
  /** Currently being hovered as a drop target */
  isDragOver: boolean;
  /** Drop position relative to this row */
  dropPosition: "before" | "after" | null;
};

/**
 * Initial state for multi-drag operations.
 */
export const INITIAL_MULTI_DRAG_STATE: MultiDragState = {
  isDragging: false,
  isMultiDrag: false,
  primaryKey: null,
  draggedKeys: [],
  dragCount: 0,
  dragLevel: null,
};

/**
 * Props for the MultiDragGhost component.
 */
export type MultiDragGhostProps = {
  /** Number of items being dragged */
  count: number;
  /** Content to render in the ghost (typically cloned row content) */
  children: React.ReactNode;
  /** Optional custom ID for the ghost element (default: "multi-drag-ghost") */
  ghostId?: string;
};

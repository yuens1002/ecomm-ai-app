/**
 * Multi-Select Drag-and-Drop Module
 *
 * Provides DnD hooks for both flat (single-entity) and hierarchical (multi-entity) tables.
 *
 * Hook Selection Guide:
 * - useSingleEntityDnd: For flat tables (AllLabelsTableView, CategoryTableView)
 * - useMultiEntityDnd: For hierarchical tables (MenuTableView)
 *
 * Both hooks use useGroupedReorder internally for shared reorder logic.
 */

// Types (from centralized types directory)
export type {
  MultiDragState,
  MultiDragClasses,
  GroupedEntitiesGhostProps,
  DraggableEntity,
  GetDraggableEntitiesResult,
  DnDSelectionApi,
  PreviousSelectionState,
  DnDOperationType,
} from "../../types/dnd";
export { INITIAL_MULTI_DRAG_STATE, getDnDOperationType } from "../../types/dnd";

// Validation utilities
export {
  getDraggableEntities,
  filterSameLevelKeys,
  validateMultiDrop,
  getDraggableKeys,
  isInDragSet,
  calculateMultiReorder,
} from "./multiSelectValidation";

// DnD Eligibility
export { useDnDEligibility } from "./useDnDEligibility";
export type { DnDEligibility } from "./useDnDEligibility";

// Core reorder hook (internal, typically not used directly)
export { useGroupedReorder } from "./useGroupedReorder";
export type {
  GroupedReorderState,
  GroupedReorderHandlers,
  GroupedReorderClasses,
  UseGroupedReorderOptions,
} from "./useGroupedReorder";

// Single-entity DnD hook (for flat tables)
export { useSingleEntityDnd } from "./useSingleEntityDnd";
export type { UseSingleEntityDndOptions } from "./useSingleEntityDnd";

// Multi-entity DnD hook (for hierarchical tables)
export { useMultiEntityDnd } from "./useMultiEntityDnd";
export type {
  UseMultiEntityDndOptions,
  UseMultiEntityDndReturn,
  MultiEntityDragState,
  MultiEntityDragClasses,
  MultiEntityDragHandlers,
  MultiEntityReorderFunctions,
  DraggedChildInfo,
  DropType,
  EntityLevel,
} from "./useMultiEntityDnd";

// Ghost image hook
export { useGroupedEntitiesGhost } from "./useGroupedEntitiesGhost";

// Utility hooks
export { useThrottledCallback } from "./useThrottledCallback";

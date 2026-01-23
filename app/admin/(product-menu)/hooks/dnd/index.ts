/**
 * Multi-Select Drag-and-Drop Module
 *
 * Shared utilities and components for multi-select DnD operations.
 */

// Types
export type {
  MultiDragState,
  MultiDragClasses,
  MultiDragGhostProps,
  DraggableEntity,
  GetDraggableEntitiesResult,
  DnDSelectionApi,
  PreviousSelectionState,
  DnDOperationType,
} from "./types";
export { INITIAL_MULTI_DRAG_STATE, getDnDOperationType } from "./types";

// Validation utilities
export {
  getDraggableEntities,
  filterSameLevelKeys,
  validateMultiDrop,
  getDraggableKeys,
  isInDragSet,
  calculateMultiReorder,
} from "./multiSelectValidation";

// Components
export { MultiDragGhost, GhostRowContent } from "./MultiDragGhost";

// Hooks
export { useMultiDragGhost } from "./useMultiDragGhost";
export { useThrottledCallback } from "./useThrottledCallback";

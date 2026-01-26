/**
 * Context Menu Hooks
 *
 * Shared hooks for context menu functionality across table views.
 * These hooks extract common patterns to reduce duplication and improve maintainability.
 *
 * Hook categories:
 * - Row state: useContextRowHighlight
 * - Actions: useContextClone, useContextVisibility, useContextRemove, useDeleteConfirmation
 * - Movement: useMoveHandlers (flat + nested), useContextMoveTo
 * - Relationships: useRelationshipToggle
 * - Bulk operations: useBulkAction
 *
 * @module context-menu
 */

// Row state
export {
  useContextRowHighlight,
  type UseContextRowHighlightReturn,
} from "./useContextRowHighlight";

// Actions
export {
  useContextClone,
  type UseContextCloneOptions,
  type UseContextCloneReturn,
} from "./useContextClone";

export {
  useContextVisibility,
  type UseContextVisibilityOptions,
  type UseContextVisibilityReturn,
} from "./useContextVisibility";

export {
  useContextRemove,
  type UseContextRemoveOptions,
  type UseContextRemoveReturn,
} from "./useContextRemove";

export {
  useDeleteConfirmation,
  type UseDeleteConfirmationOptions,
  type UseDeleteConfirmationReturn,
  type DeleteConfirmationState,
  type DeleteEntityKind,
} from "./useDeleteConfirmation";

// Movement
export {
  useMoveHandlers,
  type UseMoveHandlersOptions,
  type UseMoveHandlersLegacyOptions,
  type UseMoveHandlersReturn,
} from "./useMoveHandlers";

export {
  useContextMoveTo,
  type UseContextMoveToOptions,
  type UseContextMoveToReturn,
} from "./useContextMoveTo";

// Relationships
export {
  useRelationshipToggle,
  type UseRelationshipToggleOptions,
  type UseRelationshipToggleReturn,
} from "./useRelationshipToggle";

// Bulk operations
export {
  useBulkAction,
  type UseBulkActionOptions,
  type UseBulkActionReturn,
  type BulkActionToastOptions,
} from "./useBulkAction";

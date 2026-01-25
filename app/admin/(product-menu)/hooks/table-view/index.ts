/**
 * Config-Driven Table View Module
 *
 * Provides unified, declarative table view infrastructure for Menu Builder.
 * Instead of writing boilerplate for each view, define a config and let the
 * hook handle the common patterns.
 *
 * @example
 * ```tsx
 * // Define config once
 * const myConfig: ViewConfig<MyEntity> = {
 *   viewType: "my-view",
 *   entityKind: "category",
 *   columns: [...],
 *   // ...
 * };
 *
 * // Use in component
 * const { renderRow, emptyState } = useTableView({
 *   config: myConfig,
 *   items,
 *   builder,
 *   handlers,
 * });
 * ```
 */

// Types
export type {
  // Core
  EntityKind,
  RowContext,

  // Column configuration
  ColumnConfig,

  // Empty state
  EmptyStateContext,
  EmptyStateConfig,

  // Context menu
  ContextMenuHandlers,
  ContextMenuPropsPartial,

  // Row configuration
  EntityRowConfig,

  // View configuration
  ViewFeatures,
  ViewConfig,

  // Hook types
  ViewHandlers,
  BuilderApi,
  UseTableViewOptions,
  DeleteConfirmationState,
  UseTableViewReturn,
} from "./types";

// Utilities
export { buildRowContext, NO_DND } from "./buildRowContext";
export type { BuildRowContextOptions } from "./buildRowContext";

// Main hook
export { useTableView } from "./useTableView";

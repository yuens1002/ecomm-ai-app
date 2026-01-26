/**
 * Config-Driven Table View Types
 *
 * These types define the configuration structure for unified table views
 * in the Menu Builder. Each view can be configured declaratively using
 * these types instead of writing boilerplate code.
 */

import type { ReactNode, DragEvent } from "react";
import type { LucideIcon } from "lucide-react";
import type { SelectedEntityKind, ViewType } from "../../types/builder-state";
import type { CheckboxState } from "../useContextSelectionModel";
import type { ColumnWidthEntry, ColumnWidthPreset } from "../../menu-builder/components/table-views/shared/table/columnWidthPresets";
import type { TableHeaderColumn } from "../../menu-builder/components/table-views/shared/table/TableHeader";
import type { RowContextMenuProps } from "../../menu-builder/components/table-views/shared/cells/RowContextMenu";

// ─────────────────────────────────────────────────────────────────────────────
// Core Entity Types
// ─────────────────────────────────────────────────────────────────────────────

export type EntityKind = SelectedEntityKind; // "label" | "category" | "product"

// ─────────────────────────────────────────────────────────────────────────────
// Row Context - Passed to Cell Renderers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Context passed to cell renderers for a single row.
 *
 * Contains all state and handlers needed to render any cell in the row.
 * This is the single source of truth for row-level information.
 */
export type RowContext<T = unknown> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Row Identification
  // ─────────────────────────────────────────────────────────────────────────
  /** The row data object */
  row: T;
  /** Full key with kind prefix (e.g., "label:abc123") */
  rowKey: string;
  /** Entity ID (without kind prefix) */
  rowId: string;
  /** Entity kind for this row */
  entityKind: EntityKind;

  // ─────────────────────────────────────────────────────────────────────────
  // Selection State
  // ─────────────────────────────────────────────────────────────────────────
  /** Whether this row is selected */
  isSelected: boolean;
  /** Tri-state checkbox state (for hierarchy views) */
  checkboxState: CheckboxState;
  /** Current anchor key for range selection */
  anchorKey: string | null;

  // ─────────────────────────────────────────────────────────────────────────
  // UI State
  // ─────────────────────────────────────────────────────────────────────────
  /** Whether mouse is hovering over this row */
  isRowHovered: boolean;
  /** Whether context menu is open for this row */
  isContextRow: boolean;
  /** Whether this row is in editing mode (inline name editor) */
  isEditing: boolean;
  /** Whether this row is pinned (newly created) */
  isPinned: boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // Position (for move-up/move-down, borders, etc.)
  // ─────────────────────────────────────────────────────────────────────────
  /** Row index in the current list */
  index: number;
  /** Whether this is the first row */
  isFirstRow: boolean;
  /** Whether this is the last row */
  isLastRow: boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // DnD State (when feature enabled)
  // ─────────────────────────────────────────────────────────────────────────
  /** Whether this row is draggable */
  isDraggable: boolean;
  /** Whether this row is currently being dragged */
  isDragging: boolean;
  /** Whether a drag is active somewhere in the table */
  isDragActive: boolean;
  /** CSS classes for drag states (from dnd-kit) */
  dragClasses: string | undefined;

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  /** Toggle selection for this row */
  onToggle: () => void;
  /** Range select to this row (if anchor exists) */
  onRangeSelect: (() => void) | undefined;
  /** Start inline editing for this row */
  onStartEdit: () => void;
  /** Cancel inline editing */
  onCancelEdit: () => void;
  /** Save inline edit (id, new value) */
  onSave: (id: string, value: string) => Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────
  // View-Specific Context (passed through from view)
  // ─────────────────────────────────────────────────────────────────────────
  /** Arbitrary extra data from the view (derived data, handlers, etc.) */
  extra: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Column Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for a single table column.
 */
export type ColumnConfig<T> = {
  /** Column ID - must match width preset key and header column id */
  id: string;
  /** Width configuration from preset */
  width: ColumnWidthEntry;
  /** If true, clicks on this cell don't trigger row click */
  ignoreRowClick?: boolean;
  /** Additional CSS classes for the cell */
  className?: string;
  /** Render function for cell content */
  render: (row: T, ctx: RowContext<T>) => ReactNode;
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty State Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Context passed to empty state condition function.
 */
export type EmptyStateContext = {
  /** All items in the current view */
  items: unknown[];
  /** Parent ID if this is a parent-context view */
  parentId?: string;
  /** Whether parent exists (for distinguishing "no parent" vs "parent has no items") */
  parentExists?: boolean;
};

/**
 * Configuration for an empty state.
 * Multiple can be defined - first matching condition wins.
 */
export type EmptyStateConfig = {
  /** Condition to check if this empty state should be shown */
  condition: (ctx: EmptyStateContext) => boolean;
  /** Icon to display */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Action ID for the view to handle */
  actionId?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Context Menu Props Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handlers passed to context menu props builder.
 */
export type ContextMenuHandlers = {
  /** Clone handler - called with entity ID */
  clone: (id: string) => Promise<void>;
  /** Delete handler - called with entity ID */
  delete: (id: string) => void;
  /** Visibility toggle handler */
  visibility: (id: string, visible: boolean) => Promise<void>;
  /** Remove handler (for parent-context views) */
  remove?: (id: string) => Promise<void>;
  /** Move up handler (parentId for hierarchical views) */
  moveUp?: (id: string, parentId?: string) => Promise<void>;
  /** Move down handler (parentId for hierarchical views) */
  moveDown?: (id: string, parentId?: string) => Promise<void>;
  /** Move to handler (parentId for source context in hierarchical views, targetId for destination) */
  moveTo?: (id: string, parentIdOrTargetId: string, targetId?: string) => Promise<void>;
  /** Label toggle handler (for categories) */
  labelToggle?: (entityId: string, labelId: string, attach: boolean) => Promise<void>;
  /** Category toggle handler (for labels and products) */
  categoryToggle?: (entityId: string, categoryId: string, attach: boolean) => Promise<void>;
};

/**
 * Partial props returned by context menu props builder.
 * These override defaults in RowContextMenu.
 */
export type ContextMenuPropsPartial = Omit<
  Partial<RowContextMenuProps>,
  "children" | "entityKind" | "viewType" | "entityId" | "onOpenChange"
>;

// ─────────────────────────────────────────────────────────────────────────────
// Entity Row Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for how to render rows of a specific entity type.
 */
export type EntityRowConfig<T> = {
  /**
   * Build context menu props for a row.
   * Returns partial props that override defaults.
   */
  getContextMenuProps: (
    row: T,
    ctx: RowContext<T>,
    handlers: ContextMenuHandlers
  ) => ContextMenuPropsPartial;

  /**
   * Get additional TableRow props for a row.
   * Used for hierarchy-specific styling, etc.
   */
  getTableRowProps?: (
    row: T,
    ctx: RowContext<T>
  ) => {
    className?: string;
    isHidden?: boolean;
    depth?: number;
  };

  /**
   * Get CSS classes for drag state.
   * Only called when DnD is enabled.
   */
  getDragClassName?: (row: T, ctx: RowContext<T>) => string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Feature configuration for a table view.
 */
export type ViewFeatures = {
  /** DnD mode: "single" (one entity type), "multi" (hierarchy), or false */
  dnd: "single" | "multi" | false;
  /** Whether react-table sorting is enabled */
  sorting: boolean;
  /** Whether to persist sort state in URL/storage */
  persistSort: boolean;
  /** Whether to show ghost component during drag */
  ghost: boolean;
  /** Whether to show delete confirmation dialog */
  deleteDialog: boolean;
  /** Whether this is a hierarchical view (affects selection tri-state) */
  hierarchy: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main View Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main configuration for a table view.
 * This is the single source of truth for how a view behaves.
 */
export type ViewConfig<T> = {
  /** View type identifier */
  viewType: ViewType;
  /** Primary entity kind for this view */
  entityKind: EntityKind;

  // ─────────────────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────────────────
  /** Column configurations */
  columns: ColumnConfig<T>[];
  /** Width preset for all columns */
  widthPreset: ColumnWidthPreset;
  /** Header column definitions (for TableHeader component) */
  headerColumns: TableHeaderColumn[];

  // ─────────────────────────────────────────────────────────────────────────
  // Features
  // ─────────────────────────────────────────────────────────────────────────
  /** Feature flags */
  features: ViewFeatures;

  // ─────────────────────────────────────────────────────────────────────────
  // Empty States
  // ─────────────────────────────────────────────────────────────────────────
  /** Empty state configurations (first matching condition wins) */
  emptyStates: EmptyStateConfig[];

  // ─────────────────────────────────────────────────────────────────────────
  // Parent Context (for label/category detail views)
  // ─────────────────────────────────────────────────────────────────────────
  /** Parent context configuration (if this view depends on a parent) */
  parentContext?: {
    /** Key in builder state for parent ID */
    idKey: "currentLabelId" | "currentCategoryId";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Row Configuration
  // ─────────────────────────────────────────────────────────────────────────
  /** Row configuration for single-entity views */
  rowConfig?: EntityRowConfig<T>;
  /** Entity-specific row configs for multi-entity views (MenuTableView) */
  entityConfigs?: Record<EntityKind, EntityRowConfig<unknown>>;
};

// ─────────────────────────────────────────────────────────────────────────────
// View Handlers (passed to useTableView)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handlers provided by the view component to useTableView.
 */
export type ViewHandlers<T = unknown> = {
  /** Navigate handler (double-click) - kind is string for compatibility with useRowClickHandler */
  navigate: (kind: string, entityId: string) => void;
  /** Inline edit handlers */
  inlineEdit: {
    /** Save name edit */
    onNameSave: (id: string, name: string) => Promise<void>;
    /** Save visibility toggle */
    onVisibilitySave?: (id: string, visible: boolean) => Promise<void>;
  };
  /** Context menu action handlers */
  contextMenu: ContextMenuHandlers;
  /** Optional: get entity kind for a row (for multi-entity views) */
  getEntityKind?: (row: T) => EntityKind;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook Options
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal builder interface required by useTableView.
 */
export type BuilderApi = {
  // Row UI state
  editingRow: { kind: SelectedEntityKind; id: string } | null;
  pinnedNewRow: { kind: SelectedEntityKind; id: string } | null;
  setEditing: (next: { kind: SelectedEntityKind; id: string } | null) => void;
  setPinnedNew: (next: { kind: SelectedEntityKind; id: string } | null) => void;
  // Selection state
  selectedIds: string[];
  selectedKind: SelectedEntityKind | null;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
};

/**
 * Options for useTableView hook.
 */
export type UseTableViewOptions<T> = {
  /** View configuration */
  config: ViewConfig<T>;
  /** Items to display */
  items: T[];
  /** Builder API for state management */
  builder: BuilderApi;
  /** View handlers */
  handlers: ViewHandlers<T>;
  /** Parent ID for parent-context views */
  parentId?: string;
  /** Extra context to pass to cell renderers */
  extra?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook Return Type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete confirmation state.
 */
export type DeleteConfirmationState = {
  open: boolean;
  targetIds: string[];
  entityKind: EntityKind;
};

/**
 * Column render result for a single cell.
 */
export type ColumnRenderResult = {
  id: string;
  width: ColumnWidthEntry;
  ignoreRowClick?: boolean;
  className?: string;
  content: ReactNode;
};

/**
 * Row render result - structured data for rendering a row.
 *
 * The view component uses this data to construct the actual JSX,
 * allowing flexibility in how rows are rendered.
 */
export type RowRenderResult<T> = {
  /** React key for the row */
  key: string;
  /** Original row data */
  row: T;
  /** Row context (for advanced rendering needs) */
  ctx: RowContext<T>;
  /** Props to spread on RowContextMenu (excludes children - view provides that) */
  contextMenuProps: Omit<RowContextMenuProps, "children">;
  /** Props to spread on TableRow */
  tableRowProps: {
    isSelected: boolean;
    isContextRow: boolean;
    isHidden?: boolean;
    className?: string;
    depth?: number;
    onRowClick: (options?: { shiftKey?: boolean }) => void;
    onRowDoubleClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    // DnD props (optional, for views with DnD support)
    isDragging?: boolean;
    isDragOver?: boolean;
    isLastRow?: boolean;
    isDraggable?: boolean;
    draggable?: boolean;
    onDragStart?: (e: DragEvent) => void;
    onDragOver?: (e: DragEvent) => void;
    onDragLeave?: (e: DragEvent) => void;
    onDrop?: (e: DragEvent) => void;
    onDragEnd?: (e: DragEvent) => void;
  };
  /** Column render results */
  columns: ColumnRenderResult[];
};

/**
 * Return type for useTableView hook.
 */
export type UseTableViewReturn<T> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────────────────────
  /** Build row render data (for view to construct JSX) */
  renderRow: (row: T, index: number, total: number) => RowRenderResult<T>;
  /** Current empty state (if any) */
  emptyState: EmptyStateConfig | null;

  // ─────────────────────────────────────────────────────────────────────────
  // Selection
  // ─────────────────────────────────────────────────────────────────────────
  /** Selection state for header checkbox */
  selectionState: {
    allSelected: boolean;
    someSelected: boolean;
    selectedCount: number;
  };
  /** Select all handler */
  onSelectAll: () => void;
  /** Actionable root keys (for bulk actions) */
  actionableRoots: string[];

  // ─────────────────────────────────────────────────────────────────────────
  // Delete Dialog
  // ─────────────────────────────────────────────────────────────────────────
  /** Delete confirmation state */
  deleteConfirmation: DeleteConfirmationState;
  /** Whether delete is in progress */
  isDeleting: boolean;
  /** Open delete confirmation for given IDs */
  openDeleteConfirmation: (ids: string[]) => void;
  /** Close delete confirmation */
  closeDeleteConfirmation: () => void;
  /** Set deleting state */
  setIsDeleting: (isDeleting: boolean) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // UI State
  // ─────────────────────────────────────────────────────────────────────────
  /** Currently hovered row ID */
  hoveredRowId: string | null;
  /** Currently context menu open row ID */
  contextRowId: string | null;

  // ─────────────────────────────────────────────────────────────────────────
  // For Ghost Component (when DnD enabled)
  // ─────────────────────────────────────────────────────────────────────────
  /** First selected item (for ghost display) */
  firstSelectedItem: T | null;
};

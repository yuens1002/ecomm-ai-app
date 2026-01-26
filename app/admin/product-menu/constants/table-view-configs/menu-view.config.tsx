/**
 * Menu Table View Configuration
 *
 * Declarative configuration for the MenuTableView.
 * This view displays a 2-level hierarchy: Labels → Categories
 * Each entity type has its own row configuration.
 */

import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import type {
  ViewConfig,
  ColumnConfig,
  EmptyStateConfig,
  EntityRowConfig,
} from "../../hooks/table-view/types";
import { menuViewWidthPreset } from "../../menu-builder/components/table-views/shared/table/columnWidthPresets";
import type { TableHeaderColumn } from "../../menu-builder/components/table-views/shared/table/TableHeader";
import { CheckboxCell } from "../../menu-builder/components/table-views/shared/cells/CheckboxCell";
import { TouchTarget } from "../../menu-builder/components/table-views/shared/cells/TouchTarget";
import { ChevronToggleCell } from "../../menu-builder/components/table-views/shared/cells/ChevronToggleCell";
import { InlineIconCell } from "../../menu-builder/components/table-views/shared/cells/InlineIconCell";
import { InlineNameEditor } from "../../menu-builder/components/table-views/shared/cells/InlineNameEditor";
import { DragHandleCell } from "../../menu-builder/components/table-views/shared/cells/DragHandleCell";
import {
  HierarchyNameCell,
  HierarchyCheckbox,
  HierarchyChevron,
  HierarchyIcon,
  HierarchyName,
} from "../../menu-builder/components/table-views/shared/cells/HierarchyNameCell";
import type { FlatLabelRow, FlatCategoryRow } from "../../menu-builder/components/table-views/MenuTableView.types";
import type { CheckboxState } from "../../hooks/useContextSelectionModel";

// ─────────────────────────────────────────────────────────────────────────────
// Type for extra context passed to cell renderers
// ─────────────────────────────────────────────────────────────────────────────

export type MenuViewExtra = {
  // Label-specific
  /** Handler to save icon changes */
  handleIconSave: (id: string, icon: string | null) => Promise<void>;
  /** Handler to save name changes */
  handleNameSave: (id: string, name: string) => Promise<void>;
  /** Currently editing label ID */
  editingLabelId: string | null;
  /** Pinned label ID */
  pinnedLabelId: string | null;
  /** Start editing a label */
  setEditing: (id: string) => void;
  /** Clear editing state */
  clearEditing: () => void;
  /** Clear pinned if matches */
  clearPinnedIfMatches: (id: string) => void;

  // Expand/collapse
  /** Set of expanded label IDs */
  expandedIds: Set<string>;
  /** Toggle expand/collapse for a label */
  toggleExpand: (id: string) => void;
  /** Whether a label drag is in progress (disables chevrons) */
  isDraggingLabel: boolean;

  // Selection
  /** Get checkbox state for a row key */
  getCheckboxState: (rowKey: string) => CheckboxState;
  /** Anchor key for range selection */
  anchorKey: string | null;
  /** Range select callback */
  rangeSelect: (key: string) => void;

  // DnD
  /** Whether DnD is eligible */
  canDrag: boolean;
  /** Set of eligible entity IDs */
  eligibleEntityIds: Set<string>;

  // Category-specific
  /** Get move targets for a category (other visible labels) */
  getMoveTargetsForCategory: (currentLabelId: string) => Array<{ id: string; name: string }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Header Columns
// ─────────────────────────────────────────────────────────────────────────────

export const MENU_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "name", label: "Name", hasInlineCheckbox: true },
  { id: "categories", label: "Categories" },
  { id: "visibility", label: "Visibility" },
  { id: "products", label: "Products" },
  { id: "dragHandle", label: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Label Row Column Configurations
// ─────────────────────────────────────────────────────────────────────────────

const labelNameColumn: ColumnConfig<FlatLabelRow> = {
  id: "name",
  width: menuViewWidthPreset.name,
  render: (row, ctx) => {
    const extra = ctx.extra as MenuViewExtra;
    const checkboxState = extra.getCheckboxState(ctx.rowKey);
    const isSelected = checkboxState === "checked";
    const isIndeterminate = checkboxState === "indeterminate";
    const isPinned = extra.pinnedLabelId === row.id;

    return (
      <HierarchyNameCell depth={0}>
        <HierarchyCheckbox>
          <TouchTarget>
            <CheckboxCell
              id={row.id}
              checked={isSelected}
              indeterminate={isIndeterminate}
              onToggle={ctx.onToggle}
              isSelectable
              alwaysVisible={isSelected || isIndeterminate}
              ariaLabel={`Select ${row.name}`}
              anchorKey={extra.anchorKey}
              onRangeSelect={ctx.onRangeSelect}
            />
          </TouchTarget>
        </HierarchyCheckbox>
        <HierarchyChevron>
          <TouchTarget>
            <ChevronToggleCell
              isExpanded={row.isExpanded}
              isExpandable={row.isExpandable}
              onToggle={() => extra.toggleExpand(row.id)}
              ariaLabel={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
              disabled={extra.isDraggingLabel}
            />
          </TouchTarget>
        </HierarchyChevron>
        <div className="flex items-center gap-1">
          <HierarchyIcon>
            <InlineIconCell
              id={row.id}
              icon={row.data.icon}
              onSave={extra.handleIconSave}
              isRowHovered={ctx.isRowHovered}
            />
          </HierarchyIcon>
          <HierarchyName>
            <InlineNameEditor
              id={row.id}
              initialValue={row.name}
              isEditing={extra.editingLabelId === row.id}
              onStartEdit={() => extra.setEditing(row.id)}
              onCancelEdit={() => {
                extra.clearEditing();
                if (isPinned) {
                  extra.clearPinnedIfMatches(row.id);
                }
              }}
              onSave={async (id, name) => {
                await extra.handleNameSave(id, name);
                if (isPinned) {
                  extra.clearPinnedIfMatches(row.id);
                }
              }}
            />
          </HierarchyName>
        </div>
      </HierarchyNameCell>
    );
  },
};

const labelCategoriesColumn: ColumnConfig<FlatLabelRow> = {
  id: "categories",
  width: menuViewWidthPreset.categories,
  render: (row) => <span className="text-sm">{row.categoryCount}</span>,
};

const labelVisibilityColumn: ColumnConfig<FlatLabelRow> = {
  id: "visibility",
  width: menuViewWidthPreset.visibility,
  render: () => (
    <div className="flex items-center justify-center">
      <Eye className="h-4 w-4" />
    </div>
  ),
};

const labelProductsColumn: ColumnConfig<FlatLabelRow> = {
  id: "products",
  width: menuViewWidthPreset.products,
  render: (row) => <span className="text-sm">{row.productCount}</span>,
};

const labelDragHandleColumn: ColumnConfig<FlatLabelRow> = {
  id: "dragHandle",
  width: menuViewWidthPreset.dragHandle,
  ignoreRowClick: true,
  render: (row, ctx) => {
    const extra = ctx.extra as MenuViewExtra;
    return (
      <DragHandleCell
        isEligible={extra.canDrag}
        isRowInEligibleSet={extra.eligibleEntityIds.has(row.id)}
        checkboxState={extra.getCheckboxState(ctx.rowKey)}
        isRowHovered={ctx.isRowHovered}
      />
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Category Row Column Configurations
// ─────────────────────────────────────────────────────────────────────────────

const categoryNameColumn: ColumnConfig<FlatCategoryRow> = {
  id: "name",
  width: menuViewWidthPreset.name,
  render: (row, ctx) => {
    const extra = ctx.extra as MenuViewExtra;
    const checkboxState = extra.getCheckboxState(ctx.rowKey);
    const isSelected = checkboxState === "checked";

    return (
      <HierarchyNameCell depth={1}>
        <HierarchyCheckbox>
          <TouchTarget>
            <CheckboxCell
              id={row.id}
              checked={isSelected}
              onToggle={ctx.onToggle}
              isSelectable
              alwaysVisible={isSelected}
              ariaLabel={`Select ${row.name}`}
              anchorKey={extra.anchorKey}
              onRangeSelect={ctx.onRangeSelect}
            />
          </TouchTarget>
        </HierarchyCheckbox>
        <HierarchyName>
          <span className="truncate font-medium">{row.name}</span>
        </HierarchyName>
      </HierarchyNameCell>
    );
  },
};

const categoryCategoriesColumn: ColumnConfig<FlatCategoryRow> = {
  id: "categories",
  width: menuViewWidthPreset.categories,
  render: () => <span className="text-sm text-muted-foreground">—</span>,
};

const categoryVisibilityColumn: ColumnConfig<FlatCategoryRow> = {
  id: "visibility",
  width: menuViewWidthPreset.visibility,
  render: (row) => (
    <div className="flex items-center justify-center">
      {row.isVisible ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </div>
  ),
};

const categoryProductsColumn: ColumnConfig<FlatCategoryRow> = {
  id: "products",
  width: menuViewWidthPreset.products,
  render: (row) => <span className="text-sm">{row.productCount}</span>,
};

const categoryDragHandleColumn: ColumnConfig<FlatCategoryRow> = {
  id: "dragHandle",
  width: menuViewWidthPreset.dragHandle,
  ignoreRowClick: true,
  render: (row, ctx) => {
    const extra = ctx.extra as MenuViewExtra;
    return (
      <DragHandleCell
        isEligible={extra.canDrag}
        isRowInEligibleSet={extra.eligibleEntityIds.has(row.id)}
        checkboxState={extra.getCheckboxState(ctx.rowKey)}
        isRowHovered={ctx.isRowHovered}
      />
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty States
// ─────────────────────────────────────────────────────────────────────────────

const emptyStates: EmptyStateConfig[] = [
  {
    condition: (ctx) => ctx.items.length === 0,
    icon: LayoutGrid,
    title: "No Menu Items",
    description: "Add labels from the dropdown to show them in the menu",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Label Row Configuration
// ─────────────────────────────────────────────────────────────────────────────

const labelRowConfig: EntityRowConfig<FlatLabelRow> = {
  getContextMenuProps: (row, ctx, handlers) => {
    const checkboxState = (ctx.extra as MenuViewExtra).getCheckboxState(ctx.rowKey);
    const isSelected = checkboxState === "checked";
    const isIndeterminate = checkboxState === "indeterminate";

    return {
      isFirst: ctx.isFirstRow,
      isLast: ctx.isLastRow,
      onClone: handlers.clone ? () => handlers.clone(row.id) : undefined,
      onRemove: handlers.remove ? () => handlers.remove!(row.id) : undefined,
      onDelete: () => handlers.delete(row.id),
      onMoveUp: handlers.moveUp ? () => handlers.moveUp!(row.id) : undefined,
      onMoveDown: handlers.moveDown
        ? () => handlers.moveDown!(row.id)
        : undefined,
      // Labels are always visible in menu view, so no visibility toggle
      selectedCount: (ctx.extra as MenuViewExtra).canDrag ? 1 : 0,
      isInSelection: isSelected || isIndeterminate,
    };
  },
  getTableRowProps: () => ({
    // Labels are always visible in menu view
    isHidden: false,
  }),
  getDragClassName: (_row, _ctx) => {
    // Return empty - drag classes are handled by the view's getDragClasses function
    return "";
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Category Row Configuration
// ─────────────────────────────────────────────────────────────────────────────

const categoryRowConfig: EntityRowConfig<FlatCategoryRow> = {
  getContextMenuProps: (row, ctx, handlers) => {
    const extra = ctx.extra as MenuViewExtra;

    return {
      isFirst: ctx.isFirstRow,
      isLast: ctx.isLastRow,
      moveToTargets: extra.getMoveTargetsForCategory(row.parentId),
      currentParentId: row.parentId,
      onClone: handlers.clone ? () => handlers.clone(row.id) : undefined,
      onVisibilityToggle: (visible) => handlers.visibility(row.id, visible),
      onDelete: () => handlers.delete(row.id),
      onMoveUp: handlers.moveUp
        ? () => handlers.moveUp!(row.id, row.parentId)
        : undefined,
      onMoveDown: handlers.moveDown
        ? () => handlers.moveDown!(row.id, row.parentId)
        : undefined,
      onMoveTo: handlers.moveTo
        ? (targetLabelId) => handlers.moveTo!(row.id, row.parentId, targetLabelId)
        : undefined,
    };
  },
  getTableRowProps: (row) => ({
    isHidden: !row.isVisible,
  }),
  getDragClassName: (_row, _ctx) => {
    // Return empty - drag classes are handled by the view's getDragClasses function
    return "";
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Configuration Exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for label rows in the menu view.
 */
export const menuLabelConfig: ViewConfig<FlatLabelRow> = {
  viewType: "menu",
  entityKind: "label",
  widthPreset: menuViewWidthPreset,
  headerColumns: MENU_VIEW_HEADER_COLUMNS,
  columns: [
    labelNameColumn,
    labelCategoriesColumn,
    labelVisibilityColumn,
    labelProductsColumn,
    labelDragHandleColumn,
  ],
  features: {
    dnd: "multi",
    sorting: false,
    persistSort: false,
    ghost: true,
    deleteDialog: true,
    hierarchy: true,
  },
  emptyStates,
  rowConfig: labelRowConfig,
};

/**
 * Configuration for category rows in the menu view.
 */
export const menuCategoryConfig: ViewConfig<FlatCategoryRow> = {
  viewType: "menu",
  entityKind: "category",
  widthPreset: menuViewWidthPreset,
  headerColumns: MENU_VIEW_HEADER_COLUMNS,
  columns: [
    categoryNameColumn,
    categoryCategoriesColumn,
    categoryVisibilityColumn,
    categoryProductsColumn,
    categoryDragHandleColumn,
  ],
  features: {
    dnd: "multi",
    sorting: false,
    persistSort: false,
    ghost: true,
    deleteDialog: true,
    hierarchy: true,
  },
  emptyStates,
  rowConfig: categoryRowConfig,
};

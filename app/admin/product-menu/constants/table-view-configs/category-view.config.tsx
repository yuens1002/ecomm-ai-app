/**
 * Category Table View Configuration
 *
 * Declarative configuration for the CategoryTableView.
 * This view displays products within a selected category with sorting and DnD support.
 */

import { Eye, EyeOff, Package } from "lucide-react";
import type {
  ViewConfig,
  ColumnConfig,
  EmptyStateConfig,
  EntityRowConfig,
} from "../../hooks/table-view/types";
import { categoryViewWidthPreset } from "../../menu-builder/components/table-views/shared/table/columnWidthPresets";
import type { TableHeaderColumn } from "../../menu-builder/components/table-views/shared/table/TableHeader";
import { CheckboxCell } from "../../menu-builder/components/table-views/shared/cells/CheckboxCell";
import { TouchTarget } from "../../menu-builder/components/table-views/shared/cells/TouchTarget";
import { DragHandleCell } from "../../menu-builder/components/table-views/shared/cells/DragHandleCell";
import type { MenuProduct } from "../../types/menu";
import type { CheckboxState } from "../../hooks/useContextSelectionModel";

// ─────────────────────────────────────────────────────────────────────────────
// Local Types
// ─────────────────────────────────────────────────────────────────────────────

/** Product with order within current category and chronological added order */
export type CategoryProduct = MenuProduct & {
  orderInCategory: number;
  addedOrderRank: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Type for extra context passed to cell renderers
// ─────────────────────────────────────────────────────────────────────────────

export type CategoryViewExtra = {
  /** Current category ID */
  currentCategoryId: string | null | undefined;
  /** Move to targets (other categories) */
  moveToTargets: Array<{ id: string; name: string }>;
  /** Category targets for manage-categories submenu */
  categoryTargets: Array<{ id: string; name: string }>;
  /** Get comma-separated category names for a product (excluding current) */
  getProductCategories: (product: MenuProduct) => string;

  // DnD-related context
  /** Whether DnD is eligible (canDrag from eligibility) */
  canDrag: boolean;
  /** Set of eligible entity IDs for drag */
  eligibleEntityIds: Set<string>;
  /** Get checkbox state for a row key */
  getCheckboxState: (rowKey: string) => CheckboxState;
};

// ─────────────────────────────────────────────────────────────────────────────
// Header Columns
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Products" },
  { id: "addedOrder", label: "Added Order" },
  { id: "visibility", label: "Visibility" },
  { id: "categories", label: "Added to Categories" },
  { id: "dragHandle", label: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Column Configurations
// ─────────────────────────────────────────────────────────────────────────────

const selectColumn: ColumnConfig<CategoryProduct> = {
  id: "select",
  width: categoryViewWidthPreset.select,
  ignoreRowClick: true,
  render: (row, ctx) => (
    <TouchTarget>
      <CheckboxCell
        id={row.id}
        checked={ctx.isSelected}
        onToggle={ctx.onToggle}
        isSelectable
        alwaysVisible={ctx.isSelected}
        ariaLabel={`Select ${row.name}`}
        anchorKey={ctx.anchorKey}
        onRangeSelect={ctx.onRangeSelect}
      />
    </TouchTarget>
  ),
};

const nameColumn: ColumnConfig<CategoryProduct> = {
  id: "name",
  width: categoryViewWidthPreset.name,
  render: (row) => <span className="truncate font-medium">{row.name}</span>,
};

const addedOrderColumn: ColumnConfig<CategoryProduct> = {
  id: "addedOrder",
  width: categoryViewWidthPreset.addedOrder,
  render: (row) => <span className="text-sm">{row.addedOrderRank}</span>,
};

const visibilityColumn: ColumnConfig<CategoryProduct> = {
  id: "visibility",
  width: categoryViewWidthPreset.visibility,
  render: (row) =>
    row.isDisabled ? (
      <EyeOff className="text-muted-foreground inline" />
    ) : (
      <Eye className="h-4 w-4 text-foreground inline" />
    ),
};

const categoriesColumn: ColumnConfig<CategoryProduct> = {
  id: "categories",
  width: categoryViewWidthPreset.categories,
  className: "text-sm",
  render: (row, ctx) => {
    const extra = ctx.extra as CategoryViewExtra;
    return extra.getProductCategories(row);
  },
};

const dragHandleColumn: ColumnConfig<CategoryProduct> = {
  id: "dragHandle",
  width: categoryViewWidthPreset.dragHandle,
  ignoreRowClick: true,
  render: (row, ctx) => {
    const extra = ctx.extra as CategoryViewExtra;
    const rowKey = ctx.rowKey;
    return (
      <DragHandleCell
        isEligible={extra.canDrag}
        isRowInEligibleSet={extra.eligibleEntityIds.has(row.id)}
        checkboxState={extra.getCheckboxState(rowKey)}
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
    condition: (ctx) => !ctx.parentId,
    icon: Package,
    title: "No Category Selected",
    description: "Select a category to view its products",
  },
  {
    condition: (ctx) => ctx.items.length === 0,
    icon: Package,
    title: "No Products",
    description: "Add products to this category using the action bar",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Row Configuration (Context Menu Props)
// ─────────────────────────────────────────────────────────────────────────────

const rowConfig: EntityRowConfig<CategoryProduct> = {
  getContextMenuProps: (row, ctx, handlers) => {
    const extra = ctx.extra as CategoryViewExtra;
    return {
      // Move-up/move-down support
      isFirst: ctx.isFirstRow,
      isLast: ctx.isLastRow,
      // Move to other categories
      moveToTargets: extra.moveToTargets,
      currentParentId: extra.currentCategoryId ?? undefined,
      // Category management
      categoryTargets: extra.categoryTargets,
      attachedCategoryIds: row.categoryIds,
      // Handlers - no clone/delete for products in this view
      onVisibilityToggle: (visible) => handlers.visibility(row.id, visible),
      onRemove: handlers.remove ? () => handlers.remove!(row.id) : undefined,
      onMoveUp: handlers.moveUp ? () => handlers.moveUp!(row.id) : undefined,
      onMoveDown: handlers.moveDown
        ? () => handlers.moveDown!(row.id)
        : undefined,
      onMoveTo: handlers.moveTo
        ? (toCategoryId) => handlers.moveTo!(row.id, toCategoryId)
        : undefined,
      onCategoryToggle: handlers.categoryToggle
        ? (categoryId, attach) =>
            handlers.categoryToggle!(row.id, categoryId, attach)
        : undefined,
    };
  },
  getTableRowProps: (row) => ({
    isHidden: row.isDisabled,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Configuration Export
// ─────────────────────────────────────────────────────────────────────────────

export const categoryViewConfig: ViewConfig<CategoryProduct> = {
  viewType: "category",
  entityKind: "product",
  widthPreset: categoryViewWidthPreset,
  headerColumns: CATEGORY_VIEW_HEADER_COLUMNS,
  columns: [
    selectColumn,
    nameColumn,
    addedOrderColumn,
    visibilityColumn,
    categoriesColumn,
    dragHandleColumn,
  ],
  features: {
    dnd: "single",
    sorting: true,
    persistSort: true,
    ghost: true, // Has multi-drag ghost
    deleteDialog: false, // No delete for products in this view
    hierarchy: false,
  },
  parentContext: {
    idKey: "currentCategoryId",
  },
  emptyStates,
  rowConfig,
};

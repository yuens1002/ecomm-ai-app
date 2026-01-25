/**
 * All Categories Table View Configuration
 *
 * Declarative configuration for the AllCategoriesTableView.
 * This view displays all categories in a flat list with sorting support.
 */

import { FileSpreadsheet } from "lucide-react";
import type { ViewConfig, ColumnConfig, EmptyStateConfig, EntityRowConfig, RowContext } from "../../hooks/table-view/types";
import { allCategoriesWidthPreset } from "../../menu-builder/components/table-views/shared/table/columnWidthPresets";
import type { TableHeaderColumn } from "../../menu-builder/components/table-views/shared/table/TableHeader";
import { CheckboxCell } from "../../menu-builder/components/table-views/shared/cells/CheckboxCell";
import { TouchTarget } from "../../menu-builder/components/table-views/shared/cells/TouchTarget";
import { InlineNameEditor } from "../../menu-builder/components/table-views/shared/cells/InlineNameEditor";
import { VisibilityCell } from "../../menu-builder/components/table-views/shared/cells/VisibilityCell";
import type { MenuCategory } from "../../types/menu";

// ─────────────────────────────────────────────────────────────────────────────
// Type for extra context passed to cell renderers
// ─────────────────────────────────────────────────────────────────────────────

export type AllCategoriesExtra = {
  /** Get product count for a category */
  getProductCount: (categoryId: string) => number;
  /** Get comma-separated label names for a category */
  getCategoryLabels: (categoryId: string) => string;
  /** Get array of label IDs attached to a category */
  getAttachedLabelIds: (categoryId: string) => string[];
  /** Available labels for "manage labels" submenu */
  labelTargets: Array<{ id: string; name: string }>;
  /** Save visibility toggle with undo support */
  handleVisibilitySave: (id: string, visible: boolean) => Promise<void>;
  /** Whether the row is pinned (for clearing pinned state on cancel/save) */
  isPinnedRow?: boolean;
  /** Pinned category ID from context */
  pinnedCategoryId: string | null;
  /** Clear editing state */
  clearEditing: () => void;
  /** Clear pinned if matches */
  clearPinnedIfMatches: (id: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Header Columns
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_CATEGORIES_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Category" },
  { id: "products", label: "Products" },
  { id: "addedDate", label: "Added Date" },
  { id: "visibility", label: "Visibility" },
  { id: "labels", label: "Added to Labels" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Column Configurations
// ─────────────────────────────────────────────────────────────────────────────

const selectColumn: ColumnConfig<MenuCategory> = {
  id: "select",
  width: allCategoriesWidthPreset.select,
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

const nameColumn: ColumnConfig<MenuCategory> = {
  id: "name",
  width: allCategoriesWidthPreset.name,
  render: (row, ctx) => {
    const extra = ctx.extra as AllCategoriesExtra;
    const isPinned = extra.isPinnedRow || extra.pinnedCategoryId === row.id;

    return (
      <InlineNameEditor
        id={row.id}
        initialValue={row.name}
        isEditing={ctx.isEditing}
        isHidden={!row.isVisible}
        onStartEdit={ctx.onStartEdit}
        onCancelEdit={() => {
          ctx.onCancelEdit();
          if (isPinned) {
            extra.clearPinnedIfMatches(row.id);
          }
        }}
        onSave={async (id, name) => {
          await ctx.onSave(id, name);
          if (isPinned) {
            extra.clearPinnedIfMatches(row.id);
          }
        }}
      />
    );
  },
};

const productsColumn: ColumnConfig<MenuCategory> = {
  id: "products",
  width: allCategoriesWidthPreset.products,
  className: "text-sm",
  render: (row, ctx) => {
    const extra = ctx.extra as AllCategoriesExtra;
    const count = extra.getProductCount(row.id);
    return count > 0 ? count.toString() : "—";
  },
};

const addedDateColumn: ColumnConfig<MenuCategory> = {
  id: "addedDate",
  width: allCategoriesWidthPreset.addedDate,
  className: "text-sm",
  render: (row) => row.createdAt.toLocaleDateString(),
};

const visibilityColumn: ColumnConfig<MenuCategory> = {
  id: "visibility",
  width: allCategoriesWidthPreset.visibility,
  render: (row, ctx) => {
    const extra = ctx.extra as AllCategoriesExtra;
    return (
      <VisibilityCell
        id={row.id}
        isVisible={row.isVisible}
        variant="switch"
        onToggle={extra.handleVisibilitySave}
      />
    );
  },
};

const labelsColumn: ColumnConfig<MenuCategory> = {
  id: "labels",
  width: allCategoriesWidthPreset.labels,
  className: "text-sm",
  render: (row, ctx) => {
    const extra = ctx.extra as AllCategoriesExtra;
    return extra.getCategoryLabels(row.id);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty States
// ─────────────────────────────────────────────────────────────────────────────

const emptyStates: EmptyStateConfig[] = [
  {
    condition: (ctx) => ctx.items.length === 0,
    icon: FileSpreadsheet,
    title: "No Categories Yet",
    description: "Get started by creating your first category",
    actionLabel: "New Category",
    actionId: "create-category",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Row Configuration (Context Menu Props)
// ─────────────────────────────────────────────────────────────────────────────

const rowConfig: EntityRowConfig<MenuCategory> = {
  getContextMenuProps: (row, ctx, handlers) => {
    const extra = ctx.extra as AllCategoriesExtra;
    return {
      // No move-up/move-down in all-categories view
      isFirst: false,
      isLast: false,
      // Label management
      labelTargets: extra.labelTargets,
      attachedLabelIds: extra.getAttachedLabelIds(row.id),
      // Handlers
      onClone: () => handlers.clone(row.id),
      onVisibilityToggle: (visible) => handlers.visibility(row.id, visible),
      onDelete: () => handlers.delete(row.id),
      onLabelToggle: handlers.labelToggle
        ? (labelId, attach) => handlers.labelToggle!(row.id, labelId, attach)
        : undefined,
    };
  },
  getTableRowProps: (row, ctx) => ({
    isHidden: !row.isVisible,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Configuration Export
// ─────────────────────────────────────────────────────────────────────────────

export const allCategoriesConfig: ViewConfig<MenuCategory> = {
  viewType: "all-categories",
  entityKind: "category",
  widthPreset: allCategoriesWidthPreset,
  headerColumns: ALL_CATEGORIES_HEADER_COLUMNS,
  columns: [
    selectColumn,
    nameColumn,
    productsColumn,
    addedDateColumn,
    visibilityColumn,
    labelsColumn,
  ],
  features: {
    dnd: false,
    sorting: true,
    persistSort: false,
    ghost: false,
    deleteDialog: true,
    hierarchy: false,
  },
  emptyStates,
  rowConfig,
};

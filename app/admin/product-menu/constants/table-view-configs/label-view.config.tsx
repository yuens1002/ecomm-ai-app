/**
 * Label Table View Configuration
 *
 * Declarative configuration for the LabelTableView.
 * This view displays categories within a selected label with sorting and DnD support.
 */

import { Eye, EyeOff, Layers } from "lucide-react";
import type {
  ViewConfig,
  ColumnConfig,
  EmptyStateConfig,
  EntityRowConfig,
} from "../../hooks/table-view/types";
import { labelViewWidthPreset } from "../../menu-builder/components/table-views/shared/table/columnWidthPresets";
import type { TableHeaderColumn } from "../../menu-builder/components/table-views/shared/table/TableHeader";
import { CheckboxCell } from "../../menu-builder/components/table-views/shared/cells/CheckboxCell";
import { TouchTarget } from "../../menu-builder/components/table-views/shared/cells/TouchTarget";
import { DragHandleCell } from "../../menu-builder/components/table-views/shared/cells/DragHandleCell";
import type { MenuCategoryInLabel } from "../../types/menu";
import type { CheckboxState } from "../../hooks/useContextSelectionModel";

// ─────────────────────────────────────────────────────────────────────────────
// Local Types
// ─────────────────────────────────────────────────────────────────────────────

/** Category with order within current label, added order rank, and product names */
export type LabelCategory = MenuCategoryInLabel & {
  orderInLabel: number;
  addedOrderRank: number;
  productNames: string;
  isVisible: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Type for extra context passed to cell renderers
// ─────────────────────────────────────────────────────────────────────────────

export type LabelViewExtra = {
  /** Current label ID */
  currentLabelId: string | null | undefined;
  /** Move to targets (other labels) */
  moveToTargets: Array<{ id: string; name: string }>;

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

export const LABEL_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Categories" },
  { id: "addedOrder", label: "Added Order" },
  { id: "visibility", label: "Visibility" },
  { id: "products", label: "Products" },
  { id: "dragHandle", label: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Column Configurations
// ─────────────────────────────────────────────────────────────────────────────

const selectColumn: ColumnConfig<LabelCategory> = {
  id: "select",
  width: labelViewWidthPreset.select,
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

const nameColumn: ColumnConfig<LabelCategory> = {
  id: "name",
  width: labelViewWidthPreset.name,
  render: (row) => <span className="truncate font-medium">{row.name}</span>,
};

const addedOrderColumn: ColumnConfig<LabelCategory> = {
  id: "addedOrder",
  width: labelViewWidthPreset.addedOrder,
  render: (row) => <span className="text-sm">{row.addedOrderRank}</span>,
};

const visibilityColumn: ColumnConfig<LabelCategory> = {
  id: "visibility",
  width: labelViewWidthPreset.visibility,
  render: (row) =>
    row.isVisible ? (
      <Eye className="h-4 w-4 inline" />
    ) : (
      <EyeOff className="h-4 w-4 text-muted-foreground inline" />
    ),
};

const productsColumn: ColumnConfig<LabelCategory> = {
  id: "products",
  width: labelViewWidthPreset.products,
  className: "text-sm",
  render: (row) => <span className="truncate">{row.productNames}</span>,
};

const dragHandleColumn: ColumnConfig<LabelCategory> = {
  id: "dragHandle",
  width: labelViewWidthPreset.dragHandle,
  ignoreRowClick: true,
  render: (row, ctx) => {
    const extra = ctx.extra as LabelViewExtra;
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
    icon: Layers,
    title: "No Label Selected",
    description: "Select a label to view its categories",
  },
  {
    condition: (ctx) => ctx.items.length === 0,
    icon: Layers,
    title: "No Categories",
    description: "Add categories to this label using the action bar",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Row Configuration (Context Menu Props)
// ─────────────────────────────────────────────────────────────────────────────

const rowConfig: EntityRowConfig<LabelCategory> = {
  getContextMenuProps: (row, ctx, handlers) => {
    const extra = ctx.extra as LabelViewExtra;
    return {
      // Move-up/move-down support
      isFirst: ctx.isFirstRow,
      isLast: ctx.isLastRow,
      // Move to other labels
      moveToTargets: extra.moveToTargets,
      currentParentId: extra.currentLabelId ?? undefined,
      // Handlers
      onClone: handlers.clone ? () => handlers.clone(row.id) : undefined,
      onVisibilityToggle: (visible) => handlers.visibility(row.id, visible),
      onRemove: handlers.remove ? () => handlers.remove!(row.id) : undefined,
      onDelete: () => handlers.delete(row.id),
      onMoveUp: handlers.moveUp ? () => handlers.moveUp!(row.id) : undefined,
      onMoveDown: handlers.moveDown
        ? () => handlers.moveDown!(row.id)
        : undefined,
      onMoveTo: handlers.moveTo
        ? (toLabelId) => handlers.moveTo!(row.id, toLabelId)
        : undefined,
    };
  },
  getTableRowProps: (row) => ({
    isHidden: !row.isVisible,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Configuration Export
// ─────────────────────────────────────────────────────────────────────────────

export const labelViewConfig: ViewConfig<LabelCategory> = {
  viewType: "label",
  entityKind: "category",
  widthPreset: labelViewWidthPreset,
  headerColumns: LABEL_VIEW_HEADER_COLUMNS,
  columns: [
    selectColumn,
    nameColumn,
    addedOrderColumn,
    visibilityColumn,
    productsColumn,
    dragHandleColumn,
  ],
  features: {
    dnd: "single",
    sorting: true,
    persistSort: true,
    ghost: false, // No multi-drag ghost in LabelTableView
    deleteDialog: true,
    hierarchy: false,
  },
  parentContext: {
    idKey: "currentLabelId",
  },
  emptyStates,
  rowConfig,
};

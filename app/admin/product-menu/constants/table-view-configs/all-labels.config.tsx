/**
 * All Labels Table View Configuration
 *
 * Declarative configuration for the AllLabelsTableView.
 * This view displays all labels in a flat list with DnD reordering support.
 */

import { Tag } from "lucide-react";
import type {
  ViewConfig,
  ColumnConfig,
  EmptyStateConfig,
  EntityRowConfig,
} from "../../hooks/table-view/types";
import { allLabelsWidthPreset } from "../../menu-builder/components/table-views/shared/table/columnWidthPresets";
import type { TableHeaderColumn } from "../../menu-builder/components/table-views/shared/table/TableHeader";
import { CheckboxCell } from "../../menu-builder/components/table-views/shared/cells/CheckboxCell";
import { TouchTarget } from "../../menu-builder/components/table-views/shared/cells/TouchTarget";
import { InlineIconCell } from "../../menu-builder/components/table-views/shared/cells/InlineIconCell";
import { InlineNameEditor } from "../../menu-builder/components/table-views/shared/cells/InlineNameEditor";
import { VisibilityCell } from "../../menu-builder/components/table-views/shared/cells/VisibilityCell";
import { DragHandleCell } from "../../menu-builder/components/table-views/shared/cells/DragHandleCell";
import type { MenuLabel } from "../../types/menu";
import type { CheckboxState } from "../../hooks/useContextSelectionModel";

// ─────────────────────────────────────────────────────────────────────────────
// Type for extra context passed to cell renderers
// ─────────────────────────────────────────────────────────────────────────────

export type AllLabelsExtra = {
  /** Get comma-separated category names for a label */
  getLabelCategories: (label: MenuLabel) => string;
  /** Available categories for "manage categories" submenu */
  categoryTargets: Array<{ id: string; name: string }>;
  /** Save icon change */
  handleIconSave: (id: string, icon: string | null) => Promise<void>;
  /** Save visibility toggle with undo support */
  handleVisibilitySave: (id: string, visible: boolean) => Promise<void>;
  /** Whether the row is pinned (for clearing pinned state on cancel/save) */
  isPinnedRow?: boolean;
  /** Pinned label ID from context */
  pinnedLabelId: string | null;
  /** Clear editing state */
  clearEditing: () => void;
  /** Clear pinned if matches */
  clearPinnedIfMatches: (id: string) => void;

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

export const ALL_LABELS_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "icon", label: "Icon" },
  { id: "name", label: "Label" },
  { id: "visibility", label: "Visibility" },
  { id: "categories", label: "Categories" },
  { id: "dragHandle", label: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Column Configurations
// ─────────────────────────────────────────────────────────────────────────────

const selectColumn: ColumnConfig<MenuLabel> = {
  id: "select",
  width: allLabelsWidthPreset.select,
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

const iconColumn: ColumnConfig<MenuLabel> = {
  id: "icon",
  width: allLabelsWidthPreset.icon,
  ignoreRowClick: true,
  render: (row, ctx) => {
    const extra = ctx.extra as AllLabelsExtra;
    return (
      <InlineIconCell
        id={row.id}
        icon={row.icon}
        onSave={extra.handleIconSave}
        isRowHovered={ctx.isRowHovered}
      />
    );
  },
};

const nameColumn: ColumnConfig<MenuLabel> = {
  id: "name",
  width: allLabelsWidthPreset.name,
  render: (row, ctx) => {
    const extra = ctx.extra as AllLabelsExtra;
    const isPinned = extra.isPinnedRow || extra.pinnedLabelId === row.id;

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

const visibilityColumn: ColumnConfig<MenuLabel> = {
  id: "visibility",
  width: allLabelsWidthPreset.visibility,
  render: (row, ctx) => {
    const extra = ctx.extra as AllLabelsExtra;
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

const categoriesColumn: ColumnConfig<MenuLabel> = {
  id: "categories",
  width: allLabelsWidthPreset.categories,
  className: "text-sm",
  render: (row, ctx) => {
    const extra = ctx.extra as AllLabelsExtra;
    return extra.getLabelCategories(row);
  },
};

const dragHandleColumn: ColumnConfig<MenuLabel> = {
  id: "dragHandle",
  width: allLabelsWidthPreset.dragHandle,
  ignoreRowClick: true,
  render: (row, ctx) => {
    const extra = ctx.extra as AllLabelsExtra;
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
    condition: (ctx) => ctx.items.length === 0,
    icon: Tag,
    title: "No Labels Yet",
    description: "Get started by creating your first label",
    actionLabel: "New Label",
    actionId: "create-label",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Row Configuration (Context Menu Props)
// ─────────────────────────────────────────────────────────────────────────────

const rowConfig: EntityRowConfig<MenuLabel> = {
  getContextMenuProps: (row, ctx, handlers) => {
    const extra = ctx.extra as AllLabelsExtra;
    return {
      // Move-up/move-down support (not disabled for first/last)
      isFirst: ctx.isFirstRow,
      isLast: ctx.isLastRow,
      // Category management
      categoryTargets: extra.categoryTargets,
      attachedCategoryIds: row.categories?.map((c) => c.id) ?? [],
      // Handlers
      onClone: () => handlers.clone(row.id),
      onVisibilityToggle: (visible) => handlers.visibility(row.id, visible),
      onDelete: () => handlers.delete(row.id),
      onMoveUp: handlers.moveUp ? () => handlers.moveUp!(row.id) : undefined,
      onMoveDown: handlers.moveDown
        ? () => handlers.moveDown!(row.id)
        : undefined,
      onCategoryToggle: handlers.categoryToggle
        ? (categoryId, attach) =>
            handlers.categoryToggle!(row.id, categoryId, attach)
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

export const allLabelsConfig: ViewConfig<MenuLabel> = {
  viewType: "all-labels",
  entityKind: "label",
  widthPreset: allLabelsWidthPreset,
  headerColumns: ALL_LABELS_HEADER_COLUMNS,
  columns: [
    selectColumn,
    iconColumn,
    nameColumn,
    visibilityColumn,
    categoriesColumn,
    dragHandleColumn,
  ],
  features: {
    dnd: "single",
    sorting: false,
    persistSort: false,
    ghost: true,
    deleteDialog: true,
    hierarchy: false,
  },
  emptyStates,
  rowConfig,
};

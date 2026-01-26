"use client";
"use no memo";

/**
 * All Categories Table View
 *
 * Displays all categories in a flat list with sorting support.
 * Uses config-driven rendering for columns via useConfiguredRow.
 */

import { TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  useContextRowHighlight,
  useBulkAction,
  useDeleteConfirmation,
  useContextClone,
  useContextVisibility,
  useRelationshipToggle,
} from "../../../hooks/context-menu";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { buildFlatRegistry } from "../../../hooks/useIdentityRegistry";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuCategory } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import {
  allCategoriesConfig,
  ALL_CATEGORIES_HEADER_COLUMNS,
  type AllCategoriesExtra,
} from "../../../constants/table-view-configs";
import { useConfiguredRow } from "../../../hooks/table-view";
import { EmptyState } from "./shared/table/EmptyState";
import { TableHeader } from "./shared/table/TableHeader";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import { DeleteConfirmationDialog } from "./shared/table/DeleteConfirmationDialog";
import { ConfiguredTableRow } from "./shared/table/ConfiguredTableRow";

export function AllCategoriesTableView() {
  const {
    builder,
    categories,
    labels,
    products,
    updateCategory,
    createNewCategory,
    deleteCategory,
    cloneCategory,
    attachCategory,
    detachCategory,
  } = useMenuBuilder();

  const { toast: _toast } = useToast();

  // UI state for row hover
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Context menu row highlighting (shared hook)
  const { isContextRow, handleContextOpenChange } = useContextRowHighlight();

  // Delete confirmation dialog (shared hook)
  const {
    deleteConfirmation,
    isDeleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation({
    deleteEntity: (_kind, id) => deleteCategory(id),
  });

  // Editing/pinned state
  const {
    editingId: editingCategoryId,
    pinnedId: pinnedCategoryId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "category", { autoClearPinned: true });

  // Build registry for selection
  const registry = useMemo(
    () => buildFlatRegistry(categories, "category"),
    [categories]
  );

  // Sorting state (react-table)
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "addedDate", desc: true },
  ]);

  // Pinned row handling
  const { pinnedRow: pinnedCategory, rowsForTable: categoriesForTable } =
    usePinnedRow({
      rows: categories,
      pinnedId: pinnedCategoryId,
      isSortingActive: sorting.length > 0,
    });

  // Inline edit handlers
  const { handleNameSave, handleVisibilitySave } = useInlineEditHandlers({
    builder,
    entityKind: "category",
    getItem: (id) => categories.find((c) => c.id === id),
    updateItem: updateCategory,
    onSaveComplete: clearEditing,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Data (for extra context)
  // ─────────────────────────────────────────────────────────────────────────

  const categoryLabelsById = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const label of labels) {
      for (const category of label.categories ?? []) {
        const existing = map.get(category.id);
        if (existing) {
          existing.push(label.name);
        } else {
          map.set(category.id, [label.name]);
        }
      }
    }
    return map;
  }, [labels]);

  const categoryProductCountById = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      for (const categoryId of product.categoryIds ?? []) {
        map.set(categoryId, (map.get(categoryId) ?? 0) + 1);
      }
    }
    return map;
  }, [products]);

  const categoryLabelIdsById = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const label of labels) {
      for (const category of label.categories ?? []) {
        const existing = map.get(category.id);
        if (existing) {
          existing.push(label.id);
        } else {
          map.set(category.id, [label.id]);
        }
      }
    }
    return map;
  }, [labels]);

  // Label targets for manage-labels submenu (all visible labels)
  const labelTargets = useMemo(
    () =>
      labels
        .filter((l) => l.isVisible)
        .map((l) => ({ id: l.id, name: l.name })),
    [labels]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // React Table (for sorting)
  // ─────────────────────────────────────────────────────────────────────────

  const getCategoryLabels = useCallback(
    (categoryId: string) => {
      const names = categoryLabelsById.get(categoryId);
      return names && names.length > 0 ? names.join(", ") : "—";
    },
    [categoryLabelsById]
  );

  const getCategoryProductCount = useCallback(
    (categoryId: string) => categoryProductCountById.get(categoryId) ?? 0,
    [categoryProductCountById]
  );

  const columns = useMemo<ColumnDef<MenuCategory>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name,
        sortingFn: "alphanumeric",
      },
      {
        id: "labels",
        accessorFn: (row) => getCategoryLabels(row.id),
        sortingFn: "alphanumeric",
      },
      {
        id: "products",
        accessorFn: (row) => getCategoryProductCount(row.id),
        sortingFn: "basic",
      },
      {
        id: "addedDate",
        accessorFn: (row) => row.createdAt.getTime(),
        sortingFn: "basic",
      },
      {
        id: "visibility",
        accessorFn: (row) => (row.isVisible ? 1 : 0),
        sortingFn: "basic",
      },
    ],
    [getCategoryLabels, getCategoryProductCount]
  );

  const table = useReactTable({
    data: categoriesForTable,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableSortingRemoval: true,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Selection
  // ─────────────────────────────────────────────────────────────────────────

  // selectableKeys must match visual row order (pinned first, then sorted)
  const selectableKeys = useMemo(() => {
    const sortedRows = table.getRowModel().rows;
    const keys: string[] = [];
    if (pinnedCategory) {
      keys.push(createKey("category", pinnedCategory.id));
    }
    for (const row of sortedRows) {
      keys.push(createKey("category", row.original.id));
    }
    return keys;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, pinnedCategory, sorting]);

  const {
    selectionState,
    onSelectAll,
    onToggle,
    isSelected,
    anchorKey,
    rangeSelect,
    getCheckboxState,
    actionableRoots,
    isSameKind,
  } = useContextSelectionModel(builder, { selectableKeys });

  // Click handlers
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    navigate: (_kind, entityId) => builder.navigateToCategory(entityId),
    rangeSelect,
    anchorKey,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Context Menu Handlers (using shared hooks)
  // ─────────────────────────────────────────────────────────────────────────

  // Bulk action support for context menu operations
  const { getTargetIds } = useBulkAction({
    isSelected,
    actionableRoots,
    isSameKind,
    entityKind: "category",
  });

  // Clone (with bulk support)
  const { handleClone: handleContextClone } = useContextClone({
    cloneEntity: (id) => cloneCategory({ id }),
    getTargetIds,
    entityLabel: { singular: "Category", plural: "categories" },
  });

  // Delete handler
  const handleContextDelete = useCallback(
    (categoryId: string) => {
      requestDelete(categoryId, "category", getTargetIds);
    },
    [requestDelete, getTargetIds]
  );

  // Visibility toggle (with bulk support + undo for single items)
  const { handleVisibilityToggle: handleBulkVisibility } = useContextVisibility({
    updateEntity: (id, visible) => updateCategory(id, { isVisible: visible }),
    getTargetIds,
    entityLabel: { singular: "Category", plural: "categories" },
  });

  // Wrap to use undo-enabled handler for single items
  const handleContextVisibilityToggle = useCallback(
    async (categoryId: string, visible: boolean) => {
      const targetIds = getTargetIds(categoryId);
      if (targetIds.length === 1) {
        await handleVisibilitySave(categoryId, visible);
      } else {
        // Bulk operation - use hook handler
        await handleBulkVisibility(categoryId, visible);
      }
    },
    [getTargetIds, handleVisibilitySave, handleBulkVisibility]
  );

  // Label toggle for manage-labels submenu (swap args to match attachCategory signature)
  const { handleToggle: handleLabelToggle } = useRelationshipToggle({
    attach: (categoryId, labelId) => attachCategory(labelId, categoryId),
    detach: (categoryId, labelId) => detachCategory(labelId, categoryId),
    relationshipLabel: "label",
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Config-Driven Row Rendering
  // ─────────────────────────────────────────────────────────────────────────

  const extra: AllCategoriesExtra = useMemo(
    () => ({
      getProductCount: getCategoryProductCount,
      getCategoryLabels,
      getAttachedLabelIds: (id) => categoryLabelIdsById.get(id) ?? [],
      labelTargets,
      handleVisibilitySave,
      pinnedCategoryId,
      clearEditing,
      clearPinnedIfMatches,
    }),
    [
      getCategoryProductCount,
      getCategoryLabels,
      categoryLabelIdsById,
      labelTargets,
      handleVisibilitySave,
      pinnedCategoryId,
      clearEditing,
      clearPinnedIfMatches,
    ]
  );

  const { buildRow } = useConfiguredRow({
    config: allCategoriesConfig,
    contextMenuHandlers: {
      clone: handleContextClone,
      delete: handleContextDelete,
      visibility: handleContextVisibilityToggle,
      labelToggle: handleLabelToggle,
    },
    selectionInfo: { actionableRoots, isSameKind },
    extra,
    onContextMenuOpenChange: handleContextOpenChange,
    onMouseEnter: setHoveredRowId,
    onMouseLeave: () => setHoveredRowId(null),
    onRowClick: handleClick,
    onRowDoubleClick: handleDoubleClick,
  });

  // Build row state and handlers for a category
  const getRowStateAndHandlers = useCallback(
    (category: MenuCategory, isPinned: boolean) => {
      const categoryKey = createKey("category", category.id);
      return {
        state: {
          isSelected: isSelected(categoryKey),
          checkboxState: getCheckboxState(categoryKey),
          anchorKey,
          isRowHovered: hoveredRowId === category.id,
          isContextRow: isContextRow(category.id),
          isEditing: editingCategoryId === category.id,
          isPinned: isPinned || pinnedCategoryId === category.id,
        },
        handlers: {
          onToggle: () => onToggle(categoryKey),
          onRangeSelect:
            anchorKey && anchorKey !== categoryKey
              ? () => rangeSelect(categoryKey)
              : undefined,
          onStartEdit: () =>
            builder.setEditing({ kind: "category", id: category.id }),
          onCancelEdit: () => {
            clearEditing();
            if (isPinned || pinnedCategoryId === category.id) {
              clearPinnedIfMatches(category.id);
            }
          },
          onSave: async (id: string, name: string) => {
            await handleNameSave(id, name);
            if (isPinned || pinnedCategoryId === category.id) {
              clearPinnedIfMatches(category.id);
            }
          },
        },
      };
    },
    [
      isSelected,
      getCheckboxState,
      anchorKey,
      hoveredRowId,
      isContextRow,
      editingCategoryId,
      pinnedCategoryId,
      onToggle,
      rangeSelect,
      builder,
      clearEditing,
      clearPinnedIfMatches,
      handleNameSave,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Empty State
  // ─────────────────────────────────────────────────────────────────────────

  if (categories.length === 0) {
    const emptyConfig = allCategoriesConfig.emptyStates[0];
    return (
      <EmptyState
        icon={emptyConfig.icon}
        title={emptyConfig.title}
        description={emptyConfig.description}
        actionLabel={emptyConfig.actionLabel}
        onAction={async () => {
          const createdId = await createNewCategory();
          if (createdId) {
            builder.setPinnedNew({ kind: "category", id: createdId });
            builder.setEditing({ kind: "category", id: createdId });
          }
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const sortedRows = table.getRowModel().rows;
  const totalRows = (pinnedCategory ? 1 : 0) + sortedRows.length;

  return (
    <>
      <TableViewWrapper>
        <TableHeader
          columns={ALL_CATEGORIES_HEADER_COLUMNS}
          preset={allCategoriesConfig.widthPreset}
          table={table}
          hasSelectAll
          allSelected={selectionState.allSelected}
          someSelected={selectionState.someSelected}
          onSelectAll={onSelectAll}
        />

        <TableBody>
          {pinnedCategory && (() => {
            const { state, handlers } = getRowStateAndHandlers(pinnedCategory, true);
            const rowData = buildRow(pinnedCategory, 0, totalRows, state, handlers);
            return <ConfiguredTableRow key={rowData.key} data={rowData} />;
          })()}
          {sortedRows.map((row, index) => {
            const category = row.original;
            const { state, handlers } = getRowStateAndHandlers(category, false);
            const rowIndex = pinnedCategory ? index + 1 : index;
            const rowData = buildRow(category, rowIndex, totalRows, state, handlers);
            return <ConfiguredTableRow key={rowData.key} data={rowData} />;
          })}
        </TableBody>
      </TableViewWrapper>

      <DeleteConfirmationDialog
        open={deleteConfirmation.open}
        targetCount={deleteConfirmation.targetIds.length}
        entityName="category"
        entityNamePlural="categories"
        associationMessage="all product associations"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

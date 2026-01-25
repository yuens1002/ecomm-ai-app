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

  // UI state
  const [contextRowId, setContextRowId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    targetIds: string[];
  }>({ open: false, targetIds: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

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
  // Context Menu Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const getTargetIds = useCallback(
    (categoryId: string): string[] => {
      const categoryKey = createKey("category", categoryId);
      const inSelection = isSelected(categoryKey);
      const isBulk = inSelection && actionableRoots.length > 1 && isSameKind;
      if (isBulk) {
        return actionableRoots.map((key) => key.split(":")[1]);
      }
      return [categoryId];
    },
    [isSelected, actionableRoots, isSameKind]
  );

  const handleContextDelete = useCallback(
    (categoryId: string) => {
      const targetIds = getTargetIds(categoryId);
      setDeleteConfirmation({ open: true, targetIds });
    },
    [getTargetIds]
  );

  const handleConfirmDelete = useCallback(async () => {
    const { targetIds } = deleteConfirmation;
    if (!targetIds || targetIds.length === 0) return;

    setIsDeleting(true);
    try {
      const results = await Promise.all(
        targetIds.map((id) => deleteCategory(id))
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast({
          title:
            targetIds.length > 1
              ? `${targetIds.length} categories deleted`
              : "Category deleted",
        });
      } else {
        toast({
          title: "Error",
          description: "Some categories could not be deleted",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, targetIds: [] });
    }
  }, [deleteConfirmation, deleteCategory, toast]);

  const handleContextClone = useCallback(
    async (categoryId: string) => {
      const targetIds = getTargetIds(categoryId);
      const results = await Promise.all(
        targetIds.map((id) => cloneCategory({ id }))
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast({
          title:
            targetIds.length > 1
              ? `${targetIds.length} categories cloned`
              : "Category cloned",
        });
      } else {
        toast({
          title: "Error",
          description: "Some categories could not be cloned",
          variant: "destructive",
        });
      }
    },
    [cloneCategory, toast, getTargetIds]
  );

  const handleContextVisibilityToggle = useCallback(
    async (categoryId: string, visible: boolean) => {
      const targetIds = getTargetIds(categoryId);
      if (targetIds.length === 1) {
        await handleVisibilitySave(categoryId, visible);
      } else {
        await Promise.all(
          targetIds.map((id) => updateCategory(id, { isVisible: visible }))
        );
        toast({
          title: `${targetIds.length} categories ${visible ? "shown" : "hidden"}`,
        });
      }
    },
    [getTargetIds, handleVisibilitySave, updateCategory, toast]
  );

  const handleLabelToggle = useCallback(
    async (categoryId: string, labelId: string, shouldAttach: boolean) => {
      if (shouldAttach) {
        const result = await attachCategory(labelId, categoryId);
        if (!result.ok) {
          toast({
            title: "Error",
            description: "Could not add to label",
            variant: "destructive",
          });
        }
      } else {
        const result = await detachCategory(labelId, categoryId);
        if (!result.ok) {
          toast({
            title: "Error",
            description: "Could not remove from label",
            variant: "destructive",
          });
        }
      }
    },
    [attachCategory, detachCategory, toast]
  );

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
    onContextMenuOpenChange: (id, open) => setContextRowId(open ? id : null),
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
          isContextRow: contextRowId === category.id,
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
      contextRowId,
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
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ open: false, targetIds: [] })}
      />
    </>
  );
}

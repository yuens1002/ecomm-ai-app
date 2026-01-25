"use client";
"use no memo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { FileSpreadsheet } from "lucide-react";
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
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { TouchTarget } from "./shared/cells/TouchTarget";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { VisibilityCell } from "./shared/cells/VisibilityCell";
import { RowContextMenu } from "./shared/cells/RowContextMenu";
import { allCategoriesWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";

const ALL_CATEGORIES_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Category" },
  { id: "products", label: "Products" },
  { id: "addedDate", label: "Added Date" },
  { id: "visibility", label: "Visibility" },
  { id: "labels", label: "Added to Labels" },
];

export function AllCategoriesTableView() {
  const { builder, categories, labels, products, updateCategory, createNewCategory, deleteCategory, cloneCategory, attachCategory, detachCategory } =
    useMenuBuilder();

  // Context menu highlight state (separate from selection)
  const [contextRowId, setContextRowId] = useState<string | null>(null);

  // Delete confirmation state (single or bulk from context menu)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    targetIds: string[];
  }>({ open: false, targetIds: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const {
    editingId: editingCategoryId,
    pinnedId: pinnedCategoryId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "category", { autoClearPinned: true });

  // Build registry for this flat view
  const registry = useMemo(() => buildFlatRegistry(categories, "category"), [categories]);

  // Default sort by addedDate desc (newest first) - no DnD in this view so always show sort indicator
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "addedDate", desc: true }]);

  const { pinnedRow: pinnedCategory, rowsForTable: categoriesForTable } = usePinnedRow({
    rows: categories,
    pinnedId: pinnedCategoryId,
    isSortingActive: sorting.length > 0,
    // Uses built-in default sort by order field
  });

  // Inline edit handlers with undo/redo
  const { handleNameSave, handleVisibilitySave } = useInlineEditHandlers({
    builder,
    entityKind: "category",
    getItem: (id) => categories.find((c) => c.id === id),
    updateItem: updateCategory,
    onSaveComplete: clearEditing,
  });

  // Helper: Get label names for a category
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

  const getCategoryLabels = useCallback(
    (categoryId: string) => {
      const names = categoryLabelsById.get(categoryId);
      return names && names.length > 0 ? names.join(", ") : "—";
    },
    [categoryLabelsById]
  );

  const getCategoryProductCountNumber = useCallback(
    (categoryId: string) => categoryProductCountById.get(categoryId) ?? 0,
    [categoryProductCountById]
  );

  // Map category ID -> array of label IDs that contain this category
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

  // Label targets for context menu (all visible labels)
  const labelTargets = useMemo(
    () =>
      labels
        .filter((l) => l.isVisible)
        .map((l) => ({ id: l.id, name: l.name })),
    [labels]
  );

  // Handler for toggling category attachment to a label
  const handleLabelToggle = useCallback(
    async (categoryId: string, labelId: string, shouldAttach: boolean) => {
      if (shouldAttach) {
        const result = await attachCategory(labelId, categoryId);
        if (!result.ok) {
          toast({ title: "Error", description: "Could not add to label", variant: "destructive" });
        }
      } else {
        const result = await detachCategory(labelId, categoryId);
        if (!result.ok) {
          toast({ title: "Error", description: "Could not remove from label", variant: "destructive" });
        }
      }
    },
    [attachCategory, detachCategory, toast]
  );

  // Column definitions
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
        accessorFn: (row) => getCategoryProductCountNumber(row.id),
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
    [getCategoryLabels, getCategoryProductCountNumber]
  );

  // Initialize table
  // eslint-disable-next-line react-hooks/incompatible-library
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

  // IMPORTANT: selectableKeys must match the VISUAL row order (after sorting)
  // so that shift+click range selection selects the correct rows
  const selectableKeys = useMemo(() => {
    const sortedRows = table.getRowModel().rows;
    // Include pinned row at the top if present
    const keys: string[] = [];
    if (pinnedCategory) {
      keys.push(createKey("category", pinnedCategory.id));
    }
    for (const row of sortedRows) {
      keys.push(createKey("category", row.original.id));
    }
    return keys;
  }, [table, pinnedCategory, sorting]);

  const {
    selectionState,
    onSelectAll,
    onToggle,
    isSelected,
    anchorKey,
    rangeSelect,
    actionableRoots,
    isSameKind,
  } = useContextSelectionModel(builder, { selectableKeys });

  // Unified click handler with range selection support
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    navigate: (kind, entityId) => builder.navigateToCategory(entityId),
    rangeSelect,
    anchorKey,
  });

  // Context menu handlers - support bulk when item is in selection
  // Helper to get target IDs (bulk if in selection with multiple, single otherwise)
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

  // Opens confirmation dialog for delete (single or bulk)
  const handleContextDelete = useCallback(
    (categoryId: string) => {
      const targetIds = getTargetIds(categoryId);
      setDeleteConfirmation({ open: true, targetIds });
    },
    [getTargetIds]
  );

  // Actually perform the delete after confirmation
  const handleConfirmDelete = useCallback(async () => {
    const { targetIds } = deleteConfirmation;
    if (!targetIds || targetIds.length === 0) return;

    setIsDeleting(true);
    try {
      const results = await Promise.all(targetIds.map((id) => deleteCategory(id)));
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast({
          title: targetIds.length > 1 ? `${targetIds.length} categories deleted` : "Category deleted",
        });
      } else {
        toast({ title: "Error", description: "Some categories could not be deleted", variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, targetIds: [] });
    }
  }, [deleteConfirmation, deleteCategory, toast]);

  const handleContextClone = useCallback(
    async (categoryId: string) => {
      const targetIds = getTargetIds(categoryId);
      const results = await Promise.all(targetIds.map((id) => cloneCategory({ id })));
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast({
          title: targetIds.length > 1 ? `${targetIds.length} categories cloned` : "Category cloned",
        });
      } else {
        toast({ title: "Error", description: "Some categories could not be cloned", variant: "destructive" });
      }
    },
    [cloneCategory, toast, getTargetIds]
  );

  // Visibility toggle for context menu (single or bulk)
  const handleContextVisibilityToggle = useCallback(
    async (categoryId: string, visible: boolean) => {
      const targetIds = getTargetIds(categoryId);
      if (targetIds.length === 1) {
        // Single item - use handler with undo support
        await handleVisibilitySave(categoryId, visible);
      } else {
        // Bulk operation
        await Promise.all(targetIds.map((id) => updateCategory(id, { isVisible: visible })));
        toast({ title: `${targetIds.length} categories ${visible ? "shown" : "hidden"}` });
      }
    },
    [getTargetIds, handleVisibilitySave, updateCategory, toast]
  );

  const allSelected = selectionState.allSelected;
  const someSelected = selectionState.someSelected;

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No Categories Yet"
        description="Get started by creating your first category"
        actionLabel="New Category"
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

  const renderCategoryRow = (category: MenuCategory, options?: { isPinned?: boolean }) => {
    const isPinned = options?.isPinned === true;
    const categoryKey = createKey("category", category.id);
    const isCategorySelected = isSelected(categoryKey);
    const isContextRow = contextRowId === category.id;

    return (
      <RowContextMenu
        key={category.id}
        entityKind="category"
        viewType="all-categories"
        entityId={category.id}
        isVisible={category.isVisible}
        isFirst={false}
        isLast={false}
        selectedCount={actionableRoots.length}
        isInSelection={isCategorySelected}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        labelTargets={labelTargets}
        attachedLabelIds={categoryLabelIdsById.get(category.id) ?? []}
        onOpenChange={(open) => setContextRowId(open ? category.id : null)}
        onClone={() => handleContextClone(category.id)}
        onVisibilityToggle={(visible) => handleContextVisibilityToggle(category.id, visible)}
        onDelete={() => handleContextDelete(category.id)}
        onLabelToggle={(labelId, shouldAttach) => handleLabelToggle(category.id, labelId, shouldAttach)}
      >
        <TableRow
          data-state={isCategorySelected ? "selected" : undefined}
          isSelected={isCategorySelected}
          isContextRow={isContextRow}
          isHidden={!category.isVisible}
          onRowClick={(options) => handleClick(categoryKey, options)}
          onRowDoubleClick={() => handleDoubleClick(categoryKey)}
        >
          <TableCell config={allCategoriesWidthPreset.select} data-row-click-ignore>
            <TouchTarget>
              <CheckboxCell
                id={category.id}
                checked={isCategorySelected}
                onToggle={() => onToggle(categoryKey)}
                isSelectable
                alwaysVisible={isCategorySelected}
                ariaLabel={`Select ${category.name}`}
                anchorKey={anchorKey}
                onRangeSelect={anchorKey && anchorKey !== categoryKey ? () => rangeSelect(categoryKey) : undefined}
              />
            </TouchTarget>
          </TableCell>

          <TableCell config={allCategoriesWidthPreset.name}>
            <InlineNameEditor
              id={category.id}
              initialValue={category.name}
              isEditing={editingCategoryId === category.id}
              isHidden={!category.isVisible}
              onStartEdit={() => builder.setEditing({ kind: "category", id: category.id })}
              onCancelEdit={() => {
                clearEditing();
                if (isPinned || pinnedCategoryId === category.id) {
                  clearPinnedIfMatches(category.id);
                }
              }}
              onSave={async (id, name) => {
                await handleNameSave(id, name);
                if (isPinned || pinnedCategoryId === category.id) {
                  clearPinnedIfMatches(category.id);
                }
              }}
            />
          </TableCell>

          <TableCell config={allCategoriesWidthPreset.products} className="text-sm">
            {(() => {
              const count = getCategoryProductCountNumber(category.id);
              return count > 0 ? count.toString() : "—";
            })()}
          </TableCell>

          <TableCell config={allCategoriesWidthPreset.addedDate} className="text-sm">
            {category.createdAt.toLocaleDateString()}
          </TableCell>

          <TableCell config={allCategoriesWidthPreset.visibility}>
            <VisibilityCell
              id={category.id}
              isVisible={category.isVisible}
              variant="switch"
              onToggle={handleVisibilitySave}
            />
          </TableCell>

          <TableCell config={allCategoriesWidthPreset.labels} className="text-sm">
            {getCategoryLabels(category.id)}
          </TableCell>
        </TableRow>
      </RowContextMenu>
    );
  };

  return (
    <>
      <TableViewWrapper>
        <TableHeader
          columns={ALL_CATEGORIES_HEADER_COLUMNS}
          preset={allCategoriesWidthPreset}
          table={table}
          hasSelectAll
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
        />

        <TableBody>
          {pinnedCategory ? renderCategoryRow(pinnedCategory, { isPinned: true }) : null}
          {table.getRowModel().rows.map((row) => renderCategoryRow(row.original))}
        </TableBody>
      </TableViewWrapper>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmation({ open: false, targetIds: [] });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Delete {deleteConfirmation.targetIds.length}{" "}
              {deleteConfirmation.targetIds.length === 1 ? "category" : "categories"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The{" "}
              {deleteConfirmation.targetIds.length === 1 ? "category" : "categories"} will be
              permanently deleted and all product associations will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

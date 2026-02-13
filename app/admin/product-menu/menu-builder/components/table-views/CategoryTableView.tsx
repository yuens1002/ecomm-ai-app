"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  useMoveHandlers,
  useBulkAction,
  useContextRemove,
  useContextMoveTo,
  useRelationshipToggle,
} from "../../../hooks/context-menu";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useSingleEntityDnd } from "../../../hooks/dnd/useSingleEntityDnd";
import { useDnDEligibility } from "../../../hooks/dnd/useDnDEligibility";
import { buildFlatRegistry } from "../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { createKey } from "../../../types/identity-registry";
import { usePersistColumnSort } from "../../../hooks/usePersistColumnSort";
import { GroupedEntitiesGhost, GhostRowContent } from "./shared/table/GroupedEntitiesGhost";
import { useGroupedEntitiesGhost } from "../../../hooks/dnd/useGroupedEntitiesGhost";
import { usePinnedRow } from "../../../hooks/usePinnedRow";
import type { MenuProduct } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { categoryViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableHeader } from "./shared/table/TableHeader";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import { ConfiguredTableRow } from "./shared/table/ConfiguredTableRow";
import { useConfiguredRow, type UseConfiguredRowOptions } from "../../../hooks/table-view";
import {
  categoryViewConfig,
  CATEGORY_VIEW_HEADER_COLUMNS,
  type CategoryViewExtra,
  type CategoryProduct,
} from "../../../constants/table-view-configs";

export function CategoryTableView() {
  const {
    builder,
    products,
    categories,
    reorderProductsInCategory,
    detachProductFromCategory,
    attachProductToCategory,
  } = useMenuBuilder();

  const currentCategoryId = builder.currentCategoryId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const { toast } = useToast();

  // Context menu row highlighting (shared hook)
  const { isContextRow, handleContextOpenChange } = useContextRowHighlight();

  // Pinning support for newly added products
  const { pinnedId: pinnedProductId } = useContextRowUiState(
    builder,
    "product",
    { autoClearPinned: true }
  );

  // Get products for current category, sorted by their order within this category
  const categoryProducts = useMemo((): CategoryProduct[] => {
    if (!currentCategoryId) return [];

    // First, get products in this category with their order and attachedAt
    const productsInCategory = products
      .filter((p) => p.categoryIds.includes(currentCategoryId))
      .map((p) => {
        const orderEntry = p.categoryOrders.find((o) => o.categoryId === currentCategoryId);
        return {
          ...p,
          orderInCategory: orderEntry?.order ?? 0,
          attachedAt: orderEntry?.attachedAt ?? p.createdAt, // Fallback to product createdAt
        };
      });

    // Calculate chronological rank based on attachedAt (when product was attached to this category)
    // 1 = oldest/first added to this category
    const sortedByAttachedAt = [...productsInCategory].sort(
      (a, b) => new Date(a.attachedAt).getTime() - new Date(b.attachedAt).getTime()
    );
    const attachedAtRankMap = new Map<string, number>();
    sortedByAttachedAt.forEach((p, index) => {
      attachedAtRankMap.set(p.id, index + 1);
    });

    // Return products sorted by their display order, with addedOrderRank attached
    return productsInCategory
      .map((p) => ({
        ...p,
        addedOrderRank: attachedAtRankMap.get(p.id) ?? 0,
      }))
      .sort((a, b) => a.orderInCategory - b.orderInCategory);
  }, [products, currentCategoryId]);

  // Separate pinned row from table rows
  const { pinnedRow: pinnedProduct, rowsForTable: productsForTable } = usePinnedRow({
    rows: categoryProducts,
    pinnedId: pinnedProductId,
    isSortingActive: sorting.length > 0,
    // Uses default sort by orderInCategory (already sorted in categoryProducts)
    defaultSort: null, // Disable additional sorting - categoryProducts is pre-sorted
  });

  // Build registry for this flat view
  const registry = useMemo(() => buildFlatRegistry(categoryProducts, "product"), [categoryProducts]);

  // Helper: Get category names for a product (excluding current category)
  const getProductCategories = useCallback(
    (product: MenuProduct): string => {
      const productCategoryIds = product.categoryIds.filter((id) => id !== currentCategoryId);
      if (productCategoryIds.length === 0) return "—";

      const categoryNames = productCategoryIds
        .map((catId) => categories.find((c) => c.id === catId)?.name)
        .filter(Boolean) as string[];

      if (categoryNames.length === 0) return "—";
      if (categoryNames.length === 1) return categoryNames[0];
      return categoryNames.join(", ");
    },
    [categories, currentCategoryId]
  );

  // Column definitions - name and addedOrder are sortable
  const columns = useMemo<ColumnDef<CategoryProduct>[]>(
    () => [
      { id: "select", accessorFn: () => null, enableSorting: false },
      { id: "name", accessorFn: (row) => row.name, sortingFn: "alphanumeric" },
      { id: "addedOrder", accessorFn: (row) => row.addedOrderRank, sortingFn: "basic" },
      { id: "visibility", accessorFn: (row) => (row.isDisabled ? 0 : 1), enableSorting: false },
      { id: "categories", accessorFn: (row) => getProductCategories(row), enableSorting: false },
      { id: "dragHandle", accessorFn: () => null, enableSorting: false },
    ],
    [getProductCategories]
  );

  // Initialize table - BEFORE selection model so we can get sorted row order
  const table = useReactTable({
    data: productsForTable,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    getRowId: (row) => row.id,
  });

  // IMPORTANT: selectableKeys must match the VISUAL row order (after sorting)
  // so that shift+click range selection selects the correct rows
  const selectableKeys = useMemo(() => {
    const sortedRows = table.getRowModel().rows;
    // Include pinned row at the top if present
    const keys: string[] = [];
    if (pinnedProduct) {
      keys.push(createKey("product", pinnedProduct.id));
    }
    for (const row of sortedRows) {
      keys.push(createKey("product", row.original.id));
    }
    return keys;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, pinnedProduct, sorting]);

  // Selection model for remove action
  const {
    selectionState,
    onSelectAll,
    onToggle,
    isSelected,
    getCheckboxState,
    actionableRoots,
    selectedKind,
    isSameKind,
    anchorKey,
    rangeSelect,
  } = useContextSelectionModel(builder, { selectableKeys });

  // Derive DnD eligibility from selection state (action-bar pattern)
  const eligibility = useDnDEligibility({
    actionableRoots,
    selectedKind,
    isSameKind,
    registry,
  });

  // Unified click handler with range selection (no navigation for products)
  const { handleClick } = useRowClickHandler(registry, {
    onToggle,
    rangeSelect,
    anchorKey,
  });

  // Push undo action for reorder
  const pushReorderUndo = useCallback(
    (previousIds: string[], newIds: string[]) => {
      if (!currentCategoryId) return;
      const categoryId = currentCategoryId;

      builder.pushUndoAction({
        action: "reorder:products-in-category",
        timestamp: new Date(),
        data: {
          undo: async () => {
            await reorderProductsInCategory(categoryId, previousIds);
          },
          redo: async () => {
            await reorderProductsInCategory(categoryId, newIds);
          },
        },
      });
    },
    [currentCategoryId, builder, reorderProductsInCategory]
  );

  // Drag & Drop handlers with multi-select support - reset sorting when manual reorder occurs
  const { getDragHandlers: getBaseDragHandlers, getDragClasses, getIsDraggable, eligibleEntityIds } = useSingleEntityDnd({
    items: categoryProducts,
    onReorder: async (ids) => {
      if (currentCategoryId) {
        // Capture old order before mutation (categoryProducts still has old order)
        const previousIds = categoryProducts.map((p) => p.id);
        await reorderProductsInCategory(currentCategoryId, ids);
        pushReorderUndo(previousIds, ids);
      }
    },
    onReorderComplete: () => {
      // Clear column sorting after manual DnD reorder
      setSorting([]);
    },
    eligibility,
  });

  // Multi-drag ghost for count badge (unique ID for this view)
  const GHOST_ID = "category-view-drag-ghost";
  const { setGhostImage } = useGroupedEntitiesGhost(GHOST_ID);

  // Pre-compute first selected product for ghost content using actionableRoots
  // (must exist BEFORE drag starts for synchronous setDragImage call)
  const firstSelectedProduct = useMemo(() => {
    if (actionableRoots.length <= 1) return null;
    // Extract entity IDs from actionable root keys (format: "product:id")
    const actionableEntityIds = new Set(
      actionableRoots.map((key) => key.split(":")[1])
    );
    // Find first product matching an actionable entity
    for (const product of categoryProducts) {
      if (actionableEntityIds.has(product.id)) {
        return product;
      }
    }
    return null;
  }, [actionableRoots, categoryProducts]);

  // Wrap drag handlers to set ghost image for multi-select
  const getDragHandlers = useCallback(
    (itemId: string) => {
      const baseHandlers = getBaseDragHandlers(itemId);
      const productKey = createKey("product", itemId);
      // Use actionableRoots for multi-drag check (consistent with selection model)
      const isInActionableRoots = actionableRoots.includes(productKey);
      const isMultiSelect = isInActionableRoots && actionableRoots.length > 1;

      return {
        ...baseHandlers,
        onDragStart: (e: React.DragEvent) => {
          baseHandlers.onDragStart(e);
          if (isMultiSelect) {
            setGhostImage(e);
          }
        },
      };
    },
    [getBaseDragHandlers, actionableRoots, setGhostImage]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu data (targets for submenus)
  // ─────────────────────────────────────────────────────────────────────────────

  // Category targets for manage-categories submenu (all visible categories)
  const categoryTargets = useMemo(
    () =>
      categories
        .filter((c) => c.isVisible)
        .map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  // Move-to targets (other categories, excluding current)
  const moveToTargets = useMemo(
    () =>
      categories
        .filter((c) => c.id !== currentCategoryId)
        .map((c) => ({ id: c.id, name: c.name })),
    [categories, currentCategoryId]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu handlers (using shared hooks)
  // ─────────────────────────────────────────────────────────────────────────────

  // Bulk action support for context menu operations
  const { getTargetIds } = useBulkAction({
    isSelected,
    actionableRoots,
    isSameKind,
    entityKind: "product",
  });

  // Move up/down handlers for context menu reordering
  const { handleMoveUp, handleMoveDown } = useMoveHandlers({
    items: categoryProducts,
    reorder: async (ids: string[]) => {
      if (currentCategoryId) {
        await reorderProductsInCategory(currentCategoryId, ids);
      }
    },
    onReorderComplete: () => setSorting([]),
  });

  // Note: Products use isDisabled for visibility (inverse of category/label isVisible)
  // Visibility is controlled at the product level, not per-category - show info toast
  const handleContextVisibility = useCallback(
    async (_productId: string, _visible: boolean) => {
      toast({ title: "Product visibility is managed in product settings" });
    },
    [toast]
  );

  // Remove from category handler (with bulk support)
  const { handleRemove: handleContextRemove } = useContextRemove({
    parentId: currentCategoryId,
    detachEntity: (parentId, productId) => detachProductFromCategory(productId, parentId),
    getTargetIds,
    entityLabel: { singular: "Product", plural: "products" },
  });

  // Move to another category handler
  const { handleMoveTo } = useContextMoveTo({
    sourceParentId: currentCategoryId,
    detach: (parentId, productId) => detachProductFromCategory(productId, parentId),
    attach: attachProductToCategory,
    getEntityName: (id) => products.find((p) => p.id === id)?.name,
    getTargetName: (id) => categories.find((c) => c.id === id)?.name,
    entityLabel: "Product",
  });

  // Category toggle for manage-categories submenu
  const { handleToggle: handleCategoryToggle } = useRelationshipToggle({
    attach: attachProductToCategory,
    detach: detachProductFromCategory,
    relationshipLabel: "category",
  });

  // Persist sort order to database when column sorting is applied
  usePersistColumnSort({
    sorting,
    contextId: currentCategoryId,
    table,
    onPersist: reorderProductsInCategory,
  });

  const allSelected = selectionState.allSelected;
  const someSelected = selectionState.someSelected;

  // Extra context for config-driven rendering
  const extra: CategoryViewExtra = useMemo(
    () => ({
      currentCategoryId,
      moveToTargets,
      categoryTargets,
      getProductCategories,
      canDrag: eligibility.canDrag,
      eligibleEntityIds,
      getCheckboxState,
    }),
    [
      currentCategoryId,
      moveToTargets,
      categoryTargets,
      getProductCategories,
      eligibility.canDrag,
      eligibleEntityIds,
      getCheckboxState,
    ]
  );

  // Context menu handlers for config
  const contextMenuHandlers = useMemo(
    () => ({
      clone: async () => {}, // No clone for products in this view
      delete: () => {}, // No delete for products in this view
      visibility: handleContextVisibility,
      remove: handleContextRemove,
      moveUp: handleMoveUp,
      moveDown: handleMoveDown,
      moveTo: handleMoveTo,
      categoryToggle: handleCategoryToggle,
    }),
    [
      handleContextVisibility,
      handleContextRemove,
      handleMoveUp,
      handleMoveDown,
      handleMoveTo,
      handleCategoryToggle,
    ]
  );

  // Selection info for context menu
  const selectionInfo = useMemo(
    () => ({
      actionableRoots,
      isSameKind,
    }),
    [actionableRoots, isSameKind]
  );

  // Config-driven row builder
  const configuredRowOptions: UseConfiguredRowOptions<CategoryProduct> = useMemo(
    () => ({
      config: categoryViewConfig,
      contextMenuHandlers,
      selectionInfo,
      extra,
      onContextMenuOpenChange: handleContextOpenChange,
      onMouseEnter: setHoveredRowId,
      onMouseLeave: () => setHoveredRowId(null),
      onRowClick: handleClick,
      onRowDoubleClick: () => {}, // No navigation for products
    }),
    [
      contextMenuHandlers,
      selectionInfo,
      extra,
      handleContextOpenChange,
      handleClick,
    ]
  );

  const { buildRow } = useConfiguredRow(configuredRowOptions);

  // Empty state
  if (!currentCategoryId) {
    return (
      <EmptyState
        icon={categoryViewConfig.emptyStates[0].icon}
        title={categoryViewConfig.emptyStates[0].title}
        description={categoryViewConfig.emptyStates[0].description}
      />
    );
  }

  if (categoryProducts.length === 0) {
    return (
      <EmptyState
        icon={categoryViewConfig.emptyStates[1].icon}
        title={categoryViewConfig.emptyStates[1].title}
        description={categoryViewConfig.emptyStates[1].description}
      />
    );
  }

  // Build row state and handlers for each row
  const buildRowState = (product: CategoryProduct, options?: { isPinned?: boolean }) => ({
    isSelected: isSelected(createKey("product", product.id)),
    checkboxState: getCheckboxState(createKey("product", product.id)),
    anchorKey,
    isRowHovered: hoveredRowId === product.id,
    isContextRow: isContextRow(product.id),
    isEditing: false, // No inline editing in CategoryTableView
    isPinned: options?.isPinned || pinnedProductId === product.id,
  });

  const buildRowHandlers = (product: CategoryProduct) => ({
    onToggle: () => onToggle(createKey("product", product.id)),
    onRangeSelect:
      anchorKey && anchorKey !== createKey("product", product.id)
        ? () => rangeSelect(createKey("product", product.id))
        : undefined,
    onStartEdit: () => {}, // No inline editing
    onCancelEdit: () => {},
    onSave: async () => {},
  });

  // Render a product row with DnD support
  const renderProductRow = (
    product: CategoryProduct,
    index: number,
    total: number,
    options?: { isPinned?: boolean }
  ) => {
    const rowData = buildRow(
      product,
      index,
      total,
      buildRowState(product, options),
      buildRowHandlers(product)
    );

    // Get DnD classes and handlers
    const dragClasses = getDragClasses(product.id);
    const dragHandlers = getDragHandlers(product.id);
    const isDraggable = getIsDraggable(product.id);

    return (
      <ConfiguredTableRow
        key={rowData.key}
        data={{
          ...rowData,
          tableRowProps: {
            ...rowData.tableRowProps,
            isDragging: dragClasses.isDragging || dragClasses.isInDragSet,
            isDragOver: dragClasses.isDragOver,
            isLastRow: index === total - 1,
            isDraggable,
            draggable: true,
            onDragStart: dragHandlers.onDragStart,
            onDragOver: dragHandlers.onDragOver,
            onDragLeave: dragHandlers.onDragLeave,
            onDrop: dragHandlers.onDrop,
            onDragEnd: dragHandlers.onDragEnd,
            className: cn(
              rowData.tableRowProps.className,
              dragClasses.isDragOver &&
                (dragClasses.dropPosition === "after"
                  ? "!border-b-2 !border-b-primary"
                  : "!border-t-2 !border-t-primary")
            ),
          },
        }}
      />
    );
  };

  const rows = table.getRowModel().rows;
  const totalRows = (pinnedProduct ? 1 : 0) + rows.length;

  return (
    <>
      <TableViewWrapper className="min-w-[860px]">
        <TableHeader
          columns={CATEGORY_VIEW_HEADER_COLUMNS}
          preset={categoryViewWidthPreset}
          table={table}
          hasSelectAll
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
        />

        <TableBody>
          {pinnedProduct
            ? renderProductRow(pinnedProduct, 0, totalRows, { isPinned: true })
            : null}
          {rows.map((row, index) =>
            renderProductRow(
              row.original,
              pinnedProduct ? index + 1 : index,
              totalRows
            )
          )}
        </TableBody>
      </TableViewWrapper>

      {/* Multi-drag ghost with count badge - pre-rendered based on selection */}
      {actionableRoots.length > 1 && firstSelectedProduct && (
        <GroupedEntitiesGhost
          key={`ghost-${actionableRoots.length}-${firstSelectedProduct.id}`}
          ghostId={GHOST_ID}
          count={actionableRoots.length}
        >
          <GhostRowContent name={firstSelectedProduct.name} />
        </GroupedEntitiesGhost>
      )}
    </>
  );
}

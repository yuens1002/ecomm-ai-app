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
import { Eye, EyeOff, Package } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
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
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { TouchTarget } from "./shared/cells/TouchTarget";
import { RowContextMenu } from "./shared/cells/RowContextMenu";
import { categoryViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import { DragHandleCell } from "./shared/cells/DragHandleCell";

/** Product with order within current category and chronological added order */
type CategoryProduct = MenuProduct & {
  orderInCategory: number;
  addedOrderRank: number; // Chronological rank based on createdAt (1 = first added)
};

const CATEGORY_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "select", label: "", isCheckbox: true },
  { id: "name", label: "Products" },
  { id: "addedOrder", label: "Added Order" },
  { id: "visibility", label: "Visibility" },
  { id: "categories", label: "Added to Categories" },
  { id: "dragHandle", label: "" },
];

export function CategoryTableView() {
  const {
    builder,
    products,
    categories,
    reorderProductsInCategory,
    detachProductFromCategory,
    attachProductToCategory,
    moveProductToCategory,
  } = useMenuBuilder();

  const currentCategoryId = builder.currentCategoryId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Context menu highlight state
  const [contextRowId, setContextRowId] = useState<string | null>(null);

  const { toast } = useToast();

  // Pinning support for newly added products
  const { pinnedId: pinnedProductId, clearPinnedIfMatches: _clearPinnedIfMatches } = useContextRowUiState(
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
  // Moved up to be used by columns definition
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
  // eslint-disable-next-line react-hooks/incompatible-library
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
  // Context menu handlers
  // ─────────────────────────────────────────────────────────────────────────────

  // Note: Products use isDisabled for visibility (inverse of category/label isVisible)
  const handleContextVisibility = useCallback(
    async (_productId: string, _visible: boolean) => {
      // Products don't have a direct visibility toggle in this context
      // Visibility is controlled at the product level, not per-category
      // For now, this is a no-op; could link to product settings in future
      toast({ title: "Product visibility is managed in product settings" });
    },
    [toast]
  );

  const handleContextRemove = useCallback(
    async (productId: string) => {
      if (!currentCategoryId) return;
      const result = await detachProductFromCategory(productId, currentCategoryId);
      if (result.ok) {
        toast({ title: "Product removed from category" });
      } else {
        toast({ title: "Error", description: "Could not remove product", variant: "destructive" });
      }
    },
    [currentCategoryId, detachProductFromCategory, toast]
  );

  const handleMoveUp = useCallback(
    async (productId: string) => {
      const index = categoryProducts.findIndex((p) => p.id === productId);
      if (index <= 0 || !currentCategoryId) return;
      const newOrder = categoryProducts.map((p) => p.id);
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      await reorderProductsInCategory(currentCategoryId, newOrder);
      setSorting([]); // Clear sorting when manually reordering
    },
    [categoryProducts, currentCategoryId, reorderProductsInCategory]
  );

  const handleMoveDown = useCallback(
    async (productId: string) => {
      const index = categoryProducts.findIndex((p) => p.id === productId);
      if (index < 0 || index >= categoryProducts.length - 1 || !currentCategoryId) return;
      const newOrder = categoryProducts.map((p) => p.id);
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      await reorderProductsInCategory(currentCategoryId, newOrder);
      setSorting([]); // Clear sorting when manually reordering
    },
    [categoryProducts, currentCategoryId, reorderProductsInCategory]
  );

  const handleMoveTo = useCallback(
    async (productId: string, toCategoryId: string) => {
      if (!currentCategoryId) return;
      const product = products.find((p) => p.id === productId);
      const toCategory = categories.find((c) => c.id === toCategoryId);

      const result = await moveProductToCategory({
        productId,
        fromCategoryId: currentCategoryId,
        toCategoryId,
      });

      if (result.ok) {
        toast({
          title: "Product moved",
          description: `Moved "${product?.name ?? "Product"}" to "${toCategory?.name ?? "Category"}"`,
        });
      } else {
        toast({ title: "Move failed", description: "Could not move product", variant: "destructive" });
      }
    },
    [currentCategoryId, products, categories, moveProductToCategory, toast]
  );

  // Handler for toggling product attachment to a category (via context menu)
  const handleCategoryToggle = useCallback(
    async (productId: string, categoryId: string, shouldAttach: boolean) => {
      if (shouldAttach) {
        const result = await attachProductToCategory(productId, categoryId);
        if (!result.ok) {
          toast({
            title: "Error",
            description: "Could not add to category",
            variant: "destructive",
          });
        }
      } else {
        const result = await detachProductFromCategory(productId, categoryId);
        if (!result.ok) {
          toast({
            title: "Error",
            description: "Could not remove from category",
            variant: "destructive",
          });
        }
      }
    },
    [attachProductToCategory, detachProductFromCategory, toast]
  );

  // Get move targets (other categories, excluding current)
  const moveToTargets = useMemo(
    () =>
      categories
        .filter((c) => c.id !== currentCategoryId)
        .map((c) => ({ id: c.id, name: c.name })),
    [categories, currentCategoryId]
  );

  // Category targets for manage-categories context menu (all visible categories)
  const categoryTargets = useMemo(
    () =>
      categories
        .filter((c) => c.isVisible)
        .map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  // Persist sort order to database when column sorting is applied
  usePersistColumnSort({
    sorting,
    contextId: currentCategoryId,
    table,
    onPersist: reorderProductsInCategory,
  });

  const allSelected = selectionState.allSelected;
  const someSelected = selectionState.someSelected;

  // Empty state
  if (!currentCategoryId) {
    return (
      <EmptyState
        icon={Package}
        title="No Category Selected"
        description="Select a category to view its products"
      />
    );
  }

  if (categoryProducts.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No Products"
        description="Add products to this category using the action bar"
      />
    );
  }

  const renderProductRow = (product: CategoryProduct, options?: { isPinned?: boolean; isFirstRow?: boolean; isLastRow?: boolean }) => {
    const _isPinned = options?.isPinned === true;
    const isFirstRow = options?.isFirstRow === true;
    const isLastRow = options?.isLastRow === true;
    const productKey = createKey("product", product.id);
    const isProductSelected = isSelected(productKey);
    const isRowHovered = hoveredRowId === product.id;
    const isContextRow = contextRowId === product.id;
    const dragClasses = getDragClasses(product.id);
    const dragHandlers = getDragHandlers(product.id);

    // Get cursor styling state for this row
    const isDraggable = getIsDraggable(product.id);

    return (
      <RowContextMenu
        key={product.id}
        entityKind="product"
        viewType="category"
        entityId={product.id}
        isVisible={!product.isDisabled}
        isFirst={isFirstRow}
        isLast={isLastRow}
        selectedCount={actionableRoots.length}
        isInSelection={isProductSelected}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        moveToTargets={moveToTargets}
        currentParentId={currentCategoryId ?? undefined}
        categoryTargets={categoryTargets}
        attachedCategoryIds={product.categoryIds}
        onOpenChange={(open) => setContextRowId(open ? product.id : null)}
        onVisibilityToggle={(visible) => handleContextVisibility(product.id, visible)}
        onRemove={() => handleContextRemove(product.id)}
        onMoveUp={() => handleMoveUp(product.id)}
        onMoveDown={() => handleMoveDown(product.id)}
        onMoveTo={(toCategoryId) => handleMoveTo(product.id, toCategoryId)}
        onCategoryToggle={(categoryId, shouldAttach) => handleCategoryToggle(product.id, categoryId, shouldAttach)}
      >
      <TableRow
        data-state={isProductSelected ? "selected" : undefined}
        isSelected={isProductSelected}
        isContextRow={isContextRow}
        isHidden={product.isDisabled}
        isDragging={dragClasses.isDragging || dragClasses.isInDragSet}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        isDraggable={isDraggable}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(product.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary")
        )}
        onRowClick={(options) => handleClick(productKey, options)}
      >
        {/* Checkbox */}
        <TableCell config={categoryViewWidthPreset.select} data-row-click-ignore>
          <TouchTarget>
            <CheckboxCell
              id={product.id}
              checked={isProductSelected}
              onToggle={() => onToggle(productKey)}
              isSelectable
              alwaysVisible={isProductSelected}
              ariaLabel={`Select ${product.name}`}
              anchorKey={anchorKey}
              onRangeSelect={anchorKey && anchorKey !== productKey ? () => rangeSelect(productKey) : undefined}
            />
          </TouchTarget>
        </TableCell>

        {/* Product Name */}
        <TableCell config={categoryViewWidthPreset.name}>
          <span className="truncate font-medium">{product.name}</span>
        </TableCell>

        {/* Added Order (chronological rank based on createdAt) */}
        <TableCell config={categoryViewWidthPreset.addedOrder}>
          <span className="text-sm">{product.addedOrderRank}</span>
        </TableCell>

        {/* Visibility (read-only icon) */}
        <TableCell config={categoryViewWidthPreset.visibility}>
          {product.isDisabled ? (
            <EyeOff className="text-muted-foreground inline" />
          ) : (
            <Eye className="h-4 w-4 text-foreground inline" />
          )}
        </TableCell>

        {/* Categories */}
        <TableCell config={categoryViewWidthPreset.categories} className="text-sm">
          {getProductCategories(product)}
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={categoryViewWidthPreset.dragHandle} data-row-click-ignore>
          <DragHandleCell
            isEligible={eligibility.canDrag}
            isRowInEligibleSet={eligibleEntityIds.has(product.id)}
            checkboxState={getCheckboxState(productKey)}
            isRowHovered={isRowHovered}
          />
        </TableCell>
      </TableRow>
      </RowContextMenu>
    );
  };

  const rows = table.getRowModel().rows;

  return (
    <>
      <TableViewWrapper>
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
          {pinnedProduct ? renderProductRow(pinnedProduct, { isPinned: true, isFirstRow: true }) : null}
          {rows.map((row, index) =>
            renderProductRow(row.original, {
              isFirstRow: !pinnedProduct && index === 0,
              isLastRow: index === rows.length - 1,
            })
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

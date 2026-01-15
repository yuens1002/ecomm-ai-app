"use client";
"use no memo";

import { TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Eye, EyeOff, GripVertical, Package } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { useDragReorder } from "../../../hooks/useDragReorder";
import type { MenuProduct } from "../../../types/menu";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { EmptyState } from "../shared/EmptyState";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { categoryViewWidthPreset } from "./shared/table/columnWidthPresets";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";

/** Product with order within current category and chronological added order */
type CategoryProduct = MenuProduct & {
  orderInCategory: number;
  addedOrderRank: number; // Chronological rank based on createdAt (1 = first added)
};

const CATEGORY_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  {
    id: "select",
    label: "",
    isCheckbox: true,
    width: categoryViewWidthPreset.select?.head,
  },
  {
    id: "name",
    label: "Products",
    align: "left",
    width: categoryViewWidthPreset.name?.head,
  },
  {
    id: "addedOrder",
    label: "Added Order",
    align: "center",
    width: categoryViewWidthPreset.addedOrder?.head,
  },
  {
    id: "visibility",
    label: "Visibility",
    align: "center",
    width: categoryViewWidthPreset.visibility?.head,
  },
  {
    id: "categories",
    label: "Added to Categories",
    align: "left",
    width: categoryViewWidthPreset.categories?.head,
  },
  {
    id: "dragHandle",
    label: "",
    align: "center",
    width: categoryViewWidthPreset.dragHandle?.head,
  },
];

export function CategoryTableView() {
  const { builder, products, categories, reorderProductsInCategory } = useMenuBuilder();

  const currentCategoryId = builder.currentCategoryId;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

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

  // Selection model for remove action
  const selectableProductIds = useMemo(() => categoryProducts.map((p) => p.id), [categoryProducts]);
  const {
    isSelectionActive: isProductSelectionActive,
    selectionState,
    onSelectAll,
    onToggleId: onToggleProductId,
    isSelected: isProductSelected,
  } = useContextSelectionModel(builder, {
    kind: "product",
    selectableIds: selectableProductIds,
  });

  // Drag & Drop handlers - reset sorting when manual reorder occurs
  const { getDragHandlers, getDragClasses } = useDragReorder({
    items: categoryProducts,
    onReorder: async (ids) => {
      if (currentCategoryId) {
        await reorderProductsInCategory(currentCategoryId, ids);
      }
    },
    onReorderComplete: () => {
      // Clear column sorting after manual DnD reorder
      setSorting([]);
    },
  });

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

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categoryProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    getRowId: (row) => row.id,
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

  const renderProductRow = (product: CategoryProduct, options?: { isLastRow?: boolean }) => {
    const isLastRow = options?.isLastRow === true;
    const isSelected = isProductSelected(product.id);
    const isRowHovered = hoveredRowId === product.id;
    const dragClasses = getDragClasses(product.id);
    const dragHandlers = getDragHandlers(product.id);

    return (
      <TableRow
        key={product.id}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected}
        isDragging={dragClasses.isDragging}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
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
        onRowClick={() => onToggleProductId(product.id)}
      >
        {/* Checkbox */}
        <TableCell className={categoryViewWidthPreset.select?.cell} data-row-click-ignore>
          <CheckboxCell
            id={product.id}
            checked={isSelected}
            onToggle={onToggleProductId}
            isSelectable={isProductSelectionActive}
            disabled={!isProductSelectionActive}
            alwaysVisible={isSelected}
            ariaLabel={`Select ${product.name}`}
          />
        </TableCell>

        {/* Product Name */}
        <TableCell className={categoryViewWidthPreset.name?.cell}>
          <span className="truncate font-medium">{product.name}</span>
        </TableCell>

        {/* Added Order (chronological rank based on createdAt) */}
        <TableCell className={categoryViewWidthPreset.addedOrder?.cell}>
          <span className="text-muted-foreground text-sm">{product.addedOrderRank}</span>
        </TableCell>

        {/* Visibility (read-only icon) */}
        <TableCell align="center" className={categoryViewWidthPreset.visibility?.cell}>
          <div className="flex justify-center">
            {product.isDisabled ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-foreground" />
            )}
          </div>
        </TableCell>

        {/* Categories */}
        <TableCell className={"text-sm " + (categoryViewWidthPreset.categories?.cell ?? "")}>
          {getProductCategories(product)}
        </TableCell>

        {/* Drag Handle */}
        <TableCell className={categoryViewWidthPreset.dragHandle?.cell} data-row-click-ignore>
          <div
            className={cn(
              "flex items-center justify-center cursor-grab active:cursor-grabbing",
              // xs-sm: always visible
              "opacity-100",
              // md+: show on hover only
              isRowHovered ? "md:opacity-100" : "md:opacity-0"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const rows = table.getRowModel().rows;

  return (
    <>
      <TableHeader
        columns={CATEGORY_VIEW_HEADER_COLUMNS}
        table={table}
        hasSelectAll
        allSelected={allSelected}
        someSelected={someSelected}
        selectAllDisabled={!isProductSelectionActive}
        onSelectAll={onSelectAll}
      />

      <TableBody>
        {rows.map((row, index) =>
          renderProductRow(row.original, { isLastRow: index === rows.length - 1 })
        )}
      </TableBody>
    </>
  );
}

"use client";

import type { DataTableColumnMeta } from "@/app/admin/_components/data-table";
import { RowActionMenu, type RowActionItem } from "@/app/admin/_components/data-table/RowActionMenu";
import {
  useColumnVisibility,
  useDataTable,
} from "@/app/admin/_components/data-table/hooks";
import type { ActiveFilter, FilterConfig } from "@/app/admin/_components/data-table/types";
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Settings, Trash } from "lucide-react";
import { useCallback, useMemo } from "react";

import { VariantCell } from "../_components/VariantCell";

interface PurchaseOption {
  id: string;
  type: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
  salePriceInCents?: number | null;
  billingInterval?: string | null;
  billingIntervalCount?: number | null;
}

interface Variant {
  id: string;
  name: string;
  stock: number;
  options: PurchaseOption[];
}

interface CategoryDetailed {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  isDisabled?: boolean;
  stock: number;
  price: number;
  categories: string;
  categoriesDetailed: CategoryDetailed[];
  variants: Variant[];
  addOns: string[];
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

const multiFieldFilter: FilterFn<Product> = (row, _columnId, filterValue) => {
  if (!filterValue) return true;
  const query = String(filterValue).toLowerCase();
  const product = row.original;
  const searchable = [
    product.name,
    product.categories,
    ...product.addOns,
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
};

const COLUMN_VISIBILITY_KEY = "products-table-column-visibility";

// Columns that are always hidden (used for filtering only)
const ALWAYS_HIDDEN = { price: false, stock: false };

// Togglable columns shown in the Show/Hide sub-menu
const TOGGLABLE_COLUMNS = [
  { id: "categories", label: "Categories" },
  { id: "addOns", label: "Add-ons" },
  { id: "variants", label: "Variants" },
];

function productFilterToColumnFilters(filter: ActiveFilter): ColumnFiltersState {
  if (filter.configId === "price" && typeof filter.value === "number") {
    return [
      {
        id: "price",
        value: { operator: filter.operator ?? ">", num: filter.value },
      },
    ];
  }
  if (filter.configId === "stock" && typeof filter.value === "number") {
    return [
      {
        id: "stock",
        value: { operator: filter.operator ?? ">", num: filter.value },
      },
    ];
  }
  if (filter.configId === "categories" && Array.isArray(filter.value)) {
    return filter.value.length > 0
      ? [{ id: "categories", value: filter.value }]
      : [];
  }
  return [];
}

interface UseProductsTableOptions {
  products: Product[];
  onStockUpdate: (variantId: string, stock: number) => Promise<void>;
  onPriceUpdate: (optionId: string, cents: number, field?: "priceInCents" | "salePriceInCents") => Promise<void>;
  onEditVariants: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function useProductsTable({
  products,
  onStockUpdate,
  onPriceUpdate,
  onEditVariants,
  onDeleteProduct,
}: UseProductsTableOptions) {
  const { columnVisibility, handleVisibilityChange } = useColumnVisibility(
    COLUMN_VISIBILITY_KEY,
    ALWAYS_HIDDEN
  );

  // Extract unique categories for filter options
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      p.categoriesDetailed?.forEach((c) => {
        map.set(c.id, c.name);
      });
    });
    const opts = Array.from(map.entries()).map(([id, name]) => ({
      label: name,
      value: id,
    }));
    opts.sort((a, b) => a.label.localeCompare(b.label));
    opts.push({ label: "Uncategorized", value: "__uncategorized__" });
    return opts;
  }, [products]);

  // Column definitions with meta
  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      // Desktop columns
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        size: 220,
        enableSorting: true,
        enableResizing: true,
        meta: { pin: "left", cellClassName: "font-medium" } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.name}</span>
            {row.original.isDisabled ? (
              <span className="text-xs rounded bg-destructive/10 text-destructive px-2 py-0.5">
                Disabled
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "categories",
        accessorKey: "categories",
        header: "Categories",
        size: 160,
        enableSorting: false,
        enableResizing: true,
        meta: { responsive: "desktop" } satisfies DataTableColumnMeta,
        cell: ({ row }) => row.original.categories || "-",
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          const cats = row.original.categoriesDetailed || [];
          const catIds = cats.map((c) => c.id);
          const hasUncategorized = filterValue.includes("__uncategorized__");
          const otherIds = filterValue.filter((v) => v !== "__uncategorized__");

          if (hasUncategorized && cats.length === 0) return true;
          if (otherIds.length > 0 && otherIds.some((id) => catIds.includes(id)))
            return true;
          return false;
        },
      },
      {
        id: "addOns",
        accessorKey: "addOns",
        header: "Add-ons",
        size: 160,
        enableSorting: false,
        enableResizing: true,
        meta: { responsive: "desktop" } satisfies DataTableColumnMeta,
        cell: ({ row }) => {
          const addOns = row.original.addOns;
          return addOns && addOns.length > 0 ? addOns.join(", ") : "-";
        },
      },
      {
        id: "variants",
        header: "Variants",
        enableSorting: false,
        enableResizing: true,
        meta: { responsive: "desktop" } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <VariantCell
            variants={row.original.variants}
            onStockUpdate={onStockUpdate}
            onPriceUpdate={onPriceUpdate}
          />
        ),
      },
      // Hidden columns for column filters (price/stock)
      {
        id: "price",
        accessorKey: "price",
        header: "Price",
        enableHiding: true,
        filterFn: (row, _columnId, filterValue: { operator: string; num: number }) => {
          if (!filterValue || typeof filterValue.num !== "number") return true;
          const price = row.original.price;
          switch (filterValue.operator) {
            case ">": return price > filterValue.num;
            case "<": return price < filterValue.num;
            case "\u2265": return price >= filterValue.num;
            case "\u2264": return price <= filterValue.num;
            default: return true;
          }
        },
      },
      {
        id: "stock",
        accessorKey: "stock",
        header: "Stock",
        enableHiding: true,
        filterFn: (row, _columnId, filterValue: { operator: string; num: number }) => {
          if (!filterValue || typeof filterValue.num !== "number") return true;
          const stock = row.original.stock;
          switch (filterValue.operator) {
            case ">": return stock > filterValue.num;
            case "<": return stock < filterValue.num;
            case "\u2265": return stock >= filterValue.num;
            case "\u2264": return stock <= filterValue.num;
            default: return true;
          }
        },
      },
      // Mobile columns
      {
        id: "priceRange",
        header: "Price",
        size: 100,
        enableSorting: false,
        enableResizing: false,
        meta: { responsive: "mobile" } satisfies DataTableColumnMeta,
        cell: ({ row }) => {
          const allPrices = row.original.variants.flatMap((v) =>
            v.options
              .filter((o) => o.type === "ONE_TIME")
              .map((o) => o.salePriceInCents ?? o.priceInCents)
          );
          if (allPrices.length === 0) return "-";
          const min = Math.min(...allPrices);
          const max = Math.max(...allPrices);
          return min === max
            ? formatPrice(min)
            : `${formatPrice(min)} – ${formatPrice(max)}`;
        },
      },
      {
        id: "stockTotal",
        header: "Stock",
        size: 80,
        enableSorting: false,
        enableResizing: false,
        meta: { responsive: "mobile" } satisfies DataTableColumnMeta,
        cell: ({ row }) => row.original.stock,
      },
      {
        id: "mobileActions",
        header: "",
        size: 48,
        enableSorting: false,
        enableResizing: false,
        meta: { responsive: "mobile" } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onEditVariants(row.original)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ),
      },
      // Row action column (desktop only)
      {
        id: "actions",
        header: "",
        size: 48,
        enableSorting: false,
        enableResizing: false,
        meta: { responsive: "desktop", cellClassName: "align-middle text-center" } satisfies DataTableColumnMeta,
        cell: ({ row }) => {
          const product = row.original;
          const items: RowActionItem[] = [
            {
              type: "item",
              label: "Edit Variants",
              icon: Pencil,
              onClick: () => onEditVariants(product),
            },
            {
              type: "sub-menu",
              label: "Show/Hide Columns",
              icon: Settings,
              items: TOGGLABLE_COLUMNS.map((col) => ({
                label: col.label,
                checked: columnVisibility[col.id] !== false,
                onCheckedChange: (checked: boolean) =>
                  handleVisibilityChange(col.id, checked),
              })),
            },
            { type: "separator" },
            {
              type: "item",
              label: "Delete",
              icon: Trash,
              variant: "destructive",
              onClick: () => onDeleteProduct(product),
            },
          ];
          return <RowActionMenu items={items} />;
        },
      },
    ],
    [onStockUpdate, onPriceUpdate, onEditVariants, onDeleteProduct, columnVisibility, handleVisibilityChange]
  );

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      { id: "price", label: "Price", filterType: "comparison" },
      { id: "stock", label: "Stock", filterType: "comparison" },
      {
        id: "categories",
        label: "Categories",
        filterType: "multiSelect",
        options: categoryOptions,
      },
    ],
    [categoryOptions]
  );

  const stableFilterToColumnFilters = useCallback(
    (filter: ActiveFilter) => productFilterToColumnFilters(filter),
    []
  );

  return useDataTable({
    data: products,
    columns,
    filterConfigs,
    columnVisibility,
    globalFilterFn: multiFieldFilter,
    filterToColumnFilters: stableFilterToColumnFilters,
  });
}

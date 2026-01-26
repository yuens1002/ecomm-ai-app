import { useState, useMemo } from "react";
import { DropdownContent } from "./DropdownContent";
import type { MenuProduct } from "../../../types/menu";

type UndoAction = {
  action: string;
  timestamp: Date;
  data: {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
  };
};

type ToastFn = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

type AddProductsDropdownProps = {
  currentCategoryId: string;
  products: MenuProduct[];
  attachProductToCategory: (
    productId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  detachProductFromCategory: (
    productId: string,
    categoryId: string
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  setPinnedNew: (next: { kind: "product"; id: string } | null) => void;
  pushUndoAction: (action: UndoAction) => void;
  toast: ToastFn;
};

/**
 * Filter products by search term (case-insensitive)
 */
function filterProductsBySearch(
  products: MenuProduct[],
  search: string
): MenuProduct[] {
  return products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );
}

/**
 * Section products into Added, Unassigned, and Available groups
 * Each section is sorted alphabetically
 */
function sectionProducts(products: MenuProduct[], currentCategoryId: string) {
  const addedProducts = products
    .filter((p) => p.categoryIds.includes(currentCategoryId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const unassignedProducts = products
    .filter((p) => p.categoryIds.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const availableProducts = products
    .filter(
      (p) =>
        !p.categoryIds.includes(currentCategoryId) && p.categoryIds.length > 0
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return { addedProducts, unassignedProducts, availableProducts };
}

/**
 * Dropdown for adding/removing products from category (category view)
 */
export function AddProductsDropdown({
  currentCategoryId,
  products,
  attachProductToCategory,
  detachProductFromCategory,
  setPinnedNew,
  pushUndoAction,
  toast,
}: AddProductsDropdownProps) {
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(
    () => filterProductsBySearch(products, productSearch),
    [products, productSearch]
  );

  const { addedProducts, unassignedProducts, availableProducts } = useMemo(
    () => sectionProducts(filteredProducts, currentCategoryId),
    [filteredProducts, currentCategoryId]
  );

  if (!products || products.length === 0) return null;

  return (
    <DropdownContent
      searchable
      searchPlaceholder="Search products..."
      searchValue={productSearch}
      onSearchChange={setProductSearch}
      sections={[
        {
          label: "Added",
          items: addedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            checked: true,
          })),
        },
        {
          label: "Unassigned",
          items: unassignedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            checked: false,
          })),
        },
        {
          label: "Available",
          items: availableProducts.map((p) => ({
            id: p.id,
            name: p.name,
            checked: false,
          })),
        },
      ]}
      onItemToggle={async (productId, checked) => {
        const product = products.find((p) => p.id === productId);
        const productName = product?.name ?? "Product";

        try {
          if (checked) {
            const result = await attachProductToCategory(
              productId,
              currentCategoryId
            );
            if (result.ok) {
              // Pin the newly added product to show it at the top
              setPinnedNew({ kind: "product", id: productId });
              // Capture undo action for attach
              pushUndoAction({
                action: "add-product-to-category",
                timestamp: new Date(),
                data: {
                  undo: async () => {
                    await detachProductFromCategory(productId, currentCategoryId);
                  },
                  redo: async () => {
                    await attachProductToCategory(productId, currentCategoryId);
                  },
                },
              });
              toast({ title: "Product added", description: `${productName} added to category` });
            } else {
              toast({
                title: "Failed to add product",
                description: result.error ?? "Please try again",
                variant: "destructive",
              });
            }
          } else {
            const result = await detachProductFromCategory(
              productId,
              currentCategoryId
            );
            if (result.ok) {
              // Capture undo action for detach
              pushUndoAction({
                action: "remove-product-from-category",
                timestamp: new Date(),
                data: {
                  undo: async () => {
                    await attachProductToCategory(productId, currentCategoryId);
                  },
                  redo: async () => {
                    await detachProductFromCategory(productId, currentCategoryId);
                  },
                },
              });
              toast({ title: "Product removed", description: `${productName} removed from category` });
            } else {
              toast({
                title: "Failed to remove product",
                description: result.error ?? "Please try again",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("[Add Products] Error:", error);
          toast({
            title: checked ? "Failed to add product" : "Failed to remove product",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }}
      emptyMessage="No products found"
    />
  );
}

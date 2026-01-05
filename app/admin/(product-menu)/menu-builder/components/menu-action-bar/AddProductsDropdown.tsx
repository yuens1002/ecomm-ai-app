import { useState, useMemo } from "react";
import { DropdownContent } from "./DropdownContent";
import type { MenuProduct } from "../../../types/menu";

type AddProductsDropdownProps = {
  currentCategoryId: string;
  products: MenuProduct[];
  attachProductToCategory: (
    productId: string,
    categoryId: string
  ) => Promise<any>;
  detachProductFromCategory: (
    productId: string,
    categoryId: string
  ) => Promise<any>;
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
        console.log(
          "[Add Products]",
          checked ? "Attaching" : "Detaching",
          "product:",
          productId
        );
        try {
          if (checked) {
            const result = await attachProductToCategory(
              productId,
              currentCategoryId
            );
            console.log("[Add Products] Attach result:", result);
          } else {
            const result = await detachProductFromCategory(
              productId,
              currentCategoryId
            );
            console.log("[Add Products] Detach result:", result);
          }
        } catch (error) {
          console.error("[Add Products] Error:", error);
        }
      }}
      emptyMessage="No products found"
    />
  );
}

import { useMemo } from "react";
import type {
  MenuCategory,
  MenuLabel,
  MenuProduct,
} from "../types/menu";
import type {
  FlatCategoryRow,
  FlatLabelRow,
  FlatMenuRow,
  FlatProductRow,
} from "../menu-builder/components/table-views/MenuTableView.types";

type UseFlattenedMenuRowsOptions = {
  labels: MenuLabel[];
  categories: MenuCategory[];
  products: MenuProduct[];
  expandedIds: Set<string>;
};

/**
 * Transforms the hierarchical menu data into a flat list of rows for rendering.
 * Respects expand/collapse state to show/hide children.
 *
 * Data flow:
 * labels[] + categories[] + products[] + expandedIds
 *   → FlatMenuRow[] (discriminated union: label | category | product)
 *   → Render rows with level-based indentation
 */
export function useFlattenedMenuRows({
  labels,
  categories,
  products,
  expandedIds,
}: UseFlattenedMenuRowsOptions): FlatMenuRow[] {
  return useMemo(() => {
    const rows: FlatMenuRow[] = [];

    // Create a map of category ID → MenuCategory for quick lookup
    const categoryMap = new Map<string, MenuCategory>();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
    }

    // Create a map of category ID → products in that category
    const productsByCategoryId = new Map<string, MenuProduct[]>();
    for (const product of products) {
      for (const categoryId of product.categoryIds) {
        const existing = productsByCategoryId.get(categoryId) ?? [];
        existing.push(product);
        productsByCategoryId.set(categoryId, existing);
      }
    }

    // Sort labels by order
    const sortedLabels = [...labels].sort((a, b) => a.order - b.order);

    for (const label of sortedLabels) {
      // Calculate category count and total product count for this label
      const labelCategoryIds = label.categories.map((c) => c.id);
      const uniqueProductIds = new Set<string>();
      for (const catId of labelCategoryIds) {
        const catProducts = productsByCategoryId.get(catId) ?? [];
        for (const p of catProducts) {
          uniqueProductIds.add(p.id);
        }
      }

      const isLabelExpanded = expandedIds.has(label.id);
      const hasCategories = label.categories.length > 0;

      // Add label row
      const labelRow: FlatLabelRow = {
        id: label.id,
        name: label.name,
        level: "label",
        isVisible: label.isVisible,
        isExpandable: hasCategories,
        isExpanded: isLabelExpanded,
        parentId: null,
        data: label,
        categoryCount: label.categories.length,
        productCount: uniqueProductIds.size,
      };
      rows.push(labelRow);

      // If label is expanded, add its categories
      if (isLabelExpanded && hasCategories) {
        // Sort categories by order within label
        const sortedCategories = [...label.categories].sort(
          (a, b) => a.order - b.order
        );

        for (const catInLabel of sortedCategories) {
          const fullCategory = categoryMap.get(catInLabel.id);
          const categoryProducts = productsByCategoryId.get(catInLabel.id) ?? [];
          // Use composite key for category expand state to handle same category under multiple labels
          const categoryExpandKey = `${label.id}-${catInLabel.id}`;
          const isCategoryExpanded = expandedIds.has(categoryExpandKey);
          const hasProducts = categoryProducts.length > 0;

          // Add category row
          const categoryRow: FlatCategoryRow = {
            id: catInLabel.id,
            name: catInLabel.name,
            level: "category",
            isVisible: fullCategory?.isVisible ?? true,
            isExpandable: hasProducts,
            isExpanded: isCategoryExpanded,
            parentId: label.id,
            orderInLabel: catInLabel.order,
            data: {
              id: catInLabel.id,
              name: catInLabel.name,
              slug: catInLabel.slug,
              order: catInLabel.order,
              attachedAt: catInLabel.attachedAt,
              isVisible: fullCategory?.isVisible ?? true,
            },
            productCount: categoryProducts.length,
          };
          rows.push(categoryRow);

          // If category is expanded, add its products
          if (isCategoryExpanded && hasProducts) {
            // Sort products by their order within this category
            const sortedProducts = [...categoryProducts].sort((a, b) => {
              const orderA =
                a.categoryOrders.find((co) => co.categoryId === catInLabel.id)
                  ?.order ?? 0;
              const orderB =
                b.categoryOrders.find((co) => co.categoryId === catInLabel.id)
                  ?.order ?? 0;
              return orderA - orderB;
            });

            for (const product of sortedProducts) {
              const orderInCategory =
                product.categoryOrders.find(
                  (co) => co.categoryId === catInLabel.id
                )?.order ?? 0;

              // Add product row
              const productRow: FlatProductRow = {
                id: product.id,
                name: product.name,
                level: "product",
                isVisible: !product.isDisabled,
                isExpandable: false,
                isExpanded: false,
                parentId: catInLabel.id,
                grandParentId: label.id,
                orderInCategory,
                data: product,
              };
              rows.push(productRow);
            }
          }
        }
      }
    }

    return rows;
  }, [labels, categories, products, expandedIds]);
}

/**
 * Gets all expandable IDs (labels with categories, categories with products).
 * Used for "Expand All" functionality.
 */
export function getExpandableIds(
  labels: MenuLabel[],
  products: MenuProduct[]
): string[] {
  const expandableIds: string[] = [];

  // Create a map of category ID → has products
  const categoryHasProducts = new Set<string>();
  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      categoryHasProducts.add(categoryId);
    }
  }

  for (const label of labels) {
    // Label is expandable if it has categories
    if (label.categories.length > 0) {
      expandableIds.push(label.id);

      // Category is expandable if it has products
      // Use composite key to handle same category under multiple labels
      for (const cat of label.categories) {
        if (categoryHasProducts.has(cat.id)) {
          expandableIds.push(`${label.id}-${cat.id}`);
        }
      }
    }
  }

  return expandableIds;
}

/**
 * Menu hierarchy for selection model.
 *
 * Uses kind-prefixed keys: "label:id", "category:labelId-catId", "product:labelId-catId-prodId"
 *
 * Provides:
 * - All selectable keys at all levels (labels, categories, products)
 * - Function to get descendant keys for any parent key
 */
export type MenuHierarchy = {
  /** All selectable keys with kind prefixes */
  allKeys: string[];
  /** All label keys */
  labelKeys: string[];
  /** All category keys */
  categoryKeys: string[];
  /** All product keys */
  productKeys: string[];
  /**
   * Get all descendant keys for a parent key.
   *
   * - For label key: returns all category keys + product keys under that label
   * - For category key: returns all product keys under that category
   * - For product key: returns empty array (leaf node)
   */
  getDescendants: (key: string) => string[];
};

/**
 * Builds menu hierarchy maps for selection model.
 *
 * Uses kind-prefixed keys for all entities:
 * - Labels: "label:labelId"
 * - Categories: "category:labelId-categoryId"
 * - Products: "product:labelId-categoryId-productId"
 *
 * @example
 * ```ts
 * const hierarchy = useMemo(
 *   () => buildMenuHierarchy(labels, products),
 *   [labels, products]
 * );
 *
 * const selection = useContextSelectionModel(builder, {
 *   selectableKeys: hierarchy.allKeys,
 *   hierarchy: { getDescendants: hierarchy.getDescendants },
 * });
 * ```
 */
export function buildMenuHierarchy(
  labels: MenuLabel[],
  products: MenuProduct[]
): MenuHierarchy {
  // Build product lookup by categoryId
  const productsByCategoryId = new Map<string, MenuProduct[]>();
  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      const existing = productsByCategoryId.get(categoryId) ?? [];
      existing.push(product);
      productsByCategoryId.set(categoryId, existing);
    }
  }

  // All keys by kind
  const labelKeys: string[] = [];
  const categoryKeys: string[] = [];
  const productKeys: string[] = [];

  // Hierarchy maps (using kind-prefixed keys)
  // Label key → all descendant keys (categories + products)
  const labelToDescendants = new Map<string, string[]>();
  // Category key → all descendant keys (products)
  const categoryToDescendants = new Map<string, string[]>();

  // Set for deduplication
  const productKeySet = new Set<string>();

  for (const label of labels) {
    const labelKey = `label:${label.id}`;
    labelKeys.push(labelKey);

    const labelDescendants: string[] = [];

    for (const category of label.categories) {
      const categoryKey = `category:${label.id}-${category.id}`;
      categoryKeys.push(categoryKey);
      labelDescendants.push(categoryKey);

      const categoryDescendants: string[] = [];
      const categoryProducts = productsByCategoryId.get(category.id) ?? [];

      for (const product of categoryProducts) {
        const productKey = `product:${label.id}-${category.id}-${product.id}`;
        categoryDescendants.push(productKey);
        labelDescendants.push(productKey);

        if (!productKeySet.has(productKey)) {
          productKeySet.add(productKey);
          productKeys.push(productKey);
        }
      }

      categoryToDescendants.set(categoryKey, categoryDescendants);
    }

    labelToDescendants.set(labelKey, labelDescendants);
  }

  const getDescendants = (key: string): string[] => {
    // Check if it's a label key
    if (labelToDescendants.has(key)) {
      return labelToDescendants.get(key) ?? [];
    }

    // Check if it's a category key
    if (categoryToDescendants.has(key)) {
      return categoryToDescendants.get(key) ?? [];
    }

    // It's a product key or unknown - return empty (leaf node)
    return [];
  };

  return {
    allKeys: [...labelKeys, ...categoryKeys, ...productKeys],
    labelKeys,
    categoryKeys,
    productKeys,
    getDescendants,
  };
}

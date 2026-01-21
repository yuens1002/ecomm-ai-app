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
 * 2-level hierarchy: Labels → Categories
 * Products are NOT rendered as rows (only product count shown on category rows).
 * Product management is done in the Category Detail view.
 *
 * Data flow:
 * labels[] + categories[] + products[] + expandedIds
 *   → FlatMenuRow[] (discriminated union: label | category)
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

    // Create a map of category ID → product count
    const productCountByCategoryId = new Map<string, number>();
    for (const product of products) {
      for (const categoryId of product.categoryIds) {
        const existing = productCountByCategoryId.get(categoryId) ?? 0;
        productCountByCategoryId.set(categoryId, existing + 1);
      }
    }

    // Sort labels by order
    const sortedLabels = [...labels].sort((a, b) => a.order - b.order);

    for (const label of sortedLabels) {
      // Calculate category count and total product count for this label
      const labelCategoryIds = label.categories.map((c) => c.id);
      let totalProductCount = 0;
      const seenProductIds = new Set<string>();

      // Count unique products across all categories in this label
      for (const catId of labelCategoryIds) {
        for (const product of products) {
          if (product.categoryIds.includes(catId) && !seenProductIds.has(product.id)) {
            seenProductIds.add(product.id);
            totalProductCount++;
          }
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
        productCount: totalProductCount,
      };
      rows.push(labelRow);

      // If label is expanded, add its categories (leaf nodes, not expandable)
      if (isLabelExpanded && hasCategories) {
        // Sort categories by order within label
        const sortedCategories = [...label.categories].sort(
          (a, b) => a.order - b.order
        );

        for (const catInLabel of sortedCategories) {
          const fullCategory = categoryMap.get(catInLabel.id);
          const categoryProductCount = productCountByCategoryId.get(catInLabel.id) ?? 0;

          // Add category row - leaf node in 2-level menu view (not expandable)
          const categoryRow: FlatCategoryRow = {
            id: catInLabel.id,
            name: catInLabel.name,
            level: "category",
            isVisible: fullCategory?.isVisible ?? true,
            isExpandable: false, // Categories are leaf nodes in 2-level view
            isExpanded: false,
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
            productCount: categoryProductCount,
          };
          rows.push(categoryRow);
        }
      }
    }

    return rows;
  }, [labels, categories, products, expandedIds]);
}

/**
 * Gets all expandable IDs (labels with categories).
 * Used for "Expand All" functionality.
 *
 * In 2-level menu view, only labels are expandable.
 * Categories are leaf nodes and cannot be expanded.
 */
export function getExpandableIds(labels: MenuLabel[]): string[] {
  const expandableIds: string[] = [];

  for (const label of labels) {
    // Label is expandable if it has categories
    if (label.categories.length > 0) {
      expandableIds.push(label.id);
    }
  }

  return expandableIds;
}

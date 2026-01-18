import type { MenuLabel, MenuProduct } from "../../../../types/menu";

/**
 * Row levels in the menu hierarchy.
 * Each level uses a different indentation depth.
 */
export type MenuRowLevel = "label" | "category" | "product";

/**
 * Tri-state checkbox values for hierarchical selection.
 * - checked: Entity is selected (for parents: all descendants are selected)
 * - indeterminate: Some descendants are selected (parents only)
 * - unchecked: Entity is not selected and no descendants are selected
 */
export type CheckboxState = "checked" | "indeterminate" | "unchecked";

/**
 * Base properties for all flattened menu rows.
 */
type FlatMenuRowBase = {
  /** Unique row ID (same as entity ID) */
  id: string;
  /** Display name for the row */
  name: string;
  /** Hierarchy level determines indentation */
  level: MenuRowLevel;
  /** Whether the row is visible in the menu */
  isVisible: boolean;
  /** Whether this row can be expanded (has children) */
  isExpandable: boolean;
  /** Whether this row is currently expanded */
  isExpanded: boolean;
  /** Parent ID for DnD constraints (null for labels) */
  parentId: string | null;
};

/**
 * Flattened label row with label-specific properties.
 */
export type FlatLabelRow = FlatMenuRowBase & {
  level: "label";
  parentId: null;
  /** Original label data */
  data: MenuLabel;
  /** Count of categories in this label */
  categoryCount: number;
  /** Total count of products across all categories in this label */
  productCount: number;
};

/**
 * Flattened category row with category-specific properties.
 */
export type FlatCategoryRow = FlatMenuRowBase & {
  level: "category";
  /** Parent label ID */
  parentId: string;
  /** Order within parent label */
  orderInLabel: number;
  /** Original category data (subset) */
  data: {
    id: string;
    name: string;
    slug: string;
    order: number;
    attachedAt: Date;
    isVisible: boolean;
  };
  /** Count of products in this category */
  productCount: number;
};

/**
 * Flattened product row with product-specific properties.
 */
export type FlatProductRow = FlatMenuRowBase & {
  level: "product";
  /** Parent category ID */
  parentId: string;
  /** Grandparent label ID (for ancestry tracking) */
  grandParentId: string;
  /** Order within parent category */
  orderInCategory: number;
  /** Original product data */
  data: MenuProduct;
};

/**
 * Discriminated union for all row types in the menu table.
 * Use `row.level` to narrow the type.
 */
export type FlatMenuRow = FlatLabelRow | FlatCategoryRow | FlatProductRow;

/**
 * Type guard for label rows.
 */
export function isLabelRow(row: FlatMenuRow): row is FlatLabelRow {
  return row.level === "label";
}

/**
 * Type guard for category rows.
 */
export function isCategoryRow(row: FlatMenuRow): row is FlatCategoryRow {
  return row.level === "category";
}

/**
 * Type guard for product rows.
 */
export function isProductRow(row: FlatMenuRow): row is FlatProductRow {
  return row.level === "product";
}

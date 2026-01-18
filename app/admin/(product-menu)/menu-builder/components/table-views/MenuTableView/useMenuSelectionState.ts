"use client";

import { useCallback, useMemo } from "react";
import type { SelectedEntityKind } from "../../../../types/builder-state";
import type { MenuLabel, MenuProduct } from "../../../../types/menu";
import type { CheckboxState, FlatMenuRow } from "./types";
import { isCategoryRow, isLabelRow, isProductRow } from "./types";

type BuilderSelectionApi = {
  selectedIds: string[];
  selectedKind: SelectedEntityKind | null;
  toggleSelection: (id: string, options?: { kind?: SelectedEntityKind }) => void;
  selectAll: (ids: string[], options?: { kind?: SelectedEntityKind }) => void;
  clearSelection: () => void;
};

type UseMenuSelectionStateOptions = {
  rows: FlatMenuRow[];
  labels: MenuLabel[];
  products: MenuProduct[];
  builder: BuilderSelectionApi;
};

type HierarchyMaps = {
  /** Product composite key → category ID */
  productToCategory: Map<string, string>;
  /** Product composite key → label ID */
  productToLabel: Map<string, string>;
  /** Category ID → label ID */
  categoryToLabel: Map<string, string>;
  /** Label ID → category IDs */
  labelToCategories: Map<string, string[]>;
  /** Category composite key (labelId-categoryId) → product composite keys */
  categoryToProducts: Map<string, string[]>;
  /** Label ID → product composite keys (all products under label) */
  labelToProducts: Map<string, string[]>;
  /** All product composite keys */
  allProductKeys: Set<string>;
  /** All category IDs */
  allCategoryIds: Set<string>;
};

/**
 * Builds hierarchy lookup maps for fast ancestry/descendant queries.
 * Only rebuilds when labels or products data changes.
 */
function buildHierarchyMaps(labels: MenuLabel[], products: MenuProduct[]): HierarchyMaps {
  const productToCategory = new Map<string, string>();
  const productToLabel = new Map<string, string>();
  const categoryToLabel = new Map<string, string>();
  const labelToCategories = new Map<string, string[]>();
  const categoryToProducts = new Map<string, string[]>();
  const labelToProducts = new Map<string, string[]>();
  const allProductKeys = new Set<string>();
  const allCategoryIds = new Set<string>();

  // Build product lookup by categoryId
  const productsByCategoryId = new Map<string, MenuProduct[]>();
  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      const existing = productsByCategoryId.get(categoryId) ?? [];
      existing.push(product);
      productsByCategoryId.set(categoryId, existing);
    }
  }

  // Build maps from label hierarchy
  for (const label of labels) {
    const labelCategoryIds: string[] = [];
    const labelProductKeys: string[] = [];

    for (const category of label.categories) {
      labelCategoryIds.push(category.id);
      allCategoryIds.add(category.id);
      categoryToLabel.set(category.id, label.id);

      const categoryKey = `${label.id}-${category.id}`;
      const categoryProductKeys: string[] = [];
      const categoryProducts = productsByCategoryId.get(category.id) ?? [];

      for (const product of categoryProducts) {
        // Composite key: labelId-categoryId-productId
        const productKey = `${label.id}-${category.id}-${product.id}`;
        productToCategory.set(productKey, category.id);
        productToLabel.set(productKey, label.id);
        categoryProductKeys.push(productKey);
        labelProductKeys.push(productKey);
        allProductKeys.add(productKey);
      }

      categoryToProducts.set(categoryKey, categoryProductKeys);
    }

    labelToCategories.set(label.id, labelCategoryIds);
    labelToProducts.set(label.id, labelProductKeys);
  }

  return {
    productToCategory,
    productToLabel,
    categoryToLabel,
    labelToCategories,
    categoryToProducts,
    labelToProducts,
    allProductKeys,
    allCategoryIds,
  };
}

/**
 * Menu view selection state hook.
 *
 * Provides:
 * - Checkbox state (checked/indeterminate/unchecked) for each row
 * - Checkbox visibility based on selection kind and ancestry
 * - Toggle handlers that update builder selection state
 *
 * Uses pre-built hierarchy maps for O(1) lookups.
 * Iterates only over selected items (typically small set) for state computation.
 */
export function useMenuSelectionState({
  rows,
  labels,
  products,
  builder,
}: UseMenuSelectionStateOptions) {
  const { selectedIds, selectedKind } = builder;

  // Build hierarchy maps once when data changes
  const hierarchy = useMemo(
    () => buildHierarchyMaps(labels, products),
    [labels, products]
  );

  // Create a Set for O(1) selected ID lookups
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // ─────────────────────────────────────────────────────────────
  // CHECKBOX STATE COMPUTATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Get checkbox state for a label.
   * - checked: label is selected (kind=label) OR all descendants selected
   * - indeterminate: some descendants selected
   * - unchecked: nothing selected
   */
  const getLabelCheckboxState = useCallback(
    (labelId: string): CheckboxState => {
      if (selectedKind === "label") {
        return selectedIdSet.has(labelId) ? "checked" : "unchecked";
      }

      if (selectedKind === "category") {
        // Check if any selected category belongs to this label
        // Category selection uses composite key: labelId-categoryId
        const labelCategories = hierarchy.labelToCategories.get(labelId) ?? [];
        const selectedInLabel = labelCategories.filter((catId) =>
          selectedIdSet.has(`${labelId}-${catId}`)
        );

        if (selectedInLabel.length === 0) return "unchecked";
        if (selectedInLabel.length === labelCategories.length) return "checked";
        return "indeterminate";
      }

      if (selectedKind === "product") {
        // Check if any selected product belongs to this label
        const labelProducts = hierarchy.labelToProducts.get(labelId) ?? [];
        if (labelProducts.length === 0) return "unchecked";

        const selectedInLabel = labelProducts.filter((pk) => selectedIdSet.has(pk));

        if (selectedInLabel.length === 0) return "unchecked";
        if (selectedInLabel.length === labelProducts.length) return "checked";
        return "indeterminate";
      }

      return "unchecked";
    },
    [selectedKind, selectedIdSet, hierarchy]
  );

  /**
   * Get checkbox state for a category (within a specific label).
   * Uses composite key: labelId-categoryId
   */
  const getCategoryCheckboxState = useCallback(
    (labelId: string, categoryId: string): CheckboxState => {
      if (selectedKind === "category") {
        const categoryKey = `${labelId}-${categoryId}`;
        return selectedIdSet.has(categoryKey) ? "checked" : "unchecked";
      }

      if (selectedKind === "product") {
        const categoryKey = `${labelId}-${categoryId}`;
        const categoryProducts = hierarchy.categoryToProducts.get(categoryKey) ?? [];
        if (categoryProducts.length === 0) return "unchecked";

        const selectedInCategory = categoryProducts.filter((pk) => selectedIdSet.has(pk));

        if (selectedInCategory.length === 0) return "unchecked";
        if (selectedInCategory.length === categoryProducts.length) return "checked";
        return "indeterminate";
      }

      return "unchecked";
    },
    [selectedKind, selectedIdSet, hierarchy]
  );

  /**
   * Get checkbox state for a product.
   */
  const getProductCheckboxState = useCallback(
    (productKey: string): CheckboxState => {
      if (selectedKind === "product") {
        return selectedIdSet.has(productKey) ? "checked" : "unchecked";
      }
      return "unchecked";
    },
    [selectedKind, selectedIdSet]
  );

  // ─────────────────────────────────────────────────────────────
  // CHECKBOX VISIBILITY
  // ─────────────────────────────────────────────────────────────

  /**
   * Simple checkbox visibility rule:
   *
   * A checkbox is visible if:
   * 1. No selection exists (selectedKind === null) - all checkboxes available
   * 2. Same kind as current selection - can toggle
   *
   * Descendant checkboxes are HIDDEN when a parent kind is selected.
   * User must clear the selection first to select a different kind.
   */

  const isLabelCheckboxVisible = useCallback(
    (): boolean => {
      return selectedKind === null || selectedKind === "label";
    },
    [selectedKind]
  );

  const isCategoryCheckboxVisible = useCallback(
    (): boolean => {
      return selectedKind === null || selectedKind === "category";
    },
    [selectedKind]
  );

  const isProductCheckboxVisible = useCallback(
    (): boolean => {
      return selectedKind === null || selectedKind === "product";
    },
    [selectedKind]
  );

  // ─────────────────────────────────────────────────────────────
  // TOGGLE HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Label toggle - acts as master switch for descendants.
   *
   * In label mode: toggles the label itself
   * In category/product mode: toggles all descendants of that kind
   *   - checked → unchecked: deselect all descendants
   *   - indeterminate/unchecked → checked: select all descendants
   */
  const onToggleLabel = useCallback(
    (labelId: string) => {
      if (selectedKind !== null && selectedKind !== "label") {
        // Different kind selected - master switch behavior
        const labelState = getLabelCheckboxState(labelId);

        if (selectedKind === "category") {
          // Build composite keys for categories in this label
          const labelCategoryIds = hierarchy.labelToCategories.get(labelId) ?? [];
          const labelCategoryKeys = labelCategoryIds.map((catId) => `${labelId}-${catId}`);
          const labelCategoryKeySet = new Set(labelCategoryKeys);

          if (labelState === "checked") {
            // Deselect all categories in this label
            const newSelection = selectedIds.filter((key) => !labelCategoryKeySet.has(key));
            builder.selectAll(newSelection, { kind: "category" });
          } else {
            // Select all categories in this label (indeterminate or unchecked → checked)
            const newSelection = [...selectedIds, ...labelCategoryKeys.filter((key) => !selectedIdSet.has(key))];
            builder.selectAll(newSelection, { kind: "category" });
          }
          return;
        }

        if (selectedKind === "product") {
          const labelProducts = hierarchy.labelToProducts.get(labelId) ?? [];
          if (labelState === "checked") {
            // Deselect all products in this label
            const newSelection = selectedIds.filter((pk) => !labelProducts.includes(pk));
            builder.selectAll(newSelection, { kind: "product" });
          } else {
            // Select all products in this label (indeterminate or unchecked → checked)
            const newSelection = [...selectedIds, ...labelProducts.filter((pk) => !selectedIdSet.has(pk))];
            builder.selectAll(newSelection, { kind: "product" });
          }
          return;
        }

        return;
      }

      // Label selection mode - toggle the label itself
      builder.toggleSelection(labelId, { kind: "label" });
    },
    [selectedKind, selectedIds, selectedIdSet, builder, hierarchy, getLabelCheckboxState]
  );

  /**
   * Category toggle.
   * Uses composite key: labelId-categoryId
   *
   * In category mode: toggles the category itself
   * In other modes: ignored (checkbox hidden anyway)
   */
  const onToggleCategory = useCallback(
    (labelId: string, categoryId: string) => {
      if (selectedKind !== null && selectedKind !== "category") {
        // Different kind selected - ignore (checkbox should be hidden)
        return;
      }

      // Category selection mode - toggle the category with composite key
      const categoryKey = `${labelId}-${categoryId}`;
      builder.toggleSelection(categoryKey, { kind: "category" });
    },
    [selectedKind, builder]
  );

  /**
   * Product toggle.
   *
   * In product mode: toggles the product itself
   * In other modes: ignored (checkbox hidden anyway)
   */
  const onToggleProduct = useCallback(
    (productKey: string) => {
      if (selectedKind !== null && selectedKind !== "product") {
        // Different kind selected - ignore (checkbox should be hidden)
        return;
      }

      // Product selection mode - toggle the product itself
      builder.toggleSelection(productKey, { kind: "product" });
    },
    [selectedKind, builder]
  );

  // ─────────────────────────────────────────────────────────────
  // ROW HELPERS (compute state for a specific row)
  // ─────────────────────────────────────────────────────────────

  const getRowCheckboxState = useCallback(
    (row: FlatMenuRow): CheckboxState => {
      if (isLabelRow(row)) {
        return getLabelCheckboxState(row.id);
      }
      if (isCategoryRow(row)) {
        return getCategoryCheckboxState(row.parentId, row.id);
      }
      if (isProductRow(row)) {
        const productKey = `${row.grandParentId}-${row.parentId}-${row.id}`;
        return getProductCheckboxState(productKey);
      }
      return "unchecked";
    },
    [getLabelCheckboxState, getCategoryCheckboxState, getProductCheckboxState]
  );

  const getRowCheckboxVisible = useCallback(
    (row: FlatMenuRow): boolean => {
      if (isLabelRow(row)) {
        return isLabelCheckboxVisible();
      }
      if (isCategoryRow(row)) {
        return isCategoryCheckboxVisible();
      }
      if (isProductRow(row)) {
        return isProductCheckboxVisible();
      }
      return false;
    },
    [isLabelCheckboxVisible, isCategoryCheckboxVisible, isProductCheckboxVisible]
  );

  const onToggleRow = useCallback(
    (row: FlatMenuRow) => {
      if (isLabelRow(row)) {
        onToggleLabel(row.id);
      } else if (isCategoryRow(row)) {
        onToggleCategory(row.parentId, row.id);
      } else if (isProductRow(row)) {
        const productKey = `${row.grandParentId}-${row.parentId}-${row.id}`;
        onToggleProduct(productKey);
      }
    },
    [onToggleLabel, onToggleCategory, onToggleProduct]
  );

  // ─────────────────────────────────────────────────────────────
  // HEADER SELECT ALL
  // ─────────────────────────────────────────────────────────────

  const headerState = useMemo((): { allSelected: boolean; someSelected: boolean } => {
    if (selectedKind !== "label" || selectedIds.length === 0) {
      return { allSelected: false, someSelected: selectedIds.length > 0 };
    }

    const visibleLabelIds = labels.filter((l) => l.isVisible).map((l) => l.id);
    const selectedLabelCount = visibleLabelIds.filter((id) => selectedIdSet.has(id)).length;

    return {
      allSelected: selectedLabelCount === visibleLabelIds.length && visibleLabelIds.length > 0,
      someSelected: selectedLabelCount > 0 && selectedLabelCount < visibleLabelIds.length,
    };
  }, [selectedKind, selectedIds.length, selectedIdSet, labels]);

  const onSelectAllLabels = useCallback(() => {
    if (selectedKind !== null && selectedKind !== "label") {
      return; // Can't select all labels when different kind is active
    }

    const visibleLabelIds = labels.filter((l) => l.isVisible).map((l) => l.id);

    if (headerState.allSelected) {
      builder.clearSelection();
    } else {
      builder.selectAll(visibleLabelIds, { kind: "label" });
    }
  }, [selectedKind, labels, headerState.allSelected, builder]);

  // ─────────────────────────────────────────────────────────────
  // ACTION BAR HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if any entity of the current selection kind has indeterminate state.
   * Used to disable actions when selection is incomplete.
   */
  const hasIndeterminateSelection = useMemo((): boolean => {
    if (selectedKind === "label") {
      // Labels are leaf selection - no indeterminate possible
      return false;
    }

    if (selectedKind === "category") {
      // Check if any label containing selected categories is indeterminate
      for (const label of labels) {
        const state = getLabelCheckboxState(label.id);
        if (state === "indeterminate") return true;
      }
      return false;
    }

    if (selectedKind === "product") {
      // Check if any category containing selected products is indeterminate
      for (const row of rows) {
        if (isCategoryRow(row)) {
          const state = getCategoryCheckboxState(row.parentId, row.id);
          if (state === "indeterminate") return true;
        }
      }
      return false;
    }

    return false;
  }, [selectedKind, labels, rows, getLabelCheckboxState, getCategoryCheckboxState]);

  return {
    // State getters
    getRowCheckboxState,
    getRowCheckboxVisible,

    // Individual level getters (for direct access)
    getLabelCheckboxState,
    getCategoryCheckboxState,
    getProductCheckboxState,
    isLabelCheckboxVisible,
    isCategoryCheckboxVisible,
    isProductCheckboxVisible,

    // Toggle handlers
    onToggleRow,
    onToggleLabel,
    onToggleCategory,
    onToggleProduct,

    // Header
    headerState,
    onSelectAllLabels,
    isSelectAllDisabled: selectedKind !== null && selectedKind !== "label",

    // Action bar helpers
    hasIndeterminateSelection,
    selectedKind,
    hasSelection: selectedIds.length > 0,
  };
}

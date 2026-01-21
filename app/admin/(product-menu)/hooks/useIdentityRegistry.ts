/**
 * Identity Registry Builders
 *
 * Factory functions to create IdentityRegistry instances for different view types.
 */

import type { MenuLabel, MenuProduct } from "../types/menu";
import {
  type RowIdentity,
  type IdentityRegistry,
  createRegistry,
  createKey,
} from "../types/identity-registry";

/**
 * Build a flat registry for simple table views (AllLabels, AllCategories, etc.)
 *
 * All items are at depth 0 with no hierarchy.
 */
export function buildFlatRegistry<T extends { id: string }>(
  items: T[],
  kind: string
): IdentityRegistry {
  const identities = new Map<string, RowIdentity>();
  const allKeys: string[] = [];
  const keysByKind: Record<string, string[]> = { [kind]: [] };

  for (const item of items) {
    const key = createKey(kind, item.id);

    const identity: RowIdentity = {
      key,
      kind,
      entityId: item.id,
      depth: 0,
      parentKey: null,
      childKeys: [],
      expandKey: null,
      canReceiveDrop: false,
    };

    identities.set(key, identity);
    allKeys.push(key);
    keysByKind[kind].push(key);
  }

  return createRegistry(identities, allKeys, keysByKind);
}

/**
 * Build a hierarchical registry for the Menu table view.
 *
 * Structure:
 * - Labels (depth 0) - expandable, contains categories, can receive drops
 * - Categories (depth 1) - expandable if has products, leaf in 2-level view
 * - Products (depth 2) - leaf nodes (included for backwards compatibility)
 *
 * Note: Products are included for now but will be removed in Phase 3
 * when we simplify to 2-level hierarchy.
 */
export function buildMenuHierarchyRegistry(
  labels: MenuLabel[],
  products: MenuProduct[]
): IdentityRegistry {
  const identities = new Map<string, RowIdentity>();
  const allKeys: string[] = [];
  const keysByKind: Record<string, string[]> = {
    label: [],
    category: [],
    product: [],
  };

  // Build product lookup: categoryId -> products in that category
  const productsByCategory = new Map<string, MenuProduct[]>();
  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      const existing = productsByCategory.get(categoryId) ?? [];
      existing.push(product);
      productsByCategory.set(categoryId, existing);
    }
  }

  // Process labels and their descendants
  for (const label of labels) {
    const labelKey = createKey("label", label.id);
    const labelChildKeys: string[] = [];

    // Process categories within this label
    for (const category of label.categories) {
      const categoryKey = createKey("category", label.id, category.id);
      const categoryChildKeys: string[] = [];

      // Process products within this category (under this label context)
      const categoryProducts = productsByCategory.get(category.id) ?? [];

      // Sort products by their order for this specific category
      const sortedProducts = [...categoryProducts].sort((a, b) => {
        const orderA =
          a.categoryOrders.find((o) => o.categoryId === category.id)?.order ??
          0;
        const orderB =
          b.categoryOrders.find((o) => o.categoryId === category.id)?.order ??
          0;
        return orderA - orderB;
      });

      for (const product of sortedProducts) {
        const productKey = createKey(
          "product",
          label.id,
          category.id,
          product.id
        );

        const productIdentity: RowIdentity = {
          key: productKey,
          kind: "product",
          entityId: product.id,
          depth: 2,
          parentKey: categoryKey,
          childKeys: [],
          expandKey: null,
          canReceiveDrop: false,
        };

        identities.set(productKey, productIdentity);
        allKeys.push(productKey);
        keysByKind.product.push(productKey);
        categoryChildKeys.push(productKey);
      }

      // Category identity - expandable if has products
      const categoryExpandKey =
        categoryChildKeys.length > 0 ? categoryKey : null;

      const categoryIdentity: RowIdentity = {
        key: categoryKey,
        kind: "category",
        entityId: category.id,
        depth: 1,
        parentKey: labelKey,
        childKeys: categoryChildKeys,
        expandKey: categoryExpandKey,
        canReceiveDrop: false,
      };

      identities.set(categoryKey, categoryIdentity);
      allKeys.push(categoryKey);
      keysByKind.category.push(categoryKey);
      labelChildKeys.push(categoryKey, ...categoryChildKeys);
    }

    // Label identity - expandable if has categories, can receive category drops
    const hasCategories = label.categories.length > 0;

    const labelIdentity: RowIdentity = {
      key: labelKey,
      kind: "label",
      entityId: label.id,
      depth: 0,
      parentKey: null,
      childKeys: labelChildKeys,
      expandKey: hasCategories ? labelKey : null,
      canReceiveDrop: true, // Labels can receive category drops
    };

    identities.set(labelKey, labelIdentity);
    allKeys.push(labelKey);
    keysByKind.label.push(labelKey);
  }

  // Reorder allKeys to match tree order: label, then its children
  const orderedKeys: string[] = [];
  for (const label of labels) {
    const labelKey = createKey("label", label.id);
    orderedKeys.push(labelKey);

    for (const category of label.categories) {
      const categoryKey = createKey("category", label.id, category.id);
      orderedKeys.push(categoryKey);

      const categoryProducts = productsByCategory.get(category.id) ?? [];
      const sortedProducts = [...categoryProducts].sort((a, b) => {
        const orderA =
          a.categoryOrders.find((o) => o.categoryId === category.id)?.order ??
          0;
        const orderB =
          b.categoryOrders.find((o) => o.categoryId === category.id)?.order ??
          0;
        return orderA - orderB;
      });

      for (const product of sortedProducts) {
        const productKey = createKey(
          "product",
          label.id,
          category.id,
          product.id
        );
        orderedKeys.push(productKey);
      }
    }
  }

  return createRegistry(identities, orderedKeys, keysByKind);
}

/**
 * Get direct child keys only (not all descendants).
 * Useful for immediate children iteration.
 */
export function getDirectChildKeys(
  registry: IdentityRegistry,
  key: string
): readonly string[] {
  const identity = registry.get(key);
  if (!identity) return [];

  const depth = identity.depth;

  // Filter childKeys to only include immediate children (depth + 1)
  return identity.childKeys.filter((childKey) => {
    const childIdentity = registry.get(childKey);
    return childIdentity?.depth === depth + 1;
  });
}

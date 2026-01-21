/**
 * Identity Registry Builders
 *
 * Factory functions to create IdentityRegistry instances for different view types.
 */

import type { MenuLabel } from "../types/menu";
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
      isExpandable: false,
      canReceiveDrop: false,
    };

    identities.set(key, identity);
    allKeys.push(key);
    keysByKind[kind].push(key);
  }

  return createRegistry(identities, allKeys, keysByKind);
}

/**
 * Build a 2-level hierarchical registry for the Menu table view.
 *
 * Structure:
 * - Labels (depth 0) - expandable if has categories, can receive category drops
 * - Categories (depth 1) - leaf nodes, no children in menu view
 *
 * Products are NOT included in the menu registry. Product count is displayed
 * as an info column but products are managed in Category Detail view.
 */
export function buildMenuRegistry(labels: MenuLabel[]): IdentityRegistry {
  const identities = new Map<string, RowIdentity>();
  const keysByKind: Record<string, string[]> = {
    label: [],
    category: [],
  };

  // Sort labels by order to match useFlattenedMenuRows
  const sortedLabels = [...labels].sort((a, b) => a.order - b.order);

  // Process labels and their categories (2 levels only)
  for (const label of sortedLabels) {
    const labelKey = createKey("label", label.id);
    const categoryKeys: string[] = [];

    // Sort categories by order within label to match useFlattenedMenuRows
    const sortedCategories = [...label.categories].sort((a, b) => a.order - b.order);

    // Process categories within this label
    for (const category of sortedCategories) {
      const categoryKey = createKey("category", label.id, category.id);

      // Category identity - leaf node in 2-level menu view
      const categoryIdentity: RowIdentity = {
        key: categoryKey,
        kind: "category",
        entityId: category.id,
        depth: 1,
        parentKey: labelKey,
        childKeys: [], // Leaf node
        isExpandable: false, // Leaf node
        canReceiveDrop: false,
      };

      identities.set(categoryKey, categoryIdentity);
      categoryKeys.push(categoryKey);
      keysByKind.category.push(categoryKey);
    }

    // Label identity - expandable if has categories, can receive category drops
    const hasCategories = categoryKeys.length > 0;

    const labelIdentity: RowIdentity = {
      key: labelKey,
      kind: "label",
      entityId: label.id,
      depth: 0,
      parentKey: null,
      childKeys: categoryKeys,
      isExpandable: hasCategories,
      canReceiveDrop: true, // Labels can receive category drops
    };

    identities.set(labelKey, labelIdentity);
    keysByKind.label.push(labelKey);
  }

  // Build ordered keys: label, then its categories (using sorted data)
  const orderedKeys: string[] = [];
  for (const label of sortedLabels) {
    const labelKey = createKey("label", label.id);
    orderedKeys.push(labelKey);

    const sortedCats = [...label.categories].sort((a, b) => a.order - b.order);
    for (const category of sortedCats) {
      const categoryKey = createKey("category", label.id, category.id);
      orderedKeys.push(categoryKey);
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

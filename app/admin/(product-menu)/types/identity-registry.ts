/**
 * Identity Registry Types
 *
 * Unified row identity management for all table views.
 * Single source of truth for selection, actions, expand/collapse, and navigation.
 */

/**
 * Complete identity for any row in any table view.
 *
 * Provides all precomputed data needed for:
 * - Selection (key, childKeys, parentKey)
 * - Actions (kind, entityId, parentKey)
 * - Expand/collapse (expandKey)
 * - Rendering (depth)
 * - DnD (parentKey, containsKinds)
 */
export type RowIdentity = {
  /** Unique key for this row (React key, selection tracking) */
  readonly key: string;

  /** Entity type - string for extensibility */
  readonly kind: string;

  /** Actual database ID for mutations */
  readonly entityId: string;

  /** Hierarchy depth for indentation (0, 1, 2, ...) */
  readonly depth: number;

  /**
   * Parent's key in the hierarchy. Null for root-level items.
   * - Label: null
   * - Category under label: "label:labelId"
   *
   * Used for: actionable roots filtering, DnD same-parent check, mutation context.
   */
  readonly parentKey: string | null;

  /** Keys of all descendants for selection cascade. Empty if leaf. */
  readonly childKeys: readonly string[];

  /** Whether this row can be expanded (has children). */
  readonly isExpandable: boolean;

  /**
   * Kinds this entity can contain (for DnD drop validation).
   * - Labels contain categories: ["category"]
   * - Categories are leaf nodes: []
   * - Flat list items: []
   *
   * Used by canReceiveDrop(targetKey, dragKind) to validate drops at runtime.
   */
  readonly containsKinds: readonly string[];
};

/**
 * Container for all row identities with O(1) lookup methods.
 */
export type IdentityRegistry = {
  /** All identities by key */
  readonly byKey: ReadonlyMap<string, RowIdentity>;

  /** All keys in insertion order */
  readonly allKeys: readonly string[];

  /** Keys grouped by kind */
  readonly keysByKind: Readonly<Record<string, readonly string[]>>;

  // === O(1) LOOKUPS ===

  /** Get full identity for a key */
  get(key: string): RowIdentity | undefined;

  /** Get entity ID for mutations */
  getEntityId(key: string): string | undefined;

  /** Get kind for the key */
  getKind(key: string): string | undefined;

  /** Get depth for rendering */
  getDepth(key: string): number;

  /** Get parent key for hierarchy operations */
  getParentKey(key: string): string | null;

  /** Get child keys for selection cascade */
  getChildKeys(key: string): readonly string[];

  /** Check if row is expandable */
  isExpandable(key: string): boolean;

  /** Get kinds this entity can contain */
  getContainsKinds(key: string): readonly string[];

  /**
   * Check if target can receive a drop of the specified kind.
   * Uses containsKinds to validate at runtime.
   */
  canReceiveDrop(targetKey: string, dragKind: string): boolean;
};

/**
 * Helper to create a registry from a map of identities.
 */
export function createRegistry(
  identities: Map<string, RowIdentity>,
  allKeys: string[],
  keysByKind: Record<string, string[]>
): IdentityRegistry {
  return {
    byKey: identities,
    allKeys,
    keysByKind,

    get(key: string): RowIdentity | undefined {
      return identities.get(key);
    },

    getEntityId(key: string): string | undefined {
      return identities.get(key)?.entityId;
    },

    getKind(key: string): string | undefined {
      return identities.get(key)?.kind;
    },

    getDepth(key: string): number {
      return identities.get(key)?.depth ?? 0;
    },

    getParentKey(key: string): string | null {
      return identities.get(key)?.parentKey ?? null;
    },

    getChildKeys(key: string): readonly string[] {
      return identities.get(key)?.childKeys ?? [];
    },

    isExpandable(key: string): boolean {
      return identities.get(key)?.isExpandable ?? false;
    },

    getContainsKinds(key: string): readonly string[] {
      return identities.get(key)?.containsKinds ?? [];
    },

    canReceiveDrop(targetKey: string, dragKind: string): boolean {
      const containsKinds = identities.get(targetKey)?.containsKinds ?? [];
      return containsKinds.includes(dragKind);
    },
  };
}

/**
 * Key format: `{kind}:{compositeId}`
 * - Labels: `label:{labelId}`
 * - Categories: `category:{labelId}-{categoryId}`
 * - Products: `product:{labelId}-{categoryId}-{productId}`
 */
/**
 * Separator used between ID segments in composite keys.
 * Using `~` to avoid conflicts with hyphens in UUIDs.
 */
const KEY_SEGMENT_SEPARATOR = "~";

export function createKey(kind: string, ...ids: string[]): string {
  return `${kind}:${ids.join(KEY_SEGMENT_SEPARATOR)}`;
}

/**
 * Parse kind from a key.
 */
export function getKindFromKey(key: string): string {
  const colonIndex = key.indexOf(":");
  return colonIndex > -1 ? key.slice(0, colonIndex) : "";
}

/**
 * Parse composite ID from a key (everything after the colon).
 */
export function getCompositeFromKey(key: string): string {
  const colonIndex = key.indexOf(":");
  return colonIndex > -1 ? key.slice(colonIndex + 1) : key;
}

/**
 * Extract the entity ID from a key.
 *
 * Key format: `kind:id1~id2~id3` (uses ~ separator to avoid UUID hyphen conflicts)
 * - For labels: `label:labelId` → `labelId`
 * - For categories: `category:labelId~categoryId` → `categoryId`
 * - For products: `product:labelId~categoryId~productId` → `productId`
 *
 * The entity ID is always the last segment after splitting by the separator.
 */
export function getEntityIdFromKey(key: string): string {
  const composite = getCompositeFromKey(key);
  // Split by separator and return the last segment
  const segments = composite.split(KEY_SEGMENT_SEPARATOR);
  return segments[segments.length - 1];
}

/**
 * Extract the parent ID from a key.
 *
 * Key format: `kind:id1~id2~id3` (uses ~ separator to avoid UUID hyphen conflicts)
 * - For labels: `label:labelId` → undefined (no parent)
 * - For categories: `category:labelId~categoryId` → `labelId`
 * - For products: `product:labelId~categoryId~productId` → `categoryId`
 *
 * The parent ID is the second-to-last segment.
 */
export function getParentIdFromKey(key: string): string | undefined {
  const composite = getCompositeFromKey(key);
  const segments = composite.split(KEY_SEGMENT_SEPARATOR);
  return segments.length >= 2 ? segments[segments.length - 2] : undefined;
}

/**
 * Compute the parent key for a given key.
 *
 * Key hierarchy (uses ~ separator to avoid UUID hyphen conflicts):
 * - label:L1 → no parent
 * - category:L1~C1 → parent is label:L1
 * - product:L1~C1~P1 → parent is category:L1~C1
 */
export function getParentKey(key: string): string | null {
  const kind = getKindFromKey(key);
  const composite = getCompositeFromKey(key);
  const segments = composite.split(KEY_SEGMENT_SEPARATOR);

  if (kind === "label" || segments.length < 2) {
    return null; // Labels have no parent
  }

  if (kind === "category") {
    // category:L1~C1 → parent is label:L1
    return `label:${segments[0]}`;
  }

  if (kind === "product") {
    // product:L1~C1~P1 → parent is category:L1~C1
    return `category:${segments[0]}${KEY_SEGMENT_SEPARATOR}${segments[1]}`;
  }

  return null;
}

/**
 * Extract actionable root keys from a selection.
 *
 * A "root" key is a selected key whose parent is NOT also selected.
 * These are the items that actions (clone, remove) should operate on.
 *
 * Example:
 * - Selection: ["label:L1", "category:L1-C1", "product:L1-C1-P1"]
 * - "label:L1" has no parent → ROOT
 * - "category:L1-C1" has parent "label:L1" which IS selected → not root
 * - "product:L1-C1-P1" has parent "category:L1-C1" which IS selected → not root
 * - Result: ["label:L1"]
 */
export function getActionableRoots(selectedIds: string[]): string[] {
  const selectedSet = new Set(selectedIds);
  const roots: string[] = [];

  for (const key of selectedIds) {
    const parentKey = getParentKey(key);
    if (parentKey === null || !selectedSet.has(parentKey)) {
      roots.push(key);
    }
  }

  return roots;
}

/**
 * Get the kind of actionable roots.
 * Returns the kind if all roots are the same kind, null if mixed or empty.
 */
export function getActionableKind(selectedIds: string[]): string | null {
  const roots = getActionableRoots(selectedIds);
  if (roots.length === 0) return null;

  const kinds = new Set(roots.map(getKindFromKey));
  if (kinds.size === 1) {
    return [...kinds][0];
  }
  return null; // Mixed kinds
}

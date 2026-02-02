# Identity Registry API Design

> Internal API for unified row identity management across all table views.

## Problem Statement

Current architecture has multiple identity formats for different systems:

| System | Format | Example |
|--------|--------|---------|
| Selection | `kind:compositeId` | `"category:labelId-catId"` |
| Actions | Expects `entityId` | `"catId"` |
| Expand | Composite key | `"labelId-catId"` |
| Mutations | Database ID | `"catId"` |

This causes:

- Actions fail because `getIdFromKey()` returns composite, not entity ID
- Per-view click handlers with duplicated logic
- Tight coupling between level (depth) and entity type

## Design Goals

1. **Single source of truth** - One lookup answers all identity questions
2. **O(1) lookups** - Pre-computed maps, no runtime parsing
3. **View-agnostic** - Same API for flat and hierarchical views
4. **Extensible** - Supports N levels, any entity types

---

## Core Types

### RowIdentity

The complete identity for any row in any table view.

```json

type RowIdentity = {
  // === UNIQUE IDENTIFIER ===
  /** Unique key for this row (React key, selection tracking) */
  key: string;

  // === ENTITY INFO (for mutations) ===
  /** Entity type - string for extensibility, not hardcoded union */
  kind: string;
  /** Actual database ID for mutations */
  entityId: string;

  // === ANCESTRY (for context operations) ===
  /**
   * Parent chain of entity IDs, ordered root → parent.
   * Examples:
   * - Label: []
   * - Category under label: ["labelId"]
   * - Product under category under label: ["labelId", "categoryId"]
   */
  ancestry: string[];

  // === HIERARCHY ===
  /** Expand/collapse key. Null if not expandable (leaf node). */
  expandKey: string | null;
  /** Keys of all descendants for selection cascade. Empty if leaf. */
  childKeys: string[];

  // === RENDERING ===
  /** Hierarchy depth for indentation (0, 1, 2, ...) */
  depth: number;
};
```

### IdentityRegistry

Container for all row identities with O(1) lookup methods.

```tsx

type IdentityRegistry = {
  // === STORAGE ===
  /** All identities by key */
  readonly byKey: ReadonlyMap<string, RowIdentity>;

  // === GROUPED KEYS ===
  /** All keys in insertion order */
  readonly allKeys: readonly string[];
  /** Keys grouped by kind */
  readonly keysByKind: Readonly<Record<string, readonly string[]>>;

  // === LOOKUP METHODS (all O(1)) ===
  /** Get full identity for a key */
  get(key: string): RowIdentity | undefined;
  /** Get entity ID for mutations */
  getEntityId(key: string): string | undefined;
  /** Get child keys for selection cascade */
  getChildKeys(key: string): readonly string[];
  /** Get expand key for collapse/expand */
  getExpandKey(key: string): string | null;
  /** Get parent entity ID (last element of ancestry) */
  getParentId(key: string): string | undefined;
  /** Get depth for rendering */
  getDepth(key: string): number;
};
```

---

## Builder Functions

### buildFlatRegistry

For flat table views (AllLabels, AllCategories, etc.)

```typescript

function buildFlatRegistry<T extends { id: string }>(
  items: T[],
  kind: string
): IdentityRegistry;

// Usage
const registry = buildFlatRegistry(labels, "label");
// Creates identities like:
// { key: "label:abc", entityId: "abc", kind: "label", ancestry: [],
//   expandKey: null, childKeys: [], depth: 0 }
```

### buildMenuHierarchyRegistry

For the 3-level menu hierarchy view.

```typescript

function buildMenuHierarchyRegistry(
  labels: MenuLabel[],
  products: MenuProduct[]
): IdentityRegistry;

// Creates identities for all three levels:
// Labels:     { key: "label:L1", entityId: "L1", ancestry: [], depth: 0, ... }
// Categories: { key: "category:L1-C1", entityId: "C1", ancestry: ["L1"], depth: 1, ... }
// Products:   { key: "product:L1-C1-P1", entityId: "P1", ancestry: ["L1", "C1"], depth: 2, ... }
```

### Generic Builder (Future)

For arbitrary hierarchies.

```typescript

function buildHierarchyRegistry<T>(
  root: T[],
  config: {
    kind: string;
    getId: (item: T) => string;
    getChildren?: (item: T) => T[];
    childKind?: string;
  }
): IdentityRegistry;
```

---

## Unified Handlers

### useRowClickHandler

Single hook for all table views.

```typescript

function useRowClickHandler(
  registry: IdentityRegistry,
  options: {
    // Selection
    onToggle: (key: string) => void;
    onToggleWithHierarchy?: (key: string) => void;
    getCheckboxState?: (key: string) => CheckboxState;

    // Expand/collapse
    expandedIds?: Set<string>;
    toggleExpand?: (expandKey: string) => void;

    // Navigation
    navigate?: (kind: string, entityId: string) => void;
  }
): {
  handleClick: (key: string) => void;
  handleDoubleClick: (key: string) => void;
};
```

**Behavior:**

```typescript

// handleClick implementation
const handleClick = (key: string) => {
  const identity = registry.get(key);
  if (!identity) return;

  // 1. Sync expand/collapse (no-op if expandKey is null)
  if (identity.expandKey && toggleExpand && expandedIds) {
    const willSelect = getCheckboxState?.(key) !== "checked";
    const isExpanded = expandedIds.has(identity.expandKey);
    if (willSelect !== isExpanded) {
      toggleExpand(identity.expandKey);
    }
  }

  // 2. Toggle selection (cascade if has children)
  if (identity.childKeys.length > 0 && onToggleWithHierarchy) {
    onToggleWithHierarchy(key);
  } else {
    onToggle(key);
  }
};

// handleDoubleClick implementation
const handleDoubleClick = (key: string) => {
  const identity = registry.get(key);
  if (identity && navigate) {
    navigate(identity.kind, identity.entityId);
  }
};
```

### useActionHandler

For clone, remove, and other actions.

```typescript

function useActionHandler(
  registry: IdentityRegistry,
  mutations: {
    cloneLabel?: (id: string) => Promise<void>;
    cloneCategory?: (id: string, parentId: string) => Promise<void>;
    removeLabel?: (id: string) => Promise<void>;
    removeCategory?: (id: string, parentId: string) => Promise<void>;
    // ... etc
  }
): {
  handleClone: (keys: string[]) => Promise<void>;
  handleRemove: (keys: string[]) => Promise<void>;
};
```

**Behavior:**

```typescript

const handleClone = async (keys: string[]) => {
  for (const key of keys) {
    const identity = registry.get(key);
    if (!identity) continue;

    const parentId = identity.ancestry.at(-1);

    switch (identity.kind) {
      case "label":
        await mutations.cloneLabel?.(identity.entityId);
        break;
      case "category":
        await mutations.cloneCategory?.(identity.entityId, parentId!);
        break;
      // ... etc
    }
  }
};
```

---

## Consumer Patterns

### In Table Views

```typescript

function SomeTableView() {
  // 1. Build registry from data
  const registry = useMemo(
    () => buildFlatRegistry(items, "item"),
    [items]
  );

  // 2. Get unified handlers
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle: builder.toggleSelection,
    navigate: (kind, id) => builder.navigateToItem(id),
  });

  // 3. Render rows
  return items.map(item => {
    const key = `${kind}:${item.id}`;
    return (
      <TableRow
        key={key}
        onRowClick={() => handleClick(key)}
        onRowDoubleClick={() => handleDoubleClick(key)}
      />
    );
  });
}
```

### In Action Bar

```typescript

function useActionBarHandlers(registry: IdentityRegistry) {
  const { handleClone, handleRemove } = useActionHandler(registry, mutations);

  return {
    clone: {
      execute: () => handleClone(builder.selectedIds),
      disabled: !canPerformAction,
    },
    remove: {
      execute: () => handleRemove(builder.selectedIds),
      disabled: !canPerformAction,
    },
  };
}
```

---

## Actionable Roots & Business Rules

### Business Rules for Clone/Remove Actions

| Rule | Description |
|------|-------------|
| **Same Kind** | All actionable items must be the same entity type (all labels, OR all categories, OR all products) |
| **Complete Selection** | Each actionable item must be in "checked" state (not indeterminate) - meaning all its descendants are also selected |
| **Different Parents Allowed** | Items of the same kind from different parents can be acted on together (e.g., categories from different labels) |

### Actionable Roots

When performing actions (clone, remove), we operate on **actionable roots** - selected keys whose parents are NOT also selected.

**Example:**

```text
Selection: ["label:L1", "category:L1-C1", "product:L1-C1-P1"]

Actionable roots analysis:
- "label:L1" has no parent → ROOT
- "category:L1-C1" has parent "label:L1" which IS selected → NOT root
- "product:L1-C1-P1" has parent "category:L1-C1" which IS selected → NOT root

Result: ["label:L1"]
```

The clone/remove action will operate on the label only (which includes its structure).

### Helper Functions

```typescript

// Get parent key from a key (based on kind hierarchy)
function getParentKey(key: string): string | null;

// Extract actionable root keys from selection
function getActionableRoots(selectedIds: string[]): string[];

// Get kind of actionable roots (null if mixed)
function getActionableKind(selectedIds: string[]): string | null;
```

### Master Switch Behavior

When clicking a parent checkbox:

1. **Select**: Parent key + all descendant keys are added to selection
2. **Deselect**: Parent key + all descendant keys are removed from selection

This ensures completeness when selecting a parent (not indeterminate).

---

## Key Format Convention

```json
{kind}:{compositeId}
```

Where `compositeId` encodes ancestry for uniqueness:

- Labels: `label:{labelId}` → `"label:abc"`
- Categories: `category:{labelId}-{categoryId}` → `"category:abc-def"`
- Products: `product:{labelId}-{categoryId}-{productId}` → `"product:abc-def-ghi"`

**Why this format?**

- `kind:` prefix enables mixed-kind selection validation
- Composite part ensures uniqueness (same category under different labels = different keys)
- Human-readable for debugging

---

## Design Rationale

### Why `ancestry: string[]` instead of `parentId/grandParentId`?

- Supports arbitrary depth hierarchies
- `ancestry.at(-1)` gives parent, `ancestry.at(-2)` gives grandparent
- Adding 4th level doesn't require type changes

### Why `kind: string` instead of `"label" | "category" | "product"`?

- New entity types don't require type changes
- Action handlers use switch/if, not exhaustive checks
- More flexible for future features

### Why `childKeys: string[]` instead of computing on demand?

- O(1) lookup vs O(n) traversal
- Selection cascade is hot path
- Built once when data changes

### Why separate `key` and `entityId`?

- `key` is for React/selection (must be unique per row)
- `entityId` is for database (same entity can appear in multiple rows)
- Decouples UI identity from data identity

---

## File Locations

```text
app/admin/(product-menu)/
├── types/
│   └── identity-registry.ts      # RowIdentity, IdentityRegistry types
├── hooks/
│   ├── useIdentityRegistry.ts    # Builder functions
│   ├── useRowClickHandler.ts     # Unified click handler
│   └── useActionHandler.ts       # Action handlers using registry
└── menu-builder/
    └── components/table-views/
        └── ... (views consume registry)
```

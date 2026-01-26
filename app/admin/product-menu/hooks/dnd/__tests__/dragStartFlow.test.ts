/**
 * Unit tests for DnD drag start flow.
 *
 * Validates that:
 * 1. Unselected items get committed to selection on drag start
 * 2. The drag operation uses correct identity values
 * 3. Selection is properly tracked for restoration
 */

import { getDraggableEntities } from "../multiSelectValidation";
import type { IdentityRegistry, RowIdentity } from "../../../types/identity-registry";

// Mock registry builder
function createMockRegistry(identities: RowIdentity[]): IdentityRegistry {
  const byKey = new Map(identities.map(i => [i.key, i]));
  return {
    byKey,
    allKeys: identities.map(i => i.key),
    keysByKind: {},
    get: (key) => byKey.get(key),
    getEntityId: (key) => byKey.get(key)?.entityId,
    getKind: (key) => byKey.get(key)?.kind,
    getDepth: (key) => byKey.get(key)?.depth ?? 0,
    getParentKey: (key) => byKey.get(key)?.parentKey ?? null,
    getChildKeys: (key) => byKey.get(key)?.childKeys ?? [],
    isExpandable: (key) => byKey.get(key)?.isExpandable ?? false,
    getContainsKinds: (key) => byKey.get(key)?.containsKinds ?? [],
    canReceiveDrop: (targetKey, dragKind) => {
      const containsKinds = byKey.get(targetKey)?.containsKinds ?? [];
      return containsKinds.includes(dragKind);
    },
  };
}

describe("DnD Drag Start Flow", () => {
  // Setup: Create mock registry with labels and categories
  const mockIdentities: RowIdentity[] = [
    {
      key: "label:L1",
      kind: "label",
      entityId: "L1",
      depth: 0,
      parentKey: null,
      childKeys: ["category:L1-C1"],
      isExpandable: true,
      containsKinds: ["category"],
    },
    {
      key: "label:L2",
      kind: "label",
      entityId: "L2",
      depth: 0,
      parentKey: null,
      childKeys: [],
      isExpandable: false,
      containsKinds: ["category"],
    },
    {
      key: "category:L1-C1",
      kind: "category",
      entityId: "C1",
      depth: 1,
      parentKey: "label:L1",
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    },
  ];

  const registry = createMockRegistry(mockIdentities);

  describe("Scenario A: Drag unselected item (no prior selection)", () => {
    // Given: No items are selected
    const actionableRoots: string[] = [];
    const selectedKind: string | null = null;
    const dragStartKey = "label:L1";

    it("should return valid single-item drag", () => {
      const result = getDraggableEntities(
        actionableRoots,
        selectedKind,
        registry,
        dragStartKey
      );

      // Verify: Single item drag is valid
      expect(result.isValid).toBe(true);
      expect(result.count).toBe(1);
      expect(result.dragKind).toBe("label");
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]).toEqual({
        key: "label:L1",
        entityId: "L1",
        kind: "label",
        currentParentId: null,
      });
    });

    it("should provide correct entity info for drag operation", () => {
      const result = getDraggableEntities(
        actionableRoots,
        selectedKind,
        registry,
        dragStartKey
      );

      // The drag operation should use these values
      const draggedIds = result.entities.map(e => e.entityId);

      expect(draggedIds).toEqual(["L1"]);
    });
  });

  describe("Scenario B: Drag unselected item (with prior selection)", () => {
    // Given: L2 is already selected, user drags L1 (unselected)
    const actionableRoots = ["label:L2"];
    const selectedKind = "label";
    const dragStartKey = "label:L1"; // NOT in selection

    it("should return single-item drag for the dragged item only", () => {
      const result = getDraggableEntities(
        actionableRoots,
        selectedKind,
        registry,
        dragStartKey
      );

      // Verify: Only the dragged item, not the prior selection
      expect(result.isValid).toBe(true);
      expect(result.count).toBe(1);
      expect(result.entities[0].entityId).toBe("L1");
    });
  });

  describe("Scenario C: Drag selected item (multi-select)", () => {
    // Given: L1 and L2 are both selected, user drags L1
    const actionableRoots = ["label:L1", "label:L2"];
    const selectedKind = "label";
    const dragStartKey = "label:L1"; // IS in selection

    it("should return multi-item drag with all selected items", () => {
      const result = getDraggableEntities(
        actionableRoots,
        selectedKind,
        registry,
        dragStartKey
      );

      // Verify: All selected items are dragged
      expect(result.isValid).toBe(true);
      expect(result.count).toBe(2);
      expect(result.dragKind).toBe("label");

      const entityIds = result.entities.map(e => e.entityId);
      expect(entityIds).toContain("L1");
      expect(entityIds).toContain("L2");
    });
  });

  describe("Scenario D: Drag category (with parent info)", () => {
    const actionableRoots: string[] = [];
    const selectedKind: string | null = null;
    const dragStartKey = "category:L1-C1";

    it("should include currentParentId from registry", () => {
      const result = getDraggableEntities(
        actionableRoots,
        selectedKind,
        registry,
        dragStartKey
      );

      expect(result.isValid).toBe(true);
      expect(result.entities[0]).toEqual({
        key: "category:L1-C1",
        entityId: "C1",
        kind: "category",
        currentParentId: "L1", // Parent ID extracted from parentKey
      });
    });
  });

  describe("Scenario E: Mixed kinds in selection (invalid)", () => {
    // Given: Label and category both selected
    const actionableRoots = ["label:L1", "category:L1-C1"];
    const selectedKind: string | null = null; // Mixed = null
    const dragStartKey = "label:L1";

    it("should return invalid for mixed kinds", () => {
      const result = getDraggableEntities(
        actionableRoots,
        selectedKind,
        registry,
        dragStartKey
      );

      // Mixed kinds = invalid multi-drag
      expect(result.isValid).toBe(false);
    });
  });
});

/**
 * Test: Selection commit flow simulation
 *
 * This simulates the full drag start flow to verify selection is committed correctly.
 */
describe("Selection Commit Flow", () => {
  it("should demonstrate the correct flow for committing selection", () => {
    // Simulate the state before drag
    let selectionState = {
      selectedIds: [] as string[],
      selectedKind: null as string | null,
    };

    // Mock setSelection that updates state synchronously (for test purposes)
    const setSelection = (ids: string[]) => {
      selectionState = {
        selectedIds: ids,
        selectedKind: ids.length > 0 ? "label" : null,
      };
    };

    const itemKey = "label:L1";
    const isInCurrentSelection = selectionState.selectedIds.includes(itemKey);

    // Flow step 1: Check if in selection
    expect(isInCurrentSelection).toBe(false);

    // Flow step 2: Since NOT in selection, this is single-item drag
    // Compute what to drag BEFORE calling setSelection
    const itemsTooDrag = isInCurrentSelection
      ? [...selectionState.selectedIds]  // Multi-select
      : [itemKey];                        // Single item

    // Flow step 3: Commit to selection for visual feedback
    if (!isInCurrentSelection) {
      setSelection([itemKey]);
    }

    // Flow step 4: Verify selection was committed
    expect(selectionState.selectedIds).toEqual(["label:L1"]);

    // Flow step 5: Use pre-computed values for drag, NOT selectionState
    expect(itemsTooDrag).toEqual(["label:L1"]);

    // Key insight: itemsToDrag was computed BEFORE setSelection,
    // so it doesn't suffer from stale closure issues
  });
});

/**
 * Integration test: Simulates the actual handleDragStart flow
 *
 * This test mirrors the exact logic in useMenuTableDragReorder.handleDragStart
 * to identify where the flow might break.
 */
describe("handleDragStart Integration Flow", () => {
  // Mock registry
  const mockIdentities: RowIdentity[] = [
    {
      key: "label:L1",
      kind: "label",
      entityId: "L1",
      depth: 0,
      parentKey: null,
      childKeys: [],
      isExpandable: false,
      containsKinds: ["category"],
    },
  ];
  const registry = createMockRegistry(mockIdentities);

  it("should commit unselected item to selection and gather correct drag data", () => {
    // === SETUP: Mock selectionApi (simulates what table view provides) ===
    const capturedSetSelectionCalls: string[][] = [];

    // This simulates the STALE closure behavior - selectionApi values don't update
    // until the next render, but setSelection is called
    const selectionApi = {
      selectedIds: [] as readonly string[],  // Empty - nothing selected
      selectedKind: null as string | null,
      hasSameKindSelection: false,
      toggleSelection: jest.fn(),
      setSelection: jest.fn((keys: string[]) => {
        capturedSetSelectionCalls.push(keys);
        // Note: In real React, this would NOT update selectionApi.selectedIds
        // until the next render. selectionApi is a stale closure.
      }),
      clearSelection: jest.fn(),
    };

    const rowKey = "label:L1";

    // === STEP 1: Store previous selection ===
    const previousSelection = {
      ids: [...selectionApi.selectedIds],
      kind: selectionApi.selectedKind,
    };
    expect(previousSelection.ids).toEqual([]);

    // === STEP 2: Determine drag mode BEFORE any commits ===
    const isInCurrentSelection = selectionApi.selectedIds.includes(rowKey);
    expect(isInCurrentSelection).toBe(false);

    // === STEP 3: Validate (skipped for single-item drag) ===
    // No validation needed since isInCurrentSelection is false

    // === STEP 4: Get draggable entities with PRE-COMMIT values ===
    const currentRoots = [...selectionApi.selectedIds]; // Empty
    const currentKind = selectionApi.selectedKind;      // null

    const result = getDraggableEntities(
      currentRoots,
      currentKind,
      registry,
      rowKey
    );

    // Verify getDraggableEntities returns valid single-item drag
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].entityId).toBe("L1");

    // === STEP 5: Commit to selection for visual feedback ===
    if (!isInCurrentSelection) {
      selectionApi.setSelection([rowKey]);
    }

    // Verify setSelection was called with correct key
    expect(capturedSetSelectionCalls).toHaveLength(1);
    expect(capturedSetSelectionCalls[0]).toEqual(["label:L1"]);

    // === STEP 6: Extract drag data from result (not selectionApi!) ===
    const draggedIds = result.entities.map(e => e.entityId);
    expect(draggedIds).toEqual(["L1"]);

    // === KEY VERIFICATION ===
    // Even though selectionApi.selectedIds is still [] (stale),
    // we correctly got draggedIds from getDraggableEntities result
    expect(selectionApi.selectedIds).toEqual([]); // Still stale!
    expect(draggedIds).toEqual(["L1"]);           // Correct!
  });

  it("should NOT call setSelection when dragging already-selected item", () => {
    // Setup: Item is already selected
    const selectionApi = {
      selectedIds: ["label:L1"] as readonly string[],
      selectedKind: "label" as string | null,
      hasSameKindSelection: true,
      toggleSelection: jest.fn(),
      setSelection: jest.fn(),
      clearSelection: jest.fn(),
    };

    const rowKey = "label:L1";
    const isInCurrentSelection = selectionApi.selectedIds.includes(rowKey);

    expect(isInCurrentSelection).toBe(true);

    // For multi-select, we DON'T call setSelection
    if (!isInCurrentSelection) {
      selectionApi.setSelection([rowKey]);
    }

    // Verify setSelection was NOT called
    expect(selectionApi.setSelection).not.toHaveBeenCalled();
  });

  it("should correctly restore selection on drag end", () => {
    let currentSelection: string[] = [];

    const selectionApi = {
      selectedIds: [] as readonly string[],
      selectedKind: null as string | null,
      hasSameKindSelection: false,
      toggleSelection: jest.fn(),
      setSelection: jest.fn((keys: string[]) => {
        currentSelection = keys;
      }),
      clearSelection: jest.fn(),
    };

    // Store previous selection
    const previousSelection = [...selectionApi.selectedIds]; // []

    // Commit new selection during drag
    selectionApi.setSelection(["label:L1"]);
    expect(currentSelection).toEqual(["label:L1"]);

    // Restore on drag end
    selectionApi.setSelection(previousSelection);
    expect(currentSelection).toEqual([]);
  });
});

/**
 * Test: The CORRECT flow for single-item drag
 *
 * This demonstrates the proper synchronous flow:
 * 1. Determine what WILL be selected (compute locally)
 * 2. Commit to selection
 * 3. Use the LOCALLY COMPUTED values (not selectionApi which is stale)
 */
describe("Correct Single-Item Drag Flow", () => {
  const mockIdentities: RowIdentity[] = [
    {
      key: "label:L1",
      kind: "label",
      entityId: "L1",
      depth: 0,
      parentKey: null,
      childKeys: [],
      isExpandable: false,
      containsKinds: ["category"],
    },
  ];
  const registry = createMockRegistry(mockIdentities);

  it("should compute selection locally then commit", () => {
    // Simulate React's async state behavior
    const reactState = {
      selectedIds: [] as string[],
    };

    // This is what selectionApi looks like - a SNAPSHOT of state at render time
    const selectionApiSnapshot = {
      selectedIds: [...reactState.selectedIds], // Snapshot!
      setSelection: (keys: string[]) => {
        // This updates React state, but selectionApiSnapshot.selectedIds
        // won't reflect this until next render
        reactState.selectedIds = keys;
      },
    };

    const rowKey = "label:L1";

    // === THE CORRECT FLOW ===

    // Step 1: Check if in current selection (using snapshot)
    const isInSelection = selectionApiSnapshot.selectedIds.includes(rowKey);
    expect(isInSelection).toBe(false);

    // Step 2: COMPUTE what the new selection SHOULD be
    // This is key: we compute locally, don't rely on post-commit state
    const newSelectionForDrag = isInSelection
      ? [...selectionApiSnapshot.selectedIds]  // Multi-select: use current
      : [rowKey];                               // Single: just this item

    // Step 3: Commit to selection (for visual feedback)
    selectionApiSnapshot.setSelection(newSelectionForDrag);

    // Step 4: Verify React state updated
    expect(reactState.selectedIds).toEqual(["label:L1"]);

    // Step 5: BUT selectionApiSnapshot is STILL stale!
    expect(selectionApiSnapshot.selectedIds).toEqual([]); // Stale!

    // Step 6: Use our locally computed value for drag operation
    const dragKeys = newSelectionForDrag;
    expect(dragKeys).toEqual(["label:L1"]); // Correct!

    // === KEY INSIGHT ===
    // We CANNOT use selectionApiSnapshot.selectedIds after setSelection
    // because it's a stale closure. We MUST use our locally computed value.
  });

  it("should get identity from registry using computed selection", () => {
    const rowKey = "label:L1";

    // For single item drag, we know the selection will be [rowKey]
    const _computedSelection = [rowKey];

    // Get identity from registry
    const identity = registry.get(rowKey);
    expect(identity).toBeDefined();
    expect(identity?.entityId).toBe("L1");

    // Build drag info from identity
    const draggedIds = [identity!.entityId];
    expect(draggedIds).toEqual(["L1"]);

    // This is exactly what getDraggableEntities does internally
    const result = getDraggableEntities([], null, registry, rowKey);
    expect(result.entities[0].entityId).toBe("L1");
  });
});

/**
 * Test: Edge case - entity not in registry
 *
 * If the dragged item isn't in the registry, getDraggableEntities returns invalid.
 * This would cause the drag to fail silently without committing to selection.
 */
describe("Edge Case: Entity Not In Registry", () => {
  it("should return invalid when entity key not found in registry", () => {
    // Empty registry
    const emptyRegistry = createMockRegistry([]);

    const rowKey = "label:UNKNOWN";

    const result = getDraggableEntities([], null, emptyRegistry, rowKey);

    // Should be invalid - can't drag what doesn't exist
    expect(result.isValid).toBe(false);
    expect(result.entities).toHaveLength(0);
  });

  it("should demonstrate failure path: setSelection never called if entity not in registry", () => {
    const emptyRegistry = createMockRegistry([]);
    let setSelectionCalled = false;

    const selectionApi = {
      selectedIds: [] as readonly string[],
      setSelection: (_keys: string[]) => { setSelectionCalled = true; },
    };

    const rowKey = "label:UNKNOWN";
    const _isInCurrentSelection = selectionApi.selectedIds.includes(rowKey);

    // Get draggable entities - will fail because entity not in registry
    const result = getDraggableEntities([], null, emptyRegistry, rowKey);

    // Early return if invalid
    if (!result.isValid) {
      // This is where the real code returns early
      // setSelection is NEVER called
      expect(setSelectionCalled).toBe(false);
      return;
    }

    // This code never runs
    selectionApi.setSelection([rowKey]);
    expect(setSelectionCalled).toBe(true);
  });
});

/**
 * Test: Verify the exact key format matching
 *
 * The registry key MUST match the drag key exactly.
 */
describe("Key Format Matching", () => {
  it("should match label key format: label:{id}", () => {
    const identity: RowIdentity = {
      key: "label:abc123",
      kind: "label",
      entityId: "abc123",
      depth: 0,
      parentKey: null,
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    };

    const registry = createMockRegistry([identity]);

    // This is how the table view builds the key
    const rowKey = `label:abc123`;

    // Should find it
    expect(registry.get(rowKey)).toBeDefined();
    expect(registry.get(rowKey)?.entityId).toBe("abc123");
  });

  it("should match category key format: category:{labelId}-{categoryId}", () => {
    const identity: RowIdentity = {
      key: "category:L1-C1",
      kind: "category",
      entityId: "C1",
      depth: 1,
      parentKey: "label:L1",
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    };

    const registry = createMockRegistry([identity]);

    // This is how the table view builds the key
    const rowKey = `category:L1-C1`;

    // Should find it
    expect(registry.get(rowKey)).toBeDefined();
    expect(registry.get(rowKey)?.entityId).toBe("C1");
  });
});

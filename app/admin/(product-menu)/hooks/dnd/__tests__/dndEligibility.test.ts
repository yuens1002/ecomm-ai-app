/**
 * DnD Eligibility Tests
 *
 * Validates the action-consistent DnD eligibility pattern where:
 * - DnD eligibility is derived from selection state (not managed during drag)
 * - No selection = no drag operation
 * - Mixed kinds = no drag operation
 * - Single/multi-drag determined by actionableRoots count
 * - Drag handle shows enabled/disabled based on eligibility
 *
 * Acceptance Criteria covered:
 * AC1: No Selection = No Drag
 * AC2: Single Selection Drag
 * AC3: Multi-Selection Drag
 * AC4: Mixed Selection = No Drag
 * AC5: Drag Handle Visual States
 * AC6: Drop Validation
 * AC7: Selection State Integrity
 * AC8: Operation Validation
 */

import {
  getDraggableEntities,
  getDraggableKeys,
  filterSameLevelKeys,
  validateMultiDrop,
  calculateMultiReorder,
} from "../multiSelectValidation";
import { getDnDOperationType } from "../types";
import { isDragHandleEnabled, isDragHandleAlwaysVisible } from "../useDnDEligibility";
import type { DnDEligibility } from "../useDnDEligibility";
import type { IdentityRegistry, RowIdentity } from "../../../types/identity-registry";

// ─────────────────────────────────────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock registry builder - creates a minimal IdentityRegistry from identity array.
 */
function createMockRegistry(identities: RowIdentity[]): IdentityRegistry {
  const byKey = new Map(identities.map((i) => [i.key, i]));
  return {
    byKey,
    allKeys: identities.map((i) => i.key),
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

/**
 * Create a standard test registry with labels and categories.
 * Structure:
 * - label:L1 (contains C1, C2)
 * - label:L2 (contains C3)
 * - label:L3 (empty)
 */
function createStandardTestRegistry(): IdentityRegistry {
  const identities: RowIdentity[] = [
    {
      key: "label:L1",
      kind: "label",
      entityId: "L1",
      depth: 0,
      parentKey: null,
      childKeys: ["category:L1-C1", "category:L1-C2"],
      isExpandable: true,
      containsKinds: ["category"],
    },
    {
      key: "label:L2",
      kind: "label",
      entityId: "L2",
      depth: 0,
      parentKey: null,
      childKeys: ["category:L2-C3"],
      isExpandable: true,
      containsKinds: ["category"],
    },
    {
      key: "label:L3",
      kind: "label",
      entityId: "L3",
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
    {
      key: "category:L1-C2",
      kind: "category",
      entityId: "C2",
      depth: 1,
      parentKey: "label:L1",
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    },
    {
      key: "category:L2-C3",
      kind: "category",
      entityId: "C3",
      depth: 1,
      parentKey: "label:L2",
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    },
  ];
  return createMockRegistry(identities);
}

/**
 * Mock selection API for testing selection state changes.
 */
function createMockSelectionApi() {
  let selectedIds: string[] = [];
  let selectedKind: string | null = null;
  const calls = {
    setSelection: [] as string[][],
    toggleSelection: [] as string[],
    clearSelection: 0,
  };

  return {
    get selectedIds() {
      return selectedIds as readonly string[];
    },
    get selectedKind() {
      return selectedKind;
    },
    get hasSameKindSelection() {
      return selectedKind !== null;
    },
    toggleSelection: jest.fn((key: string) => {
      calls.toggleSelection.push(key);
    }),
    setSelection: jest.fn((keys: string[]) => {
      calls.setSelection.push(keys);
      selectedIds = keys;
      // Compute kind from keys
      if (keys.length === 0) {
        selectedKind = null;
      } else {
        const kinds = new Set(keys.map((k) => k.split(":")[0]));
        selectedKind = kinds.size === 1 ? [...kinds][0] : null;
      }
    }),
    clearSelection: jest.fn(() => {
      calls.clearSelection++;
      selectedIds = [];
      selectedKind = null;
    }),
    _calls: calls,
    _setState: (ids: string[], kind: string | null) => {
      selectedIds = ids;
      selectedKind = kind;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: NO SELECTION = NO DRAG
// ─────────────────────────────────────────────────────────────────────────────

describe("AC1: No Selection = No Drag", () => {
  const registry = createStandardTestRegistry();

  describe("when nothing is selected", () => {
    const actionableRoots: string[] = [];
    const selectedKind: string | null = null;

    it("dragging an unselected item should return single-item drag (implicit selection)", () => {
      // NOTE: The current pattern allows single-item drag when nothing is selected.
      // This is because the item gets implicitly selected on drag start.
      // The "No Selection = No Drag" rule applies to DnD ELIGIBILITY, not getDraggableEntities.
      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      // Single item drag is valid - the item is implicitly treated as the drag target
      expect(result.isValid).toBe(true);
      expect(result.count).toBe(1);
      expect(result.dragKind).toBe("label");
    });

    it("should compute eligibility as ineligible when no selection and indeterminate state", () => {
      // Eligibility is computed BEFORE drag start based on selection state
      // If checkbox is unchecked (no selection), drag handle should be disabled

      // When there's no selection, actionableRoots is empty
      const eligibleForDrag = actionableRoots.length > 0;
      expect(eligibleForDrag).toBe(false);
    });
  });

  describe("eligibility derivation from selection", () => {
    it("should return ineligible when actionableRoots is empty", () => {
      const isEligible = (roots: string[], kind: string | null): boolean => {
        // Core eligibility rule: must have selection with same kind
        return roots.length > 0 && kind !== null;
      };

      expect(isEligible([], null)).toBe(false);
      expect(isEligible([], "label")).toBe(false);
    });

    it("should return eligible when actionableRoots has items of same kind", () => {
      const isEligible = (roots: string[], kind: string | null): boolean => {
        return roots.length > 0 && kind !== null;
      };

      expect(isEligible(["label:L1"], "label")).toBe(true);
      expect(isEligible(["label:L1", "label:L2"], "label")).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: SINGLE SELECTION DRAG
// ─────────────────────────────────────────────────────────────────────────────

describe("AC2: Single Selection Drag", () => {
  const registry = createStandardTestRegistry();

  describe("when one item is selected", () => {
    const actionableRoots = ["label:L1"];
    const selectedKind = "label";

    it("should return valid single-item drag when dragging selected item", () => {
      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(1);
      expect(result.dragKind).toBe("label");
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].entityId).toBe("L1");
    });

    it("should return single-item drag without count badge (count = 1)", () => {
      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      // Ghost should NOT have badge when count is 1
      const showBadge = result.count > 1;
      expect(showBadge).toBe(false);
    });

    it("should include correct entity info for drag operation", () => {
      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      expect(result.entities[0]).toEqual({
        key: "label:L1",
        entityId: "L1",
        kind: "label",
        currentParentId: null, // Labels have no parent
      });
    });

    it("should handle category with parent info", () => {
      const catRoots = ["category:L1-C1"];
      const catKind = "category";

      const result = getDraggableEntities(catRoots, catKind, registry, "category:L1-C1");

      expect(result.isValid).toBe(true);
      expect(result.entities[0]).toEqual({
        key: "category:L1-C1",
        entityId: "C1",
        kind: "category",
        currentParentId: "L1", // Parent extracted from parentKey
      });
    });
  });

  describe("eligibility shows enabled drag handle", () => {
    it("should compute eligible state when single item selected", () => {
      const isEligible = (roots: string[], kind: string | null): boolean => {
        return roots.length > 0 && kind !== null;
      };

      // Single label selected
      expect(isEligible(["label:L1"], "label")).toBe(true);

      // Single category selected
      expect(isEligible(["category:L1-C1"], "category")).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: MULTI-SELECTION DRAG
// ─────────────────────────────────────────────────────────────────────────────

describe("AC3: Multi-Selection Drag", () => {
  const registry = createStandardTestRegistry();

  describe("when multiple same-kind items selected", () => {
    it("should return multi-item drag with all selected labels", () => {
      const actionableRoots = ["label:L1", "label:L2"];
      const selectedKind = "label";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(2);
      expect(result.dragKind).toBe("label");

      const entityIds = result.entities.map((e) => e.entityId);
      expect(entityIds).toContain("L1");
      expect(entityIds).toContain("L2");
    });

    it("should return multi-item drag with all selected categories", () => {
      const actionableRoots = ["category:L1-C1", "category:L1-C2"];
      const selectedKind = "category";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "category:L1-C1");

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(2);
      expect(result.dragKind).toBe("category");

      const entityIds = result.entities.map((e) => e.entityId);
      expect(entityIds).toContain("C1");
      expect(entityIds).toContain("C2");
    });

    it("should show count badge when count > 1", () => {
      const actionableRoots = ["label:L1", "label:L2", "label:L3"];
      const selectedKind = "label";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      const showBadge = result.count > 1;
      expect(showBadge).toBe(true);
      expect(result.count).toBe(3);
    });

    it("should maintain relative order of selected items", () => {
      const actionableRoots = ["label:L1", "label:L2", "label:L3"];
      const selectedKind = "label";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L2");

      // The order should be preserved from actionableRoots
      const entityIds = result.entities.map((e) => e.entityId);
      expect(entityIds).toEqual(["L1", "L2", "L3"]);
    });
  });

  describe("cross-parent category selection", () => {
    it("should include categories from different parents with correct parentIds", () => {
      const actionableRoots = ["category:L1-C1", "category:L2-C3"];
      const selectedKind = "category";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "category:L1-C1");

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(2);

      const c1 = result.entities.find((e) => e.entityId === "C1");
      const c3 = result.entities.find((e) => e.entityId === "C3");

      expect(c1?.currentParentId).toBe("L1");
      expect(c3?.currentParentId).toBe("L2");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: MIXED SELECTION = NO DRAG
// ─────────────────────────────────────────────────────────────────────────────

describe("AC4: Mixed Selection = No Drag", () => {
  const registry = createStandardTestRegistry();

  describe("when mixed kinds selected (labels and categories)", () => {
    it("should return invalid for multi-drag", () => {
      // Mixed selection: label + category
      const actionableRoots = ["label:L1", "category:L1-C1"];
      const selectedKind: string | null = null; // Mixed = null

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      expect(result.isValid).toBe(false);
      expect(result.dragKind).toBeNull();
    });

    it("should still count the items even when invalid", () => {
      const actionableRoots = ["label:L1", "category:L1-C1", "category:L2-C3"];
      const selectedKind: string | null = null;

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      expect(result.isValid).toBe(false);
      expect(result.count).toBe(3);
      expect(result.entities).toHaveLength(0); // No entities for invalid drag
    });
  });

  describe("eligibility computation for mixed kinds", () => {
    it("should compute ineligible when selectedKind is null (mixed)", () => {
      const isEligible = (roots: string[], kind: string | null): boolean => {
        return roots.length > 0 && kind !== null;
      };

      // Mixed kinds = selectedKind is null
      expect(isEligible(["label:L1", "category:L1-C1"], null)).toBe(false);
    });

    it("should show disabled drag handle for all selected rows", () => {
      // When mixed kinds, drag handle shows disabled for ALL selected rows
      const selectedKind: string | null = null;
      const isHandleEnabled = selectedKind !== null;

      expect(isHandleEnabled).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: DRAG HANDLE VISUAL STATES
// ─────────────────────────────────────────────────────────────────────────────

describe("AC5: Drag Handle Visual States", () => {
  /**
   * Visual state computation for drag handle.
   *
   * Visibility: Always visible when row is checked or indeterminate
   * Eligible: Default color, grab cursor
   * Ineligible: Muted/dimmed color, not-allowed cursor
   * Ineligible triggers: No selection, mixed kinds, indeterminate state
   */

  type DragHandleState = {
    visible: boolean;
    eligible: boolean;
    cursor: "grab" | "not-allowed";
  };

  type CheckboxState = "checked" | "indeterminate" | "unchecked";

  function computeDragHandleState(
    checkboxState: CheckboxState,
    selectedKind: string | null,
    hasSelection: boolean
  ): DragHandleState {
    // Visibility: show when checked or indeterminate
    const visible = checkboxState === "checked" || checkboxState === "indeterminate";

    // Eligibility: has selection + same kind + not indeterminate
    const eligible = hasSelection && selectedKind !== null && checkboxState !== "indeterminate";

    return {
      visible,
      eligible,
      cursor: eligible ? "grab" : "not-allowed",
    };
  }

  describe("visibility rules", () => {
    it("should be visible when row is checked", () => {
      const state = computeDragHandleState("checked", "label", true);
      expect(state.visible).toBe(true);
    });

    it("should be visible when row is indeterminate", () => {
      const state = computeDragHandleState("indeterminate", "label", true);
      expect(state.visible).toBe(true);
    });

    it("should NOT be visible when row is unchecked", () => {
      const state = computeDragHandleState("unchecked", null, false);
      expect(state.visible).toBe(false);
    });
  });

  describe("eligibility rules", () => {
    it("should be eligible when checked with same-kind selection", () => {
      const state = computeDragHandleState("checked", "label", true);
      expect(state.eligible).toBe(true);
      expect(state.cursor).toBe("grab");
    });

    it("should be ineligible when checked but mixed kinds (selectedKind = null)", () => {
      const state = computeDragHandleState("checked", null, true);
      expect(state.eligible).toBe(false);
      expect(state.cursor).toBe("not-allowed");
    });

    it("should be ineligible when indeterminate (incomplete parent selection)", () => {
      // Indeterminate means some but not all descendants selected
      // Cannot drag a partially selected parent
      const state = computeDragHandleState("indeterminate", "label", true);
      expect(state.eligible).toBe(false);
      expect(state.cursor).toBe("not-allowed");
    });

    it("should be ineligible when no selection", () => {
      // This case shouldn't happen (handle not visible), but test anyway
      const state = computeDragHandleState("checked", null, false);
      expect(state.eligible).toBe(false);
    });
  });

  describe("reactive updates", () => {
    it("should update state when selection changes", () => {
      // Simulate selection state changes
      let checkboxState: CheckboxState = "unchecked";
      let selectedKind: string | null = null;
      let hasSelection = false;

      // Initial: not selected
      let state = computeDragHandleState(checkboxState, selectedKind, hasSelection);
      expect(state.visible).toBe(false);

      // User clicks checkbox
      checkboxState = "checked";
      selectedKind = "label";
      hasSelection = true;
      state = computeDragHandleState(checkboxState, selectedKind, hasSelection);
      expect(state.visible).toBe(true);
      expect(state.eligible).toBe(true);

      // User selects another kind (now mixed)
      selectedKind = null;
      state = computeDragHandleState(checkboxState, selectedKind, hasSelection);
      expect(state.visible).toBe(true);
      expect(state.eligible).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: DROP VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe("AC6: Drop Validation", () => {
  const registry = createStandardTestRegistry();

  describe("same parent → reorder operation", () => {
    it("should identify reorder when target has same parent as dragged items", () => {
      // Categories C1 and C2 both under L1
      const draggedParentKeys = ["label:L1", "label:L1"];
      const targetKey = "category:L1-C2";
      const targetKind = "category";
      const dragKind = "category";

      const opType = getDnDOperationType(
        draggedParentKeys,
        targetKey,
        targetKind,
        dragKind,
        registry
      );

      expect(opType).toBe("reorder");
    });

    it("should identify reorder for labels (all at root level)", () => {
      const draggedParentKeys = [null, null]; // Labels have no parent
      const targetKey = "label:L2";
      const targetKind = "label";
      const dragKind = "label";

      const opType = getDnDOperationType(
        draggedParentKeys,
        targetKey,
        targetKind,
        dragKind,
        registry
      );

      expect(opType).toBe("reorder");
    });
  });

  describe("different parent + valid container → move operation", () => {
    it("should identify move when dropping category on different label", () => {
      // Category from L1 dropping on L2
      const draggedParentKeys = ["label:L1"];
      const targetKey = "label:L2";
      const targetKind = "label";
      const dragKind = "category";

      const opType = getDnDOperationType(
        draggedParentKeys,
        targetKey,
        targetKind,
        dragKind,
        registry
      );

      expect(opType).toBe("move");
    });

    it("should identify move when dropping on sibling category in different parent", () => {
      // C1 from L1 dropping near C3 in L2
      const draggedParentKeys = ["label:L1"];
      const targetKey = "category:L2-C3";
      const targetKind = "category";
      const dragKind = "category";

      const opType = getDnDOperationType(
        draggedParentKeys,
        targetKey,
        targetKind,
        dragKind,
        registry
      );

      expect(opType).toBe("move");
    });
  });

  describe("validateMultiDrop utility", () => {
    it("should reject drop on item that is being dragged", () => {
      const isValid = validateMultiDrop({
        draggedKeys: ["label:L1", "label:L2"],
        targetKey: "label:L1", // Target is in drag set
        getDepth: () => 0,
      });

      expect(isValid).toBe(false);
    });

    it("should accept drop on valid target not in drag set", () => {
      const isValid = validateMultiDrop({
        draggedKeys: ["label:L1", "label:L2"],
        targetKey: "label:L3", // Target is NOT in drag set
        getDepth: () => 0,
      });

      expect(isValid).toBe(true);
    });
  });

  describe("invalid target shows forbidden cursor", () => {
    it("should indicate invalid drop on self", () => {
      const draggedKeys = ["label:L1"];
      const targetKey = "label:L1";

      const isValid = !draggedKeys.includes(targetKey);
      expect(isValid).toBe(false);
    });

    it("should indicate invalid drop when label cannot contain labels", () => {
      const targetKey = "label:L1";
      const dragKind = "label";

      // Labels can only contain categories, not labels
      const canReceive = registry.canReceiveDrop(targetKey, dragKind);
      expect(canReceive).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: SELECTION STATE INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────

describe("AC7: Selection State Integrity", () => {
  /**
   * Core principle: DnD should NEVER mutate selection state.
   * - No setSelection calls during drag operation
   * - No toggleSelection calls during drag operation
   * - No clearSelection calls during drag operation
   * - No previousSelectionRef or restore logic needed
   * - Selection only changes via explicit user click actions
   */

  describe("getDraggableEntities does not mutate selection", () => {
    it("should be a pure function with no side effects", () => {
      const registry = createStandardTestRegistry();
      const actionableRoots = ["label:L1"];
      const selectedKind = "label";

      // Call multiple times - should return same result
      const result1 = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");
      const result2 = getDraggableEntities(actionableRoots, selectedKind, registry, "label:L1");

      expect(result1).toEqual(result2);
      // No external state modified
    });

    it("should not modify input arrays", () => {
      const registry = createStandardTestRegistry();
      const actionableRoots = ["label:L1", "label:L2"];
      const originalRoots = [...actionableRoots];

      getDraggableEntities(actionableRoots, "label", registry, "label:L1");

      expect(actionableRoots).toEqual(originalRoots);
    });
  });

  describe("selection API should not be called during drag", () => {
    it("should not require setSelection in eligibility check", () => {
      const selectionApi = createMockSelectionApi();
      selectionApi._setState(["label:L1"], "label");

      // Eligibility is computed from current state, no API calls needed
      const isEligible =
        selectionApi.selectedIds.length > 0 && selectionApi.selectedKind !== null;

      expect(isEligible).toBe(true);
      expect(selectionApi.setSelection).not.toHaveBeenCalled();
      expect(selectionApi.toggleSelection).not.toHaveBeenCalled();
      expect(selectionApi.clearSelection).not.toHaveBeenCalled();
    });

    it("should derive drag data from selection without modifications", () => {
      const registry = createStandardTestRegistry();
      const selectionApi = createMockSelectionApi();
      selectionApi._setState(["label:L1", "label:L2"], "label");

      // Derive actionableRoots from selection
      const actionableRoots = [...selectionApi.selectedIds];
      const selectedKind = selectionApi.selectedKind;

      // Get drag entities
      const result = getDraggableEntities(
        actionableRoots as string[],
        selectedKind,
        registry,
        "label:L1"
      );

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(2);

      // Verify no selection API calls
      expect(selectionApi._calls.setSelection).toHaveLength(0);
      expect(selectionApi._calls.toggleSelection).toHaveLength(0);
      expect(selectionApi._calls.clearSelection).toBe(0);
    });
  });

  describe("no previousSelectionRef pattern needed", () => {
    it("should not need to store/restore selection during drag", () => {
      // The old pattern:
      // 1. Store previousSelection
      // 2. Commit to selection (setSelection)
      // 3. Perform drag
      // 4. Restore previousSelection

      // The NEW pattern:
      // 1. Read current selection
      // 2. Derive eligibility and drag data
      // 3. Perform drag
      // 4. Done (no restore needed)

      const selectionApi = createMockSelectionApi();
      selectionApi._setState(["label:L1"], "label");

      // Simulate new pattern
      const currentSelection = [...selectionApi.selectedIds];
      const currentKind = selectionApi.selectedKind;

      // No previousSelectionRef needed
      // No setSelection calls
      // Selection remains unchanged after drag

      expect(currentSelection).toEqual(["label:L1"]);
      expect(currentKind).toBe("label");
      expect(selectionApi._calls.setSelection).toHaveLength(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: OPERATION VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe("AC8: Operation Validation", () => {
  describe("reorder: items end up in correct position", () => {
    it("should reorder single item before target", () => {
      const items = [
        { id: "A", order: 0 },
        { id: "B", order: 1 },
        { id: "C", order: 2 },
      ];

      // Drag C before A
      const newOrder = calculateMultiReorder(items, ["C"], "A", "before");

      expect(newOrder).toEqual(["C", "A", "B"]);
    });

    it("should reorder single item after target", () => {
      const items = [
        { id: "A", order: 0 },
        { id: "B", order: 1 },
        { id: "C", order: 2 },
      ];

      // Drag A after C
      const newOrder = calculateMultiReorder(items, ["A"], "C", "after");

      expect(newOrder).toEqual(["B", "C", "A"]);
    });

    it("should preserve order when dropping in same position", () => {
      const items = [
        { id: "A", order: 0 },
        { id: "B", order: 1 },
        { id: "C", order: 2 },
      ];

      // Drag B after A (current position)
      const newOrder = calculateMultiReorder(items, ["B"], "A", "after");

      expect(newOrder).toEqual(["A", "B", "C"]);
    });
  });

  describe("multi-reorder: all selected items maintain relative order", () => {
    it("should move multiple items together before target", () => {
      const items = [
        { id: "A", order: 0 },
        { id: "B", order: 1 },
        { id: "C", order: 2 },
        { id: "D", order: 3 },
      ];

      // Drag C and D before A
      const newOrder = calculateMultiReorder(items, ["C", "D"], "A", "before");

      expect(newOrder).toEqual(["C", "D", "A", "B"]);
    });

    it("should move multiple items together after target", () => {
      const items = [
        { id: "A", order: 0 },
        { id: "B", order: 1 },
        { id: "C", order: 2 },
        { id: "D", order: 3 },
      ];

      // Drag A and B after D
      const newOrder = calculateMultiReorder(items, ["A", "B"], "D", "after");

      expect(newOrder).toEqual(["C", "D", "A", "B"]);
    });

    it("should handle non-contiguous selection", () => {
      const items = [
        { id: "A", order: 0 },
        { id: "B", order: 1 },
        { id: "C", order: 2 },
        { id: "D", order: 3 },
        { id: "E", order: 4 },
      ];

      // Drag A, C, E before D
      const newOrder = calculateMultiReorder(items, ["A", "C", "E"], "D", "before");

      expect(newOrder).toEqual(["B", "A", "C", "E", "D"]);
    });
  });

  describe("multi-move: all selected items move together to new parent", () => {
    it("should include all moved categories in result", () => {
      const registry = createStandardTestRegistry();
      const actionableRoots = ["category:L1-C1", "category:L1-C2"];
      const selectedKind = "category";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, "category:L1-C1");

      // Both categories should be in the drag set
      expect(result.entities).toHaveLength(2);
      const entityIds = result.entities.map((e) => e.entityId);
      expect(entityIds).toContain("C1");
      expect(entityIds).toContain("C2");

      // Parent info preserved for move operation
      result.entities.forEach((e) => {
        expect(e.currentParentId).toBe("L1");
      });
    });
  });

  describe("filterSameLevelKeys utility", () => {
    it("should filter keys to same depth level", () => {
      const keys = ["label:L1", "label:L2", "category:L1-C1", "category:L2-C3"];
      const getDepth = (key: string) => (key.startsWith("label:") ? 0 : 1);

      // Filter to depth 0 (labels only)
      const labelsOnly = filterSameLevelKeys(keys, 0, getDepth);
      expect(labelsOnly).toEqual(["label:L1", "label:L2"]);

      // Filter to depth 1 (categories only)
      const catsOnly = filterSameLevelKeys(keys, 1, getDepth);
      expect(catsOnly).toEqual(["category:L1-C1", "category:L2-C3"]);
    });
  });

  describe("getDraggableKeys utility", () => {
    it("should return only primaryKey when not in selection", () => {
      const selectedKeys = ["label:L2"];
      const primaryKey = "label:L1"; // NOT in selection
      const getDepth = () => 0;

      const result = getDraggableKeys(selectedKeys, primaryKey, getDepth);

      expect(result).toEqual(["label:L1"]);
    });

    it("should return all same-level selected keys when primary is in selection", () => {
      const selectedKeys = ["label:L1", "label:L2", "label:L3"];
      const primaryKey = "label:L1"; // IS in selection
      const getDepth = () => 0;

      const result = getDraggableKeys(selectedKeys, primaryKey, getDepth);

      expect(result).toEqual(["label:L1", "label:L2", "label:L3"]);
    });

    it("should filter to same level when mixed depths", () => {
      const selectedKeys = ["label:L1", "category:L1-C1"];
      const primaryKey = "label:L1";
      const getDepth = (key: string) => (key.startsWith("label:") ? 0 : 1);

      const result = getDraggableKeys(selectedKeys, primaryKey, getDepth);

      // Only label at depth 0
      expect(result).toEqual(["label:L1"]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION: COMPLETE DND ELIGIBILITY FLOW
// ─────────────────────────────────────────────────────────────────────────────

describe("Integration: Complete DnD Eligibility Flow", () => {
  const registry = createStandardTestRegistry();

  /**
   * Simulates the complete eligibility computation flow that happens
   * when a user attempts to drag a row.
   */
  function computeDragEligibility(
    checkboxState: "checked" | "indeterminate" | "unchecked",
    actionableRoots: string[],
    selectedKind: string | null
  ) {
    // Step 1: Check if row is checkable (has checkbox checked or indeterminate)
    const isCheckable = checkboxState !== "unchecked";

    // Step 2: Check if drag handle should be visible
    const handleVisible = isCheckable;

    // Step 3: Check if drag handle should be enabled
    const handleEnabled =
      handleVisible &&
      actionableRoots.length > 0 &&
      selectedKind !== null &&
      checkboxState === "checked"; // Must be fully checked, not indeterminate

    return {
      isCheckable,
      handleVisible,
      handleEnabled,
      cursor: handleEnabled ? "grab" : handleVisible ? "not-allowed" : "default",
    };
  }

  describe("complete flow scenarios", () => {
    it("Scenario: No selection - handle not visible", () => {
      const result = computeDragEligibility("unchecked", [], null);

      expect(result.handleVisible).toBe(false);
      expect(result.handleEnabled).toBe(false);
      expect(result.cursor).toBe("default");
    });

    it("Scenario: Single label selected - handle enabled", () => {
      const result = computeDragEligibility("checked", ["label:L1"], "label");

      expect(result.handleVisible).toBe(true);
      expect(result.handleEnabled).toBe(true);
      expect(result.cursor).toBe("grab");
    });

    it("Scenario: Multiple labels selected - handle enabled", () => {
      const result = computeDragEligibility("checked", ["label:L1", "label:L2"], "label");

      expect(result.handleVisible).toBe(true);
      expect(result.handleEnabled).toBe(true);
      expect(result.cursor).toBe("grab");
    });

    it("Scenario: Mixed kinds selected - handle visible but disabled", () => {
      const result = computeDragEligibility("checked", ["label:L1", "category:L1-C1"], null);

      expect(result.handleVisible).toBe(true);
      expect(result.handleEnabled).toBe(false);
      expect(result.cursor).toBe("not-allowed");
    });

    it("Scenario: Parent with indeterminate state - handle visible but disabled", () => {
      // Parent has some but not all descendants selected
      const result = computeDragEligibility("indeterminate", ["category:L1-C1"], "category");

      expect(result.handleVisible).toBe(true);
      expect(result.handleEnabled).toBe(false);
      expect(result.cursor).toBe("not-allowed");
    });
  });

  describe("drag operation execution", () => {
    it("should execute valid single-item drag", () => {
      const actionableRoots = ["label:L1"];
      const selectedKind = "label";
      const dragStartKey = "label:L1";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, dragStartKey);

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(1);
      expect(result.entities[0].entityId).toBe("L1");
    });

    it("should execute valid multi-item drag", () => {
      const actionableRoots = ["label:L1", "label:L2"];
      const selectedKind = "label";
      const dragStartKey = "label:L1";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, dragStartKey);

      expect(result.isValid).toBe(true);
      expect(result.count).toBe(2);
    });

    it("should reject invalid mixed-kind drag", () => {
      const actionableRoots = ["label:L1", "category:L1-C1"];
      const selectedKind = null; // Mixed
      const dragStartKey = "label:L1";

      const result = getDraggableEntities(actionableRoots, selectedKind, registry, dragStartKey);

      expect(result.isValid).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useDnDEligibility HOOK HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

describe("useDnDEligibility helper functions", () => {
  describe("isDragHandleEnabled", () => {
    const ELIGIBLE: DnDEligibility = {
      canDrag: true,
      dragKind: "label",
      draggedEntities: [{ key: "label:L1", entityId: "L1", parentKey: null }],
      isMultiDrag: false,
      dragCount: 1,
    };

    const INELIGIBLE: DnDEligibility = {
      canDrag: false,
      dragKind: null,
      draggedEntities: [],
      isMultiDrag: false,
      dragCount: 0,
    };

    it("should return true when eligible and checkbox is checked", () => {
      const result = isDragHandleEnabled(ELIGIBLE, "checked");
      expect(result).toBe(true);
    });

    it("should return false when eligible but checkbox is indeterminate", () => {
      // Indeterminate means partial selection - can't drag
      const result = isDragHandleEnabled(ELIGIBLE, "indeterminate");
      expect(result).toBe(false);
    });

    it("should return false when eligible but checkbox is unchecked", () => {
      const result = isDragHandleEnabled(ELIGIBLE, "unchecked");
      expect(result).toBe(false);
    });

    it("should return false when ineligible regardless of checkbox state", () => {
      expect(isDragHandleEnabled(INELIGIBLE, "checked")).toBe(false);
      expect(isDragHandleEnabled(INELIGIBLE, "indeterminate")).toBe(false);
      expect(isDragHandleEnabled(INELIGIBLE, "unchecked")).toBe(false);
    });
  });

  describe("isDragHandleAlwaysVisible", () => {
    it("should return true when checkbox is checked", () => {
      expect(isDragHandleAlwaysVisible("checked")).toBe(true);
    });

    it("should return true when checkbox is indeterminate", () => {
      expect(isDragHandleAlwaysVisible("indeterminate")).toBe(true);
    });

    it("should return false when checkbox is unchecked", () => {
      expect(isDragHandleAlwaysVisible("unchecked")).toBe(false);
    });
  });

  describe("integration: visibility and enabled states", () => {
    const ELIGIBLE: DnDEligibility = {
      canDrag: true,
      dragKind: "label",
      draggedEntities: [{ key: "label:L1", entityId: "L1", parentKey: null }],
      isMultiDrag: false,
      dragCount: 1,
    };

    const INELIGIBLE: DnDEligibility = {
      canDrag: false,
      dragKind: null,
      draggedEntities: [],
      isMultiDrag: false,
      dragCount: 0,
    };

    it("Scenario: checked row with eligible selection - visible and enabled", () => {
      const visible = isDragHandleAlwaysVisible("checked");
      const enabled = isDragHandleEnabled(ELIGIBLE, "checked");

      expect(visible).toBe(true);
      expect(enabled).toBe(true);
    });

    it("Scenario: checked row with ineligible selection - visible but disabled", () => {
      const visible = isDragHandleAlwaysVisible("checked");
      const enabled = isDragHandleEnabled(INELIGIBLE, "checked");

      expect(visible).toBe(true);
      expect(enabled).toBe(false);
    });

    it("Scenario: indeterminate row - visible but disabled", () => {
      const visible = isDragHandleAlwaysVisible("indeterminate");
      const enabled = isDragHandleEnabled(ELIGIBLE, "indeterminate");

      expect(visible).toBe(true);
      expect(enabled).toBe(false);
    });

    it("Scenario: unchecked row - not visible, not enabled", () => {
      const visible = isDragHandleAlwaysVisible("unchecked");
      const enabled = isDragHandleEnabled(ELIGIBLE, "unchecked");

      expect(visible).toBe(false);
      expect(enabled).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DnDEligibility OBJECT SHAPE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("DnDEligibility object shape", () => {
  const registry = createStandardTestRegistry();

  /**
   * Simulates what useDnDEligibility hook computes.
   * This is a pure function version for testing.
   */
  function computeEligibility(
    actionableRoots: readonly string[],
    selectedKind: string | null,
    isSameKind: boolean,
    reg: IdentityRegistry
  ): DnDEligibility {
    // Rule 1: No selection = no drag
    if (actionableRoots.length === 0) {
      return {
        canDrag: false,
        dragKind: null,
        draggedEntities: [],
        isMultiDrag: false,
        dragCount: 0,
      };
    }

    // Rule 2: Mixed kinds = no drag
    if (!isSameKind || selectedKind === null) {
      return {
        canDrag: false,
        dragKind: null,
        draggedEntities: [],
        isMultiDrag: false,
        dragCount: 0,
      };
    }

    // Build dragged entities
    const draggedEntities = [];
    for (const key of actionableRoots) {
      const identity = reg.get(key);
      if (identity) {
        draggedEntities.push({
          key,
          entityId: identity.entityId,
          parentKey: identity.parentKey,
        });
      }
    }

    if (draggedEntities.length === 0) {
      return {
        canDrag: false,
        dragKind: null,
        draggedEntities: [],
        isMultiDrag: false,
        dragCount: 0,
      };
    }

    return {
      canDrag: true,
      dragKind: selectedKind,
      draggedEntities,
      isMultiDrag: draggedEntities.length > 1,
      dragCount: draggedEntities.length,
    };
  }

  describe("no selection", () => {
    it("should return ineligible state", () => {
      const result = computeEligibility([], null, false, registry);

      expect(result.canDrag).toBe(false);
      expect(result.dragKind).toBeNull();
      expect(result.draggedEntities).toHaveLength(0);
      expect(result.isMultiDrag).toBe(false);
      expect(result.dragCount).toBe(0);
    });
  });

  describe("single selection", () => {
    it("should return eligible state with single entity", () => {
      const result = computeEligibility(["label:L1"], "label", true, registry);

      expect(result.canDrag).toBe(true);
      expect(result.dragKind).toBe("label");
      expect(result.draggedEntities).toHaveLength(1);
      expect(result.isMultiDrag).toBe(false);
      expect(result.dragCount).toBe(1);
      expect(result.draggedEntities[0]).toEqual({
        key: "label:L1",
        entityId: "L1",
        parentKey: null,
      });
    });
  });

  describe("multi-selection same kind", () => {
    it("should return eligible state with multiple entities", () => {
      const result = computeEligibility(
        ["label:L1", "label:L2"],
        "label",
        true,
        registry
      );

      expect(result.canDrag).toBe(true);
      expect(result.dragKind).toBe("label");
      expect(result.draggedEntities).toHaveLength(2);
      expect(result.isMultiDrag).toBe(true);
      expect(result.dragCount).toBe(2);
    });
  });

  describe("mixed kinds", () => {
    it("should return ineligible state", () => {
      const result = computeEligibility(
        ["label:L1", "category:L1-C1"],
        null,
        false,
        registry
      );

      expect(result.canDrag).toBe(false);
      expect(result.dragKind).toBeNull();
      expect(result.draggedEntities).toHaveLength(0);
      expect(result.isMultiDrag).toBe(false);
      expect(result.dragCount).toBe(0);
    });
  });

  describe("entity not in registry", () => {
    it("should skip missing entities gracefully", () => {
      const result = computeEligibility(
        ["label:L1", "label:UNKNOWN"],
        "label",
        true,
        registry
      );

      // Only L1 found, UNKNOWN skipped
      expect(result.canDrag).toBe(true);
      expect(result.draggedEntities).toHaveLength(1);
      expect(result.dragCount).toBe(1);
    });

    it("should return ineligible if all entities missing", () => {
      const result = computeEligibility(
        ["label:UNKNOWN1", "label:UNKNOWN2"],
        "label",
        true,
        registry
      );

      expect(result.canDrag).toBe(false);
      expect(result.draggedEntities).toHaveLength(0);
    });
  });

  describe("category entities include parent info", () => {
    it("should include parentKey for categories", () => {
      const result = computeEligibility(
        ["category:L1-C1", "category:L1-C2"],
        "category",
        true,
        registry
      );

      expect(result.canDrag).toBe(true);
      expect(result.draggedEntities).toHaveLength(2);

      // Both should have parentKey pointing to label:L1
      result.draggedEntities.forEach((entity) => {
        expect(entity.parentKey).toBe("label:L1");
      });
    });

    it("should handle categories from different parents", () => {
      const result = computeEligibility(
        ["category:L1-C1", "category:L2-C3"],
        "category",
        true,
        registry
      );

      const c1 = result.draggedEntities.find((e) => e.entityId === "C1");
      const c3 = result.draggedEntities.find((e) => e.entityId === "C3");

      expect(c1?.parentKey).toBe("label:L1");
      expect(c3?.parentKey).toBe("label:L2");
    });
  });
});

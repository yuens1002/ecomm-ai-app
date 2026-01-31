/**
 * Integration test for range selection flow.
 * Tests the complete flow: click to set anchor → shift+click to range select
 */
import { act, renderHook } from "@testing-library/react";
import { useContextSelectionModel } from "../useContextSelectionModel";
import { useRowClickHandler } from "../useRowClickHandler";
import { createKey, createRegistry, type RowIdentity } from "../../types/identity-registry";

// Mock builder API that tracks selection state
function createMockBuilder() {
  let selectedIds: string[] = [];

  return {
    get selectedIds() {
      return selectedIds;
    },
    get selectedKind() {
      return null;
    },
    toggleSelection: jest.fn((key: string) => {
      if (selectedIds.includes(key)) {
        selectedIds = selectedIds.filter((id) => id !== key);
      } else {
        selectedIds = [...selectedIds, key];
      }
    }),
    selectAll: jest.fn((ids: string[]) => {
      selectedIds = ids;
    }),
    clearSelection: jest.fn(() => {
      selectedIds = [];
    }),
    // For test inspection
    _getState: () => ({ selectedIds }),
    _setState: (ids: string[]) => {
      selectedIds = ids;
    },
  };
}

// Create a simple flat registry for testing
function createTestRegistry(keys: string[]) {
  const identities = new Map<string, RowIdentity>();
  const keysByKind: Record<string, string[]> = {};

  for (const key of keys) {
    const [kind, id] = key.split(":");
    identities.set(key, {
      key,
      kind,
      entityId: id,
      depth: 0,
      parentKey: null,
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    });

    if (!keysByKind[kind]) {
      keysByKind[kind] = [];
    }
    keysByKind[kind].push(key);
  }

  return createRegistry(identities, keys, keysByKind);
}

describe("Range Selection Integration", () => {
  describe("useContextSelectionModel + useRowClickHandler integration", () => {
    it("sets anchor on first click and range selects on shift+click", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keys = [keyA, keyB, keyC];

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      // Render both hooks together to simulate component usage
      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Initially, no anchor
      expect(result.current.selectionModel.anchorKey).toBeNull();

      // Step 1: Click on row A (no shift) - should set anchor
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: false });
      });
      rerender();

      // Verify anchor is set
      expect(result.current.selectionModel.anchorKey).toBe(keyA);
      expect(builder._getState().selectedIds).toContain(keyA);

      // Step 2: Shift+click on row C - should range select A, B, C
      act(() => {
        result.current.rowClickHandler.handleClick(keyC, { shiftKey: true });
      });
      rerender();

      // Verify range selection
      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
    });

    it("anchor persists across multiple shift+clicks", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keyD = createKey("label", "d");
      const keys = [keyA, keyB, keyC, keyD];

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Click A to set anchor
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: false });
      });
      rerender();

      expect(result.current.selectionModel.anchorKey).toBe(keyA);

      // Shift+click C
      act(() => {
        result.current.rowClickHandler.handleClick(keyC, { shiftKey: true });
      });
      rerender();

      // Shift+click D (anchor should still be A)
      act(() => {
        result.current.rowClickHandler.handleClick(keyD, { shiftKey: true });
      });
      rerender();

      // Selection should now be A through D (anchor didn't change)
      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
      expect(selectedIds).toContain(keyD);
    });

    it("shift+click without anchor falls through to toggle", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keys = [keyA, keyB];

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // No anchor initially
      expect(result.current.selectionModel.anchorKey).toBeNull();

      // Shift+click without anchor - should just toggle and set anchor
      act(() => {
        result.current.rowClickHandler.handleClick(keyB, { shiftKey: true });
      });
      rerender();

      // Should have toggled B and set anchor to B
      expect(builder._getState().selectedIds).toContain(keyB);
      expect(result.current.selectionModel.anchorKey).toBe(keyB);
    });

    it("verifies callback updates when anchorKey changes", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keys = [keyA, keyB, keyC];

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      // Track which anchorKey values are seen by useRowClickHandler
      const seenAnchorKeys: (string | null)[] = [];

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        // Track the anchorKey being passed
        seenAnchorKeys.push(selectionModel.anchorKey);

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Initial render - anchorKey is null
      expect(seenAnchorKeys).toContain(null);

      // Click to set anchor
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: false });
      });
      rerender();

      // After rerender, anchorKey should be keyA
      expect(seenAnchorKeys[seenAnchorKeys.length - 1]).toBe(keyA);

      // Now shift+click should work because anchorKey is set
      act(() => {
        result.current.rowClickHandler.handleClick(keyC, { shiftKey: true });
      });
      rerender();

      // Verify range selection worked
      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds.length).toBeGreaterThan(1);
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
    });
  });

  describe("expected shift+click behavior", () => {
    it("shift+click selects ALL items between anchor and target (inclusive)", () => {
      const keys = [
        createKey("label", "a"),
        createKey("label", "b"),
        createKey("label", "c"),
        createKey("label", "d"),
        createKey("label", "e"),
      ];
      const [keyA, keyB, keyC, keyD, keyE] = keys;

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Click on A to set anchor
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: false });
      });
      rerender();

      expect(result.current.selectionModel.anchorKey).toBe(keyA);
      expect(builder._getState().selectedIds).toEqual([keyA]);

      // Shift+click on E - should select A, B, C, D, E (all 5)
      act(() => {
        result.current.rowClickHandler.handleClick(keyE, { shiftKey: true });
      });
      rerender();

      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toHaveLength(5);
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
      expect(selectedIds).toContain(keyD);
      expect(selectedIds).toContain(keyE);
    });

    it("shift+click on already-selected range should deselect the range (toggle)", () => {
      const keys = [
        createKey("label", "a"),
        createKey("label", "b"),
        createKey("label", "c"),
      ];
      const [keyA, keyB, keyC] = keys;

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Click on A to set anchor and select A
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: false });
      });
      rerender();

      expect(result.current.selectionModel.anchorKey).toBe(keyA);
      expect(builder._getState().selectedIds).toEqual([keyA]);

      // Shift+click on C to select A, B, C
      act(() => {
        result.current.rowClickHandler.handleClick(keyC, { shiftKey: true });
      });
      rerender();

      expect(builder._getState().selectedIds).toHaveLength(3);
      expect(builder._getState().selectedIds).toContain(keyA);
      expect(builder._getState().selectedIds).toContain(keyB);
      expect(builder._getState().selectedIds).toContain(keyC);

      // Anchor should still be A (shift+click doesn't change anchor)
      expect(result.current.selectionModel.anchorKey).toBe(keyA);

      // Shift+click on C again - entire range A-C is already selected, should DESELECT all
      act(() => {
        result.current.rowClickHandler.handleClick(keyC, { shiftKey: true });
      });
      rerender();

      // Range A-C should now be deselected
      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toHaveLength(0);
      expect(selectedIds).not.toContain(keyA);
      expect(selectedIds).not.toContain(keyB);
      expect(selectedIds).not.toContain(keyC);

      // Anchor should be cleared after deselecting
      expect(result.current.selectionModel.anchorKey).toBeNull();
    });

    it("shift+click in reverse direction (target before anchor) selects all items", () => {
      const keys = [
        createKey("label", "a"),
        createKey("label", "b"),
        createKey("label", "c"),
        createKey("label", "d"),
      ];
      const [keyA, keyB, keyC, keyD] = keys;

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Click on D to set anchor (at the end)
      act(() => {
        result.current.rowClickHandler.handleClick(keyD, { shiftKey: false });
      });
      rerender();

      expect(result.current.selectionModel.anchorKey).toBe(keyD);

      // Shift+click on A (before anchor) - should select A, B, C, D
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: true });
      });
      rerender();

      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toHaveLength(4);
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
      expect(selectedIds).toContain(keyD);
    });

    it("multiple shift+clicks extend selection from same anchor", () => {
      const keys = [
        createKey("label", "a"),
        createKey("label", "b"),
        createKey("label", "c"),
        createKey("label", "d"),
        createKey("label", "e"),
      ];
      const [keyA, keyB, keyC, keyD, _keyE] = keys;

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        const rowClickHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        return { selectionModel, rowClickHandler };
      });

      // Click on B to set anchor
      act(() => {
        result.current.rowClickHandler.handleClick(keyB, { shiftKey: false });
      });
      rerender();

      // Shift+click on D - should select B, C, D
      act(() => {
        result.current.rowClickHandler.handleClick(keyD, { shiftKey: true });
      });
      rerender();

      expect(builder._getState().selectedIds).toHaveLength(3);

      // Shift+click on A (extends backward from same anchor B) - should now have A, B, C, D
      act(() => {
        result.current.rowClickHandler.handleClick(keyA, { shiftKey: true });
      });
      rerender();

      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
      expect(selectedIds).toContain(keyD);
    });
  });

  describe("debugging: isolate the issue", () => {
    it("onToggle correctly sets anchor", () => {
      const keyA = createKey("label", "a");
      const keys = [keyA];

      const builder = createMockBuilder();

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, { selectableKeys: keys })
      );

      expect(result.current.anchorKey).toBeNull();

      // Call onToggle directly (simulating what useRowClickHandler does)
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      // Anchor should now be set
      expect(result.current.anchorKey).toBe(keyA);
      expect(builder._getState().selectedIds).toContain(keyA);
    });

    it("rangeSelect works when called directly", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keys = [keyA, keyB, keyC];

      const builder = createMockBuilder();

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, { selectableKeys: keys })
      );

      // Set anchor first via onToggle
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyA);

      // Now call rangeSelect directly
      act(() => {
        result.current.rangeSelect(keyC);
      });
      rerender();

      // Should have A, B, C selected
      const selectedIds = builder._getState().selectedIds;
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
    });

    it("handleClick receives correct anchorKey after it changes", () => {
      const keyA = createKey("label", "a");
      const keyC = createKey("label", "c");
      const keys = [keyA, createKey("label", "b"), keyC];

      const builder = createMockBuilder();
      const registry = createTestRegistry(keys);

      // Track what handleClick sees
      const handleClickLog: { anchorKey: string | null; shiftKey: boolean }[] = [];

      const { result, rerender } = renderHook(() => {
        const selectionModel = useContextSelectionModel(builder, {
          selectableKeys: keys,
        });

        // Create a wrapped handleClick that logs what it sees
        const baseHandler = useRowClickHandler(registry, {
          onToggle: selectionModel.onToggle,
          rangeSelect: selectionModel.rangeSelect,
          anchorKey: selectionModel.anchorKey,
        });

        const wrappedHandleClick = (key: string, options?: { shiftKey?: boolean }) => {
          handleClickLog.push({
            anchorKey: selectionModel.anchorKey,
            shiftKey: options?.shiftKey ?? false,
          });
          return baseHandler.handleClick(key, options);
        };

        return {
          selectionModel,
          handleClick: wrappedHandleClick,
        };
      });

      // First click (no shift) - anchor should be null at this point
      act(() => {
        result.current.handleClick(keyA, { shiftKey: false });
      });
      rerender();

      // Verify first click saw null anchor
      expect(handleClickLog[0].anchorKey).toBeNull();
      expect(handleClickLog[0].shiftKey).toBe(false);

      // Second click (with shift) - anchor should now be keyA
      act(() => {
        result.current.handleClick(keyC, { shiftKey: true });
      });
      rerender();

      // Verify second click saw the updated anchor
      expect(handleClickLog[1].anchorKey).toBe(keyA);
      expect(handleClickLog[1].shiftKey).toBe(true);
    });
  });
});

import { act, renderHook } from "@testing-library/react";

import { useContextSelectionModel } from "../useContextSelectionModel";
import { createKey } from "../../types/identity-registry";
import type { SelectedEntityKind } from "../../types/builder-state";

type SelectionState = {
  ids: string[];
  kind: SelectedEntityKind | null;
};

function createSelectionBuilder(initial: SelectionState) {
  let state = initial;

  const api = {
    get selectedIds() {
      return state.ids;
    },
    get selectedKind() {
      return state.kind;
    },
    toggleSelection: jest.fn((id: string) => {
      const isRemoving = state.ids.includes(id);
      const nextIds = isRemoving ? state.ids.filter((x) => x !== id) : [...state.ids, id];
      state = { ids: nextIds, kind: null }; // Kind is derived from keys, not stored
    }),
    selectAll: jest.fn((ids: string[]) => {
      state = { ids, kind: null }; // Kind is derived from keys, not stored
    }),
    clearSelection: jest.fn(() => {
      state = { ids: [], kind: null };
    }),
    getState: () => state,
  };

  return api;
}

describe("useContextSelectionModel", () => {
  it("computes selectionState based on intersection with selectableKeys", () => {
    const builder = createSelectionBuilder({
      ids: [createKey("category", "a"), createKey("category", "c"), createKey("category", "zzz")],
      kind: "category",
    });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [
          createKey("category", "a"),
          createKey("category", "b"),
          createKey("category", "c"),
        ],
      })
    );

    expect(result.current.selectionState).toEqual({
      allSelected: false,
      someSelected: true,
      selectedCount: 2,
    });
  });

  it("onSelectAll selects all when not all selected, and clears when all selected", () => {
    const builder = createSelectionBuilder({ ids: [], kind: null });

    const selectableKeys = [createKey("category", "a"), createKey("category", "b")];

    const { result, rerender } = renderHook(() =>
      useContextSelectionModel(builder, { selectableKeys })
    );

    act(() => {
      result.current.onSelectAll();
    });
    rerender();

    expect(builder.getState()).toEqual({ ids: selectableKeys, kind: null });
    expect(builder.selectAll).toHaveBeenCalledWith(selectableKeys);

    act(() => {
      result.current.onSelectAll();
    });
    rerender();

    expect(builder.getState()).toEqual({ ids: [], kind: null });
    expect(builder.clearSelection).toHaveBeenCalled();
  });

  it("onToggle toggles selection for a key", () => {
    const builder = createSelectionBuilder({ ids: [], kind: null });
    const categoryKey = createKey("category", "a");

    const { result, rerender } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [categoryKey],
      })
    );

    act(() => {
      result.current.onToggle(categoryKey);
    });
    rerender();

    expect(builder.getState()).toEqual({ ids: [categoryKey], kind: null });
    expect(builder.toggleSelection).toHaveBeenCalledWith(categoryKey);
  });

  it("isSelected reflects builder.selectedIds using keys", () => {
    const keyA = createKey("category", "a");
    const keyB = createKey("category", "b");
    const builder = createSelectionBuilder({ ids: [keyA], kind: "category" });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [keyA, keyB],
      })
    );

    expect(result.current.isSelected(keyA)).toBe(true);
    expect(result.current.isSelected(keyB)).toBe(false);
  });

  it("selectedKind is derived from selected keys", () => {
    const labelKey = createKey("label", "l1");
    const builder = createSelectionBuilder({ ids: [labelKey], kind: "label" });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [labelKey],
      })
    );

    expect(result.current.selectedKind).toBe("label");
    expect(result.current.isSameKind).toBe(true);
  });

  it("selectedKind is null when mixed kinds are selected", () => {
    const labelKey = createKey("label", "l1");
    const categoryKey = createKey("category", "c1");
    const builder = createSelectionBuilder({ ids: [labelKey, categoryKey], kind: null });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [labelKey, categoryKey],
      })
    );

    expect(result.current.selectedKind).toBe(null);
    expect(result.current.isSameKind).toBe(false);
  });

  it("canPerformAction requires same kind and all checked", () => {
    const keyA = createKey("category", "a");
    const keyB = createKey("category", "b");
    const builder = createSelectionBuilder({ ids: [keyA, keyB], kind: "category" });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [keyA, keyB],
      })
    );

    // All same kind and all checked (no hierarchy, so all leaves)
    expect(result.current.canPerformAction).toBe(true);
  });

  it("canPerformAction is false when no selection", () => {
    const builder = createSelectionBuilder({ ids: [], kind: null });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        selectableKeys: [createKey("category", "a")],
      })
    );

    expect(result.current.canPerformAction).toBe(false);
  });

  describe("range selection", () => {
    it("sets anchor when selecting via onToggle", () => {
      const builder = createSelectionBuilder({ ids: [], kind: null });
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB],
        })
      );

      // Initially no anchor
      expect(result.current.anchorKey).toBeNull();

      // Toggle to select - should set anchor
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyA);
    });

    it("does not change anchor when deselecting via onToggle", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const builder = createSelectionBuilder({ ids: [keyA], kind: "label" });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB],
        })
      );

      // Select keyA to set anchor
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      // Now keyA is selected, toggle again to deselect
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      // Anchor should still be keyA (we don't clear on deselect)
      expect(result.current.anchorKey).toBe(keyA);
    });

    it("rangeSelect selects all keys between anchor and target", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keyD = createKey("label", "d");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB, keyC, keyD],
        })
      );

      // First select keyA to set anchor
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyA);

      // Now range select to keyC
      act(() => {
        result.current.rangeSelect(keyC);
      });
      rerender();

      // Should have selected A, B, C
      expect(builder.selectAll).toHaveBeenCalledWith(
        expect.arrayContaining([keyA, keyB, keyC])
      );
      expect(builder.getState().ids).toContain(keyA);
      expect(builder.getState().ids).toContain(keyB);
      expect(builder.getState().ids).toContain(keyC);
      expect(builder.getState().ids).not.toContain(keyD);
    });

    it("rangeSelect works in reverse direction (target before anchor)", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB, keyC],
        })
      );

      // Select keyC to set anchor
      act(() => {
        result.current.onToggle(keyC);
      });
      rerender();

      // Range select to keyA (backwards)
      act(() => {
        result.current.rangeSelect(keyA);
      });
      rerender();

      // Should have selected A, B, C
      expect(builder.getState().ids).toContain(keyA);
      expect(builder.getState().ids).toContain(keyB);
      expect(builder.getState().ids).toContain(keyC);
    });

    it("rangeSelect without anchor sets anchor and selects target", () => {
      const keyA = createKey("label", "a");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA],
        })
      );

      expect(result.current.anchorKey).toBeNull();

      act(() => {
        const count = result.current.rangeSelect(keyA);
        expect(count).toBe(1);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyA);
      expect(builder.getState().ids).toContain(keyA);
    });

    it("getKeysBetween returns correct slice of selectableKeys", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB, keyC],
        })
      );

      expect(result.current.getKeysBetween(keyA, keyC)).toEqual([keyA, keyB, keyC]);
      expect(result.current.getKeysBetween(keyC, keyA)).toEqual([keyA, keyB, keyC]);
      expect(result.current.getKeysBetween(keyA, keyA)).toEqual([keyA]);
    });

    it("clearAnchor resets the anchor", () => {
      const keyA = createKey("label", "a");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA],
        })
      );

      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyA);

      act(() => {
        result.current.clearAnchor();
      });
      rerender();

      expect(result.current.anchorKey).toBeNull();
    });

    it("rangeSelect on fully selected range deselects all (toggle behavior)", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB, keyC],
        })
      );

      // Step 1: Click keyA to set anchor
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyA);
      expect(result.current.isSelected(keyA)).toBe(true);

      // Step 2: Range select to keyC (selects A, B, C)
      act(() => {
        result.current.rangeSelect(keyC);
      });
      rerender();

      expect(result.current.isSelected(keyA)).toBe(true);
      expect(result.current.isSelected(keyB)).toBe(true);
      expect(result.current.isSelected(keyC)).toBe(true);

      // Step 3: Range select to keyC again - range is fully selected, should deselect
      act(() => {
        const count = result.current.rangeSelect(keyC);
        expect(count).toBe(-3); // Negative = deselected 3 items
      });
      rerender();

      // All items should be deselected
      expect(result.current.isSelected(keyA)).toBe(false);
      expect(result.current.isSelected(keyB)).toBe(false);
      expect(result.current.isSelected(keyC)).toBe(false);
      // Anchor should be cleared after deselecting
      expect(result.current.anchorKey).toBeNull();
    });

    it("rangeSelect extends selection from same anchor", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keyD = createKey("label", "d");
      const keyE = createKey("label", "e");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB, keyC, keyD, keyE],
        })
      );

      // Step 1: Click keyB to set anchor
      act(() => {
        result.current.onToggle(keyB);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyB);

      // Step 2: Range select to keyC (selects B, C)
      act(() => {
        result.current.rangeSelect(keyC);
      });
      rerender();

      expect(result.current.isSelected(keyA)).toBe(false);
      expect(result.current.isSelected(keyB)).toBe(true);
      expect(result.current.isSelected(keyC)).toBe(true);
      expect(result.current.isSelected(keyD)).toBe(false);

      // Step 3: Range select to keyE (extends to B, C, D, E - anchor stays at B)
      act(() => {
        result.current.rangeSelect(keyE);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyB); // Anchor unchanged
      expect(result.current.isSelected(keyA)).toBe(false);
      expect(result.current.isSelected(keyB)).toBe(true);
      expect(result.current.isSelected(keyC)).toBe(true);
      expect(result.current.isSelected(keyD)).toBe(true);
      expect(result.current.isSelected(keyE)).toBe(true);
    });

    it("regular click after range select sets new anchor", () => {
      const keyA = createKey("label", "a");
      const keyB = createKey("label", "b");
      const keyC = createKey("label", "c");
      const keyD = createKey("label", "d");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: [keyA, keyB, keyC, keyD],
        })
      );

      // Step 1: Click keyA, range select to keyC (selects A, B, C)
      act(() => {
        result.current.onToggle(keyA);
      });
      rerender();
      act(() => {
        result.current.rangeSelect(keyC);
      });
      rerender();

      expect(result.current.isSelected(keyA)).toBe(true);
      expect(result.current.isSelected(keyB)).toBe(true);
      expect(result.current.isSelected(keyC)).toBe(true);
      expect(result.current.anchorKey).toBe(keyA);

      // Step 2: Regular click on keyD - sets new anchor, adds to selection
      act(() => {
        result.current.onToggle(keyD);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyD); // New anchor
      expect(result.current.isSelected(keyA)).toBe(true);
      expect(result.current.isSelected(keyB)).toBe(true);
      expect(result.current.isSelected(keyC)).toBe(true);
      expect(result.current.isSelected(keyD)).toBe(true);
    });

    it("selectableKeys order determines range - CRITICAL for sorted tables", () => {
      // This test verifies the critical requirement that selectableKeys
      // must match the VISUAL row order for range selection to work correctly.
      //
      // Bug scenario: Table displays rows in sorted order [D, B, A, C] but
      // selectableKeys is in original order [A, B, C, D]. User clicks D (visual row 1)
      // and shift+clicks A (visual row 3), expecting D, B, A to be selected.
      // But if selectableKeys is [A, B, C, D], getKeysBetween(D, A) returns [A, B, C, D]!

      const keyA = createKey("category", "a");
      const keyB = createKey("category", "b");
      const keyC = createKey("category", "c");
      const keyD = createKey("category", "d");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      // Simulate sorted visual order: D, B, A, C (e.g., sorted by date desc)
      const visualOrder = [keyD, keyB, keyA, keyC];

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: visualOrder, // Must match visual order!
        })
      );

      // User clicks first visual row (D)
      act(() => {
        result.current.onToggle(keyD);
      });
      rerender();

      expect(result.current.anchorKey).toBe(keyD);

      // User shift+clicks third visual row (A) - expects D, B, A selected
      act(() => {
        result.current.rangeSelect(keyA);
      });
      rerender();

      // Should select D, B, A (visual rows 1-3)
      expect(result.current.isSelected(keyD)).toBe(true);
      expect(result.current.isSelected(keyB)).toBe(true);
      expect(result.current.isSelected(keyA)).toBe(true);
      // Should NOT select C (visual row 4, outside the range)
      expect(result.current.isSelected(keyC)).toBe(false);

      // Verify the range is exactly 3 items
      expect(builder.getState().ids).toHaveLength(3);
    });

    it("wrong selectableKeys order causes incorrect range selection", () => {
      // This test demonstrates what goes WRONG when selectableKeys
      // doesn't match visual order - the bug we fixed.

      const keyA = createKey("category", "a");
      const keyB = createKey("category", "b");
      const keyC = createKey("category", "c");
      const keyD = createKey("category", "d");
      const builder = createSelectionBuilder({ ids: [], kind: null });

      // WRONG: Using original data order instead of visual sorted order
      // Visual order is [D, B, A, C] but we pass [A, B, C, D]
      const wrongOrder = [keyA, keyB, keyC, keyD];

      const { result, rerender } = renderHook(() =>
        useContextSelectionModel(builder, {
          selectableKeys: wrongOrder, // BUG: doesn't match visual order
        })
      );

      // User clicks D (visual row 1)
      act(() => {
        result.current.onToggle(keyD);
      });
      rerender();

      // User shift+clicks A (visual row 3)
      // Expects: D, B, A (3 items)
      // Gets: A, B, C, D (4 items) - WRONG!
      act(() => {
        result.current.rangeSelect(keyA);
      });
      rerender();

      // With wrong order, getKeysBetween(D, A) uses indices in [A,B,C,D]
      // D is at index 3, A is at index 0, so it returns [A,B,C,D] - all 4!
      const selectedIds = builder.getState().ids;

      // This demonstrates the bug: all 4 items selected instead of 3
      expect(selectedIds).toHaveLength(4);
      expect(selectedIds).toContain(keyA);
      expect(selectedIds).toContain(keyB);
      expect(selectedIds).toContain(keyC);
      expect(selectedIds).toContain(keyD);
    });
  });
});

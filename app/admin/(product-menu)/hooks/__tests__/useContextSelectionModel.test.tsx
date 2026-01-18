import { act, renderHook } from "@testing-library/react";

import { useContextSelectionModel, createKey } from "../useContextSelectionModel";

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
});

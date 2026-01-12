import { act, renderHook } from "@testing-library/react";

import { useContextSelectionModel } from "../useContextSelectionModel";

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
    toggleSelection: jest.fn((id: string, options?: { kind?: SelectedEntityKind }) => {
      const kind = options?.kind;
      const isRemoving = state.ids.includes(id);

      if (!isRemoving && kind && state.kind && state.kind !== kind && state.ids.length > 0) {
        // match builder "same-entity only" gating
        return;
      }

      const nextIds = isRemoving ? state.ids.filter((x) => x !== id) : [...state.ids, id];
      const nextKind = nextIds.length === 0 ? null : (kind ?? state.kind);
      state = { ids: nextIds, kind: nextKind };
    }),
    selectAll: jest.fn((ids: string[], options?: { kind?: SelectedEntityKind }) => {
      const kind = options?.kind;
      if (kind && state.kind && state.kind !== kind && state.ids.length > 0) {
        // match builder "same-entity only" gating
        return;
      }

      state = { ids, kind: ids.length === 0 ? null : (kind ?? state.kind) };
    }),
    clearSelection: jest.fn(() => {
      state = { ids: [], kind: null };
    }),
    getState: () => state,
  };

  return api;
}

describe("useContextSelectionModel", () => {
  it("reports isSelectionActive when selectedKind is null or same kind", () => {
    const builder = createSelectionBuilder({ ids: [], kind: null });

    const { result, rerender } = renderHook(
      ({ kind }: { kind: SelectedEntityKind }) =>
        useContextSelectionModel(builder, {
          kind,
          selectableIds: ["a"],
        }),
      { initialProps: { kind: "category" as SelectedEntityKind } }
    );

    expect(result.current.isSelectionActive).toBe(true);

    act(() => {
      builder.selectAll(["x"], { kind: "label" });
    });
    rerender({ kind: "category" });

    expect(builder.getState()).toEqual({ ids: ["x"], kind: "label" });
    expect(result.current.isSelectionActive).toBe(false);

    rerender({ kind: "label" });
    expect(result.current.isSelectionActive).toBe(true);
  });

  it("computes selectionState based on intersection with selectableIds", () => {
    const builder = createSelectionBuilder({ ids: ["a", "c", "zzz"], kind: "category" });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        kind: "category",
        selectableIds: ["a", "b", "c"],
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

    const { result, rerender } = renderHook(() =>
      useContextSelectionModel(builder, {
        kind: "category",
        selectableIds: ["a", "b"],
      })
    );

    act(() => {
      result.current.onSelectAll();
    });
    rerender();

    expect(builder.getState()).toEqual({ ids: ["a", "b"], kind: "category" });
    expect(builder.selectAll).toHaveBeenCalledWith(["a", "b"], { kind: "category" });

    act(() => {
      result.current.onSelectAll();
    });
    rerender();

    expect(builder.getState()).toEqual({ ids: [], kind: null });
    expect(builder.clearSelection).toHaveBeenCalled();
  });

  it("onToggleId is a no-op when selection is not active", () => {
    const builder = createSelectionBuilder({ ids: ["x"], kind: "label" });

    const { result, rerender } = renderHook(() =>
      useContextSelectionModel(builder, {
        kind: "category",
        selectableIds: ["a"],
      })
    );

    expect(result.current.isSelectionActive).toBe(false);

    act(() => {
      result.current.onToggleId("a");
    });
    rerender();

    expect(builder.getState()).toEqual({ ids: ["x"], kind: "label" });
  });

  it("isSelected reflects builder.selectedIds", () => {
    const builder = createSelectionBuilder({ ids: ["a"], kind: "category" });

    const { result } = renderHook(() =>
      useContextSelectionModel(builder, {
        kind: "category",
        selectableIds: ["a", "b"],
      })
    );

    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(false);
  });
});

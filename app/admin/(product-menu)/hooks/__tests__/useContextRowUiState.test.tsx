import { renderHook, act } from "@testing-library/react";

import { useContextRowUiState } from "../useContextRowUiState";

import type { SelectedEntityKind } from "../../types/builder-state";

type ActiveRow = { kind: SelectedEntityKind; id: string };

type BuilderRowUiState = {
  editingRow: ActiveRow | null;
  pinnedNewRow: ActiveRow | null;
};

function createRowUiBuilder(initial: BuilderRowUiState) {
  let state = initial;

  const api = {
    get editingRow() {
      return state.editingRow;
    },
    get pinnedNewRow() {
      return state.pinnedNewRow;
    },
    setEditing: jest.fn((next: ActiveRow | null) => {
      state = { ...state, editingRow: next };
    }),
    setPinnedNew: jest.fn((next: ActiveRow | null) => {
      state = { ...state, pinnedNewRow: next };
    }),
    getState: () => state,
  };

  return api;
}

describe("useContextRowUiState", () => {
  it("scopes editingId and pinnedId to the requested kind", () => {
    const builder = createRowUiBuilder({
      editingRow: { kind: "label", id: "l1" },
      pinnedNewRow: { kind: "category", id: "c1" },
    });

    const { result: categoryResult } = renderHook(() => useContextRowUiState(builder, "category"));
    expect(categoryResult.current.editingId).toBeNull();
    expect(categoryResult.current.pinnedId).toBe("c1");

    const { result: labelResult } = renderHook(() => useContextRowUiState(builder, "label"));
    expect(labelResult.current.editingId).toBe("l1");
    expect(labelResult.current.pinnedId).toBeNull();
  });

  it("clearEditing sets editingRow to null", () => {
    const builder = createRowUiBuilder({
      editingRow: { kind: "category", id: "c1" },
      pinnedNewRow: null,
    });

    const { result } = renderHook(() => useContextRowUiState(builder, "category"));

    act(() => {
      result.current.clearEditing();
    });

    expect(builder.setEditing).toHaveBeenCalledWith(null);
    expect(builder.getState().editingRow).toBeNull();
  });

  it("clearPinnedIfMatches clears pinnedNewRow only when it matches kind and id", () => {
    const builder = createRowUiBuilder({
      editingRow: null,
      pinnedNewRow: { kind: "category", id: "c1" },
    });

    const { result } = renderHook(() => useContextRowUiState(builder, "category"));

    act(() => {
      result.current.clearPinnedIfMatches("nope");
    });
    expect(builder.getState().pinnedNewRow).toEqual({ kind: "category", id: "c1" });

    act(() => {
      result.current.clearPinnedIfMatches("c1");
    });

    expect(builder.setPinnedNew).toHaveBeenCalledWith(null);
    expect(builder.getState().pinnedNewRow).toBeNull();
  });

  it("does not clear pinnedNewRow when pinned kind differs", () => {
    const builder = createRowUiBuilder({
      editingRow: null,
      pinnedNewRow: { kind: "label", id: "l1" },
    });

    const { result } = renderHook(() => useContextRowUiState(builder, "category"));

    act(() => {
      result.current.clearPinnedIfMatches("l1");
    });

    expect(builder.getState().pinnedNewRow).toEqual({ kind: "label", id: "l1" });
  });
});

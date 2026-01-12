import { renderHook } from "@testing-library/react";
import { usePinnedRow } from "../usePinnedRow";

type Row = { id: string; order: number };

describe("usePinnedRow", () => {
  it("returns undefined pinnedRow when no pinnedId", () => {
    const rows: Row[] = [
      { id: "a", order: 2 },
      { id: "b", order: 1 },
    ];

    const { result } = renderHook(() =>
      usePinnedRow<Row>({
        rows,
        pinnedId: null,
        isSortingActive: false,
        defaultSort: (x, y) => y.order - x.order,
      })
    );

    expect(result.current.pinnedRow).toBeUndefined();
    // defaultSort applies when not sorting
    expect(result.current.rowsForTable.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("splits out pinnedRow and removes it from rowsForTable", () => {
    const rows: Row[] = [
      { id: "a", order: 2 },
      { id: "b", order: 1 },
      { id: "c", order: 3 },
    ];

    const { result } = renderHook(() =>
      usePinnedRow<Row>({
        rows,
        pinnedId: "b",
        isSortingActive: false,
        defaultSort: (x, y) => y.order - x.order,
      })
    );

    expect(result.current.pinnedRow?.id).toBe("b");
    expect(result.current.rowsForTable.map((r) => r.id)).toEqual(["c", "a"]);
  });

  it("does not apply defaultSort when isSortingActive is true", () => {
    const rows: Row[] = [
      { id: "a", order: 2 },
      { id: "b", order: 1 },
      { id: "c", order: 3 },
    ];

    const { result } = renderHook(() =>
      usePinnedRow<Row>({
        rows,
        pinnedId: "b",
        isSortingActive: true,
        defaultSort: (x, y) => y.order - x.order,
      })
    );

    // Original order minus pinned
    expect(result.current.rowsForTable.map((r) => r.id)).toEqual(["a", "c"]);
  });
});

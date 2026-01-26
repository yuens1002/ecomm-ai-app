/**
 * Tests to verify selectableKeys matches visual row order.
 *
 * CRITICAL: selectableKeys must be in the same order as rows are displayed,
 * otherwise shift+click range selection will select wrong items.
 *
 * Bug scenario: Table sorts by date desc, but selectableKeys uses original order.
 * User clicks row 1 and shift+clicks row 4 visually, but wrong items get selected.
 */
import { useMemo } from "react";
import { renderHook } from "@testing-library/react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { createKey } from "../../types/identity-registry";

// Simulate the pattern used in table views
type MockRow = { id: string; name: string; createdAt: Date };

/**
 * This test verifies the PATTERN that components must follow:
 * selectableKeys must be derived from the VISUAL row order, not original data order.
 */
describe("selectableKeys order pattern", () => {
  it("CORRECT pattern: selectableKeys from sorted rows matches visual order", () => {
    // Original data order
    const rows: MockRow[] = [
      { id: "a", name: "Alpha", createdAt: new Date("2024-01-01") },
      { id: "b", name: "Beta", createdAt: new Date("2024-01-03") },
      { id: "c", name: "Charlie", createdAt: new Date("2024-01-02") },
    ];

    // Simulate sorting by createdAt desc (newest first)
    const sortedRows = [...rows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    // Sorted order: b (Jan 3), c (Jan 2), a (Jan 1)

    const { result } = renderHook(() => {
      // CORRECT: derive selectableKeys from sorted rows (visual order)
      const selectableKeys = useMemo(
        () => sortedRows.map((row) => createKey("category", row.id)),
        []
      );
      return { selectableKeys };
    });

    // Visual order should be: b, c, a
    expect(result.current.selectableKeys).toEqual([
      "category:b",
      "category:c",
      "category:a",
    ]);

    // If user clicks row 0 (b) and shift+clicks row 2 (a),
    // getKeysBetween would return indices 0-2 = [b, c, a] ✓
  });

  it("WRONG pattern: selectableKeys from original data order mismatches visual", () => {
    // Original data order
    const rows: MockRow[] = [
      { id: "a", name: "Alpha", createdAt: new Date("2024-01-01") },
      { id: "b", name: "Beta", createdAt: new Date("2024-01-03") },
      { id: "c", name: "Charlie", createdAt: new Date("2024-01-02") },
    ];

    // Simulate sorting by createdAt desc (newest first)
    const sortedRows = [...rows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    // Visual order: b, c, a

    const { result } = renderHook(() => {
      // WRONG: using original data order instead of sorted order
      const selectableKeys = useMemo(
        () => rows.map((row) => createKey("category", row.id)),
        []
      );
      return { selectableKeys, sortedRows };
    });

    // selectableKeys is in WRONG order (original: a, b, c)
    expect(result.current.selectableKeys).toEqual([
      "category:a",
      "category:b",
      "category:c",
    ]);

    // Visual order is: b, c, a
    const visualOrder = result.current.sortedRows.map((r) =>
      createKey("category", r.id)
    );
    expect(visualOrder).toEqual([
      "category:b",
      "category:c",
      "category:a",
    ]);

    // MISMATCH! This causes the bug.
    expect(result.current.selectableKeys).not.toEqual(visualOrder);
  });

  it("CORRECT pattern: pinned row appears first in selectableKeys", () => {
    const rows: MockRow[] = [
      { id: "a", name: "Alpha", createdAt: new Date("2024-01-01") },
      { id: "b", name: "Beta", createdAt: new Date("2024-01-02") },
      { id: "c", name: "Charlie", createdAt: new Date("2024-01-03") },
    ];

    // Simulate pinning row "b" (it will display first)
    const pinnedId = "b";
    const pinnedRow = rows.find((r) => r.id === pinnedId);
    const otherRows = rows.filter((r) => r.id !== pinnedId);

    const { result } = renderHook(() => {
      // CORRECT: pinned row first, then others
      const selectableKeys = useMemo(() => {
        const keys: string[] = [];
        if (pinnedRow) {
          keys.push(createKey("label", pinnedRow.id));
        }
        for (const row of otherRows) {
          keys.push(createKey("label", row.id));
        }
        return keys;
      }, []);
      return { selectableKeys };
    });

    // Visual order: b (pinned), a, c
    expect(result.current.selectableKeys).toEqual([
      "label:b", // pinned first
      "label:a",
      "label:c",
    ]);
  });

  it("demonstrates range selection with correct vs incorrect order", () => {
    // Simulates: user clicks visual row 0, shift+clicks visual row 2
    // Visual display: [B, C, A] (sorted by date desc)
    // Expected selection: B, C, A (all 3 rows)

    const visualOrder = ["category:b", "category:c", "category:a"];
    const wrongOrder = ["category:a", "category:b", "category:c"];

    // Helper to simulate getKeysBetween
    const getKeysBetween = (keys: string[], from: string, to: string) => {
      const fromIdx = keys.indexOf(from);
      const toIdx = keys.indexOf(to);
      if (fromIdx === -1 || toIdx === -1) return [];
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      return keys.slice(start, end + 1);
    };

    // User clicks B (visual row 0), shift+clicks A (visual row 2)
    const anchor = "category:b";
    const target = "category:a";

    // With CORRECT order: selects B, C, A (visual rows 0-2) ✓
    const correctRange = getKeysBetween(visualOrder, anchor, target);
    expect(correctRange).toEqual(["category:b", "category:c", "category:a"]);
    expect(correctRange).toHaveLength(3);

    // With WRONG order: selects A, B (indices 0-1 in wrong order) ✗
    const wrongRange = getKeysBetween(wrongOrder, anchor, target);
    expect(wrongRange).toEqual(["category:a", "category:b"]);
    expect(wrongRange).toHaveLength(2); // WRONG! Missing C

    // This demonstrates why order matters
    expect(correctRange).not.toEqual(wrongRange);
  });

  it("REAL TABLE: selectableKeys from table.getRowModel() matches sorted order", () => {
    // This test uses actual TanStack Table sorting - same as the real component
    const rows: MockRow[] = [
      { id: "a", name: "Alpha", createdAt: new Date("2024-01-01") },
      { id: "b", name: "Beta", createdAt: new Date("2024-01-03") },
      { id: "c", name: "Charlie", createdAt: new Date("2024-01-02") },
      { id: "d", name: "Delta", createdAt: new Date("2024-01-04") },
    ];

    const columns = [
      { id: "name", accessorFn: (row: MockRow) => row.name },
      { id: "createdAt", accessorFn: (row: MockRow) => row.createdAt.getTime() },
    ];

    // Sort by createdAt desc (newest first) - same as AllCategoriesTableView
    const sorting: SortingState = [{ id: "createdAt", desc: true }];

    const { result } = renderHook(() => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const table = useReactTable({
        data: rows,
        columns,
        state: { sorting },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: (row) => row.id,
      });

      // CORRECT PATTERN: derive selectableKeys from sorted rows
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const selectableKeys = useMemo(() => {
        return table.getRowModel().rows.map((row) =>
          createKey("category", row.original.id)
        );
      }, [table]);

      // WRONG PATTERN: using original data order
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const wrongSelectableKeys = useMemo(() => {
        return rows.map((row) => createKey("category", row.id));
      }, []);

      return { selectableKeys, wrongSelectableKeys, table };
    });

    // Sorted order should be: d (Jan 4), b (Jan 3), c (Jan 2), a (Jan 1)
    const expectedVisualOrder = [
      "category:d",
      "category:b",
      "category:c",
      "category:a",
    ];

    // CORRECT: selectableKeys matches visual order
    expect(result.current.selectableKeys).toEqual(expectedVisualOrder);

    // WRONG: original order doesn't match
    expect(result.current.wrongSelectableKeys).toEqual([
      "category:a",
      "category:b",
      "category:c",
      "category:d",
    ]);
    expect(result.current.wrongSelectableKeys).not.toEqual(expectedVisualOrder);

    // Verify the table actually sorted correctly
    const visualIds = result.current.table
      .getRowModel()
      .rows.map((r) => r.original.id);
    expect(visualIds).toEqual(["d", "b", "c", "a"]);
  });
});

/**
 * Build Row Context Tests
 *
 * Tests for the buildRowContext helper function that constructs
 * RowContext objects for cell renderers.
 */

import { buildRowContext, NO_DND, type BuildRowContextOptions } from "../buildRowContext";
import type { CheckboxState } from "../../useContextSelectionModel";

// ─────────────────────────────────────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type TestRow = {
  id: string;
  name: string;
  isVisible: boolean;
};

function createTestRow(overrides: Partial<TestRow> = {}): TestRow {
  return {
    id: "test-id",
    name: "Test Item",
    isVisible: true,
    ...overrides,
  };
}

function createTestOptions<T>(
  row: T,
  overrides: Partial<Omit<BuildRowContextOptions<T>, "row">> = {}
): BuildRowContextOptions<T> {
  const defaultOptions: Omit<BuildRowContextOptions<T>, "row"> = {
    rowId: "test-id",
    rowKey: "category:test-id",
    entityKind: "category",
    selection: {
      isSelected: false,
      checkboxState: "unchecked" as CheckboxState,
      anchorKey: null,
      onToggle: jest.fn(),
      onRangeSelect: undefined,
    },
    uiState: {
      isRowHovered: false,
      isContextRow: false,
      isEditing: false,
      isPinned: false,
    },
    position: {
      index: 0,
      total: 5,
    },
    dnd: NO_DND,
    editHandlers: {
      onStartEdit: jest.fn(),
      onCancelEdit: jest.fn(),
      onSave: jest.fn().mockResolvedValue(undefined),
    },
    extra: {},
  };

  return {
    row,
    ...defaultOptions,
    ...overrides,
    selection: { ...defaultOptions.selection, ...overrides.selection },
    uiState: { ...defaultOptions.uiState, ...overrides.uiState },
    position: { ...defaultOptions.position, ...overrides.position },
    dnd: overrides.dnd ?? defaultOptions.dnd,
    editHandlers: { ...defaultOptions.editHandlers, ...overrides.editHandlers },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("buildRowContext", () => {
  describe("row identification", () => {
    it("should include row data, key, id, and kind", () => {
      const row = createTestRow();
      const options = createTestOptions(row, {
        rowId: "my-id",
        rowKey: "label:my-id",
        entityKind: "label",
      });

      const ctx = buildRowContext(options);

      expect(ctx.row).toBe(row);
      expect(ctx.rowId).toBe("my-id");
      expect(ctx.rowKey).toBe("label:my-id");
      expect(ctx.entityKind).toBe("label");
    });
  });

  describe("selection state", () => {
    it("should pass through selection state", () => {
      const row = createTestRow();
      const onToggle = jest.fn();
      const onRangeSelect = jest.fn();

      const options = createTestOptions(row, {
        selection: {
          isSelected: true,
          checkboxState: "checked",
          anchorKey: "label:anchor",
          onToggle,
          onRangeSelect,
        },
      });

      const ctx = buildRowContext(options);

      expect(ctx.isSelected).toBe(true);
      expect(ctx.checkboxState).toBe("checked");
      expect(ctx.anchorKey).toBe("label:anchor");
      expect(ctx.onToggle).toBe(onToggle);
      expect(ctx.onRangeSelect).toBe(onRangeSelect);
    });

    it("should handle indeterminate checkbox state", () => {
      const row = createTestRow();
      const options = createTestOptions(row, {
        selection: {
          isSelected: false,
          checkboxState: "indeterminate",
          anchorKey: null,
          onToggle: jest.fn(),
          onRangeSelect: undefined,
        },
      });

      const ctx = buildRowContext(options);

      expect(ctx.checkboxState).toBe("indeterminate");
    });
  });

  describe("UI state", () => {
    it("should pass through UI state flags", () => {
      const row = createTestRow();
      const options = createTestOptions(row, {
        uiState: {
          isRowHovered: true,
          isContextRow: true,
          isEditing: true,
          isPinned: true,
        },
      });

      const ctx = buildRowContext(options);

      expect(ctx.isRowHovered).toBe(true);
      expect(ctx.isContextRow).toBe(true);
      expect(ctx.isEditing).toBe(true);
      expect(ctx.isPinned).toBe(true);
    });

    it("should default UI state to false", () => {
      const row = createTestRow();
      const options = createTestOptions(row);

      const ctx = buildRowContext(options);

      expect(ctx.isRowHovered).toBe(false);
      expect(ctx.isContextRow).toBe(false);
      expect(ctx.isEditing).toBe(false);
      expect(ctx.isPinned).toBe(false);
    });
  });

  describe("position", () => {
    it("should calculate isFirstRow and isLastRow", () => {
      const row = createTestRow();

      // First row
      const firstCtx = buildRowContext(
        createTestOptions(row, { position: { index: 0, total: 3 } })
      );
      expect(firstCtx.index).toBe(0);
      expect(firstCtx.isFirstRow).toBe(true);
      expect(firstCtx.isLastRow).toBe(false);

      // Middle row
      const middleCtx = buildRowContext(
        createTestOptions(row, { position: { index: 1, total: 3 } })
      );
      expect(middleCtx.index).toBe(1);
      expect(middleCtx.isFirstRow).toBe(false);
      expect(middleCtx.isLastRow).toBe(false);

      // Last row
      const lastCtx = buildRowContext(
        createTestOptions(row, { position: { index: 2, total: 3 } })
      );
      expect(lastCtx.index).toBe(2);
      expect(lastCtx.isFirstRow).toBe(false);
      expect(lastCtx.isLastRow).toBe(true);
    });

    it("should handle single-item list (first and last)", () => {
      const row = createTestRow();
      const ctx = buildRowContext(
        createTestOptions(row, { position: { index: 0, total: 1 } })
      );

      expect(ctx.isFirstRow).toBe(true);
      expect(ctx.isLastRow).toBe(true);
    });
  });

  describe("DnD state", () => {
    it("should pass through DnD state", () => {
      const row = createTestRow();
      const options = createTestOptions(row, {
        dnd: {
          isDraggable: true,
          isDragging: true,
          isDragActive: true,
          dragClasses: "ring-2 ring-primary",
        },
      });

      const ctx = buildRowContext(options);

      expect(ctx.isDraggable).toBe(true);
      expect(ctx.isDragging).toBe(true);
      expect(ctx.isDragActive).toBe(true);
      expect(ctx.dragClasses).toBe("ring-2 ring-primary");
    });

    it("should use NO_DND defaults", () => {
      const row = createTestRow();
      const options = createTestOptions(row, { dnd: NO_DND });

      const ctx = buildRowContext(options);

      expect(ctx.isDraggable).toBe(false);
      expect(ctx.isDragging).toBe(false);
      expect(ctx.isDragActive).toBe(false);
      expect(ctx.dragClasses).toBeUndefined();
    });
  });

  describe("edit handlers", () => {
    it("should pass through edit handlers", () => {
      const row = createTestRow();
      const onStartEdit = jest.fn();
      const onCancelEdit = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const options = createTestOptions(row, {
        editHandlers: {
          onStartEdit,
          onCancelEdit,
          onSave,
        },
      });

      const ctx = buildRowContext(options);

      expect(ctx.onStartEdit).toBe(onStartEdit);
      expect(ctx.onCancelEdit).toBe(onCancelEdit);
      expect(ctx.onSave).toBe(onSave);
    });
  });

  describe("extra context", () => {
    it("should pass through extra context", () => {
      const row = createTestRow();
      const extra = {
        getLabels: jest.fn().mockReturnValue(["Label 1", "Label 2"]),
        handleVisibility: jest.fn(),
      };

      const options = createTestOptions(row, { extra });

      const ctx = buildRowContext(options);

      expect(ctx.extra).toBe(extra);
      expect((ctx.extra.getLabels as jest.Mock)()).toEqual(["Label 1", "Label 2"]);
    });

    it("should default to empty object", () => {
      const row = createTestRow();
      const options = createTestOptions(row, { extra: {} });

      const ctx = buildRowContext(options);

      expect(ctx.extra).toEqual({});
    });
  });
});

describe("NO_DND constant", () => {
  it("should have all flags disabled", () => {
    expect(NO_DND.isDraggable).toBe(false);
    expect(NO_DND.isDragging).toBe(false);
    expect(NO_DND.isDragActive).toBe(false);
    expect(NO_DND.dragClasses).toBeUndefined();
  });
});

import { act, renderHook } from "@testing-library/react";
import { useRowClickHandler } from "../useRowClickHandler";
import type { IdentityRegistry, RowIdentity } from "../../types/identity-registry";

// Create a simple mock registry
function createMockRegistry(entries: { key: string; kind: string; id: string }[]): IdentityRegistry {
  const map = new Map<string, RowIdentity>();
  for (const entry of entries) {
    map.set(entry.key, {
      key: entry.key,
      kind: entry.kind,
      entityId: entry.id,
      depth: 0,
      parentKey: null,
      childKeys: [],
      isExpandable: false,
      containsKinds: [],
    });
  }

  return {
    byKey: map,
    allKeys: entries.map((e) => e.key),
    keysByKind: {},
    get: (key: string) => map.get(key),
    getEntityId: (key: string) => map.get(key)?.entityId,
    getKind: (key: string) => map.get(key)?.kind,
    getDepth: () => 0,
    getParentKey: () => null,
    getChildKeys: () => [],
    isExpandable: () => false,
    getContainsKinds: () => [],
    canReceiveDrop: () => false,
  };
}

describe("useRowClickHandler", () => {
  describe("shift+click range selection", () => {
    it("calls rangeSelect when shift+click with anchor present", () => {
      const registry = createMockRegistry([
        { key: "label:a", kind: "label", id: "a" },
        { key: "label:b", kind: "label", id: "b" },
        { key: "label:c", kind: "label", id: "c" },
      ]);

      const onToggle = jest.fn();
      const rangeSelect = jest.fn();
      const anchorKey = "label:a"; // Anchor already set

      const { result } = renderHook(() =>
        useRowClickHandler(registry, {
          onToggle,
          rangeSelect,
          anchorKey,
        })
      );

      // Shift+click on label:c
      act(() => {
        result.current.handleClick("label:c", { shiftKey: true });
      });

      // Should call rangeSelect, NOT onToggle
      expect(rangeSelect).toHaveBeenCalledWith("label:c");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("does NOT call rangeSelect when shift+click without anchor", () => {
      const registry = createMockRegistry([
        { key: "label:a", kind: "label", id: "a" },
        { key: "label:b", kind: "label", id: "b" },
      ]);

      const onToggle = jest.fn();
      const rangeSelect = jest.fn();
      const anchorKey = null; // No anchor

      const { result } = renderHook(() =>
        useRowClickHandler(registry, {
          onToggle,
          rangeSelect,
          anchorKey,
        })
      );

      // Shift+click on label:b
      act(() => {
        result.current.handleClick("label:b", { shiftKey: true });
      });

      // Without anchor, should fall through to onToggle
      expect(rangeSelect).not.toHaveBeenCalled();
      expect(onToggle).toHaveBeenCalledWith("label:b");
    });

    it("calls onToggle when clicking without shift (no range select)", () => {
      const registry = createMockRegistry([
        { key: "label:a", kind: "label", id: "a" },
        { key: "label:b", kind: "label", id: "b" },
      ]);

      const onToggle = jest.fn();
      const rangeSelect = jest.fn();
      const anchorKey = "label:a";

      const { result } = renderHook(() =>
        useRowClickHandler(registry, {
          onToggle,
          rangeSelect,
          anchorKey,
        })
      );

      // Click without shift
      act(() => {
        result.current.handleClick("label:b", { shiftKey: false });
      });

      expect(rangeSelect).not.toHaveBeenCalled();
      expect(onToggle).toHaveBeenCalledWith("label:b");
    });

    it("calls onToggle when clicking with no options passed", () => {
      const registry = createMockRegistry([
        { key: "label:a", kind: "label", id: "a" },
      ]);

      const onToggle = jest.fn();
      const rangeSelect = jest.fn();
      const anchorKey = "label:a";

      const { result } = renderHook(() =>
        useRowClickHandler(registry, {
          onToggle,
          rangeSelect,
          anchorKey,
        })
      );

      // Click with no options (like from checkbox)
      act(() => {
        result.current.handleClick("label:a");
      });

      expect(rangeSelect).not.toHaveBeenCalled();
      expect(onToggle).toHaveBeenCalledWith("label:a");
    });

    it("calls onToggleWithHierarchy when provided instead of onToggle", () => {
      const registry = createMockRegistry([
        { key: "label:a", kind: "label", id: "a" },
      ]);

      const onToggle = jest.fn();
      const onToggleWithHierarchy = jest.fn();
      const rangeSelect = jest.fn();

      const { result } = renderHook(() =>
        useRowClickHandler(registry, {
          onToggle,
          onToggleWithHierarchy,
          rangeSelect,
          anchorKey: null,
        })
      );

      act(() => {
        result.current.handleClick("label:a");
      });

      expect(onToggleWithHierarchy).toHaveBeenCalledWith("label:a");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("updates when anchorKey changes (callback recreated)", () => {
      const registry = createMockRegistry([
        { key: "label:a", kind: "label", id: "a" },
        { key: "label:b", kind: "label", id: "b" },
      ]);

      const onToggle = jest.fn();
      const rangeSelect = jest.fn();

      // Start with no anchor
      const { result, rerender } = renderHook(
        ({ anchorKey }) =>
          useRowClickHandler(registry, {
            onToggle,
            rangeSelect,
            anchorKey,
          }),
        { initialProps: { anchorKey: null as string | null } }
      );

      // Shift+click with no anchor - falls through to toggle
      act(() => {
        result.current.handleClick("label:b", { shiftKey: true });
      });
      expect(rangeSelect).not.toHaveBeenCalled();
      expect(onToggle).toHaveBeenCalledTimes(1);

      // Now rerender with anchor set
      rerender({ anchorKey: "label:a" });

      // Clear mocks
      onToggle.mockClear();
      rangeSelect.mockClear();

      // Shift+click again - now should call rangeSelect
      act(() => {
        result.current.handleClick("label:b", { shiftKey: true });
      });
      expect(rangeSelect).toHaveBeenCalledWith("label:b");
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("handleDoubleClick navigation", () => {
    it("calls navigate with kind and entityId", () => {
      const registry = createMockRegistry([
        { key: "label:myLabel", kind: "label", id: "myLabel" },
      ]);

      const navigate = jest.fn();

      const { result } = renderHook(() =>
        useRowClickHandler(registry, {
          onToggle: jest.fn(),
          navigate,
        })
      );

      act(() => {
        result.current.handleDoubleClick("label:myLabel");
      });

      expect(navigate).toHaveBeenCalledWith("label", "myLabel");
    });
  });
});

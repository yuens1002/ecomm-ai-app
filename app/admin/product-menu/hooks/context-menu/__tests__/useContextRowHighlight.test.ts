/**
 * useContextRowHighlight Tests
 *
 * Tests the context menu row highlighting hook used across all table views.
 */

import { renderHook, act } from "@testing-library/react";
import { useContextRowHighlight } from "../useContextRowHighlight";

describe("useContextRowHighlight", () => {
  describe("initialization", () => {
    it("should initialize with null contextRowId", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      expect(result.current.contextRowId).toBeNull();
    });

    it("should return isContextRow as false for any row initially", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      expect(result.current.isContextRow("row-1")).toBe(false);
      expect(result.current.isContextRow("row-2")).toBe(false);
    });
  });

  describe("handleContextOpenChange", () => {
    it("should set contextRowId when menu opens", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });

      expect(result.current.contextRowId).toBe("row-1");
    });

    it("should clear contextRowId when menu closes", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      // Open menu
      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });
      expect(result.current.contextRowId).toBe("row-1");

      // Close menu
      act(() => {
        result.current.handleContextOpenChange("row-1")(false);
      });
      expect(result.current.contextRowId).toBeNull();
    });

    it("should switch contextRowId when different menu opens", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      // Open first menu
      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });
      expect(result.current.contextRowId).toBe("row-1");

      // Open second menu (implicitly closes first)
      act(() => {
        result.current.handleContextOpenChange("row-2")(true);
      });
      expect(result.current.contextRowId).toBe("row-2");
    });
  });

  describe("isContextRow", () => {
    it("should return true for the context row", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });

      expect(result.current.isContextRow("row-1")).toBe(true);
    });

    it("should return false for non-context rows", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });

      expect(result.current.isContextRow("row-2")).toBe(false);
      expect(result.current.isContextRow("row-3")).toBe(false);
    });

    it("should return false for all rows when menu is closed", () => {
      const { result } = renderHook(() => useContextRowHighlight());

      // Open then close
      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });
      act(() => {
        result.current.handleContextOpenChange("row-1")(false);
      });

      expect(result.current.isContextRow("row-1")).toBe(false);
    });
  });

  describe("handler stability", () => {
    it("should return stable handleContextOpenChange reference", () => {
      const { result, rerender } = renderHook(() => useContextRowHighlight());

      const firstHandler = result.current.handleContextOpenChange;
      rerender();
      const secondHandler = result.current.handleContextOpenChange;

      expect(firstHandler).toBe(secondHandler);
    });

    it("should update isContextRow when contextRowId changes", () => {
      const { result, rerender } = renderHook(() => useContextRowHighlight());

      // Initial check
      expect(result.current.isContextRow("row-1")).toBe(false);

      // Change state
      act(() => {
        result.current.handleContextOpenChange("row-1")(true);
      });

      rerender();

      // After rerender, should reflect new state
      expect(result.current.isContextRow("row-1")).toBe(true);
    });
  });
});

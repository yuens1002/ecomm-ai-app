/**
 * useMoveHandlers Tests
 *
 * Tests the move up/down logic used across table views with manual reordering.
 */

import { renderHook, act } from "@testing-library/react";
import { useMoveHandlers } from "../useMoveHandlers";

describe("useMoveHandlers", () => {
  const createItems = () => [
    { id: "item-1", name: "First" },
    { id: "item-2", name: "Second" },
    { id: "item-3", name: "Third" },
  ];

  describe("handleMoveUp", () => {
    it("should swap with previous item", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveUp("item-2");
      });

      expect(reorder).toHaveBeenCalledWith(["item-2", "item-1", "item-3"]);
    });

    it("should do nothing when already first", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveUp("item-1");
      });

      expect(reorder).not.toHaveBeenCalled();
    });

    it("should do nothing when item not found", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveUp("non-existent");
      });

      expect(reorder).not.toHaveBeenCalled();
    });

    it("should call onReorderComplete after reorder", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);
      const onReorderComplete = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder, onReorderComplete })
      );

      await act(async () => {
        await result.current.handleMoveUp("item-2");
      });

      expect(onReorderComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleMoveDown", () => {
    it("should swap with next item", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveDown("item-2");
      });

      expect(reorder).toHaveBeenCalledWith(["item-1", "item-3", "item-2"]);
    });

    it("should do nothing when already last", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveDown("item-3");
      });

      expect(reorder).not.toHaveBeenCalled();
    });

    it("should do nothing when item not found", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveDown("non-existent");
      });

      expect(reorder).not.toHaveBeenCalled();
    });

    it("should call onReorderComplete after reorder", async () => {
      const items = createItems();
      const reorder = jest.fn().mockResolvedValue(undefined);
      const onReorderComplete = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder, onReorderComplete })
      );

      await act(async () => {
        await result.current.handleMoveDown("item-2");
      });

      expect(onReorderComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPositionFlags", () => {
    it("should return isFirst: true for first item", () => {
      const items = createItems();
      const reorder = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      const flags = result.current.getPositionFlags("item-1");
      expect(flags.isFirst).toBe(true);
      expect(flags.isLast).toBe(false);
    });

    it("should return isLast: true for last item", () => {
      const items = createItems();
      const reorder = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      const flags = result.current.getPositionFlags("item-3");
      expect(flags.isFirst).toBe(false);
      expect(flags.isLast).toBe(true);
    });

    it("should return both false for middle item", () => {
      const items = createItems();
      const reorder = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      const flags = result.current.getPositionFlags("item-2");
      expect(flags.isFirst).toBe(false);
      expect(flags.isLast).toBe(false);
    });

    it("should return isFirst and isLast true for single item", () => {
      const items = [{ id: "only-item" }];
      const reorder = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      const flags = result.current.getPositionFlags("only-item");
      expect(flags.isFirst).toBe(true);
      expect(flags.isLast).toBe(true);
    });

    it("should handle non-existent item", () => {
      const items = createItems();
      const reorder = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      // When not found, index is -1
      // isFirst: -1 === 0 = false
      // isLast: -1 === 2 = false
      const flags = result.current.getPositionFlags("non-existent");
      expect(flags.isFirst).toBe(false);
      expect(flags.isLast).toBe(false);
    });
  });

  describe("handler stability", () => {
    it("should return stable handlers when items unchanged", () => {
      const items = createItems();
      const reorder = jest.fn();

      const { result, rerender } = renderHook(
        ({ items }) => useMoveHandlers({ items, reorder }),
        { initialProps: { items } }
      );

      const firstHandlers = {
        handleMoveUp: result.current.handleMoveUp,
        handleMoveDown: result.current.handleMoveDown,
        getPositionFlags: result.current.getPositionFlags,
      };

      // Rerender with same items reference
      rerender({ items });

      expect(result.current.handleMoveUp).toBe(firstHandlers.handleMoveUp);
      expect(result.current.handleMoveDown).toBe(firstHandlers.handleMoveDown);
      expect(result.current.getPositionFlags).toBe(firstHandlers.getPositionFlags);
    });

    it("should update handlers when items change", () => {
      const items1 = createItems();
      const items2 = [...createItems(), { id: "item-4", name: "Fourth" }];
      const reorder = jest.fn();

      const { result, rerender } = renderHook(
        ({ items }) => useMoveHandlers({ items, reorder }),
        { initialProps: { items: items1 } }
      );

      const firstGetPositionFlags = result.current.getPositionFlags;

      // Item 3 should be last
      expect(result.current.getPositionFlags("item-3").isLast).toBe(true);

      // Rerender with new items
      rerender({ items: items2 });

      // Handler reference changed
      expect(result.current.getPositionFlags).not.toBe(firstGetPositionFlags);

      // Item 3 should no longer be last
      expect(result.current.getPositionFlags("item-3").isLast).toBe(false);
      expect(result.current.getPositionFlags("item-4").isLast).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty items array", async () => {
      const items: { id: string }[] = [];
      const reorder = jest.fn();

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      await act(async () => {
        await result.current.handleMoveUp("any-id");
        await result.current.handleMoveDown("any-id");
      });

      expect(reorder).not.toHaveBeenCalled();
    });

    it("should handle two-item array correctly", async () => {
      const items = [
        { id: "first" },
        { id: "second" },
      ];
      const reorder = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMoveHandlers({ items, reorder })
      );

      // Move second up
      await act(async () => {
        await result.current.handleMoveUp("second");
      });

      expect(reorder).toHaveBeenCalledWith(["second", "first"]);

      // Position flags
      expect(result.current.getPositionFlags("first").isFirst).toBe(true);
      expect(result.current.getPositionFlags("first").isLast).toBe(false);
      expect(result.current.getPositionFlags("second").isFirst).toBe(false);
      expect(result.current.getPositionFlags("second").isLast).toBe(true);
    });
  });
});

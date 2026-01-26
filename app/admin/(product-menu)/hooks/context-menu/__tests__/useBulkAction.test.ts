/**
 * useBulkAction Tests
 *
 * Tests the bulk action executor used in "All" table views.
 */

import { renderHook, act } from "@testing-library/react";
import { useBulkAction } from "../useBulkAction";

// Mock useToast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("useBulkAction", () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe("getTargetIds", () => {
    it("should return single ID when entity is not in selection", () => {
      const isSelected = jest.fn().mockReturnValue(false);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:other-1", "label:other-2"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      const targetIds = result.current.getTargetIds("my-label");

      expect(targetIds).toEqual(["my-label"]);
      expect(isSelected).toHaveBeenCalledWith("label:my-label");
    });

    it("should return single ID when entity is selected but only one item", () => {
      const isSelected = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:my-label"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      const targetIds = result.current.getTargetIds("my-label");

      expect(targetIds).toEqual(["my-label"]);
    });

    it("should return all selected IDs when entity is in bulk selection", () => {
      const isSelected = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "label:label-2", "label:label-3"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      const targetIds = result.current.getTargetIds("label-1");

      expect(targetIds).toEqual(["label-1", "label-2", "label-3"]);
    });

    it("should return single ID when mixed kinds (isSameKind: false)", () => {
      const isSelected = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "category:cat-1"],
          isSameKind: false, // Mixed selection
          entityKind: "label",
        })
      );

      const targetIds = result.current.getTargetIds("label-1");

      // Mixed kinds = single item operation
      expect(targetIds).toEqual(["label-1"]);
    });
  });

  describe("isBulkOperation", () => {
    it("should return false when entity is not in selection", () => {
      const isSelected = jest.fn().mockReturnValue(false);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:other-1", "label:other-2"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      expect(result.current.isBulkOperation("my-label")).toBe(false);
    });

    it("should return false when only one item selected", () => {
      const isSelected = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:my-label"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      expect(result.current.isBulkOperation("my-label")).toBe(false);
    });

    it("should return true when entity is in bulk selection", () => {
      const isSelected = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "label:label-2"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      expect(result.current.isBulkOperation("label-1")).toBe(true);
    });

    it("should return false when mixed kinds", () => {
      const isSelected = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "category:cat-1"],
          isSameKind: false,
          entityKind: "label",
        })
      );

      expect(result.current.isBulkOperation("label-1")).toBe(false);
    });
  });

  describe("executeBulkAction", () => {
    it("should call action for single target", async () => {
      const isSelected = jest.fn().mockReturnValue(false);
      const action = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: [],
          isSameKind: true,
          entityKind: "label",
        })
      );

      await act(async () => {
        await result.current.executeBulkAction("my-label", action, {
          successMessage: (count) => (count > 1 ? `${count} done` : "Done"),
          errorMessage: "Failed",
        });
      });

      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith("my-label");
      expect(mockToast).toHaveBeenCalledWith({ title: "Done" });
    });

    it("should call action for all targets in bulk operation", async () => {
      const isSelected = jest.fn().mockReturnValue(true);
      const action = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "label:label-2", "label:label-3"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      await act(async () => {
        await result.current.executeBulkAction("label-1", action, {
          successMessage: (count) => `${count} labels cloned`,
          errorMessage: "Some failed",
        });
      });

      expect(action).toHaveBeenCalledTimes(3);
      expect(action).toHaveBeenCalledWith("label-1");
      expect(action).toHaveBeenCalledWith("label-2");
      expect(action).toHaveBeenCalledWith("label-3");
      expect(mockToast).toHaveBeenCalledWith({ title: "3 labels cloned" });
    });

    it("should show success toast with correct count", async () => {
      const isSelected = jest.fn().mockReturnValue(true);
      const action = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["category:cat-1", "category:cat-2"],
          isSameKind: true,
          entityKind: "category",
        })
      );

      await act(async () => {
        await result.current.executeBulkAction("cat-1", action, {
          successMessage: (count) =>
            count > 1 ? `${count} categories deleted` : "Category deleted",
          errorMessage: "Some categories could not be deleted",
        });
      });

      expect(mockToast).toHaveBeenCalledWith({ title: "2 categories deleted" });
    });

    it("should show error toast when some actions fail", async () => {
      const isSelected = jest.fn().mockReturnValue(true);
      const action = jest
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "label:label-2", "label:label-3"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      await act(async () => {
        await result.current.executeBulkAction("label-1", action, {
          successMessage: (count) => `${count} done`,
          errorMessage: "Some labels could not be processed",
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Some labels could not be processed",
        variant: "destructive",
      });
    });

    it("should return all action results", async () => {
      const isSelected = jest.fn().mockReturnValue(true);
      const action = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, id: "new-1" })
        .mockResolvedValueOnce({ ok: true, id: "new-2" });

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: ["label:label-1", "label:label-2"],
          isSameKind: true,
          entityKind: "label",
        })
      );

      let results: unknown[];
      await act(async () => {
        results = await result.current.executeBulkAction("label-1", action, {
          successMessage: () => "Done",
          errorMessage: "Failed",
        });
      });

      expect(results!).toEqual([
        { ok: true, id: "new-1" },
        { ok: true, id: "new-2" },
      ]);
    });

    it("should handle actions without ok property", async () => {
      const isSelected = jest.fn().mockReturnValue(false);
      const action = jest.fn().mockResolvedValue("success");

      const { result } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots: [],
          isSameKind: true,
          entityKind: "label",
        })
      );

      await act(async () => {
        await result.current.executeBulkAction("my-label", action, {
          successMessage: () => "Done",
          errorMessage: "Failed",
        });
      });

      // Should assume success when no 'ok' property
      expect(mockToast).toHaveBeenCalledWith({ title: "Done" });
    });
  });

  describe("handler stability", () => {
    it("should return stable handlers when deps unchanged", () => {
      const isSelected = jest.fn().mockReturnValue(false);
      const actionableRoots: readonly string[] = [];

      const { result, rerender } = renderHook(() =>
        useBulkAction({
          isSelected,
          actionableRoots,
          isSameKind: true,
          entityKind: "label",
        })
      );

      const firstHandlers = {
        getTargetIds: result.current.getTargetIds,
        isBulkOperation: result.current.isBulkOperation,
        executeBulkAction: result.current.executeBulkAction,
      };

      rerender();

      expect(result.current.getTargetIds).toBe(firstHandlers.getTargetIds);
      expect(result.current.isBulkOperation).toBe(firstHandlers.isBulkOperation);
      expect(result.current.executeBulkAction).toBe(firstHandlers.executeBulkAction);
    });
  });
});

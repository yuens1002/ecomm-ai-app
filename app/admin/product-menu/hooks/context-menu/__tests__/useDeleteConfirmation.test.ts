/**
 * useDeleteConfirmation Tests
 *
 * Tests the delete confirmation dialog state and handlers.
 * The hook accepts entity kind at request time (like action bar), not hook instantiation.
 */

import { renderHook, act } from "@testing-library/react";
import { useDeleteConfirmation } from "../useDeleteConfirmation";

// Mock useToast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("useDeleteConfirmation", () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe("initialization", () => {
    it("should initialize with closed dialog and empty targetIds", () => {
      const deleteEntity = jest.fn();

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      expect(result.current.deleteConfirmation).toEqual({
        open: false,
        targetIds: [],
        entityKind: "label", // Default value
      });
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe("requestDelete", () => {
    it("should open dialog with single target ID and entity kind", () => {
      const deleteEntity = jest.fn();

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label");
      });

      expect(result.current.deleteConfirmation).toEqual({
        open: true,
        targetIds: ["label-1"],
        entityKind: "label",
      });
    });

    it("should open dialog with category entity kind", () => {
      const deleteEntity = jest.fn();

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("cat-1", "category");
      });

      expect(result.current.deleteConfirmation).toEqual({
        open: true,
        targetIds: ["cat-1"],
        entityKind: "category",
      });
    });

    it("should open dialog with multiple target IDs from getTargetIds", () => {
      const deleteEntity = jest.fn();
      const getTargetIds = (id: string) => [id, "label-2", "label-3"];

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label", getTargetIds);
      });

      expect(result.current.deleteConfirmation).toEqual({
        open: true,
        targetIds: ["label-1", "label-2", "label-3"],
        entityKind: "label",
      });
    });
  });

  describe("cancelDelete", () => {
    it("should close dialog and clear targets", () => {
      const deleteEntity = jest.fn();

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      // Open dialog
      act(() => {
        result.current.requestDelete("label-1", "label");
      });
      expect(result.current.deleteConfirmation.open).toBe(true);

      // Cancel
      act(() => {
        result.current.cancelDelete();
      });

      expect(result.current.deleteConfirmation).toEqual({
        open: false,
        targetIds: [],
        entityKind: "label",
      });
    });
  });

  describe("confirmDelete", () => {
    it("should call deleteEntity with kind and id for each target", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      // Open dialog with multiple targets
      act(() => {
        result.current.requestDelete("label-1", "label", () => ["label-1", "label-2"]);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(deleteEntity).toHaveBeenCalledTimes(2);
      expect(deleteEntity).toHaveBeenCalledWith("label", "label-1");
      expect(deleteEntity).toHaveBeenCalledWith("label", "label-2");
    });

    it("should set isDeleting during operation", async () => {
      let resolveDelete: () => void;
      const deleteEntity = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDelete = () => resolve({ ok: true });
          })
      );

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label");
      });

      // Start delete
      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current.confirmDelete();
      });

      // Should be deleting
      expect(result.current.isDeleting).toBe(true);

      // Resolve
      await act(async () => {
        resolveDelete!();
        await deletePromise;
      });

      // Should no longer be deleting
      expect(result.current.isDeleting).toBe(false);
    });

    it("should show success toast for single label", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label");
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(mockToast).toHaveBeenCalledWith({ title: "Label deleted" });
    });

    it("should show success toast for multiple labels", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label", () => ["label-1", "label-2", "label-3"]);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(mockToast).toHaveBeenCalledWith({ title: "3 labels deleted" });
    });

    it("should show success toast for single category", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("cat-1", "category");
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(mockToast).toHaveBeenCalledWith({ title: "Category deleted" });
    });

    it("should show success toast for multiple categories", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("cat-1", "category", () => ["cat-1", "cat-2"]);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(mockToast).toHaveBeenCalledWith({ title: "2 categories deleted" });
    });

    it("should show error toast when some deletions fail", async () => {
      const deleteEntity = jest
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label", () => ["label-1", "label-2"]);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Some labels could not be deleted",
        variant: "destructive",
      });
    });

    it("should call onSuccess with count and kind after successful delete", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
          onSuccess,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label", () => ["label-1", "label-2"]);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(onSuccess).toHaveBeenCalledWith(2, "label");
    });

    it("should not call onSuccess when some deletions fail", async () => {
      const deleteEntity = jest
        .fn()
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false });
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
          onSuccess,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label", () => ["label-1", "label-2"]);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should close dialog after completion", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label");
      });
      expect(result.current.deleteConfirmation.open).toBe(true);

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(result.current.deleteConfirmation).toEqual({
        open: false,
        targetIds: [],
        entityKind: "label",
      });
    });

    it("should do nothing when targetIds is empty", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      // Don't open dialog, just call confirm directly
      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(deleteEntity).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe("handler stability", () => {
    it("should return stable requestDelete and cancelDelete handlers", () => {
      const deleteEntity = jest.fn();

      const { result, rerender } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      const firstHandlers = {
        requestDelete: result.current.requestDelete,
        cancelDelete: result.current.cancelDelete,
      };

      rerender();

      expect(result.current.requestDelete).toBe(firstHandlers.requestDelete);
      expect(result.current.cancelDelete).toBe(firstHandlers.cancelDelete);
    });
  });

  describe("mixed entity kinds", () => {
    it("should handle switching between label and category deletes", async () => {
      const deleteEntity = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      // Delete a label
      act(() => {
        result.current.requestDelete("label-1", "label");
      });
      expect(result.current.deleteConfirmation.entityKind).toBe("label");

      await act(async () => {
        await result.current.confirmDelete();
      });
      expect(deleteEntity).toHaveBeenCalledWith("label", "label-1");

      // Delete a category
      act(() => {
        result.current.requestDelete("cat-1", "category");
      });
      expect(result.current.deleteConfirmation.entityKind).toBe("category");

      await act(async () => {
        await result.current.confirmDelete();
      });
      expect(deleteEntity).toHaveBeenCalledWith("category", "cat-1");
    });
  });

  describe("edge cases", () => {
    it("should handle error in deleteEntity gracefully", async () => {
      const deleteEntity = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteEntity,
        })
      );

      act(() => {
        result.current.requestDelete("label-1", "label");
      });

      // Should throw (or be handled by caller)
      await expect(
        act(async () => {
          await result.current.confirmDelete();
        })
      ).rejects.toThrow("Network error");

      // isDeleting should still be reset (in finally block)
      // Note: In real implementation, we might want to catch and handle this better
    });
  });
});

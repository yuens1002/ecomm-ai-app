/** @jest-environment node */

import {
  reorderProductsInCategory,
  sortProductsInCategory,
  moveProductToCategory,
  batchMoveProductsToCategory,
} from "../products";

// Mock Prisma
const mockUpdate = jest.fn();
const mockFindMany = jest.fn();
const mockTransaction = jest.fn();
const mockFindUnique = jest.fn();
const mockDelete = jest.fn();
const mockCreate = jest.fn();
const mockUpdateMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    categoriesOnProducts: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
    $transaction: (fn: unknown) => {
      if (typeof fn === "function") {
        // For transaction with callback, execute the callback with mock tx
        return fn({
          categoriesOnProducts: {
            findUnique: mockFindUnique,
            delete: mockDelete,
            create: mockCreate,
            updateMany: mockUpdateMany,
          },
        });
      }
      // For transaction with array of operations
      return mockTransaction(fn);
    },
  },
}));

describe("actions/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reorderProductsInCategory", () => {
    it("should return error for invalid categoryId", async () => {
      const result = await reorderProductsInCategory(123, ["p1", "p2"]);
      expect(result).toEqual({ ok: false, error: "Invalid categoryId" });
    });

    it("should return error for invalid productIds", async () => {
      const result = await reorderProductsInCategory("cat1", "not-an-array");
      expect(result).toEqual({ ok: false, error: "Invalid productIds array" });
    });

    it("should return error for productIds with non-string items", async () => {
      const result = await reorderProductsInCategory("cat1", [1, 2, 3]);
      expect(result).toEqual({ ok: false, error: "Invalid productIds array" });
    });

    it("should update order for each product in the category", async () => {
      mockTransaction.mockResolvedValueOnce([{}, {}, {}]);

      const result = await reorderProductsInCategory("cat1", ["p1", "p2", "p3"]);

      expect(result).toEqual({ ok: true });
      expect(mockTransaction).toHaveBeenCalledTimes(1);

      // Verify transaction receives correct update operations
      const transactionArg = mockTransaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(3);
    });

    it("should handle empty productIds array", async () => {
      mockTransaction.mockResolvedValueOnce([]);

      const result = await reorderProductsInCategory("cat1", []);

      expect(result).toEqual({ ok: true });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should return error on database failure", async () => {
      mockTransaction.mockRejectedValueOnce(new Error("DB connection failed"));

      const result = await reorderProductsInCategory("cat1", ["p1", "p2"]);

      expect(result).toEqual({ ok: false, error: "DB connection failed" });
    });
  });

  describe("sortProductsInCategory", () => {
    it("should return error for invalid categoryId", async () => {
      const result = await sortProductsInCategory(123, "name", "asc");
      expect(result).toEqual({ ok: false, error: "Invalid categoryId" });
    });

    it("should return error for invalid sortBy", async () => {
      const result = await sortProductsInCategory("cat1", "invalid", "asc");
      expect(result).toEqual({ ok: false, error: "Invalid sortBy value" });
    });

    it("should return error for invalid direction", async () => {
      const result = await sortProductsInCategory("cat1", "name", "invalid");
      expect(result).toEqual({ ok: false, error: "Invalid direction value" });
    });

    it("should sort products by name ascending", async () => {
      mockFindMany.mockResolvedValueOnce([
        { productId: "p2", categoryId: "cat1", product: { name: "Zebra", createdAt: new Date() } },
        { productId: "p1", categoryId: "cat1", product: { name: "Apple", createdAt: new Date() } },
        { productId: "p3", categoryId: "cat1", product: { name: "Mango", createdAt: new Date() } },
      ]);
      mockTransaction.mockResolvedValueOnce([{}, {}, {}]);

      const result = await sortProductsInCategory("cat1", "name", "asc");

      expect(result).toEqual({ ok: true });
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { categoryId: "cat1" },
        include: {
          product: { select: { name: true, createdAt: true } },
        },
      });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should sort products by name descending", async () => {
      mockFindMany.mockResolvedValueOnce([
        { productId: "p1", categoryId: "cat1", product: { name: "Apple", createdAt: new Date() } },
        { productId: "p2", categoryId: "cat1", product: { name: "Zebra", createdAt: new Date() } },
      ]);
      mockTransaction.mockResolvedValueOnce([{}, {}]);

      const result = await sortProductsInCategory("cat1", "name", "desc");

      expect(result).toEqual({ ok: true });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should sort products by createdAt ascending", async () => {
      const older = new Date("2024-01-01");
      const newer = new Date("2024-06-01");

      mockFindMany.mockResolvedValueOnce([
        { productId: "p2", categoryId: "cat1", product: { name: "B", createdAt: newer } },
        { productId: "p1", categoryId: "cat1", product: { name: "A", createdAt: older } },
      ]);
      mockTransaction.mockResolvedValueOnce([{}, {}]);

      const result = await sortProductsInCategory("cat1", "createdAt", "asc");

      expect(result).toEqual({ ok: true });
    });

    it("should sort products by createdAt descending", async () => {
      const older = new Date("2024-01-01");
      const newer = new Date("2024-06-01");

      mockFindMany.mockResolvedValueOnce([
        { productId: "p1", categoryId: "cat1", product: { name: "A", createdAt: older } },
        { productId: "p2", categoryId: "cat1", product: { name: "B", createdAt: newer } },
      ]);
      mockTransaction.mockResolvedValueOnce([{}, {}]);

      const result = await sortProductsInCategory("cat1", "createdAt", "desc");

      expect(result).toEqual({ ok: true });
    });

    it("should handle empty category", async () => {
      mockFindMany.mockResolvedValueOnce([]);
      mockTransaction.mockResolvedValueOnce([]);

      const result = await sortProductsInCategory("cat1", "name", "asc");

      expect(result).toEqual({ ok: true });
    });

    it("should return error on database failure", async () => {
      mockFindMany.mockRejectedValueOnce(new Error("DB error"));

      const result = await sortProductsInCategory("cat1", "name", "asc");

      expect(result).toEqual({ ok: false, error: "DB error" });
    });
  });

  describe("moveProductToCategory", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return error for invalid input", async () => {
      const result = await moveProductToCategory({ productId: "" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Validation failed");
    });

    it("should return ok if moving to same category", async () => {
      const result = await moveProductToCategory({
        productId: "p1",
        fromCategoryId: "cat1",
        toCategoryId: "cat1",
      });
      expect(result).toEqual({ ok: true, data: {} });
    });

    it("should return error if product not in source category", async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      const result = await moveProductToCategory({
        productId: "p1",
        fromCategoryId: "cat1",
        toCategoryId: "cat2",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Product is not in source category");
    });

    it("should move product from source to target category", async () => {
      mockFindUnique
        .mockResolvedValueOnce({ productId: "p1", categoryId: "cat1", isPrimary: false }) // source exists
        .mockResolvedValueOnce(null); // not in target
      mockUpdateMany.mockResolvedValueOnce({ count: 5 });
      mockDelete.mockResolvedValueOnce({});
      mockCreate.mockResolvedValueOnce({});

      const result = await moveProductToCategory({
        productId: "p1",
        fromCategoryId: "cat1",
        toCategoryId: "cat2",
      });

      expect(result).toEqual({ ok: true, data: {} });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
    });

    it("should preserve isPrimary status when moving", async () => {
      mockFindUnique
        .mockResolvedValueOnce({ productId: "p1", categoryId: "cat1", isPrimary: true })
        .mockResolvedValueOnce(null);
      mockUpdateMany.mockResolvedValueOnce({ count: 0 });
      mockDelete.mockResolvedValueOnce({});
      mockCreate.mockResolvedValueOnce({});

      await moveProductToCategory({
        productId: "p1",
        fromCategoryId: "cat1",
        toCategoryId: "cat2",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrimary: true }),
        })
      );
    });

    it("should only delete from source if already in target", async () => {
      mockFindUnique
        .mockResolvedValueOnce({ productId: "p1", categoryId: "cat1", isPrimary: false })
        .mockResolvedValueOnce({ productId: "p1", categoryId: "cat2" }); // already in target
      mockDelete.mockResolvedValueOnce({});

      const result = await moveProductToCategory({
        productId: "p1",
        fromCategoryId: "cat1",
        toCategoryId: "cat2",
      });

      expect(result).toEqual({ ok: true, data: {} });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("batchMoveProductsToCategory", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return error for invalid input", async () => {
      const result = await batchMoveProductsToCategory({ toCategoryId: "cat2" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Validation failed");
    });

    it("should return ok for empty moves array", async () => {
      const result = await batchMoveProductsToCategory({
        moves: [],
        toCategoryId: "cat2",
      });
      expect(result).toEqual({ ok: true, data: {} });
    });

    it("should skip moves where from equals to category", async () => {
      mockUpdateMany.mockResolvedValueOnce({ count: 0 });

      const result = await batchMoveProductsToCategory({
        moves: [{ productId: "p1", fromCategoryId: "cat2" }],
        toCategoryId: "cat2",
      });

      expect(result).toEqual({ ok: true, data: {} });
      // Should not try to move since from === to
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("should move multiple products to target category", async () => {
      mockUpdateMany.mockResolvedValueOnce({ count: 5 });
      mockFindUnique
        .mockResolvedValueOnce({ productId: "p1", categoryId: "cat1", isPrimary: false })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ productId: "p2", categoryId: "cat1", isPrimary: true })
        .mockResolvedValueOnce(null);
      mockDelete.mockResolvedValue({});
      mockCreate.mockResolvedValue({});

      const result = await batchMoveProductsToCategory({
        moves: [
          { productId: "p1", fromCategoryId: "cat1" },
          { productId: "p2", fromCategoryId: "cat1" },
        ],
        toCategoryId: "cat2",
      });

      expect(result).toEqual({ ok: true, data: {} });
      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it("should return error on database failure", async () => {
      mockUpdateMany.mockRejectedValueOnce(new Error("DB connection failed"));

      const result = await batchMoveProductsToCategory({
        moves: [{ productId: "p1", fromCategoryId: "cat1" }],
        toCategoryId: "cat2",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe("DB connection failed");
    });
  });
});

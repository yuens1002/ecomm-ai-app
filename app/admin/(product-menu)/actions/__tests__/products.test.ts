/** @jest-environment node */

import {
  reorderProductsInCategory,
  sortProductsInCategory,
} from "../products";

// Mock Prisma
const mockUpdate = jest.fn();
const mockFindMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    categoriesOnProducts: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    $transaction: (updates: unknown[]) => mockTransaction(updates),
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
});

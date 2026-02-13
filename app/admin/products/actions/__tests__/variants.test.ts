/** @jest-environment node */

// Mock Prisma
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockAggregate = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    productVariant: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      aggregate: (...args: unknown[]) => mockAggregate(...args),
    },
    $transaction: (fn: unknown) => {
      if (typeof fn === "function") {
        return fn({
          productVariant: {
            create: mockCreate,
            update: mockUpdate,
          },
        });
      }
      return mockTransaction(fn);
    },
  },
}));

jest.mock("@/lib/admin", () => ({
  requireAdmin: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/config/app-settings", () => ({
  getWeightUnit: jest.fn().mockResolvedValue("grams"),
}));

jest.mock("@/lib/weight-unit", () => ({
  toGrams: jest.fn((value: number) => value),
  fromGrams: jest.fn((grams: number) => grams),
  roundToInt: jest.fn((value: number) => Math.round(value)),
}));

import {
  createVariant,
  updateVariant,
  deleteVariant,
  reorderVariants,
} from "../variants";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createVariant", () => {
  it("should create a variant with correct order", async () => {
    mockAggregate.mockResolvedValue({ _max: { order: 2 } });
    mockCreate.mockResolvedValue({
      id: "var-new",
      name: "12oz Bag",
      weight: 340,
      stockQuantity: 150,
      order: 3,
      purchaseOptions: [],
    });

    const result = await createVariant({
      productId: "prod-1",
      name: "12oz Bag",
      weight: 340,
      stockQuantity: 150,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(
        expect.objectContaining({
          name: "12oz Bag",
          order: 3,
        })
      );
    }
  });

  it("should return error for invalid input", async () => {
    const result = await createVariant({
      productId: "",
      name: "",
      weight: 0,
      stockQuantity: 0,
    });

    expect(result.ok).toBe(false);
  });
});

describe("updateVariant", () => {
  it("should update variant fields", async () => {
    mockUpdate.mockResolvedValue({
      id: "var-1",
      name: "Updated Bag",
      weight: 450,
      stockQuantity: 200,
      order: 0,
      purchaseOptions: [],
    });

    const result = await updateVariant("var-1", {
      name: "Updated Bag",
      weight: 450,
      stockQuantity: 200,
    });

    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "var-1" },
      })
    );
  });
});

describe("deleteVariant", () => {
  it("should delete a variant", async () => {
    mockDelete.mockResolvedValue({ id: "var-1" });

    const result = await deleteVariant("var-1");

    expect(result.ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "var-1" } });
  });
});

describe("reorderVariants", () => {
  it("should update order for all variants", async () => {
    mockUpdate.mockResolvedValue({});

    const result = await reorderVariants({
      productId: "prod-1",
      variantIds: ["var-2", "var-1", "var-3"],
    });

    expect(result.ok).toBe(true);
    // Should be called once per variant in the transaction
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });
});

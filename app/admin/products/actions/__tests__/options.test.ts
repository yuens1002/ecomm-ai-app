/** @jest-environment node */

import { PurchaseType, BillingInterval } from "@prisma/client";

// Mock Prisma
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseOption: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

jest.mock("@/lib/admin", () => ({
  requireAdmin: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { createOption, updateOption, deleteOption } from "../options";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createOption", () => {
  it("should create a one-time purchase option", async () => {
    mockCreate.mockResolvedValue({
      id: "opt-1",
      type: PurchaseType.ONE_TIME,
      priceInCents: 2200,
      salePriceInCents: null,
      billingInterval: null,
      billingIntervalCount: null,
    });

    const result = await createOption({
      variantId: "var-1",
      type: PurchaseType.ONE_TIME,
      priceInCents: 2200,
      salePriceInCents: null,
      billingInterval: null,
      billingIntervalCount: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(
        expect.objectContaining({
          type: PurchaseType.ONE_TIME,
          priceInCents: 2200,
        })
      );
    }
  });

  it("should create a subscription option", async () => {
    mockCreate.mockResolvedValue({
      id: "opt-2",
      type: PurchaseType.SUBSCRIPTION,
      priceInCents: 1980,
      salePriceInCents: null,
      billingInterval: BillingInterval.MONTH,
      billingIntervalCount: 1,
    });

    const result = await createOption({
      variantId: "var-1",
      type: PurchaseType.SUBSCRIPTION,
      priceInCents: 1980,
      salePriceInCents: null,
      billingInterval: BillingInterval.MONTH,
      billingIntervalCount: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(
        expect.objectContaining({
          type: PurchaseType.SUBSCRIPTION,
          billingInterval: BillingInterval.MONTH,
        })
      );
    }
  });
});

describe("updateOption", () => {
  it("should update price and sale price", async () => {
    mockUpdate.mockResolvedValue({
      id: "opt-1",
      type: PurchaseType.ONE_TIME,
      priceInCents: 2500,
      salePriceInCents: 2000,
      billingInterval: null,
      billingIntervalCount: null,
    });

    const result = await updateOption("opt-1", {
      priceInCents: 2500,
      salePriceInCents: 2000,
    });

    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "opt-1" },
        data: expect.objectContaining({
          priceInCents: 2500,
          salePriceInCents: 2000,
        }),
      })
    );
  });
});

describe("deleteOption", () => {
  it("should delete a purchase option", async () => {
    mockDelete.mockResolvedValue({ id: "opt-1" });

    const result = await deleteOption("opt-1");

    expect(result.ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "opt-1" } });
  });

  it("should return error on failure", async () => {
    mockDelete.mockRejectedValue(new Error("DB error"));

    const result = await deleteOption("opt-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Failed to delete purchase option");
    }
  });
});

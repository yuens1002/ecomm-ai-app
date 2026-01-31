/** @jest-environment node */

import { NextRequest } from "next/server";
import { ProductType } from "@prisma/client";

const requireAdminApiMock = jest.fn();
const prismaMocks = {
  findUniqueMock: jest.fn(),
  updateVariantMock: jest.fn(),
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    productVariant: {
      findUnique: (...args: unknown[]) => prismaMocks.findUniqueMock(...args),
      update: (...args: unknown[]) => prismaMocks.updateVariantMock(...args),
    },
  },
}));

jest.mock("@/lib/config/app-settings", () => ({
  getWeightUnit: jest.fn().mockResolvedValue("g"),
}));

import { PUT } from "../route";

describe("PUT /api/admin/variants/[variantId]", () => {
  const params = { params: Promise.resolve({ variantId: "var_1" }) } as const;

  beforeEach(() => {
    jest.resetAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    prismaMocks.findUniqueMock.mockResolvedValue({
      id: "var_1",
      productId: "prod_1",
      product: { type: ProductType.COFFEE },
    });
    prismaMocks.updateVariantMock.mockResolvedValue({
      id: "var_1",
      weight: 340,
    });
  });

  it("uses provided weight for coffee variant", async () => {
    const req = new NextRequest("http://localhost/api/admin/variants/var_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "12oz Bag", stockQuantity: 5, weight: 340 }),
    });

    await PUT(req, params);

    expect(prismaMocks.updateVariantMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weight: 340,
        }),
      })
    );
  });

  it("rejects coffee variant with no weight info", async () => {
    const req = new NextRequest("http://localhost/api/admin/variants/var_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "No weight", stockQuantity: 1 }),
    });

    const res = await PUT(req, params);
    expect(res.status).toBe(400);
    expect(prismaMocks.updateVariantMock).not.toHaveBeenCalled();
  });

  it("allows non-coffee variant with weight", async () => {
    prismaMocks.findUniqueMock.mockResolvedValue({
      id: "var_1",
      productId: "prod_1",
      product: { type: ProductType.MERCH },
    });
    prismaMocks.updateVariantMock.mockResolvedValue({
      id: "var_1",
      weight: 100,
    });

    const req = new NextRequest("http://localhost/api/admin/variants/var_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Large", stockQuantity: 1, weight: 100 }),
    });

    await PUT(req, params);

    expect(prismaMocks.updateVariantMock).toHaveBeenCalled();
  });
});

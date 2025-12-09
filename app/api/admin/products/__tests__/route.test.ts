/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "../route";

const requireAdminApiMock = jest.fn();
const createProductMock = jest.fn();
const createImageMock = jest.fn();
const createCategoriesMock = jest.fn();

type MockTx = {
  product: { create: typeof createProductMock };
  productImage: { create: typeof createImageMock };
  categoriesOnProducts: { createMany: typeof createCategoriesMock };
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (cb: (tx: MockTx) => Promise<unknown>) =>
      cb({
        product: { create: createProductMock },
        productImage: { create: createImageMock },
        categoriesOnProducts: { createMany: createCategoriesMock },
      }),
  },
}));

describe("POST /api/admin/products", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
  });

  it("allows creating a merch product when weight is provided", async () => {
    createProductMock.mockResolvedValue({ id: "prod_123" });

    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Canvas Tote",
        slug: "canvas-tote",
        description: "Durable tote for beans",
        isOrganic: false,
        isFeatured: false,
        categoryIds: ["merch-cat"],
        imageUrl: "https://placehold.co/600x400.png",
        weightInGrams: 450,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product.id).toBe("prod_123");
    expect(createProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Canvas Tote",
          slug: "canvas-tote",
          weightInGrams: 450,
        }),
      })
    );
    expect(createImageMock).toHaveBeenCalled();
    expect(createCategoriesMock).toHaveBeenCalled();
  });

  it("rejects creation when weight is missing or invalid", async () => {
    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Canvas Tote",
        slug: "canvas-tote",
        weightInGrams: 0,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/weight is required/i);
    expect(createProductMock).not.toHaveBeenCalled();
  });
});

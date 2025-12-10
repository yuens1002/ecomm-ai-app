/** @jest-environment node */

import { NextRequest } from "next/server";
import { ProductType, RoastLevel } from "@prisma/client";
import { PRODUCT_TYPES } from "@/lib/productEnums";
import {
  buildProductPayload,
  coffeeRequiredFields,
} from "../test-utils/productTestUtils";
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

    const merchPayload = buildProductPayload(ProductType.MERCH, {
      name: "Canvas Tote",
      slug: "canvas-tote",
      description: "Durable tote for beans",
      categoryIds: ["merch-cat"],
      weight: 450,
    });

    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merchPayload),
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
          weight: 450,
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
      body: JSON.stringify(
        buildProductPayload(ProductType.MERCH, { weight: 0 })
      ),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/weight is required/i);
    expect(createProductMock).not.toHaveBeenCalled();
  });

  it("persists coffee-specific fields when creating a coffee product", async () => {
    createProductMock.mockResolvedValue({ id: "prod_coffee" });

    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildProductPayload(ProductType.COFFEE, {
          name: "Ethiopia Yirgacheffe",
          slug: "ethiopia-yirgacheffe",
          description: "Floral and citrus",
          isOrganic: true,
          categoryIds: ["coffee-cat"],
          roastLevel: RoastLevel.DARK,
          origin: ["Ethiopia"],
          tastingNotes: ["Citrus", "Floral"],
        })
      ),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product.id).toBe("prod_coffee");
    expect(createProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: ProductType.COFFEE,
          roastLevel: "DARK",
          origin: ["Ethiopia"],
          tastingNotes: ["Citrus", "Floral"],
          variety: "Heirloom",
          altitude: "1900m",
        }),
      })
    );
  });

  it("rejects coffee products without origin", async () => {
    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildProductPayload(ProductType.COFFEE, {
          name: "Missing Origin",
          slug: "missing-origin",
          roastLevel: RoastLevel.LIGHT,
          origin: [],
        })
      ),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/origin/i);
    expect(createProductMock).not.toHaveBeenCalled();
  });

  it("strips coffee-only fields when creating a merch product", async () => {
    createProductMock.mockResolvedValue({ id: "prod_merch" });

    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildProductPayload(ProductType.MERCH, {
          name: "Branded Mug",
          slug: "branded-mug",
          description: "Ceramic mug",
          categoryIds: ["merch-cat"],
          weight: 500,
          // send coffee fields to confirm they are stripped
          roastLevel: RoastLevel.DARK,
          origin: ["Ethiopia"],
          tastingNotes: ["Citrus"],
          variety: "Heirloom",
          altitude: "1900m",
        })
      ),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product.id).toBe("prod_merch");
    expect(createProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: ProductType.MERCH,
          roastLevel: null,
          origin: [],
          tastingNotes: [],
          variety: null,
          altitude: null,
        }),
      })
    );
  });

  it("enforces coffee required fields from shared shape", async () => {
    createProductMock.mockResolvedValue({ id: "prod_coffee" });

    const runWithMissingField = async (
      field: (typeof coffeeRequiredFields)[number]
    ) => {
      const payload = { ...buildProductPayload(ProductType.COFFEE) } as Record<
        string,
        unknown
      >;
      delete payload[field];

      const req = new NextRequest("http://localhost/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    };

    for (const field of coffeeRequiredFields) {
      await runWithMissingField(field);
    }
  });

  it("covers all product types from shared enum", () => {
    expect(PRODUCT_TYPES).toContain(ProductType.COFFEE);
    expect(PRODUCT_TYPES).toContain(ProductType.MERCH);
  });
});

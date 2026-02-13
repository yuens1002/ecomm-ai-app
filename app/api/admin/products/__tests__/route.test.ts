/** @jest-environment node */

import { NextRequest } from "next/server";
import { ProductType, RoastLevel } from "@prisma/client";
import { PRODUCT_TYPES } from "@/lib/productEnums";
import {
  buildProductPayload,
  coffeeRequiredFields,
} from "../test-utils/productTestUtils";
import { GET, POST } from "../route";

const requireAdminApiMock = jest.fn();
const createProductMock = jest.fn();
const createCategoriesMock = jest.fn();
const findManyProductsMock = jest.fn();

type MockTx = {
  product: { create: typeof createProductMock };
  categoriesOnProducts: { createMany: typeof createCategoriesMock };
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: () => findManyProductsMock(),
    },
    $transaction: (cb: (tx: MockTx) => Promise<unknown>) =>
      cb({
        product: { create: createProductMock },
        categoriesOnProducts: { createMany: createCategoriesMock },
      }),
  },
}));

describe("GET /api/admin/products", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
  });

  it("returns products with thumbnailUrl and categoriesDetailed", async () => {
    findManyProductsMock.mockResolvedValue([
      {
        id: "prod_1",
        name: "Test Coffee",
        slug: "test-coffee",
        type: ProductType.COFFEE,
        isDisabled: false,
        variants: [
          {
            name: "12oz",
            stockQuantity: 10,
            images: [{ url: "https://example.com/image.jpg" }],
            purchaseOptions: [
              {
                type: "ONE_TIME",
                priceInCents: 1500,
                billingInterval: null,
                billingIntervalCount: null,
              },
            ],
          },
        ],
        categories: [
          {
            order: 0,
            category: { id: "cat_1", name: "Blends" },
          },
        ],
      },
    ]);

    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products[0]).toMatchObject({
      id: "prod_1",
      name: "Test Coffee",
      thumbnailUrl: "https://example.com/image.jpg",
      categoriesDetailed: [{ id: "cat_1", name: "Blends", order: 0 }],
    });
  });
});

describe("POST /api/admin/products", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
  });

  it("allows creating a merch product without product-level weight", async () => {
    createProductMock.mockResolvedValue({ id: "prod_123" });

    const merchPayload = buildProductPayload(ProductType.MERCH, {
      name: "Canvas Tote",
      slug: "canvas-tote",
      description: "Durable tote for beans",
      categoryIds: ["merch-cat"],
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
        }),
      })
    );
    expect(createCategoriesMock).toHaveBeenCalled();
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
    expect(json.error).toBe("Validation failed");
    expect(json.details).toBeDefined();
    expect(
      json.details.some((d: { path: string }) => d.path.includes("origin"))
    ).toBe(true);
    expect(createProductMock).not.toHaveBeenCalled();
  });

  it("creates merch product without coffee fields", async () => {
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

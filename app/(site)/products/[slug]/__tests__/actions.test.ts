/** @jest-environment node */

import { getProductAddOns } from "../actions";
import { prisma } from "@/lib/prisma";
import { getWeightUnit } from "@/lib/config/app-settings";

type PrismaMock = {
  addOnLink: {
    findMany: jest.Mock;
  };
  siteSetting: {
    findUnique: jest.Mock;
  };
};

// Mock Prisma
jest.mock("@/lib/prisma", () => {
  const findManyMock = jest.fn();
  const findUniqueMock = jest.fn();

  const prismaMock: PrismaMock = {
    addOnLink: {
      findMany: findManyMock,
    },
    siteSetting: {
      findUnique: findUniqueMock,
    },
  };

  return {
    prisma: prismaMock,
    __esModule: true,
    __mocks: {
      prismaMock,
      findManyMock,
      findUniqueMock,
    },
  };
});

// Mock weight utils
jest.mock("@/lib/config/app-settings", () => ({
  getWeightUnit: jest.fn().mockResolvedValue("grams"),
  fromGrams: jest.fn((grams: number, unit: string) => {
    if (unit === "ounces") return grams * 0.035274;
    return grams;
  }),
  roundToInt: jest.fn((value: number) => Math.round(value)),
}));

const makeVariantLink = (overrides: Record<string, unknown> = {}) => ({
  id: "addon-1",
  primaryProductId: "product-1",
  addOnProductId: "product-2",
  addOnVariantId: "variant-2",
  discountType: null,
  discountValue: null,
  addOnProduct: {
    id: "product-2",
    name: "Sample Mug",
    slug: "sample-mug",
    type: "MERCHANDISE",
    description: "A nice mug",
    categories: [{ category: { slug: "merchandise" } }],
    variants: [],
  },
  addOnVariant: {
    id: "variant-2",
    name: "Standard",
    weight: 500,
    stockQuantity: 10,
    images: [{ url: "https://example.com/mug.jpg" }],
    purchaseOptions: [
      { id: "po-1", priceInCents: 1500, salePriceInCents: null, type: "ONE_TIME" },
    ],
  },
  ...overrides,
});

describe("getProductAddOns", () => {
  let prismaMock: PrismaMock;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = prisma as unknown as PrismaMock;
  });

  it("should return empty array when no add-ons exist", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([]);

    const result = await getProductAddOns("product-1");

    expect(result).toEqual([]);
    expect(prismaMock.addOnLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          primaryProductId: "product-1",
          addOnProduct: { isDisabled: false },
          OR: [
            { addOnVariant: { stockQuantity: { gt: 0 } } },
            { addOnVariantId: null },
          ],
        }),
      })
    );
  });

  it("should filter out disabled products", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([]);

    await getProductAddOns("product-1");

    expect(prismaMock.addOnLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          addOnProduct: { isDisabled: false },
        }),
      })
    );
  });

  it("should return formatted add-ons with product and variant details", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([makeVariantLink()]);
    (getWeightUnit as jest.Mock).mockResolvedValue("grams");

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      product: expect.objectContaining({
        id: "product-2",
        name: "Sample Mug",
        slug: "sample-mug",
      }),
      variant: expect.objectContaining({
        id: "variant-2",
        name: "Standard",
        weight: 500,
        stockQuantity: 10,
      }),
      discountedPriceInCents: 1500,
      imageUrl: "https://example.com/mug.jpg",
      categorySlug: "merchandise",
    });
  });

  it("should use purchase option price when discount is null", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink({ discountType: null, discountValue: null }),
    ]);

    const result = await getProductAddOns("product-1");

    expect(result[0].discountedPriceInCents).toBe(1500);
  });

  it("should compute FIXED discount correctly", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink({ discountType: "FIXED", discountValue: 300 }),
    ]);

    const result = await getProductAddOns("product-1");

    // 1500 - 300 = 1200
    expect(result[0].discountedPriceInCents).toBe(1200);
  });

  it("should compute PERCENTAGE discount correctly", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink({ discountType: "PERCENTAGE", discountValue: 20 }),
    ]);

    const result = await getProductAddOns("product-1");

    // round(1500 * 0.8) = 1200
    expect(result[0].discountedPriceInCents).toBe(1200);
  });

  it("should use sale price as base when available", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink({
        addOnVariant: {
          id: "variant-2",
          name: "Standard",
          weight: 500,
          stockQuantity: 10,
          images: [{ url: "https://example.com/mug.jpg" }],
          purchaseOptions: [
            { id: "po-1", priceInCents: 1500, salePriceInCents: 1200, type: "ONE_TIME" },
          ],
        },
      }),
    ]);

    const result = await getProductAddOns("product-1");

    // Sale price 1200 is the base (no discount applied)
    expect(result[0].discountedPriceInCents).toBe(1200);
  });

  it("should filter out add-ons with no purchase options", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink({
        addOnVariant: {
          id: "variant-2",
          name: "Standard",
          weight: 500,
          stockQuantity: 10,
          images: [{ url: "https://example.com/mug.jpg" }],
          purchaseOptions: [],
        },
      }),
    ]);

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(0);
  });

  it("should expand null-variant links to all in-stock variants", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      {
        id: "addon-1",
        primaryProductId: "product-1",
        addOnProductId: "product-2",
        addOnVariantId: null,
        discountType: "PERCENTAGE",
        discountValue: 10,
        addOnProduct: {
          id: "product-2",
          name: "Coffee Bag",
          slug: "coffee-bag",
          type: "COFFEE",
          description: "Fresh coffee",
          categories: [{ category: { slug: "coffee" } }],
          variants: [
            {
              id: "v1",
              name: "12oz",
              weight: 340,
              stockQuantity: 10,
              images: [],
              purchaseOptions: [
                { id: "po-1", priceInCents: 2000, salePriceInCents: null, type: "ONE_TIME" },
              ],
            },
            {
              id: "v2",
              name: "2lb",
              weight: 907,
              stockQuantity: 5,
              images: [],
              purchaseOptions: [
                { id: "po-2", priceInCents: 5000, salePriceInCents: null, type: "ONE_TIME" },
              ],
            },
            {
              id: "v3",
              name: "Out of stock",
              weight: 100,
              stockQuantity: 0,
              images: [],
              purchaseOptions: [
                { id: "po-3", priceInCents: 1000, salePriceInCents: null, type: "ONE_TIME" },
              ],
            },
          ],
        },
        addOnVariant: null,
      },
    ]);

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(2);
    expect(result[0].variant.id).toBe("v1");
    expect(result[0].discountedPriceInCents).toBe(1800); // 2000 * 0.9
    expect(result[1].variant.id).toBe("v2");
    expect(result[1].discountedPriceInCents).toBe(4500); // 5000 * 0.9
  });

  it("should convert weights when unit is IMPERIAL", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink({
        addOnVariant: {
          id: "variant-2",
          name: "12oz",
          weight: 340,
          stockQuantity: 10,
          images: [{ url: "https://example.com/coffee.jpg" }],
          purchaseOptions: [
            { id: "po-1", priceInCents: 1800, salePriceInCents: null, type: "ONE_TIME" },
          ],
        },
      }),
    ]);
    (getWeightUnit as jest.Mock).mockResolvedValue("IMPERIAL");

    const result = await getProductAddOns("product-1");

    expect(result[0].variant.weight).toBe(12);
  });

  it("should handle multiple add-ons", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink(),
      makeVariantLink({
        id: "addon-2",
        addOnProductId: "product-3",
        addOnVariantId: "variant-3",
        addOnProduct: {
          id: "product-3",
          name: "Sticker",
          slug: "sticker",
          type: "MERCHANDISE",
          description: "A sticker",
          categories: [{ category: { slug: "merchandise" } }],
          variants: [],
        },
        addOnVariant: {
          id: "variant-3",
          name: "Small",
          weight: 10,
          stockQuantity: 10,
          images: [{ url: "https://example.com/sticker.jpg" }],
          purchaseOptions: [
            { id: "po-2", priceInCents: 1000, salePriceInCents: null, type: "ONE_TIME" },
          ],
        },
      }),
    ]);

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(2);
    expect(result[0].product.name).toBe("Sample Mug");
    expect(result[1].product.name).toBe("Sticker");
  });

  it("should return empty array on database error", async () => {
    prismaMock.addOnLink.findMany.mockRejectedValue(
      new Error("Database error")
    );

    const result = await getProductAddOns("product-1");

    expect(result).toEqual([]);
  });

  it("should deduplicate by product-variant key", async () => {
    // Two links pointing to the same product+variant (from different primary variants)
    prismaMock.addOnLink.findMany.mockResolvedValue([
      makeVariantLink(),
      makeVariantLink({ id: "addon-2" }),
    ]);

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(1);
  });
});

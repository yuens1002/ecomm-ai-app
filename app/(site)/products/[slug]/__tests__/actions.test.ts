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
    expect(prismaMock.addOnLink.findMany).toHaveBeenCalledWith({
      where: {
        primaryProductId: "product-1",
        addOnProduct: {
          isDisabled: false,
        },
        addOnVariant: {
          stockQuantity: {
            gt: 0,
          },
        },
      },
      include: expect.objectContaining({
        addOnProduct: expect.any(Object),
        addOnVariant: expect.any(Object),
      }),
    });
  });

  it("should filter out disabled products", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([]);

    await getProductAddOns("product-1");

    expect(prismaMock.addOnLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          addOnProduct: {
            isDisabled: false,
          },
        }),
      })
    );
  });

  it("should filter out products with no stock", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([]);

    await getProductAddOns("product-1");

    expect(prismaMock.addOnLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          addOnVariant: {
            stockQuantity: {
              gt: 0,
            },
          },
        }),
      })
    );
  });

  it("should return formatted add-ons with product and variant details", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        primaryProductId: "product-1",
        addOnProductId: "product-2",
        addOnVariantId: "variant-2",
        discountedPriceInCents: 1200,
        addOnProduct: {
          id: "product-2",
          name: "Sample Mug",
          slug: "sample-mug",
          type: "MERCHANDISE",
          description: "A nice mug",
          images: [{ url: "https://example.com/mug.jpg" }],
          categories: [{ category: { slug: "merchandise" } }],
        },
        addOnVariant: {
          id: "variant-2",
          name: "Standard",
          weight: 500,
          stockQuantity: 10,
          purchaseOptions: [
            {
              id: "po-1",
              priceInCents: 1500,
              type: "ONE_TIME",
            },
          ],
        },
      },
    ];

    prismaMock.addOnLink.findMany.mockResolvedValue(mockAddOns);
    (getWeightUnit as jest.Mock).mockResolvedValue("grams");

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      product: {
        id: "product-2",
        name: "Sample Mug",
        slug: "sample-mug",
        type: "MERCHANDISE",
        description: "A nice mug",
        images: [{ url: "https://example.com/mug.jpg" }],
        categories: [{ category: { slug: "merchandise" } }],
      },
      variant: {
        id: "variant-2",
        name: "Standard",
        weight: 500,
        stockQuantity: 10,
        purchaseOptions: [
          {
            id: "po-1",
            priceInCents: 1500,
            type: "ONE_TIME",
          },
        ],
      },
      discountedPriceInCents: 1200,
      imageUrl: "https://example.com/mug.jpg",
      categorySlug: "merchandise",
    });
  });

  it("should use purchase option price when discount is null", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        primaryProductId: "product-1",
        addOnProductId: "product-2",
        addOnVariantId: "variant-2",
        discountedPriceInCents: null,
        addOnProduct: {
          id: "product-2",
          name: "Sample Mug",
          slug: "sample-mug",
          type: "MERCHANDISE",
          description: "A nice mug",
          images: [{ url: "https://example.com/mug.jpg" }],
          categories: [{ category: { slug: "merchandise" } }],
        },
        addOnVariant: {
          id: "variant-2",
          name: "Standard",
          weight: 500,
          stockQuantity: 10,
          purchaseOptions: [
            {
              id: "po-1",
              priceInCents: 1500,
              type: "ONE_TIME",
            },
          ],
        },
      },
    ];

    prismaMock.addOnLink.findMany.mockResolvedValue(mockAddOns);

    const result = await getProductAddOns("product-1");

    expect(result[0].discountedPriceInCents).toBe(1500);
  });

  it("should filter out add-ons with no purchase options", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        primaryProductId: "product-1",
        addOnProductId: "product-2",
        addOnVariantId: "variant-2",
        discountedPriceInCents: 1200,
        addOnProduct: {
          id: "product-2",
          name: "Sample Mug",
          slug: "sample-mug",
          type: "MERCHANDISE",
          description: "A nice mug",
          images: [{ url: "https://example.com/mug.jpg" }],
          categories: [{ category: { slug: "merchandise" } }],
        },
        addOnVariant: {
          id: "variant-2",
          name: "Standard",
          weight: 500,
          stockQuantity: 10,
          purchaseOptions: [], // No purchase options
        },
      },
    ];

    prismaMock.addOnLink.findMany.mockResolvedValue(mockAddOns);

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(0);
  });

  it("should convert weights when unit is not grams", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        primaryProductId: "product-1",
        addOnProductId: "product-2",
        addOnVariantId: "variant-2",
        discountedPriceInCents: 1200,
        addOnProduct: {
          id: "product-2",
          name: "Coffee Beans",
          slug: "coffee-beans",
          type: "COFFEE",
          description: "Fresh beans",
          images: [{ url: "https://example.com/coffee.jpg" }],
          categories: [{ category: { slug: "coffee" } }],
        },
        addOnVariant: {
          id: "variant-2",
          name: "12oz",
          weight: 340,
          stockQuantity: 10,
          purchaseOptions: [
            {
              id: "po-1",
              priceInCents: 1800,
              type: "ONE_TIME",
            },
          ],
        },
      },
    ];

    prismaMock.addOnLink.findMany.mockResolvedValue(mockAddOns);
    (getWeightUnit as jest.Mock).mockResolvedValue("IMPERIAL");

    const result = await getProductAddOns("product-1");

    expect(result[0].variant.weight).toBe(12); // Mocked conversion result
  });

  it("should handle multiple add-ons", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        primaryProductId: "product-1",
        addOnProductId: "product-2",
        addOnVariantId: "variant-2",
        discountedPriceInCents: 1200,
        addOnProduct: {
          id: "product-2",
          name: "Mug",
          slug: "mug",
          type: "MERCHANDISE",
          description: "A mug",
          images: [{ url: "https://example.com/mug.jpg" }],
          categories: [{ category: { slug: "merchandise" } }],
        },
        addOnVariant: {
          id: "variant-2",
          name: "Standard",
          weight: 500,
          stockQuantity: 10,
          purchaseOptions: [
            { id: "po-1", priceInCents: 1500, type: "ONE_TIME" },
          ],
        },
      },
      {
        id: "addon-2",
        primaryProductId: "product-1",
        addOnProductId: "product-3",
        addOnVariantId: "variant-3",
        discountedPriceInCents: 800,
        addOnProduct: {
          id: "product-3",
          name: "Sticker",
          slug: "sticker",
          type: "MERCHANDISE",
          description: "A sticker",
          images: [{ url: "https://example.com/sticker.jpg" }],
          categories: [{ category: { slug: "merchandise" } }],
        },
        addOnVariant: {
          id: "variant-3",
          name: "Small",
          weight: 10,
          stockQuantity: 10,
          purchaseOptions: [
            { id: "po-2", priceInCents: 1000, type: "ONE_TIME" },
          ],
        },
      },
    ];

    prismaMock.addOnLink.findMany.mockResolvedValue(mockAddOns);

    const result = await getProductAddOns("product-1");

    expect(result).toHaveLength(2);
    expect(result[0].product.name).toBe("Mug");
    expect(result[1].product.name).toBe("Sticker");
  });

  it("should return empty array on database error", async () => {
    prismaMock.addOnLink.findMany.mockRejectedValue(
      new Error("Database error")
    );

    const result = await getProductAddOns("product-1");

    expect(result).toEqual([]);
  });

  it("should only fetch ONE_TIME purchase options", async () => {
    prismaMock.addOnLink.findMany.mockResolvedValue([]);

    await getProductAddOns("product-1");

    expect(prismaMock.addOnLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          addOnVariant: expect.objectContaining({
            select: expect.objectContaining({
              purchaseOptions: expect.objectContaining({
                where: {
                  type: "ONE_TIME",
                },
              }),
            }),
          }),
        }),
      })
    );
  });
});

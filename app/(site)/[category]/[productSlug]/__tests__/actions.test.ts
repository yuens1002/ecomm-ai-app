/** @jest-environment node */

import { getProductAddOns } from "../actions";

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
jest.mock("@/lib/app-settings", () => ({
  getWeightUnit: jest.fn().mockResolvedValue("grams"),
  fromGrams: jest.fn((grams: number, unit: string) => {
    if (unit === "ounces") return grams * 0.035274;
    return grams;
  }),
  roundToInt: jest.fn((value: number) => Math.round(value)),
}));

import { prisma } from "@/lib/prisma";
import { getWeightUnit } from "@/lib/app-settings";

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
        targetProduct: expect.any(Object),
        targetVariant: expect.any(Object),
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
        sourceProductId: "product-1",
        targetProductId: "product-2",
        targetVariantId: "variant-2",
        discountedPriceInCents: 1200,
        targetProduct: {
          id: "product-2",
          name: "Sample Mug",
          slug: "sample-mug",
          type: "MERCHANDISE",
          description: "A nice mug",
          heroImage: "/mug.jpg",
        },
        targetVariant: {
          id: "variant-2",
          name: "Standard",
          image: null,
          weightGrams: 500,
          weightOunces: 17.6,
          purchaseOptions: [
            {
              id: "po-1",
              priceInCents: 1500,
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
        heroImage: "/mug.jpg",
      },
      variant: {
        id: "variant-2",
        name: "Standard",
        image: null,
        weightGrams: 500,
        weightOunces: 17.6,
        purchaseOptions: [
          {
            id: "po-1",
            priceInCents: 1500,
          },
        ],
      },
      discountedPriceInCents: 1200,
    });
  });

  it("should use purchase option price when discount is null", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        sourceProductId: "product-1",
        targetProductId: "product-2",
        targetVariantId: "variant-2",
        discountedPriceInCents: null,
        targetProduct: {
          id: "product-2",
          name: "Sample Mug",
          slug: "sample-mug",
          type: "MERCHANDISE",
          description: "A nice mug",
          heroImage: "/mug.jpg",
        },
        targetVariant: {
          id: "variant-2",
          name: "Standard",
          image: null,
          weightGrams: 500,
          weightOunces: 17.6,
          purchaseOptions: [
            {
              id: "po-1",
              priceInCents: 1500,
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
        sourceProductId: "product-1",
        targetProductId: "product-2",
        targetVariantId: "variant-2",
        discountedPriceInCents: 1200,
        targetProduct: {
          id: "product-2",
          name: "Sample Mug",
          slug: "sample-mug",
          type: "MERCHANDISE",
          description: "A nice mug",
          heroImage: "/mug.jpg",
        },
        targetVariant: {
          id: "variant-2",
          name: "Standard",
          image: null,
          weightGrams: 500,
          weightOunces: 17.6,
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
        sourceProductId: "product-1",
        targetProductId: "product-2",
        targetVariantId: "variant-2",
        discountedPriceInCents: 1200,
        targetProduct: {
          id: "product-2",
          name: "Coffee Beans",
          slug: "coffee-beans",
          type: "COFFEE",
          description: "Fresh beans",
          heroImage: "/beans.jpg",
        },
        targetVariant: {
          id: "variant-2",
          name: "12oz",
          image: null,
          weightGrams: 340,
          weightOunces: 12,
          purchaseOptions: [
            {
              id: "po-1",
              priceInCents: 1800,
            },
          ],
        },
      },
    ];

    prismaMock.addOnLink.findMany.mockResolvedValue(mockAddOns);
    (getWeightUnit as jest.Mock).mockResolvedValue("ounces");

    const result = await getProductAddOns("product-1");

    expect(result[0].variant.weight).toBe(12); // Mocked conversion result
  });

  it("should handle multiple add-ons", async () => {
    const mockAddOns = [
      {
        id: "addon-1",
        sourceProductId: "product-1",
        targetProductId: "product-2",
        targetVariantId: "variant-2",
        discountedPriceInCents: 1200,
        targetProduct: {
          id: "product-2",
          name: "Mug",
          slug: "mug",
          type: "MERCHANDISE",
          description: "A mug",
          heroImage: "/mug.jpg",
        },
        targetVariant: {
          id: "variant-2",
          name: "Standard",
          image: null,
          weightGrams: 500,
          weightOunces: 17.6,
          purchaseOptions: [{ id: "po-1", priceInCents: 1500 }],
        },
      },
      {
        id: "addon-2",
        sourceProductId: "product-1",
        targetProductId: "product-3",
        targetVariantId: "variant-3",
        discountedPriceInCents: 800,
        targetProduct: {
          id: "product-3",
          name: "Sticker",
          slug: "sticker",
          type: "MERCHANDISE",
          description: "A sticker",
          heroImage: "/sticker.jpg",
        },
        targetVariant: {
          id: "variant-3",
          name: "Small",
          image: null,
          weightGrams: 10,
          weightOunces: 0.35,
          purchaseOptions: [{ id: "po-2", priceInCents: 1000 }],
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
          targetVariant: expect.objectContaining({
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

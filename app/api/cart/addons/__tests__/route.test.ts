/** @jest-environment node */

import { z } from "zod";

const addOnLinkFindManyMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    addOnLink: {
      findMany: addOnLinkFindManyMock,
    },
  },
}));

jest.mock("@/lib/placeholder-images", () => ({
  getPlaceholderImage: () => "https://placeholder.test/img.png",
}));

// Zod schema for the expected response shape
const AddOnResponseSchema = z.object({
  addOns: z.array(
    z.object({
      product: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        imageUrl: z.string(),
        categorySlug: z.string(),
      }),
      variant: z.object({
        id: z.string(),
        name: z.string(),
        priceInCents: z.number(),
        purchaseOptionId: z.string(),
      }),
    })
  ),
});

function buildAddOnLink(overrides: Record<string, unknown> = {}) {
  return {
    id: "link_1",
    primaryProductId: "prod_cart",
    addOnProductId: "prod_addon",
    addOnVariantId: null,
    discountType: null,
    discountValue: null,
    addOnProduct: {
      id: "prod_addon",
      name: "Coffee Filter",
      slug: "coffee-filter",
      description: "Paper filters",
      categories: [
        { category: { slug: "accessories" } },
      ],
      variants: [
        {
          id: "var_1",
          name: "Pack of 50",
          stockQuantity: 20,
          images: [{ url: "https://example.com/filter.png" }],
          purchaseOptions: [
            {
              id: "po_real_123",
              priceInCents: 800,
              salePriceInCents: null,
            },
          ],
        },
      ],
    },
    addOnVariant: null,
    ...overrides,
  };
}

function buildSpecificVariantAddOnLink() {
  return buildAddOnLink({
    addOnVariantId: "var_specific",
    addOnProduct: {
      id: "prod_addon",
      name: "Coffee Filter",
      slug: "coffee-filter",
      description: "Paper filters",
      categories: [{ category: { slug: "accessories" } }],
      variants: [], // not used when addOnVariantId is set
    },
    addOnVariant: {
      id: "var_specific",
      name: "Pack of 100",
      images: [{ url: "https://example.com/filter-100.png" }],
      purchaseOptions: [
        {
          id: "po_specific_456",
          priceInCents: 1200,
          salePriceInCents: null,
        },
      ],
    },
  });
}

describe("POST /api/cart/addons", () => {
  let POST: typeof import("../route").POST;

  beforeAll(async () => {
    const mod = await import("../route");
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildRequest = (productIds: string[]) =>
    new Request("http://localhost/api/cart/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    });

  it("returns valid response shape with purchaseOptionId (null-variant expansion)", async () => {
    addOnLinkFindManyMock.mockResolvedValue([buildAddOnLink()]);

    const res = await POST(buildRequest(["prod_cart"]));
    const json = await res.json();

    // Validate against Zod schema — catches missing fields like purchaseOptionId
    const parsed = AddOnResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(json.addOns).toHaveLength(1);
    expect(json.addOns[0].variant.purchaseOptionId).toBe("po_real_123");
  });

  it("returns valid response shape with purchaseOptionId (specific variant)", async () => {
    addOnLinkFindManyMock.mockResolvedValue([buildSpecificVariantAddOnLink()]);

    const res = await POST(buildRequest(["prod_cart"]));
    const json = await res.json();

    const parsed = AddOnResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(json.addOns).toHaveLength(1);
    expect(json.addOns[0].variant.purchaseOptionId).toBe("po_specific_456");
  });

  it("applies percentage discount to effective price", async () => {
    addOnLinkFindManyMock.mockResolvedValue([
      buildAddOnLink({
        discountType: "PERCENTAGE",
        discountValue: 25,
      }),
    ]);

    const res = await POST(buildRequest(["prod_cart"]));
    const json = await res.json();

    // 800 * (1 - 25/100) = 600
    expect(json.addOns[0].variant.priceInCents).toBe(600);
    expect(json.addOns[0].variant.purchaseOptionId).toBe("po_real_123");
  });

  it("returns empty array when no product IDs provided", async () => {
    const res = await POST(
      new Request("http://localhost/api/cart/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [] }),
      })
    );
    const json = await res.json();

    expect(json).toEqual({ addOns: [] });
  });

  it("skips variants with no purchase options", async () => {
    addOnLinkFindManyMock.mockResolvedValue([
      buildAddOnLink({
        addOnProduct: {
          id: "prod_addon",
          name: "Coffee Filter",
          slug: "coffee-filter",
          description: null,
          categories: [],
          variants: [
            {
              id: "var_no_po",
              name: "Discontinued",
              stockQuantity: 5,
              images: [],
              purchaseOptions: [], // no purchase options
            },
          ],
        },
      }),
    ]);

    const res = await POST(buildRequest(["prod_cart"]));
    const json = await res.json();

    expect(json.addOns).toHaveLength(0);
  });
});

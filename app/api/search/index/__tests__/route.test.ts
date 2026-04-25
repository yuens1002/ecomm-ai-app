/** @jest-environment node */

import { GET } from "../route";

const findManyMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}));

describe("GET /api/search/index", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns a catalog index with both COFFEE and MERCH products", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "p1",
        name: "Ethiopia Yirgacheffe",
        slug: "ethiopia-yirgacheffe",
        type: "COFFEE",
        description: "Floral and citrus notes.",
        tastingNotes: ["Floral", "Citrus"],
        origin: ["Ethiopia"],
        roastLevel: "LIGHT",
        isFeatured: true,
        categories: [{ category: { name: "Light Roast", slug: "light-roast" } }],
        variants: [
          {
            images: [{ url: "/img.jpg", altText: "alt" }],
            purchaseOptions: [{ priceInCents: 2000 }],
          },
        ],
      },
      {
        id: "p2",
        name: "Origami Air Dripper",
        slug: "origami-air-dripper",
        type: "MERCH",
        description: null,
        tastingNotes: [],
        origin: [],
        roastLevel: null,
        isFeatured: false,
        categories: [],
        variants: [
          {
            images: [],
            purchaseOptions: [{ priceInCents: 3000 }],
          },
        ],
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(2);

    const types = data.products.map((p: { type: string }) => p.type);
    expect(types).toContain("COFFEE");
    expect(types).toContain("MERCH");

    const coffee = data.products.find((p: { id: string }) => p.id === "p1");
    expect(coffee.primaryCategory).toEqual({
      name: "Light Roast",
      slug: "light-roast",
    });
    expect(coffee.primaryImage).toEqual({ url: "/img.jpg", altText: "alt" });
    expect(coffee.minPriceInCents).toBe(2000);

    const merch = data.products.find((p: { id: string }) => p.id === "p2");
    expect(merch.primaryCategory).toBeNull();
    expect(merch.primaryImage).toBeNull();
    expect(merch.minPriceInCents).toBe(3000);

    expect(data.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("does not filter by type — index must include all product types", async () => {
    findManyMock.mockResolvedValue([]);
    await GET();

    const callArg = findManyMock.mock.calls[0][0];
    expect(callArg.where).toEqual({ isDisabled: false });
    expect(callArg.where.type).toBeUndefined();
  });

  it("truncates long descriptions to ~200 chars", async () => {
    const longDesc = "x".repeat(500);
    findManyMock.mockResolvedValue([
      {
        id: "p1",
        name: "Test",
        slug: "test",
        type: "COFFEE",
        description: longDesc,
        tastingNotes: [],
        origin: [],
        roastLevel: null,
        isFeatured: false,
        categories: [],
        variants: [],
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(data.products[0].description.length).toBeLessThanOrEqual(201);
    expect(data.products[0].description.endsWith("…")).toBe(true);
  });

  it("returns 500 with error JSON on Prisma failure", async () => {
    findManyMock.mockRejectedValue(new Error("DB down"));
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to build search index");
  });
});

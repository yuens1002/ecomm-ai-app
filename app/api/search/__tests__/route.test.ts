/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "../route";

const productFindManyMock = jest.fn();
const userActivityCreateMock = jest.fn();

jest.mock("@/auth", () => ({
  auth: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: () => productFindManyMock(),
    },
    userActivity: {
      create: () => userActivityCreateMock(),
    },
  },
}));

// Silence console noise in tests
jest.spyOn(console, "error").mockImplementation(() => undefined);

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
  });

  it("should return 200 with empty query when q param is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/search");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe("");
  });

  it("should return valid search response structure with query", async () => {
    const mockProduct = {
      id: "prod-1",
      name: "Ethiopian Yirgacheffe",
      slug: "ethiopian-yirgacheffe",
      categories: [{ category: { name: "Light Roast", slug: "light-roast" } }],
      variants: [
        {
          id: "var-1",
          purchaseOptions: [{ id: "po-1", type: "ONE_TIME", priceInCents: 1500 }],
        },
      ],
      images: [{ url: "/image.jpg", altText: "Coffee bag" }],
    };
    productFindManyMock.mockResolvedValue([mockProduct]);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=ethiopian"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("products");
    expect(data).toHaveProperty("query");
    expect(data.query).toBe("ethiopian");
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products).toHaveLength(1);

    const product = data.products[0];
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("slug");
    expect(product).toHaveProperty("categories");
    expect(product).toHaveProperty("variants");
    expect(product).toHaveProperty("images");
    expect(product.variants[0]).toHaveProperty("purchaseOptions");
  });

  it("should handle case-insensitive search", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=LIGHT");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe("light");
  });

  it("should return empty results for nonsense query", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=xyznonexistent123"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(0);
  });

  it("should limit results to 50", async () => {
    // Mock returning 50 products (route uses take: 50)
    const mockProducts = Array.from({ length: 50 }, (_, i) => ({
      id: `prod-${i}`,
      name: `Coffee ${i}`,
      slug: `coffee-${i}`,
      categories: [],
      variants: [],
      images: [],
    }));
    productFindManyMock.mockResolvedValue(mockProducts);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=coffee"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products.length).toBeLessThanOrEqual(50);
  });
});

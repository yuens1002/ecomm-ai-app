/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, isNaturalLanguageQuery } from "../route";

const productFindManyMock = jest.fn();
const userActivityCreateMock = jest.fn();
const chatCompletionMock = jest.fn();
const isAIConfiguredMock = jest.fn();

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

jest.mock("@/lib/ai-client", () => ({
  chatCompletion: (...args: unknown[]) => chatCompletionMock(...args),
  isAIConfigured: () => isAIConfiguredMock(),
}));

// Silence console noise in tests
jest.spyOn(console, "error").mockImplementation(() => undefined);

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(false);
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

  // ---------------------------------------------------------------------------
  // Agentic response shape
  // ---------------------------------------------------------------------------

  it("should return null agentic fields for keyword queries (AI off)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=Ethiopia"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.intent).toBeNull();
    expect(data.filtersExtracted).toBeNull();
    expect(data.explanation).toBeNull();
    expect(data.followUps).toEqual([]);
    expect(data.context).toHaveProperty("sessionId");
    expect(data.context).toHaveProperty("turnCount");
  });

  it("should always include context with sessionId and turnCount", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=coffee&sessionId=abc123&turnCount=2"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.context.sessionId).toBe("abc123");
    expect(data.context.turnCount).toBe(2);
  });

  it("should call AI and return agentic fields for NL queries when AI is configured", async () => {
    isAIConfiguredMock.mockResolvedValue(true);
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { roastLevel: "light", origin: "Ethiopia" },
        explanation: "These light Ethiopian coffees match your morning V60 preference.",
        followUps: ["Want single-origin only?", "Prefer fruity or floral?"],
      }),
      finishReason: "stop",
      usage: { promptTokens: 50, completionTokens: 80, totalTokens: 130 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+morning+coffee+for+V60"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(chatCompletionMock).toHaveBeenCalledTimes(1);
    expect(data.intent).toBe("product_discovery");
    expect(data.filtersExtracted).toEqual({ roastLevel: "light", origin: "Ethiopia" });
    expect(data.explanation).toContain("Ethiopian");
    expect(data.followUps).toHaveLength(2);
  });

  it("should not call AI for short keyword queries even when AI is configured", async () => {
    isAIConfiguredMock.mockResolvedValue(true);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=Ethiopia"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(chatCompletionMock).not.toHaveBeenCalled();
    expect(data.intent).toBeNull();
    expect(data.explanation).toBeNull();
  });

  it("should fall back gracefully when AI call fails", async () => {
    isAIConfiguredMock.mockResolvedValue(true);
    chatCompletionMock.mockRejectedValue(new Error("LLM timeout"));

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+light+fruity+morning+coffee"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.explanation).toBeNull();
    expect(data.followUps).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isNaturalLanguageQuery unit tests
// ---------------------------------------------------------------------------

describe("isNaturalLanguageQuery", () => {
  it("returns false for single-word queries", () => {
    expect(isNaturalLanguageQuery("Ethiopia")).toBe(false);
  });

  it("returns false for two-word queries", () => {
    expect(isNaturalLanguageQuery("Kenya AA")).toBe(false);
  });

  it("returns false for three-word product names without NL indicators", () => {
    expect(isNaturalLanguageQuery("Ethiopian Yirgacheffe Washed")).toBe(false);
  });

  it("returns true for NL query with 'for'", () => {
    expect(isNaturalLanguageQuery("smooth morning coffee for V60")).toBe(true);
  });

  it("returns true for NL query with 'something'", () => {
    expect(isNaturalLanguageQuery("something smooth and fruity")).toBe(true);
  });

  it("returns true for NL query with 'looking'", () => {
    expect(isNaturalLanguageQuery("looking for light roast")).toBe(true);
  });

  it("returns true for NL query with 'recommend'", () => {
    expect(isNaturalLanguageQuery("recommend a good morning coffee")).toBe(true);
  });
});

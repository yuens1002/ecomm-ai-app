/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, isNaturalLanguageQuery, tokenizeNLQuery } from "../route";

const productFindManyMock = jest.fn();
const userActivityCreateMock = jest.fn();
const chatCompletionMock = jest.fn();
const isAIConfiguredMock = jest.fn();
const getPublicSiteSettingsMock = jest.fn();

jest.mock("@/auth", () => ({
  auth: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => productFindManyMock(...args),
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

jest.mock("@/lib/data", () => ({
  getPublicSiteSettings: () => getPublicSiteSettingsMock(),
}));

// Silence console noise in tests
jest.spyOn(console, "error").mockImplementation(() => undefined);

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(false);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
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
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
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
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
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

// ---------------------------------------------------------------------------
// tokenizeNLQuery unit tests
// ---------------------------------------------------------------------------

describe("tokenizeNLQuery", () => {
  it("strips stop words and returns meaningful tokens", () => {
    expect(tokenizeNLQuery("what is good for v60")).toEqual(["v60"]);
  });

  it("strips all punctuation, not just selected chars", () => {
    const tokens = tokenizeNLQuery("v60, pour-over. fruity!");
    expect(tokens).toContain("fruity");
    // commas and periods stripped — "v60" and "pour" should survive
    expect(tokens.some((t) => t.includes(","))).toBe(false);
    expect(tokens.some((t) => t.includes("."))).toBe(false);
  });

  it("returns empty array when all tokens are stop words", () => {
    expect(tokenizeNLQuery("what is that for me")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Roast pattern detection
// ---------------------------------------------------------------------------

describe("GET /api/search — roast pattern", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(false);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
  });

  it("maps 'light roast' query to category slug filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=light+roast");
    await GET(request);
    const call = productFindManyMock.mock.calls[0][0];
    expect(call?.where?.categories?.some?.category?.slug).toBe("light-roast");
  });

  it("maps 'dark roast Ethiopia' to roast category + remaining term OR filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=dark+roast+ethiopia");
    await GET(request);
    const call = productFindManyMock.mock.calls[0][0];
    expect(call?.where?.categories?.some?.category?.slug).toBe("dark-roast");
    // OR clause should exist for the remaining "ethiopia" term
    expect(call?.where?.OR).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ai=true forceAI override (TST-2)
// ---------------------------------------------------------------------------

describe("GET /api/search — ai=true override", () => {
  const nlResponse = {
    text: JSON.stringify({
      intent: "product_discovery",
      filtersExtracted: {},
      explanation: "Showing all coffees.",
      followUps: ["Light roast", "Single origin"],
    }),
    finishReason: "stop",
    usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
    chatCompletionMock.mockResolvedValue(nlResponse);
  });

  it("forces AI extraction for a keyword query when ai=true is set", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=ethiopia&ai=true");
    const response = await GET(request);
    const data = await response.json();
    expect(chatCompletionMock).toHaveBeenCalledTimes(1);
    expect(data.intent).toBe("product_discovery");
  });

  it("does not call AI for keyword query without ai=true", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=ethiopia");
    await GET(request);
    expect(chatCompletionMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TST-1: Voice persona injected into system prompt
// ---------------------------------------------------------------------------

describe("GET /api/search — voice persona injection (TST-1)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        explanation: "Great picks.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });
  });

  it("includes aiVoicePersona text in the system prompt passed to chatCompletion", async () => {
    const persona = "I am Brew, a laid-back barista who loves bold coffees.";
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: persona });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+morning+coffee+for+V60&ai=true"
    );
    await GET(request);

    expect(chatCompletionMock).toHaveBeenCalledTimes(1);
    const callArgs = chatCompletionMock.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const systemMessage = callArgs.messages.find((m) => m.role === "system");
    expect(systemMessage?.content).toContain(persona);
  });

  it("uses default system prompt when aiVoicePersona is empty", async () => {
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+morning+coffee+for+V60&ai=true"
    );
    await GET(request);

    const callArgs = chatCompletionMock.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const systemMessage = callArgs.messages.find((m) => m.role === "system");
    expect(systemMessage?.content).toContain("knowledgeable coffee shop assistant");
  });
});

// ---------------------------------------------------------------------------
// TST-3: isOrganic filter applied to whereClause
// ---------------------------------------------------------------------------

describe("GET /api/search — isOrganic filter (TST-3)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
  });

  it("applies isOrganic: true to whereClause when extracted by AI", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { isOrganic: true },
        explanation: "Organic coffees for you.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=organic+light+roast+coffee&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.isOrganic).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TST-4: priceMaxCents filter applied to whereClause
// ---------------------------------------------------------------------------

describe("GET /api/search — priceMaxCents filter (TST-4)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
  });

  it("applies priceMaxCents via variants.purchaseOptions filter when extracted by AI", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { priceMaxCents: 3000 },
        explanation: "Coffees under $30.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=coffee+under+30+dollars&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as {
      where: {
        variants?: {
          some?: {
            purchaseOptions?: {
              some?: { priceInCents?: { lte?: number } };
            };
          };
        };
      };
    };
    expect(call.where.variants?.some?.purchaseOptions?.some?.priceInCents?.lte).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// BUG-1: type=COFFEE locked when any coffee-specific semantic filter extracted
// ---------------------------------------------------------------------------

describe("GET /api/search — type=COFFEE lock (BUG-1)", () => {
  const baseSetup = () => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
  };

  const aiResponse = (filtersExtracted: Record<string, unknown>) => ({
    text: JSON.stringify({
      intent: "product_discovery",
      filtersExtracted,
      explanation: "Great picks.",
      followUps: [],
    }),
    finishReason: "stop",
    usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
  });

  // AC-TST-1
  it("sets type=COFFEE when AI extracts flavorProfile only", async () => {
    baseSetup();
    chatCompletionMock.mockResolvedValue(aiResponse({ flavorProfile: ["citrus"] }));

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+cup+with+light+citrus+notes&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.type).toBe("COFFEE");
  });

  // AC-TST-2
  it("does NOT set type when AI extracts no coffee-specific filters", async () => {
    baseSetup();
    chatCompletionMock.mockResolvedValue(aiResponse({}));

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+cup+with+citrus&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.type).toBeUndefined();
  });

  it("sets type=COFFEE when AI extracts isOrganic only (no roastLevel)", async () => {
    baseSetup();
    chatCompletionMock.mockResolvedValue(aiResponse({ isOrganic: true }));

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=organic+coffee&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.type).toBe("COFFEE");
  });
});

// ---------------------------------------------------------------------------
// BUG-2: flavorProfile expands OR clause (description + tastingNotes)
// ---------------------------------------------------------------------------

describe("GET /api/search — flavorProfile OR expansion (BUG-2)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { flavorProfile: ["citrus"] },
        explanation: "Bright citrus picks.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });
  });

  // AC-TST-3
  it("adds description case-insensitive contains for each flavor term to OR clause", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+coffee+with+citrus+notes&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as {
      where: { OR?: Array<Record<string, unknown>> };
    };
    const orEntries = call.where.OR ?? [];
    const descriptionEntry = orEntries.find(
      (e) =>
        e.description &&
        typeof e.description === "object" &&
        (e.description as Record<string, unknown>).contains === "citrus" &&
        (e.description as Record<string, unknown>).mode === "insensitive"
    );
    expect(descriptionEntry).toBeDefined();
  });

  // AC-TST-4
  it("adds Title Case tastingNotes hasSome entry to OR clause", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+coffee+with+citrus+notes&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as {
      where: { OR?: Array<Record<string, unknown>> };
    };
    const orEntries = call.where.OR ?? [];
    const tastingEntry = orEntries.find(
      (e) =>
        e.tastingNotes &&
        typeof e.tastingNotes === "object" &&
        Array.isArray((e.tastingNotes as Record<string, unknown>).hasSome) &&
        ((e.tastingNotes as Record<string, string[]>).hasSome as string[]).includes("Citrus")
    );
    expect(tastingEntry).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// BUG-3: OR clause removed when hard DB filters (roastLevel / origin) present
// ---------------------------------------------------------------------------

describe("GET /api/search — OR clause cleared by hard DB filters (BUG-3)", () => {
  const baseSetup = () => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
  };

  // AC-TST-5
  it("deletes whereClause.OR when roastLevel is extracted", async () => {
    baseSetup();
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { roastLevel: "light" },
        explanation: "Light roasts for you.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=light+morning+coffee+for+V60&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.OR).toBeUndefined();
  });

  // AC-TST-6
  it("deletes whereClause.OR when origin is extracted", async () => {
    baseSetup();
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { origin: "Ethiopia" },
        explanation: "Ethiopian beauties.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=looking+for+Ethiopian+single+origin&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.OR).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BUG-4 / BUG-5: Prompt quality — first-person explanation + 1 follow-up cap
// ---------------------------------------------------------------------------

describe("GET /api/search — prompt quality constraints (BUG-4, BUG-5)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "" });
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        explanation: "These are great picks.",
        followUps: [],
      }),
      finishReason: "stop",
      usage: { promptTokens: 40, completionTokens: 60, totalTokens: 100 },
    });
  });

  // AC-TST-7
  it("user prompt contains third-person prohibition for explanation (BUG-4)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+coffee+with+citrus&ai=true"
    );
    await GET(request);

    const callArgs = chatCompletionMock.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const userMessage = callArgs.messages.find((m) => m.role === "user");
    expect(userMessage?.content).toContain("Never use");
  });

  // AC-TST-8
  it("user prompt contains AT MOST ONE follow-up cap (BUG-5)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+coffee+with+citrus&ai=true"
    );
    await GET(request);

    const callArgs = chatCompletionMock.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const userMessage = callArgs.messages.find((m) => m.role === "user");
    expect(userMessage?.content).toContain("AT MOST ONE");
  });
});

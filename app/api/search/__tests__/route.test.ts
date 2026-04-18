/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, isNaturalLanguageQuery, tokenizeNLQuery } from "../route";

const productFindManyMock = jest.fn();
const productCountMock = jest.fn();
const userActivityCreateMock = jest.fn();
const chatCompletionMock = jest.fn();
const isAIConfiguredMock = jest.fn();
const getPublicSiteSettingsMock = jest.fn();

jest.mock("@/auth", () => ({
  auth: jest.fn(() => Promise.resolve(null)),
}));

const queryRawMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => productFindManyMock(...args),
      count: (...args: unknown[]) => productCountMock(...args),
    },
    userActivity: {
      create: () => userActivityCreateMock(),
    },
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
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
    productCountMock.mockResolvedValue(1); // chips pass validation by default
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(false);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    queryRawMock.mockResolvedValue([]);

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
    queryRawMock.mockResolvedValue([]);

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
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
// AC-TST-1: ai=true always reaches agentic path regardless of NL heuristic
// ---------------------------------------------------------------------------

describe("ai=true routing gate (AC-TST-1)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    productCountMock.mockResolvedValue(1);
    queryRawMock.mockResolvedValue([]);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
    isAIConfiguredMock.mockResolvedValue(true);
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "Let me see what I can find for you.",
        followUps: ["Bold", "Light"],
        followUpQuestion: "What roast level?",
      }),
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });
  });

  it("ai=true invokes extractAgenticFilters even for non-NL single-word query", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=xyz&ai=true"
    );
    await GET(request);
    expect(chatCompletionMock).toHaveBeenCalled();
  });

  it("ai=false non-NL query skips agentic path even when AI is configured", async () => {
    // AI is configured (from beforeEach) but ai=false + non-NL query → agentic path skipped
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=xyz&ai=false"
    );
    await GET(request);
    expect(chatCompletionMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-TST-2: Open-ended Counter query returns acknowledgment in response
// ---------------------------------------------------------------------------

describe("acknowledgment in agentic response (AC-TST-2)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    productCountMock.mockResolvedValue(1);
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
  });

  it("returns acknowledgment non-null when extraction provides it", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "Here's what I'd try today.",
        followUps: ["Bold", "Light"],
        followUpQuestion: "How do you take your coffee?",
      }),
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=what+is+good+today&ai=true"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.acknowledgment).toBeTruthy();
    expect(data.acknowledgment).toContain("today");
  });
});

// ---------------------------------------------------------------------------
// AC-TST-3: Category slug from `from` param scopes Prisma where
// ---------------------------------------------------------------------------

// AC-TST-3: origin-based filtering — schema-first, not categories
// (category pre-scope removed — origin[] field is reliable; categories are user-defined)
describe("origin-based filtering — schema-first (AC-TST-3)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    productCountMock.mockResolvedValue(1);
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
  });

  it("regional origin extraction uses hasSome for array origins", async () => {
    // Simulate AI returning an array of countries for a regional query
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { origin: ["Guatemala", "Costa Rica", "Honduras"] },
        acknowledgment: "Here are the Central American coffees.",
        followUps: [],
        followUpQuestion: "",
      }),
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=coffee+from+central+america&ai=true"
    );
    await GET(request);

    expect(productFindManyMock).toHaveBeenCalled();
    const callArgs = productFindManyMock.mock.calls[0][0];
    // Array origin → hasSome operator on the String[] origin field
    expect(callArgs.where).toMatchObject({
      origin: { hasSome: ["Guatemala", "Costa Rica", "Honduras"] },
    });
  });

  it("single-country origin extraction uses has", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { origin: "Ethiopia" },
        acknowledgment: "Ethiopian coffees coming up.",
        followUps: [],
        followUpQuestion: "",
      }),
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=ethiopian+coffee&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0][0];
    // Single string origin → has operator
    expect(callArgs.where).toMatchObject({
      origin: { has: "Ethiopia" },
    });
  });
});

// ---------------------------------------------------------------------------
// AC-TST-4 + AC-TST-5: Cadence enforcement — followUps based on result count
// ---------------------------------------------------------------------------

describe("cadence enforcement — followUps (AC-TST-4, AC-TST-5)", () => {
  const makeProducts = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `prod-${i}`,
      name: `Coffee ${i}`,
      slug: `coffee-${i}`,
      categories: [],
      variants: [{ id: `v-${i}`, purchaseOptions: [{ id: `po-${i}`, type: "ONE_TIME", priceInCents: 1500 }] }],
      images: [],
    }));

  beforeEach(() => {
    jest.resetAllMocks();
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
    queryRawMock.mockResolvedValue([]);
    productCountMock.mockResolvedValue(0); // chips fail validation → [] — proves cadence enforcement, not chip validator
  });

  it("AC-TST-4: ≤3 results zeroes followUps", async () => {
    productFindManyMock.mockResolvedValue(makeProducts(2));
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "Here you go.",
        followUps: ["Bold", "Light", "Smooth"],
        followUpQuestion: "What roast?",
      }),
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=bolivian+single+origin&ai=true"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.products).toHaveLength(2);
    expect(data.followUps).toEqual([]);
  });

  it("AC-TST-5: ≥4 results allows followUps through", async () => {
    productFindManyMock.mockResolvedValue(makeProducts(5));
    productCountMock.mockResolvedValue(5); // chips pass validation
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "Lots of good options.",
        followUps: ["Bold", "Light", "Smooth"],
        followUpQuestion: "What roast level?",
      }),
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=good+coffee&ai=true"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.products).toHaveLength(5);
    expect(data.followUps.length).toBeGreaterThan(0);
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
// Conversation context + intent routing (AC-TST-7 to TST-14)
// ---------------------------------------------------------------------------

describe("GET /api/search — conversation context + intent routing", () => {
  const nlQuery = "something smooth and fruity for my morning"; // triggers isNaturalLanguageQuery

  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({
      aiVoicePersona: "",
      aiVoiceExamples: [],
      aiVoiceSurfaces: { salutation: "What are you after?" },
    });
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "Sure, let me take a look.",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });
  });

  // AC-TST-7: history injected into chatCompletion messages
  it("AC-TST-7: passes conversation history to chatCompletion messages", async () => {
    const history = [
      { role: "user", content: "show me light roast" },
      { role: "assistant", content: "Here are some light roasts." },
    ];
    const url = new URL("http://localhost:3000/api/search");
    url.searchParams.set("q", nlQuery);
    url.searchParams.set("history", JSON.stringify(history));

    await GET(new NextRequest(url.toString()));

    const callArgs = chatCompletionMock.mock.calls[0][0];
    const messages: Array<{ role: string; content: string }> = callArgs.messages;
    const contents = messages.map((m) => m.content);
    expect(contents.some((c) => c.includes("show me light roast"))).toBe(true);
  });

  // AC-TST-8: history capped at 5 turns (10 messages)
  it("AC-TST-8: caps history at 10 messages when 7-turn history is passed", async () => {
    // 7 turns = 14 messages — only last 10 should be passed through
    const history = Array.from({ length: 14 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));
    const url = new URL("http://localhost:3000/api/search");
    url.searchParams.set("q", nlQuery);
    url.searchParams.set("history", JSON.stringify(history));

    await GET(new NextRequest(url.toString()));

    const callArgs = chatCompletionMock.mock.calls[0][0];
    const messages: Array<{ role: string }> = callArgs.messages;
    // messages = [system, ...history_segment, user_query]
    // history_segment should be ≤ 10 entries
    const historySegment = messages.slice(1, -1); // exclude system and user
    expect(historySegment.length).toBeLessThanOrEqual(10);
  });

  // AC-TST-9: how_to intent — no DB query, empty products
  it("AC-TST-9: how_to intent returns empty products without querying DB", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "how_to",
        filtersExtracted: {},
        acknowledgment: "For a V60, you'd want a medium-fine grind.",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      `http://localhost:3000/api/search?q=${encodeURIComponent(nlQuery)}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(productFindManyMock).not.toHaveBeenCalled();
    expect(data.products).toEqual([]);
    expect(data.intent).toBe("how_to");
  });

  // AC-TST-10: reorder intent — in-character redirect, empty products
  it("AC-TST-10: reorder intent returns empty products and acknowledgment containing 'account'", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "reorder",
        filtersExtracted: {},
        acknowledgment: "For your previous orders, head to your account page.",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      `http://localhost:3000/api/search?q=${encodeURIComponent(nlQuery)}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(productFindManyMock).not.toHaveBeenCalled();
    expect(data.products).toEqual([]);
    expect(data.intent).toBe("reorder");
    expect((data.acknowledgment as string).toLowerCase()).toContain("account");
  });

  // AC-TST-11: merch query — no type: COFFEE, no categories filter
  it("AC-TST-11: merch productType omits type:COFFEE and categories from DB query", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { productType: "merch" },
        acknowledgment: "Let me see what gear we have.",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });
    productFindManyMock.mockResolvedValue([]);

    const request = new NextRequest(
      `http://localhost:3000/api/search?q=${encodeURIComponent(nlQuery)}`
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0][0];
    expect(callArgs.where.type).toBeUndefined();
    expect(callArgs.where.categories).toBeUndefined();
  });

  // AC-TST-12: result reconciliation — recommendedProductName spliced to index 0
  it("AC-TST-12: recommendedProductName product is at index 0 in response", async () => {
    const products = [
      { id: "p1", name: "Colombia Huila", slug: "colombia-huila", categories: [], variants: [], images: [] },
      { id: "p2", name: "Ethiopia Yirgacheffe", slug: "ethiopia-yirgacheffe", categories: [], variants: [], images: [] },
      { id: "p3", name: "Kenya AA", slug: "kenya-aa", categories: [], variants: [], images: [] },
    ];
    productFindManyMock.mockResolvedValue(products);
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "I'd go with the Ethiopia Yirgacheffe.",
        recommendedProductName: "Ethiopia Yirgacheffe",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      `http://localhost:3000/api/search?q=${encodeURIComponent(nlQuery)}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.products[0].name).toBe("Ethiopia Yirgacheffe");
  });

  // AC-TST-14: salutation detection — isSalutation: true, empty products, salutation surface
  it("AC-TST-14: q=hey&ai=true returns isSalutation:true with salutation acknowledgment", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=hey&ai=true"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.isSalutation).toBe(true);
    expect(data.products).toEqual([]);
    expect(data.acknowledgment).toBe("What are you after?");
  });
});

// ---------------------------------------------------------------------------
// Roast pattern detection
// ---------------------------------------------------------------------------

describe("GET /api/search — roast pattern", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(false);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
  });

  it("maps 'light roast' query to category slug filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/search?q=light+roast");
    await GET(request);
    const call = productFindManyMock.mock.calls[0][0];
    expect(call?.where?.categories?.some?.category?.slug).toBe("light-roast");
  });

  it("maps 'dark roast Ethiopia' to roast category + full-text search for remainder", async () => {
    queryRawMock.mockResolvedValue([{ id: "prod-eth-1" }]);
    const request = new NextRequest("http://localhost:3000/api/search?q=dark+roast+ethiopia");
    await GET(request);
    const call = productFindManyMock.mock.calls[0][0];
    expect(call?.where?.categories?.some?.category?.slug).toBe("dark-roast");
    // Remaining "ethiopia" term uses full-text search IDs, not OR clause
    expect(call?.where?.id?.in).toEqual(["prod-eth-1"]);
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
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    queryRawMock.mockResolvedValue([]);
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
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: persona, aiVoiceExamples: [] });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+morning+coffee+for+V60&ai=true"
    );
    await GET(request);

    expect(chatCompletionMock).toHaveBeenCalledTimes(1);
    const callArgs = chatCompletionMock.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const systemMessage = callArgs.messages.find((m) => m.role === "system");
    expect(systemMessage?.content).toContain(persona);
  });

  it("uses default voice examples in system prompt when no custom examples stored", async () => {
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+morning+coffee+for+V60&ai=true"
    );
    await GET(request);

    const callArgs = chatCompletionMock.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const systemMessage = callArgs.messages.find((m) => m.role === "system");
    // Falls back to DEFAULT_VOICE_EXAMPLES — few-shot Q&A pairs in system prompt
    expect(systemMessage?.content).toContain("What should I try first?");
    expect(systemMessage?.content).toContain("Hawaiian Kona");
  });
});

// ---------------------------------------------------------------------------
// TST-3: isOrganic filter applied to whereClause
// ---------------------------------------------------------------------------

describe("GET /api/search — isOrganic filter (TST-3)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
  it("always sets type=COFFEE even when AI extracts no coffee-specific filters", async () => {
    baseSetup();
    chatCompletionMock.mockResolvedValue(aiResponse({}));

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+cup+with+citrus&ai=true"
    );
    await GET(request);

    const call = productFindManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.type).toBe("COFFEE");
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
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({ aiVoicePersona: "", aiVoiceExamples: [] });
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
  it("user prompt followUps instruction specifies 2-4 word option labels (BUG-5)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=morning+coffee+with+citrus&ai=true"
    );
    await GET(request);

    const callArgs = chatCompletionMock.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const userMessage = callArgs.messages.find((m) => m.role === "user");
    expect(userMessage?.content).toContain("2-4 word clickable answer");
    expect(userMessage?.content).toContain("Never use question marks");
  });
});

// ---------------------------------------------------------------------------
// AC-TST: Search relevance fixture tests
// ---------------------------------------------------------------------------

describe("search relevance — AI extraction clears keyword OR (AC-TST-1–8)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    productFindManyMock.mockResolvedValue([]);
    queryRawMock.mockResolvedValue([]);
    isAIConfiguredMock.mockResolvedValue(true);
    getPublicSiteSettingsMock.mockResolvedValue({
      aiVoicePersona: "",
      aiVoiceExamples: [],
    });
  });

  it("AC-TST-1: 'fruity coffee' — AI flavorProfile clears keyword OR containing 'coffee'", async () => {
    // AI extracts flavorProfile: ["fruity"] — keyword "coffee" should be discarded
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { flavorProfile: ["fruity"] },
        acknowledgment: "Looking for fruity coffee!",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=fruity+coffee&ai=true"
    );
    await GET(request);

    // Verify findMany was called — the whereClause should NOT have a broad
    // keyword OR with "coffee" contains. It should have flavor-based OR only.
    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    const orClause = callArgs?.where?.OR;

    // OR clause must exist (flavor entries present) and must NOT contain "coffee"
    expect(orClause).toBeDefined();
    expect(Array.isArray(orClause)).toBe(true);
    const hasCoffeeContains = orClause.some(
      (entry: Record<string, unknown>) =>
        entry.description &&
        typeof entry.description === "object" &&
        (entry.description as Record<string, unknown>).contains === "coffee"
    );
    expect(hasCoffeeContains).toBe(false);
    // Must contain at least one "fruity" entry — the AI flavor
    const hasFruityEntry = orClause.some(
      (entry: Record<string, unknown>) =>
        (entry.description &&
          typeof entry.description === "object" &&
          (entry.description as Record<string, unknown>).contains === "fruity") ||
        (entry.tastingNotes &&
          typeof entry.tastingNotes === "object" &&
          Array.isArray((entry.tastingNotes as Record<string, unknown>).hasSome) &&
          ((entry.tastingNotes as { hasSome: string[] }).hasSome).includes("Fruity"))
    );
    expect(hasFruityEntry).toBe(true);
  });

  it("AC-TST-3: 'tropical fruity notes' — keyword OR cleared, no 'notes' match", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { flavorProfile: ["tropical", "fruity"] },
        acknowledgment: "Tropical and fruity!",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=tropical+fruity+notes&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    const orClause = callArgs?.where?.OR;

    // OR clause must exist (flavor entries for tropical/fruity) and must NOT have "notes"
    expect(orClause).toBeDefined();
    expect(Array.isArray(orClause)).toBe(true);
    const hasNotesContains = orClause.some(
      (entry: Record<string, unknown>) =>
        entry.description &&
        typeof entry.description === "object" &&
        (entry.description as Record<string, unknown>).contains === "notes"
    );
    expect(hasNotesContains).toBe(false);
    // Must include at least "tropical" or "fruity" flavor entries
    const hasFlavorEntry = orClause.some(
      (entry: Record<string, unknown>) =>
        entry.description &&
        typeof entry.description === "object" &&
        ["tropical", "fruity"].includes(
          (entry.description as Record<string, unknown>).contains as string
        )
    );
    expect(hasFlavorEntry).toBe(true);
  });

  it("AC-TST-4: 'most expensive' — AI sortBy extracted, no keyword OR blocks results", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { sortBy: "newest" }, // nearest supported sort
        acknowledgment: "Let me find the priciest options.",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=most+expensive&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    // When sortBy is extracted, the keyword OR ("expensive", "most") should be cleared
    expect(callArgs?.where?.OR).toBeUndefined();
  });

  it("AC-TST-6: 'organic' — AI extracts isOrganic, keyword OR cleared", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { isOrganic: true },
        acknowledgment: "Organic coffees coming up.",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=organic&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    expect(callArgs?.where?.isOrganic).toBe(true);
    expect(callArgs?.where?.OR).toBeUndefined();
  });

  it("AC-TST-5: 'smooth chocolatey' — AI flavorProfile replaces keyword OR", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { flavorProfile: ["chocolate", "smooth"] },
        acknowledgment: "Smooth and chocolatey!",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=smooth+chocolatey&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    const orClause = callArgs?.where?.OR;

    // Should have flavor entries, not broad keyword entries
    expect(orClause).toBeDefined();
    expect(orClause.length).toBe(4); // 2 flavors × 2 entries each (description + tastingNotes)
    // All entries should be flavor-related
    orClause.forEach((entry: Record<string, unknown>) => {
      const isDescription = !!entry.description;
      const isTastingNotes = !!entry.tastingNotes;
      expect(isDescription || isTastingNotes).toBe(true);
    });
  });

  it("AC-TST-7: 'under $25' — AI priceMaxCents extracted, keyword OR cleared", async () => {
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: { priceMaxCents: 2500 },
        acknowledgment: "Budget-friendly options!",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=under+%2425&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    expect(callArgs?.where?.OR).toBeUndefined();
    expect(callArgs?.where?.variants?.some?.purchaseOptions?.some?.priceInCents?.lte).toBe(2500);
  });

  it("AC-TST-8: empty AI extraction falls back to keyword search", async () => {
    // AI returns empty filters — keyword search should be preserved
    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify({
        intent: "product_discovery",
        filtersExtracted: {},
        acknowledgment: "",
        followUpQuestion: "",
        followUps: [],
      }),
      finishReason: "stop",
    });

    // Full-text search returns some IDs
    queryRawMock.mockResolvedValue([{ id: "prod-1" }, { id: "prod-2" }]);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=something+random&ai=true"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    // When AI extracts nothing, the full-text search IDs should be used
    expect(callArgs?.where?.id?.in).toEqual(["prod-1", "prod-2"]);
  });

  it("AC-FN-3: 'dark roast' — category filter applied, keyword OR not used", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/search?q=dark+roast"
    );
    await GET(request);

    const callArgs = productFindManyMock.mock.calls[0]?.[0];
    expect(callArgs?.where?.categories?.some?.category?.slug).toBe("dark-roast");
    expect(callArgs?.where?.type).toBe("COFFEE");
  });
});

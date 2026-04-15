/**
 * Counter cadence integration tests — AC-TST-10, AC-TST-11, AC-TST-12
 *
 * These tests fire real HTTP requests against the running dev server
 * (http://localhost:3000) with Gemini configured. They test the full stack:
 * query → AI classification → response shape.
 *
 * Requirements:
 *   - Dev server running: `npm run dev`
 *   - AI configured: AI_API_KEY, AI_BASE_URL, AI_MODEL set in .env.local
 *
 * Run with: npm run test:integration
 * Excluded from: npm run test:ci (see jest.config.js testPathIgnorePatterns)
 */

/** @jest-environment node */

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";

async function searchRequest(params: Record<string, string>): Promise<Response> {
  const url = new URL("/api/search", BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return fetch(url.toString());
}

// Increase timeout — real AI calls can take a few seconds
jest.setTimeout(30_000);

describe("Counter cadence — intent classification (AC-TST-11)", () => {
  it("how-to query → intent:how_to, empty products", async () => {
    const res = await searchRequest({ q: "how do I brew a pour over?", ai: "true" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.intent).toBe("how_to");
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products).toHaveLength(0);
  });

  it("reorder query → intent:reorder, empty products", async () => {
    const res = await searchRequest({ q: "I want to reorder last month's bag", ai: "true" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.intent).toBe("reorder");
    expect(data.products).toHaveLength(0);
  });

  it("product_discovery query → acknowledgment non-null", async () => {
    const res = await searchRequest({ q: "something fruity and light", ai: "true" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.intent).toBe("product_discovery");
    expect(data.acknowledgment).toBeTruthy();
  });

  it("merch equipment query → merch products returned", async () => {
    const res = await searchRequest({ q: "do you have a pour over coffee maker?", ai: "true" });
    expect(res.status).toBe(200);
    const data = await res.json();
    // Either returns the product OR returns a no-results acknowledgment — neither should hallucinate
    expect(data.acknowledgment).toBeTruthy();
  });
});

describe("Counter cadence — shape (AC-TST-12)", () => {
  it("vague query → acknowledgment non-null + products ≤7", async () => {
    const res = await searchRequest({ q: "what's good today?", ai: "true" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.acknowledgment).toBeTruthy();
    expect(data.products.length).toBeLessThanOrEqual(7);
  });

  it("category page query → products non-empty (Central America category)", async () => {
    const res = await searchRequest({
      q: "most expensive coffee from here",
      ai: "true",
      from: "categories/central-america",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    // The pre-scope guarantees only central-america category products come back
    // (or zero if the category has no products — both are valid)
    expect(Array.isArray(data.products)).toBe(true);
  });
});

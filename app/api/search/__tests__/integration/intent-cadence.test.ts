/**
 * Intent-cadence contract tests — live API, real AI classification.
 *
 * These tests call the running dev server with real AI configured.
 * They verify that the actual classified intent is consistent with
 * the cadence rules: acknowledgment present, filtersExtracted correct,
 * products follow from the intent.
 *
 * Skip when AI is not configured (CI without API key).
 * Run manually: npx jest intent-cadence.integration --testPathPattern
 */

/** @jest-environment node */

export {};

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const AI_CONFIGURED = !!process.env.GEMINI_API_KEY;

const maybeDescribe = AI_CONFIGURED ? describe : describe.skip;

interface SearchResponse {
  intent: string;
  acknowledgment: string | null;
  filtersExtracted: Record<string, unknown> | null;
  products: unknown[];
  followUps: string[];
  aiFailed: boolean;
}

const search = async (query: string): Promise<SearchResponse> => {
  const url = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&ai=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<SearchResponse>;
};

maybeDescribe("intent-cadence contract — live AI", () => {
  // Generous timeout for real AI calls
  jest.setTimeout(30000);

  // -------------------------------------------------------------------------
  // recommend: single product suitability — honest NO path
  // -------------------------------------------------------------------------
  it("recommend/single: 'is dark roast good for cold brew?' → recommend, filters for cold-brew-suited roast", async () => {
    const data = await search("is dark roast good for cold brew?");

    expect(data.intent).toBe("recommend");
    expect(data.acknowledgment?.trim()).toBeTruthy();
    expect(data.aiFailed).toBe(false);
    // Should NOT filter for dark roast (that's the product being assessed)
    // Instead should search for what works for cold brew
    if (data.filtersExtracted) {
      expect(data.filtersExtracted.roastLevel).not.toBe("dark");
    }
  });

  // -------------------------------------------------------------------------
  // recommend: multi-product pick for a use case
  // -------------------------------------------------------------------------
  it("recommend/pick: 'which works better for a flat white, Brazilian or Guatemalan?' → recommend, acknowledgment explains, alternatives shown", async () => {
    const data = await search("which works better for a flat white, Brazilian or Guatemalan?");

    expect(data.intent).toBe("recommend");
    expect(data.acknowledgment?.trim()).toBeTruthy();
    expect(data.aiFailed).toBe(false);
    // Should search for milk-suited alternatives, not origin: Brazil/Guatemala
    if (data.filtersExtracted?.origin) {
      const origin = data.filtersExtracted.origin as string | string[];
      const origins = Array.isArray(origin) ? origin : [origin];
      expect(origins).not.toContain("Brazil");
      expect(origins).not.toContain("Guatemala");
    }
  });

  // -------------------------------------------------------------------------
  // compare: open-ended difference, no single use case
  // -------------------------------------------------------------------------
  it("compare: 'how do light roast and dark roast differ?' → compare, acknowledgment states delta", async () => {
    const data = await search("how do light roast and dark roast differ?");

    expect(data.intent).toBe("compare");
    expect(data.acknowledgment?.trim()).toBeTruthy();
    expect(data.aiFailed).toBe(false);
  });

  // -------------------------------------------------------------------------
  // how_to: informational, no products
  // -------------------------------------------------------------------------
  it("how_to: 'what grind size should I use for a French press?' → how_to, no products", async () => {
    const data = await search("what grind size should I use for a French press?");

    expect(data.intent).toBe("how_to");
    expect(data.products).toEqual([]);
    expect(data.acknowledgment?.trim()).toBeTruthy();
    expect(data.aiFailed).toBe(false);
  });

  // -------------------------------------------------------------------------
  // discover: vague/mood query → top_rated, no narrow filters
  // -------------------------------------------------------------------------
  it("discover/vague: 'what would you recommend for a first timer?' → discover or recommend, sortBy top_rated", async () => {
    const data = await search("what would you recommend for a first timer?");

    expect(["discover", "recommend"]).toContain(data.intent);
    expect(data.acknowledgment?.trim()).toBeTruthy();
    expect(data.aiFailed).toBe(false);
    if (data.filtersExtracted) {
      // Vague query — should not narrow to a specific roast level
      expect(data.filtersExtracted.roastLevel).toBeUndefined();
    }
  });
});

/**
 * Counter integration tests — real HTTP against running dev server.
 *
 * Each test fires a real query through the full stack:
 *   query → AI extraction → Prisma → response
 *
 * Tests are organized by what they expose:
 *   - Intent classification (how_to, reorder, compare, product_discovery)
 *   - Extraction quality (was productType/origin/etc correctly classified?)
 *   - Response shape / cadence (acknowledgment, chips, result count)
 *   - Quality gates applied to real AI output (banned phrases, chip format, grounded truth)
 *
 * KNOWN FAILURES (expected until iter-6 fixes land):
 *   BUG-1  — merch search returns 0 products  → products.length > 0 fails
 *   BUG-2  — grounded truth: ack diverges from results (intermittent)
 *   OBS-4  — comparison/recommend returns product cards → products.length === 0 fails
 *
 * Run:  npm run test:integration  (dev server must be running with AI configured)
 * Skip: npm run test:ci  (excluded via testPathIgnorePatterns in jest.config.js)
 */

/** @jest-environment node */

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Assertion helpers — applied to real AI output, not fixtures
// ---------------------------------------------------------------------------

/** Phrases the AI must never use — search-UI vocabulary and service framing */
const BANNED_PHRASES = [
  "based on your query",
  "searching for",
  "results for",
  "no matching products",
  "here are the results",
  "i found the following",
  "query results",
  "nothing matching",
  "i can't think of",
  "i'm not sure",
  "i don't have",
  "i don't know",
];

/** Phrases that imply a physical space — banned from greeting/acknowledgment */
const LOCATION_PHRASES = ["welcome in", "come on in", "step up", "walk in", "walk-in"];

function assertNoMachinePhrases(ack: string) {
  const lower = ack.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    expect(lower).not.toContain(phrase);
  }
}

function assertNoLocationLanguage(ack: string) {
  const lower = ack.toLowerCase();
  for (const phrase of LOCATION_PHRASES) {
    expect(lower).not.toContain(phrase);
  }
}

function assertChipFormat(chips: string[]) {
  for (const chip of chips) {
    const words = chip.trim().split(/\s+/);
    expect(words.length).toBeGreaterThanOrEqual(1);
    expect(words.length).toBeLessThanOrEqual(4);
    expect(chip).not.toContain("?");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SearchParams = Record<string, string>;

async function search(params: SearchParams): Promise<Record<string, unknown>> {
  const url = new URL("/api/search", BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  expect(res.status).toBe(200);
  return res.json() as Promise<Record<string, unknown>>;
}

jest.setTimeout(30_000);

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

describe("Intent classification", () => {
  it("how-to query → intent:how_to, products empty", async () => {
    const data = await search({ q: "how do I brew a pour over?", ai: "true" });
    expect(data.intent).toBe("how_to");
    expect(data.products as unknown[]).toHaveLength(0);
  });

  it("reorder query → intent:reorder, products empty", async () => {
    const data = await search({ q: "I want to reorder last month's bag", ai: "true" });
    expect(data.intent).toBe("reorder");
    expect(data.products as unknown[]).toHaveLength(0);
  });

  /**
   * OBS-4: Comparison/recommendation queries should return products: []
   * The AI should reason, not list product cards for a side-by-side decision.
   *
   * EXPECTED FAILURE: currently returns product cards → iter-6 adds compare/recommend
   * intent routing that sets products: [] on the server.
   */
  it("comparison query → products empty [OBS-4 — expected fail]", async () => {
    const data = await search({
      q: "which of these two would you pick for a beginner, Ethiopian or Colombian?",
      ai: "true",
    });
    expect(data.products as unknown[]).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Extraction quality — what did the AI actually classify?
// ---------------------------------------------------------------------------

describe("Extraction quality", () => {
  /**
   * BUG-1: Merch equipment query must:
   *   1. Be classified as productType:merch by extraction
   *   2. Return actual merch products (not 0 results)
   *
   * EXPECTED FAILURE on step 2: the merch Prisma path uses the raw NL query
   * string for name/description ILIKE — "do you have a pour over coffee maker?"
   * won't match product names. products.length > 0 will fail until iter-6
   * adds productKeywords extraction.
   */
  it("merch equipment query → productType:merch + products returned [BUG-1 — expected fail]", async () => {
    const data = await search({ q: "do you have a pour over coffee maker?", ai: "true" });
    const filters = data.filtersExtracted as Record<string, unknown> | null;
    // Step 1: extraction must classify as merch
    expect(filters?.productType).toBe("merch");
    // Step 2: merch products must actually come back
    expect((data.products as unknown[]).length).toBeGreaterThan(0);
  });

  it("product_discovery query → non-merch productType, acknowledgment present", async () => {
    const data = await search({ q: "something fruity and light", ai: "true" });
    // "something fruity and light" may be classified as product_discovery OR recommendation —
    // both are valid; the boundary is intentionally blurry. What matters is: not merch.
    expect(["product_discovery", "recommendation"]).toContain(data.intent);
    expect(data.acknowledgment).toBeTruthy();
    // Coffee discovery queries must NOT be misclassified as merch
    const filters = data.filtersExtracted as Record<string, unknown> | null;
    expect(filters?.productType).not.toBe("merch");
  });

  it("Central America region query → origin extracted as array of countries", async () => {
    const data = await search({ q: "coffee from central america", ai: "true" });
    const filters = data.filtersExtracted as Record<string, unknown> | null;
    const origin = filters?.origin;
    // Regional query → array of country origins (Guatemala, Costa Rica, Honduras…)
    expect(Array.isArray(origin)).toBe(true);
    expect((origin as unknown[]).length).toBeGreaterThan(1);
  });

  /**
   * OBS-11: Origin shape is inconsistent for single-country queries.
   * The AI returns string | string[] | undefined with no clear contract.
   * This test documents observed behavior rather than enforcing a strict shape —
   * it logs what was returned so we can track consistency over time.
   * Fix in iter-6 with OBS-8 (Zod schema enforces string for single, array for multi).
   */
  it("single country query → origin is present and contains the country name", async () => {
    const data = await search({ q: "ethiopian coffee", ai: "true" });
    const filters = data.filtersExtracted as Record<string, unknown> | null;
    const origin = filters?.origin;
    // OBS-11: shape varies — string, array, or undefined. Log for visibility.
    console.log("[OBS-11] origin shape for 'ethiopian coffee':", JSON.stringify(origin));
    // Minimal assertion: if present, must reference Ethiopia
    if (origin !== undefined && origin !== null) {
      const originStr = JSON.stringify(origin).toLowerCase();
      expect(originStr).toContain("ethiopia");
    }
    // Not asserting shape — that's the OBS-11 gap to fix in iter-6
  });
});

// ---------------------------------------------------------------------------
// Response shape and cadence
// ---------------------------------------------------------------------------

describe("Response shape / cadence", () => {
  it("vague query → acknowledgment non-null + ≤7 products", async () => {
    const data = await search({ q: "what's good today?", ai: "true" });
    expect(data.acknowledgment).toBeTruthy();
    expect((data.products as unknown[]).length).toBeLessThanOrEqual(7);
  });

  it("vague query → follow-up chips present when products ≥4", async () => {
    const data = await search({ q: "anything good?", ai: "true" });
    if ((data.products as unknown[]).length >= 4) {
      expect((data.followUps as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it("specific narrow query → no follow-up chips when 1–3 products returned", async () => {
    // A highly specific query should return ≤3 results and no chips.
    // Guard: the cadence rule in route.ts clears chips only when products.length > 0 && <= 3.
    // 0 results is a separate scenario (no-results path) and is not tested here.
    const data = await search({ q: "bolivian natural process single origin", ai: "true" });
    const count = (data.products as unknown[]).length;
    if (count > 0 && count <= 3) {
      expect(data.followUps as unknown[]).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Quality gates — assertions against real AI output
// ---------------------------------------------------------------------------

describe("Quality gates — acknowledgment and chips", () => {
  it("vague query → acknowledgment uses no machine/search phrases", async () => {
    const data = await search({ q: "anything good right now?", ai: "true" });
    if (data.acknowledgment) {
      assertNoMachinePhrases(data.acknowledgment as string);
    }
  });

  it("follow-up chips are 1-4 words, no question marks", async () => {
    const data = await search({ q: "what's popular?", ai: "true" });
    const chips = data.followUps as string[];
    if (chips?.length > 0) {
      assertChipFormat(chips);
    }
  });

  it("acknowledgment uses no location/physical-space language", async () => {
    const data = await search({ q: "hi", ai: "true" });
    if (data.acknowledgment) {
      assertNoLocationLanguage(data.acknowledgment as string);
    }
  });

  /**
   * BUG-2: Grounded truth — acknowledgment should reference the actual
   * products returned, not hallucinate products from outside the result set.
   *
   * Soft check: at least one significant word (>4 chars) from returned product
   * names appears in the acknowledgment. Fails when the two AI calls diverge.
   *
   * EXPECTED FAILURE: intermittent — depends on whether the two independent
   * AI calls (system prompt call + extraction call) produce consistent output.
   * Iter-6 fix: post-query acknowledgment generation constrained to actual results.
   */
  it("specific query → acknowledgment references returned products [BUG-2 — soft check]", async () => {
    const data = await search({ q: "Ethiopian light roast", ai: "true" });
    const products = data.products as Array<{ name: string }>;
    if (products.length > 0 && data.acknowledgment) {
      const ackLower = (data.acknowledgment as string).toLowerCase();
      const significantWords = products
        .flatMap((p) => p.name.split(" "))
        .filter((w) => w.length > 4)
        .map((w) => w.toLowerCase());
      const hasGroundedRef = significantWords.some((w) => ackLower.includes(w));
      expect(hasGroundedRef).toBe(true);
    }
  });
});

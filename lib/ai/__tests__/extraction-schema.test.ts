/** @jest-environment node */
/**
 * Iter-7 schema + prompt tests
 * AC-TST-4: Origin shape — single string passes, single-element array rejected
 * AC-TST-5: Origin shape — multi-element array passes
 * AC-TST-7: Extraction prompt contains no verbatim flavor phrases
 * AC-TST-8: Vague query extraction — no narrow filters + top_rated
 *
 * Iter-7b schema + prompt tests
 * AC-TST-1: Intent schema normalization — legacy values normalize to canonical
 * AC-TST-2: buildExtractionPrompt contains recommend cadence teaching strings
 * AC-TST-5: buildExtractionPrompt contains compare cadence + intent boundary strings
 */

import { FiltersExtractedSchema, AgenticExtractionSchema, AgenticIntentSchema } from "@/types/search";
import { buildExtractionPrompt } from "@/lib/ai/extraction";

// ---------------------------------------------------------------------------
// Iter-7b AC-TST-1: Intent schema normalization
// ---------------------------------------------------------------------------

describe("AgenticIntentSchema — legacy value normalization (iter-7b AC-TST-1)", () => {
  it('normalizes "recommendation" to "recommend"', () => {
    expect(AgenticIntentSchema.parse("recommendation")).toBe("recommend");
  });

  it('normalizes "product_discovery" to "discover"', () => {
    expect(AgenticIntentSchema.parse("product_discovery")).toBe("discover");
  });

  it("accepts canonical verb-form values unchanged", () => {
    expect(AgenticIntentSchema.parse("discover")).toBe("discover");
    expect(AgenticIntentSchema.parse("recommend")).toBe("recommend");
    expect(AgenticIntentSchema.parse("how_to")).toBe("how_to");
    expect(AgenticIntentSchema.parse("reorder")).toBe("reorder");
    expect(AgenticIntentSchema.parse("compare")).toBe("compare");
  });

  it("rejects unknown intent values", () => {
    expect(() => AgenticIntentSchema.parse("unknown_intent")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Iter-7b AC-TST-2: buildExtractionPrompt contains recommend cadence strings
// ---------------------------------------------------------------------------

describe("buildExtractionPrompt — recommend cadence strings (iter-7b AC-TST-2)", () => {
  const prompt = buildExtractionPrompt("test query");

  it('contains "RECOMMEND CADENCE"', () => {
    expect(prompt).toContain("RECOMMEND CADENCE");
  });

  it('contains "Is the answer YES"', () => {
    expect(prompt).toContain("Is the answer YES");
  });

  it('contains "Extract filters for the alternative"', () => {
    expect(prompt).toContain("Extract filters for the alternative");
  });
});

// ---------------------------------------------------------------------------
// Iter-7b AC-TST-5: buildExtractionPrompt contains compare cadence + intent boundary
// ---------------------------------------------------------------------------

describe("buildExtractionPrompt — compare cadence + intent boundary (iter-7b AC-TST-5)", () => {
  const prompt = buildExtractionPrompt("test query");

  it('contains "COMPARE CADENCE"', () => {
    expect(prompt).toContain("COMPARE CADENCE");
  });

  it('contains "state the delta"', () => {
    expect(prompt).toContain("state the delta");
  });

  it('contains "requires evaluable criteria"', () => {
    expect(prompt).toContain("requires evaluable criteria");
  });
});

// ---------------------------------------------------------------------------
// AC-TST-4 & AC-TST-5: Origin shape validation
// ---------------------------------------------------------------------------

describe("FiltersExtractedSchema — origin shape (AC-TST-4, AC-TST-5)", () => {
  // AC-TST-4
  it("single string passes", () => {
    const result = FiltersExtractedSchema.safeParse({ origin: "Ethiopia" });
    expect(result.success).toBe(true);
  });

  it("single-element array is rejected", () => {
    const result = FiltersExtractedSchema.safeParse({ origin: ["Ethiopia"] });
    expect(result.success).toBe(false);
  });

  // AC-TST-5
  it("multi-element array passes", () => {
    const result = FiltersExtractedSchema.safeParse({ origin: ["Guatemala", "Costa Rica"] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.origin).toEqual(["Guatemala", "Costa Rica"]);
    }
  });
});

// ---------------------------------------------------------------------------
// AC-TST-7: Extraction prompt contains no verbatim flavor phrases
// ---------------------------------------------------------------------------

describe("buildExtractionPrompt — no verbatim flavor phrases (AC-TST-7)", () => {
  const prompt = buildExtractionPrompt("test query");

  it("does not contain 'approachable'", () => {
    expect(prompt).not.toContain("approachable");
  });

  it("does not contain 'we have a great selection'", () => {
    expect(prompt.toLowerCase()).not.toContain("we have a great selection");
  });

  it("does not contain 'beginner' in flavor mapping", () => {
    // "beginner" was removed from experiential/mood term mappings
    // It should not appear as a trigger for flavor inference
    const flavorSection = prompt.slice(
      prompt.indexOf("flavorProfile"),
      prompt.indexOf("origin")
    );
    expect(flavorSection).not.toContain("beginner");
  });
});

// ---------------------------------------------------------------------------
// AC-TST-8: Vague query extraction — sortBy top_rated, no narrow filters
// ---------------------------------------------------------------------------

describe("AgenticExtractionSchema — vague query shape (AC-TST-8)", () => {
  it("accepts extraction with sortBy top_rated and no roast/flavor filters", () => {
    const vagueExtraction = {
      intent: "product_discovery",
      filtersExtracted: {
        sortBy: "top_rated",
        // No roastLevel, no flavorProfile — vague query
      },
      acknowledgment: "Let me show you what's popular.",
      followUpQuestion: "What kind of coffee do you usually go for?",
      followUps: ["Bold & dark", "Light & fruity"],
    };

    const result = AgenticExtractionSchema.safeParse(vagueExtraction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filtersExtracted.sortBy).toBe("top_rated");
      expect(result.data.filtersExtracted.roastLevel).toBeUndefined();
      expect(result.data.filtersExtracted.flavorProfile).toBeUndefined();
    }
  });

  it("prompt includes vague-query rule", () => {
    const prompt = buildExtractionPrompt("what's good?");
    expect(prompt).toContain("VAGUE QUERIES");
    expect(prompt).toContain("top_rated");
    expect(prompt).toContain("OMIT roastLevel and flavorProfile");
  });
});

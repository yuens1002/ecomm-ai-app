/** @jest-environment node */
/**
 * Unit tests for buildSystemPrompt — verifies that Q&A pairs from each
 * fixture set are embedded verbatim in the system prompt.
 *
 * These tests assert the plumbing (are the pairs present?), not AI output
 * (which is non-deterministic and tested elsewhere via persona-accuracy.test.ts).
 */

// route.ts imports next/server and prisma — mock them out so we can import
// buildSystemPrompt without a full server environment
jest.mock("@/auth", () => ({ auth: jest.fn(() => Promise.resolve(null)) }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: jest.fn() },
    userActivity: { create: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));
jest.mock("@/lib/ai-client", () => ({
  chatCompletion: jest.fn(),
  isAIConfigured: jest.fn(),
}));
jest.mock("@/lib/data", () => ({
  getPublicSiteSettings: jest.fn(),
}));

import { buildSystemPrompt, buildExtractionPrompt } from "../route";
import { VOICE_SET_A } from "./fixtures/voice-set-a";
import { VOICE_SET_B } from "./fixtures/voice-set-b";

describe("buildSystemPrompt — voice Q&A embedding", () => {
  describe("Set A (warm/curious default voice)", () => {
    let prompt: string;

    beforeAll(() => {
      prompt = buildSystemPrompt(VOICE_SET_A, "");
    });

    it("includes all Q&A questions verbatim", () => {
      for (const { question } of VOICE_SET_A) {
        expect(prompt).toContain(question);
      }
    });

    it("includes all Q&A answers verbatim", () => {
      for (const { answer } of VOICE_SET_A) {
        expect(prompt).toContain(answer);
      }
    });

    it("formats pairs as Customer/You dialogue", () => {
      expect(prompt).toContain(`Customer: "${VOICE_SET_A[0].question}"`);
      expect(prompt).toContain(`You: "${VOICE_SET_A[0].answer}"`);
    });

    it("uses opinion framing instruction, not service verbs", () => {
      // Positive: opinion framing is present
      expect(prompt).toContain("I'd go with");
      expect(prompt).toContain("I'd say try");
      expect(prompt).toContain("personally I'd");
      // Negative: action verbs are listed as FORBIDDEN, not as instructions
      expect(prompt).toContain("Never use physical action verbs");
    });
  });

  describe("Set B (minimal/direct voice)", () => {
    let prompt: string;

    beforeAll(() => {
      prompt = buildSystemPrompt(VOICE_SET_B, "");
    });

    it("includes all Q&A questions verbatim", () => {
      for (const { question } of VOICE_SET_B) {
        expect(prompt).toContain(question);
      }
    });

    it("includes all Q&A answers verbatim", () => {
      for (const { answer } of VOICE_SET_B) {
        expect(prompt).toContain(answer);
      }
    });

    it("Set B answers do NOT appear when Set A is used", () => {
      const setAPrompt = buildSystemPrompt(VOICE_SET_A, "");
      expect(setAPrompt).not.toContain(VOICE_SET_B[0].answer);
    });

    it("Set A answers do NOT appear when Set B is used", () => {
      expect(prompt).not.toContain(VOICE_SET_A[0].answer);
    });
  });

  describe("fallback when no examples provided", () => {
    it("uses generic voice instruction when examples array is empty", () => {
      const prompt = buildSystemPrompt([], "");
      expect(prompt).toContain("genuine expertise");
    });

    it("uses persona string when provided without examples", () => {
      const prompt = buildSystemPrompt([], "A laid-back roaster from Portland");
      expect(prompt).toContain("A laid-back roaster from Portland");
    });
  });

  // AC-TST-6: stock deflection guardrail
  describe("stock deflection guardrail (AC-TST-6)", () => {
    it("contains stock deflection rule", () => {
      const prompt = buildSystemPrompt([], "");
      expect(prompt.toLowerCase()).toContain("never state or imply stock");
    });

    it("instructs redirect to product page for availability questions", () => {
      const prompt = buildSystemPrompt([], "");
      expect(prompt.toLowerCase()).toContain("product page");
    });
  });

  // AC-TST-7: banned search-oriented language
  describe("banned search-oriented language (AC-TST-7)", () => {
    let prompt: string;

    beforeAll(() => {
      prompt = buildSystemPrompt([], "");
    });

    it("bans 'nothing matching'", () => {
      expect(prompt).toContain("nothing matching");
    });

    it("bans \"I can't think of\"", () => {
      expect(prompt).toContain("I can't think of");
    });

    it("bans \"I'm not sure\"", () => {
      expect(prompt).toContain("I'm not sure");
    });

    it("bans 'I don\\'t have'", () => {
      expect(prompt).toContain("I don't have");
    });

    it("bans 'find'", () => {
      expect(prompt).toContain("find");
    });
  });

  // AC-TST-9: page context section
  describe("page context section (AC-TST-9)", () => {
    it("includes page context when provided", () => {
      const prompt = buildSystemPrompt([], "", "Origami Air Dripper");
      expect(prompt).toContain("Origami Air Dripper");
    });

    it("excludes context section when not provided", () => {
      const prompt = buildSystemPrompt([], "");
      expect(prompt).not.toContain("currently looking at");
    });
  });

  // AC-TST-13: domain knowledge section
  describe("coffee domain knowledge (AC-TST-13)", () => {
    let prompt: string;

    beforeAll(() => {
      prompt = buildSystemPrompt([], "");
    });

    it("contains origin-to-flavor mapping for Ethiopia", () => {
      expect(prompt).toContain("Ethiopia");
    });

    it("contains origin-to-flavor mapping for Kenya", () => {
      expect(prompt).toContain("Kenya");
    });

    it("contains experiential term mapping for 'approachable'", () => {
      expect(prompt).toContain("approachable");
    });

    it("contains processing method signatures (washed, natural)", () => {
      expect(prompt).toContain("washed");
      expect(prompt).toContain("natural");
    });
  });
});

// ---------------------------------------------------------------------------
// buildExtractionPrompt
// ---------------------------------------------------------------------------

describe("buildExtractionPrompt", () => {
  // AC-TST-7: banned search vocabulary in acknowledgment rules
  describe("banned search vocabulary (AC-TST-7)", () => {
    let prompt: string;

    beforeAll(() => {
      prompt = buildExtractionPrompt("test query");
    });

    it("bans 'nothing matching' in acknowledgment rules", () => {
      expect(prompt).toContain("nothing matching");
    });

    it("bans \"I can't think of\" in acknowledgment rules", () => {
      expect(prompt).toContain("I can't think of");
    });

    it("bans \"I'm not sure\" in acknowledgment rules", () => {
      expect(prompt).toContain("I'm not sure");
    });

    it("bans 'I don\\'t have' in acknowledgment rules", () => {
      expect(prompt).toContain("I don't have");
    });
  });

  // AC-TST-8: merch equipment examples
  describe("merch equipment examples (AC-TST-8)", () => {
    let prompt: string;

    beforeAll(() => {
      prompt = buildExtractionPrompt("do you have a pour over coffee maker?");
    });

    it("productType merch description includes pour-over drippers", () => {
      expect(prompt.toLowerCase()).toContain("pour-over");
    });

    it("productType merch description includes brewing gear", () => {
      expect(prompt.toLowerCase()).toContain("brewing gear");
    });

    it("productType merch description includes Aeropress", () => {
      expect(prompt.toLowerCase()).toContain("aeropress");
    });

    it("productType merch description includes grinders", () => {
      expect(prompt.toLowerCase()).toContain("grinder");
    });
  });

  // Page context injection
  describe("page context injection", () => {
    it("includes page context note when provided", () => {
      const prompt = buildExtractionPrompt("how is this?", "Origami Air Dripper");
      expect(prompt).toContain("Origami Air Dripper");
    });

    it("omits page context note when not provided", () => {
      const prompt = buildExtractionPrompt("how is this?");
      expect(prompt).not.toContain("Page context:");
    });
  });
});

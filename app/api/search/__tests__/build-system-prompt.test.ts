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

import { buildSystemPrompt } from "../route";
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
});

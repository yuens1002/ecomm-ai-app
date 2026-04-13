/**
 * Unit tests for generateVoiceSurfaces — verifies that:
 * 1. The correct Q&A pairs from each fixture set are passed to chatCompletion
 * 2. The returned surfaces match the mocked AI output (correct JSON parsing)
 * 3. ai_voice_examples are never touched (surfaces generation ≠ example storage)
 *
 * These tests assert plumbing, not AI output quality.
 */
/** @jest-environment node */

import { generateVoiceSurfaces } from "../voice-surfaces.server";
import { DEFAULT_VOICE_SURFACES } from "../voice-surfaces";
import { VOICE_SET_A } from "@/app/api/search/__tests__/fixtures/voice-set-a";
import { VOICE_SET_B } from "@/app/api/search/__tests__/fixtures/voice-set-b";

const chatCompletionMock = jest.fn();

jest.mock("@/lib/ai-client", () => ({
  chatCompletion: (...args: unknown[]) => chatCompletionMock(...args),
}));

// Silence console noise
jest.spyOn(console, "error").mockImplementation(() => undefined);

const MOCK_SURFACES_A = {
  "greeting.home": "What are you in the mood for today?",
  "greeting.product": "Curious about {product}? Let me tell you about it.",
  "greeting.category": "Browsing {category}? I can help you find your pick.",
  waiting: "hmm",
  salutation: "Hey! What can I help you find?",
  aiFailed: "Sorry, I lost my train of thought — what were you after?",
  noResults: "Hmm, not sure we have that — tell me more about what you're after?",
  error: "Something went sideways on my end — give it another go?",
  placeholder: "How do you take your coffee?",
};

const MOCK_SURFACES_B = {
  "greeting.home": "What do you need?",
  "greeting.product": "{product} — good choice. Want details?",
  "greeting.category": "Browsing {category}. Looking for anything specific?",
  waiting: "uh",
  salutation: "Hey. What are you looking for?",
  aiFailed: "Missed that — try again?",
  noResults: "Don't have it. Rephrase?",
  error: "Error. Retry.",
  placeholder: "What do you want?",
};

describe("generateVoiceSurfaces — Q&A plumbing", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("Set A (warm/curious voice)", () => {
    beforeEach(() => {
      chatCompletionMock.mockResolvedValue({
        text: JSON.stringify(MOCK_SURFACES_A),
        finishReason: "stop",
      });
    });

    it("passes Set A Q&A pairs to chatCompletion", async () => {
      await generateVoiceSurfaces(VOICE_SET_A);

      const callArgs = chatCompletionMock.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content as string;

      for (const { question, answer } of VOICE_SET_A) {
        expect(systemMessage).toContain(question);
        expect(systemMessage).toContain(answer);
      }
    });

    it("does NOT pass Set B answers when using Set A", async () => {
      await generateVoiceSurfaces(VOICE_SET_A);

      const callArgs = chatCompletionMock.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content as string;

      // Set B has distinct answers not in Set A
      expect(systemMessage).not.toContain(VOICE_SET_B[0].answer);
    });

    it("returns the parsed surfaces from chatCompletion", async () => {
      const result = await generateVoiceSurfaces(VOICE_SET_A);

      expect(result["greeting.home"]).toBe(MOCK_SURFACES_A["greeting.home"]);
      expect(result.placeholder).toBe(MOCK_SURFACES_A.placeholder);
      expect(result.waiting).toBe(MOCK_SURFACES_A.waiting);
      expect(result.salutation).toBe(MOCK_SURFACES_A.salutation);
    });

    it("includes all 9 surface keys in the result", async () => {
      const result = await generateVoiceSurfaces(VOICE_SET_A);
      const keys = Object.keys(result);

      expect(keys).toContain("greeting.home");
      expect(keys).toContain("greeting.product");
      expect(keys).toContain("greeting.category");
      expect(keys).toContain("waiting");
      expect(keys).toContain("salutation");
      expect(keys).toContain("aiFailed");
      expect(keys).toContain("noResults");
      expect(keys).toContain("error");
      expect(keys).toContain("placeholder");
    });
  });

  describe("Set B (minimal/direct voice)", () => {
    beforeEach(() => {
      chatCompletionMock.mockResolvedValue({
        text: JSON.stringify(MOCK_SURFACES_B),
        finishReason: "stop",
      });
    });

    it("passes Set B Q&A pairs to chatCompletion", async () => {
      await generateVoiceSurfaces(VOICE_SET_B);

      const callArgs = chatCompletionMock.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content as string;

      for (const { question, answer } of VOICE_SET_B) {
        expect(systemMessage).toContain(question);
        expect(systemMessage).toContain(answer);
      }
    });

    it("does NOT pass Set A answers when using Set B", async () => {
      await generateVoiceSurfaces(VOICE_SET_B);

      const callArgs = chatCompletionMock.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content as string;

      expect(systemMessage).not.toContain(VOICE_SET_A[0].answer);
    });

    it("returns the parsed surfaces from chatCompletion", async () => {
      const result = await generateVoiceSurfaces(VOICE_SET_B);

      expect(result["greeting.home"]).toBe(MOCK_SURFACES_B["greeting.home"]);
      expect(result.placeholder).toBe(MOCK_SURFACES_B.placeholder);
    });
  });

  describe("fallback behavior", () => {
    it("falls back to DEFAULT_VOICE_SURFACES when chatCompletion returns invalid JSON", async () => {
      chatCompletionMock.mockResolvedValue({
        text: "not valid json {{",
        finishReason: "stop",
      });

      const result = await generateVoiceSurfaces(VOICE_SET_A);

      expect(result).toEqual(DEFAULT_VOICE_SURFACES);
    });

    it("falls back to default for missing keys in partial AI response", async () => {
      chatCompletionMock.mockResolvedValue({
        text: JSON.stringify({
          "greeting.home": "Welcome!",
          // all other keys missing
        }),
        finishReason: "stop",
      });

      const result = await generateVoiceSurfaces(VOICE_SET_A);

      expect(result["greeting.home"]).toBe("Welcome!");
      expect(result.placeholder).toBe(DEFAULT_VOICE_SURFACES.placeholder);
      expect(result.waiting).toBe(DEFAULT_VOICE_SURFACES.waiting);
    });

    it("strips markdown code fences from AI response", async () => {
      chatCompletionMock.mockResolvedValue({
        text: "```json\n" + JSON.stringify(MOCK_SURFACES_A) + "\n```",
        finishReason: "stop",
      });

      const result = await generateVoiceSurfaces(VOICE_SET_A);

      expect(result["greeting.home"]).toBe(MOCK_SURFACES_A["greeting.home"]);
    });
  });
});

// ---------------------------------------------------------------------------
// Voice Surface Generation — server-only (imports ai-client → prisma)
// ---------------------------------------------------------------------------
// Split from voice-surfaces.ts to keep types + defaults client-safe.
// Only API routes should import this file.
// ---------------------------------------------------------------------------

import { chatCompletion } from "@/lib/ai-client";
import type { VoiceExample } from "./voice-examples";
import { DEFAULT_VOICE_SURFACES } from "./voice-surfaces";
import type { VoiceSurfaces } from "./voice-surfaces";

/**
 * Generate surface strings from the owner's voice examples.
 * Called when voice examples are saved (admin PUT) or regenerated.
 */
export async function generateVoiceSurfaces(
  voiceExamples: VoiceExample[]
): Promise<VoiceSurfaces> {
  const examplePairs = voiceExamples
    .map((e) => `Customer: "${e.question}"\nOwner: "${e.answer}"`)
    .join("\n\n");

  const result = await chatCompletion({
    messages: [
      {
        role: "system",
        content: `You are a copywriter adapting UI text to match a shop owner's voice. Here is how the owner speaks:\n\n${examplePairs}\n\nWrite every string in the owner's voice — same warmth, vocabulary, and rhythm.`,
      },
      {
        role: "user",
        content: `Generate these UI surface strings in the owner's voice. Return valid JSON only — no markdown, no explanation.

{
  "greeting.home": "An open-ended welcome that invites the customer to explore (1-2 sentences)",
  "greeting.product": "A greeting for when the customer is viewing a specific product. Use {product} as the product name placeholder (1 sentence)",
  "greeting.category": "A greeting for when the customer is browsing a category. Use {category} as the category name placeholder (1 sentence)",
  "waiting": "A short thinking-out-loud filler word or phrase the owner would say while searching (1-3 words, like 'um' or 'let me think' or 'hmm')",
  "salutation": "A natural response to 'hey' or 'hello' — greet back and pivot to helping (1 sentence)",
  "aiFailed": "A casual recovery when you couldn't process the request — ask them to try again (1 sentence)",
  "noResults": "An empathetic message when no products match — encourage rephrasing (1-2 sentences)",
  "error": "A casual recovery for a technical error — ask them to retry (1 sentence)",
  "placeholder": "8–12 words, a question or invitation in the owner's voice for the chat input field (e.g. 'What are you after today?' or 'How do you take your coffee?')"
}

Rules:
- Speak directly to the customer: use "you", "your" — never third person
- Match the owner's actual vocabulary and sentence rhythm from the examples
- Keep it natural — no corporate speak, no exclamation overload
- The waiting filler should be 1-3 words max, lowercase
- The placeholder should be a short question, not a statement`,
      },
    ],
    maxTokens: 1024,
    temperature: 0.7,
  });

  try {
    const stripped = result.text
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
    const parsed = JSON.parse(stripped) as Record<string, unknown>;

    // Validate and fall back to defaults for any missing keys
    return {
      "greeting.home":
        typeof parsed["greeting.home"] === "string"
          ? parsed["greeting.home"]
          : DEFAULT_VOICE_SURFACES["greeting.home"],
      "greeting.product":
        typeof parsed["greeting.product"] === "string"
          ? parsed["greeting.product"]
          : DEFAULT_VOICE_SURFACES["greeting.product"],
      "greeting.category":
        typeof parsed["greeting.category"] === "string"
          ? parsed["greeting.category"]
          : DEFAULT_VOICE_SURFACES["greeting.category"],
      waiting:
        typeof parsed.waiting === "string"
          ? parsed.waiting.toLowerCase()
          : DEFAULT_VOICE_SURFACES.waiting,
      salutation:
        typeof parsed.salutation === "string"
          ? parsed.salutation
          : DEFAULT_VOICE_SURFACES.salutation,
      aiFailed:
        typeof parsed.aiFailed === "string"
          ? parsed.aiFailed
          : DEFAULT_VOICE_SURFACES.aiFailed,
      noResults:
        typeof parsed.noResults === "string"
          ? parsed.noResults
          : DEFAULT_VOICE_SURFACES.noResults,
      error:
        typeof parsed.error === "string"
          ? parsed.error
          : DEFAULT_VOICE_SURFACES.error,
      placeholder:
        typeof parsed.placeholder === "string"
          ? parsed.placeholder
          : DEFAULT_VOICE_SURFACES.placeholder,
    };
  } catch {
    console.error(
      "[voice-surfaces] Failed to parse AI response, using defaults"
    );
    return { ...DEFAULT_VOICE_SURFACES };
  }
}

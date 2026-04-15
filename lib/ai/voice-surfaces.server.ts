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
        content: `You are writing UI copy for a shop owner's chat assistant. The copy must sound exactly like this owner — use their vocabulary, sentence rhythm, and personality as shown in these Q&As:\n\n${examplePairs}\n\nDo NOT write polished or corporate copy. Write as if the owner is speaking directly to the customer.`,
      },
      {
        role: "user",
        content: `Generate these UI surface strings in the owner's voice. Return valid JSON only — no markdown, no explanation.

{
  "greeting.home": "How you'd greet someone who just walked in and open a conversation about what they're looking for — invite them to explore, not place an order. Curious and discovery-oriented, not transactional (1-2 sentences)",
  "greeting.product": "Your reaction when a customer is looking at {product} — natural, like you know the product (1 sentence)",
  "greeting.category": "A quick word when someone's browsing {category} — steer them a bit, in your voice (1 sentence)",
  "waiting": "A filler word or phrase you'd say while thinking — 1-3 words, lowercase (e.g. 'um', 'let me think', 'hmm')",
  "salutation": "Your response to 'hey' or 'hello' — greet back and ask how you can help, in your words (1 sentence)",
  "aiFailed": "What you'd say if you blanked for a second — casual, ask them to repeat (1 sentence)",
  "noResults": "What you'd say when nothing matched — ask them to rephrase or tell you more (1-2 sentences)",
  "error": "A quick recovery after a technical hiccup — casual, ask them to try again (1 sentence)"
}

Rules:
- Speak directly to the customer: use "you", "your" — never third person
- Use the owner's actual vocabulary, rhythm, and personality from the Q&As above — not generic assistant language
- The waiting filler should be 1-3 words max, lowercase`,
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
    };
  } catch {
    console.error(
      "[voice-surfaces] Failed to parse AI response, using defaults"
    );
    return { ...DEFAULT_VOICE_SURFACES };
  }
}

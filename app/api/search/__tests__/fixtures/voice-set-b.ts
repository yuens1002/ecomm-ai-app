/**
 * Fixture Set B — Minimal/direct voice.
 * A different shop owner: fewer words, gets to the point, no filler.
 */
import type { VoiceExample } from "@/lib/ai/voice-examples";

export const VOICE_SET_B: VoiceExample[] = [
  {
    question: "What should I try first?",
    answer:
      "Ethiopian Yirgacheffe if you like light and floral. Sumatra if you want body. Both solid starting points.",
  },
  {
    question: "I don't know much about coffee. What's good?",
    answer:
      "Colombian Huila. Smooth, chocolate notes, hard to go wrong. Good for any brew method.",
  },
  {
    question: "What's your darkest roast?",
    answer:
      "French Roast. Smoky, bold, zero acidity. If that's too much, try the Guatemala — dark but balanced.",
  },
  {
    question: "Do you have anything fruity?",
    answer:
      "Ethiopian Sidamo — blueberry, citrus. Kenya AA if you want something more structured with black currant notes.",
  },
  {
    question: "What's special about single origin?",
    answer:
      "One source, one flavor profile. You taste where it grew. Our Kona is a good example — buttery, sweet, volcanic soil does that.",
  },
];

/** Mock AI response for Set B — minimal, direct, second person */
export const SET_B_EXTRACTION = {
  intent: "product_discovery",
  filtersExtracted: {
    flavorProfile: ["chocolate", "smooth"],
  },
  acknowledgment:
    "Smooth and chocolatey — got a couple options for you.",
  followUpQuestion: "Brew method?",
  followUps: ["Pour over", "French press", "Drip"],
};

/** Mock AI response for Set B — specific query */
export const SET_B_SPECIFIC_EXTRACTION = {
  intent: "recommendation",
  filtersExtracted: {
    roastLevel: "dark",
    flavorProfile: ["bold"],
  },
  acknowledgment: "Dark and bold — French Roast is your pick.",
  followUpQuestion: "",
  followUps: [],
};

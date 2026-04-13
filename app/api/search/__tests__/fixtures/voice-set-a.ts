/**
 * Fixture Set A — Default warm/curious voice (DEFAULT_VOICE_EXAMPLES).
 * The shipped default personality: asks back before recommending.
 */
import { DEFAULT_VOICE_EXAMPLES } from "@/lib/ai/voice-examples";

export const VOICE_SET_A = DEFAULT_VOICE_EXAMPLES;

/** Mock AI response for Set A — warm, exploratory, second person */
export const SET_A_EXTRACTION = {
  intent: "product_discovery",
  filtersExtracted: {
    flavorProfile: ["chocolate", "smooth"],
  },
  acknowledgment:
    "Ooh, you're after something smooth and chocolatey — I've got a few that'll be right up your alley.",
  followUpQuestion: "How do you usually brew your coffee at home?",
  followUps: ["Pour over", "French press", "Drip machine"],
};

/** Mock AI response for Set A — specific query, no follow-up needed */
export const SET_A_SPECIFIC_EXTRACTION = {
  intent: "recommendation",
  filtersExtracted: {
    roastLevel: "dark",
    flavorProfile: ["bold"],
  },
  acknowledgment:
    "You want something dark and bold — our French Roast is exactly that kind of heavy-hitter.",
  followUpQuestion: "",
  followUps: [],
};

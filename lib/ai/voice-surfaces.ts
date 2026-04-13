// ---------------------------------------------------------------------------
// Voice Surface Strings — types and defaults (client-safe)
// ---------------------------------------------------------------------------
// NOTE: generateVoiceSurfaces() lives in voice-surfaces.server.ts to avoid
// pulling server-only deps (prisma/pg) into client bundles.
// ---------------------------------------------------------------------------

/**
 * All surface string keys the system uses.
 * These are generated from the owner's voice examples and cached in the DB.
 */
export interface VoiceSurfaces {
  /** Open-ended greeting for homepage */
  "greeting.home": string;
  /** Product-specific greeting (may contain {product} placeholder) */
  "greeting.product": string;
  /** Category-specific greeting (may contain {category} placeholder) */
  "greeting.category": string;
  /** Thinking/loading filler word */
  waiting: string;
  /** Response to a casual greeting (hey, hello) */
  salutation: string;
  /** Shown when AI extraction fails */
  aiFailed: string;
  /** Shown when no products match */
  noResults: string;
  /** Shown on network/server error */
  error: string;
  /** Input field placeholder — question or invitation in the owner's voice */
  placeholder: string;
}

export type VoiceSurfaceKey = keyof VoiceSurfaces;

/** Hardcoded fallback when no generated surfaces exist */
export const DEFAULT_VOICE_SURFACES: VoiceSurfaces = {
  "greeting.home": "What are you in the mood for today?",
  "greeting.product": "Curious about {product}? I can tell you all about it.",
  "greeting.category": "Browsing our {category}? I can help you narrow it down.",
  waiting: "um",
  salutation: "Hey! What can I help you find today?",
  aiFailed:
    "Ah sorry, I spaced out for a sec — what were you looking for again?",
  noResults:
    "Hmm, I'm not sure we have exactly what you're after — could you tell me more about how you like your coffee?",
  error: "Something hiccuped on my end — give it another try?",
  placeholder: "What are you after today?",
};

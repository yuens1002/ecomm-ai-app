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
}

export type VoiceSurfaceKey = keyof VoiceSurfaces;

/** Hardcoded fallback when no generated surfaces exist */
// Neutral fallbacks — only used when AI is not configured and no surfaces have been generated.
// In normal operation the lazy-init hydration replaces these with AI-generated owner voice copy.
export const DEFAULT_VOICE_SURFACES: VoiceSurfaces = {
  "greeting.home": "What are you looking for today?",
  "greeting.product": "Want to know more about {product}?",
  "greeting.category": "What are you looking for in {category}?",
  waiting: "hmm",
  salutation: "How can I help?",
  aiFailed: "Sorry, can you try that again?",
  noResults: "Nothing matched — can you tell me more about what you're after?",
  error: "Something went wrong — give it another try?",
};

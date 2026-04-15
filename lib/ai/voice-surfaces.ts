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
export const DEFAULT_VOICE_SURFACES: VoiceSurfaces = {
  "greeting.home":
    "Hey! What are you in the mood for today — light and fruity, or something darker and cozy?",
  "greeting.product": "Good eye on {product} — want to know what I think?",
  "greeting.category":
    "Browsing {category}? Tell me what you're after and I'll point you somewhere good.",
  waiting: "um",
  salutation: "What are you after?",
  aiFailed: "Ah sorry, I blanked for a sec — what were you looking for again?",
  noResults:
    "Hmm, nothing's jumping out for that — can you tell me a bit more about what you're after?",
  error: "Something hiccuped on my end — give it another try?",
};

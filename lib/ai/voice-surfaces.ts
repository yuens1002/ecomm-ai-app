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
  /** Passive "I'm here" message shown on re-open or post-reset — no prompting question */
  standby: string;
  /** Shown when AI extraction fails */
  aiFailed: string;
  /** Shown when no products match */
  noResults: string;
  /** Shown on network/server error */
  error: string;
}

export type VoiceSurfaceKey = keyof VoiceSurfaces;

/** Hardcoded fallback when no generated surfaces exist — must be neutral, never store-specific */
export const DEFAULT_VOICE_SURFACES: VoiceSurfaces = {
  "greeting.home": "Hey — what's on your mind?",
  "greeting.product": "Curious about {product}?",
  "greeting.category": "Browsing {category}?",
  waiting: "hmm",
  salutation: "What can I help with?",
  standby: "I'm here — anything come to mind?",
  aiFailed: "Sorry, I lost my train of thought — what were you after?",
  noResults: "Nothing's jumping out — can you tell me more?",
  error: "Something went sideways on my end — try again?",
};

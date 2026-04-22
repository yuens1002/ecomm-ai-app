import { z } from "zod";

// ---------------------------------------------------------------------------
// Intent schema — single source of truth for valid intents
// ---------------------------------------------------------------------------

export const AgenticIntentSchema = z.preprocess((value) => {
  if (value === "recommendation") return "recommend";
  if (value === "product_discovery") return "discover";
  return value;
}, z.enum(["discover", "recommend", "how_to", "reorder", "compare"]));
export type AgenticIntent = z.infer<typeof AgenticIntentSchema>;

// ---------------------------------------------------------------------------
// Filters extraction schema — Zod as single source of truth
// ---------------------------------------------------------------------------

export const RoastLevelSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "light": case "light roast": return "light";
    case "medium": case "medium roast": case "med": return "medium";
    case "dark": case "dark roast": return "dark";
    default: return normalized;
  }
}, z.enum(["light", "medium", "dark"]));
export type RoastLevel = z.infer<typeof RoastLevelSchema>;

export const FiltersExtractedSchema = z.object({
  productType: z.enum(["coffee", "merch"]).optional(),
  brewMethod: z.string().optional(),
  roastLevel: RoastLevelSchema.optional(),
  flavorProfile: z.array(z.string()).optional(),
  /** Single country ("Ethiopia") or array for regional queries (["Guatemala", "Costa Rica"]).
   *  Single-element arrays are invalid — AI should return a string for single countries. */
  origin: z.union([z.string(), z.array(z.string()).min(2)]).optional(),
  isOrganic: z.boolean().optional(),
  processing: z.string().optional(),
  variety: z.string().optional(),
  priceMaxCents: z.number().positive().optional(),
  priceMinCents: z.number().positive().optional(),
  sortBy: z.enum(["newest", "top_rated", "price_asc", "price_desc"]).optional(),
  /** Keywords for product name/description search — required for merch queries */
  productKeywords: z.array(z.string()).optional(),
});
export type FiltersExtracted = z.infer<typeof FiltersExtractedSchema>;

// ---------------------------------------------------------------------------
// Full AI extraction output — wraps intent + filters + response text
// ---------------------------------------------------------------------------

export const AgenticExtractionSchema = z.object({
  intent: AgenticIntentSchema,
  filtersExtracted: FiltersExtractedSchema.default({}),
  acknowledgment: z.string().default(""),
  followUpQuestion: z.string().default(""),
  followUps: z.array(z.string()).default([]),
  recommendedProductName: z.string().optional(),
});
export type AgenticExtraction = z.infer<typeof AgenticExtractionSchema>;

// ---------------------------------------------------------------------------
// API types (not Zod — plain interfaces for route handler)
// ---------------------------------------------------------------------------

export interface SearchParams {
  query: string;
  roast?: string | null;
  origin?: string | null;
  forceAI: boolean;
  sessionId: string;
  turnCount: number;
  pageTitle?: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface SearchResponse {
  products: unknown[];
  query: string;
  count: number;
  intent: AgenticIntent | null;
  filtersExtracted: FiltersExtracted | null;
  acknowledgment: string | null;
  followUpQuestion: string | null;
  followUps: string[];
  recommendedProductName: string | null;
  aiFailed: boolean;
  context: { sessionId: string; turnCount: number };
  isSalutation?: boolean;
}

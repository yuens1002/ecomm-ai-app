export type AgenticIntent = "product_discovery" | "recommendation" | "how_to" | "reorder";

export interface FiltersExtracted {
  brewMethod?: string;
  roastLevel?: string;
  flavorProfile?: string[];
  /** Single country ("Ethiopia") or array for regional queries (["Guatemala", "Costa Rica"]).
   *  Runtime normalization in route handler (lines ~167-170) converts single strings to {has: ...}
   *  and arrays to {hasSome: ...}. iter-7 Zod schema will enforce min-2 arrays. */
  origin?: string | string[];
  isOrganic?: boolean;
  processing?: string;
  variety?: string;
  priceMaxCents?: number;
  priceMinCents?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "top_rated";
  /** "coffee" uses all flavor/roast filters; "merch" uses name/description only;
   *  "any" means unspecified — treated as coffee in query construction (see route handler whereClause).
   *  iter-7 will replace this with a Zod schema enforcing the union shape. */
  productType?: "coffee" | "merch" | "any";
}

export interface AgenticExtraction {
  intent: AgenticIntent;
  filtersExtracted: FiltersExtracted;
  acknowledgment: string;
  followUpQuestion: string;
  followUps: string[];
  /** When the AI names a specific product, include the exact name for result reconciliation */
  recommendedProductName?: string;
}

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
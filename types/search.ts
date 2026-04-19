export type AgenticIntent = "product_discovery" | "recommendation" | "how_to" | "reorder";

export interface FiltersExtracted {
  brewMethod?: string;
  roastLevel?: string;
  flavorProfile?: string[];
  /** Single country ("Ethiopia") or array for regional queries (["Guatemala", "Costa Rica"]) */
  origin?: string | string[];
  isOrganic?: boolean;
  processing?: string;
  variety?: string;
  priceMaxCents?: number;
  priceMinCents?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "top_rated";
  /** "coffee" uses all flavor/roast filters; "merch" uses name/description only; "any" is unspecified */
  productType?: "coffee" | "merch" | "any";
}

export interface AgenticExtraction {
  intent: AgenticIntent;
  filtersExtracted: FiltersExtracted;
  /** @deprecated Use acknowledgment instead — kept for backwards compat in response */
  explanation: string;
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
  explanation: string | null;
  acknowledgment: string | null;
  followUpQuestion: string | null;
  followUps: string[];
  recommendedProductName: string | null;
  aiFailed: boolean;
  context: { sessionId: string; turnCount: number };
  isSalutation?: boolean;
}
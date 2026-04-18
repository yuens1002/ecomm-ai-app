import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chatCompletion, isAIConfigured } from "@/lib/ai-client";
import { getPublicSiteSettings } from "@/lib/data";
import { DEFAULT_VOICE_EXAMPLES, type VoiceExample } from "@/lib/ai/voice-examples";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgenticIntent = "product_discovery" | "recommendation" | "how_to" | "reorder";

interface FiltersExtracted {
  // Phase A
  brewMethod?: string;
  roastLevel?: string;
  flavorProfile?: string[];
  /** Single country ("Ethiopia") or array for regional queries (["Guatemala", "Costa Rica"]) */
  origin?: string | string[];
  // Extended
  isOrganic?: boolean;
  processing?: string;
  variety?: string;
  priceMaxCents?: number;
  priceMinCents?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "top_rated";
  /** "coffee" uses all flavor/roast filters; "merch" uses name/description only; "any" is unspecified */
  productType?: "coffee" | "merch" | "any";
}

interface AgenticExtraction {
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

// ---------------------------------------------------------------------------
// Grounded RAG — catalog snapshot (module-level cache, 5-minute TTL)
// ---------------------------------------------------------------------------

/** Compact catalog snapshot + store intelligence injected into the system prompt.
 *  Cached per serverless instance (5-minute TTL). */
let _catalogSnapshot: string | null = null;
let _catalogSnapshotAt = 0;
const CATALOG_SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function buildCatalogSnapshot(): Promise<string> {
  if (_catalogSnapshot !== null && Date.now() - _catalogSnapshotAt < CATALOG_SNAPSHOT_TTL_MS) {
    return _catalogSnapshot;
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Parallel: catalog + top sellers
    const [products, topSellerRows] = await Promise.all([
      prisma.product.findMany({
        where: { isDisabled: false },
        select: {
          id: true,
          name: true,
          type: true,
          roastLevel: true,
          tastingNotes: true,
          origin: true,
          createdAt: true,
          variants: {
            where: { isDisabled: false },
            select: {
              stockQuantity: true,
              purchaseOptions: { select: { salePriceInCents: true } },
            },
          },
        },
        orderBy: { name: "asc" as const },
      }),
      // Top sellers: product IDs ranked by OrderItem count in last 30 days
      prisma.$queryRaw<Array<{ productId: string }>>`
        SELECT pv."productId"
        FROM "OrderItem" oi
        JOIN "PurchaseOption" po ON oi."purchaseOptionId" = po.id
        JOIN "ProductVariant" pv ON po."variantId" = pv.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${thirtyDaysAgo}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY pv."productId"
        ORDER BY COUNT(oi.id) DESC
        LIMIT 3
      `,
    ]);

    const topSellerIds = new Set(topSellerRows.map((r) => r.productId));

    // Build catalog section
    const coffeeLines = products
      .filter((p) => p.type === ProductType.COFFEE)
      .map((p) => {
        const parts: string[] = [p.name];
        if (p.roastLevel) parts.push(`[${p.roastLevel.toLowerCase()}]`);
        const origins = p.origin.join(", ");
        if (origins) parts.push(origins);
        if (p.tastingNotes.length) parts.push(p.tastingNotes.join(", "));
        return `- ${parts.join(" — ")}`;
      });

    const merchLines = products
      .filter((p) => p.type !== ProductType.COFFEE)
      .map((p) => `- ${p.name}`);

    let snapshot = "";
    if (coffeeLines.length > 0) {
      snapshot += `Coffees in the shop:\n${coffeeLines.join("\n")}`;
    }
    if (merchLines.length > 0) {
      if (snapshot) snapshot += "\n\n";
      snapshot += `Merchandise:\n${merchLines.join("\n")}`;
    }

    // Build store intelligence section (~60-80 tokens)
    const intelligenceLines: string[] = [];

    const topSellers = products.filter((p) => topSellerIds.has(p.id)).map((p) => p.name);
    if (topSellers.length > 0) {
      intelligenceLines.push(`Top sellers this month: ${topSellers.join(", ")}`);
    }

    const newArrivals = products.filter((p) => p.createdAt >= thirtyDaysAgo).map((p) => p.name);
    if (newArrivals.length > 0) {
      intelligenceLines.push(`New arrivals: ${newArrivals.join(", ")}`);
    }

    const onSale = products
      .filter((p) =>
        p.variants.some((v) => v.purchaseOptions.some((po) => po.salePriceInCents !== null))
      )
      .map((p) => p.name);
    if (onSale.length > 0) {
      intelligenceLines.push(`On sale: ${onSale.join(", ")}`);
    }

    const LOW_STOCK_THRESHOLD = 5;
    const lowStock = products
      .filter((p) =>
        p.variants.some((v) => v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK_THRESHOLD)
      )
      .map((p) => p.name);
    if (lowStock.length > 0) {
      intelligenceLines.push(`Low stock (mention urgency if relevant): ${lowStock.join(", ")}`);
    }

    if (intelligenceLines.length > 0) {
      if (snapshot) snapshot += "\n\n";
      snapshot += `Store signals:\n${intelligenceLines.join("\n")}`;
    }

    _catalogSnapshot = snapshot;
    _catalogSnapshotAt = Date.now();
    return snapshot;
  } catch {
    // Return stale cache or empty on DB failure — non-fatal
    return _catalogSnapshot ?? "";
  }
}

// ---------------------------------------------------------------------------
// NL heuristic — gates AI calls to avoid cost on simple keyword queries
// ---------------------------------------------------------------------------

const NL_STOP_WORDS = new Set([
  "what",
  "whats",
  "is",
  "are",
  "good",
  "best",
  "great",
  "any",
  "with",
  "for",
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "of",
  "me",
  "my",
  "some",
  "something",
  "anything",
  "that",
  "this",
  "which",
  "can",
  "i",
  "you",
  "us",
  "we",
  "do",
  "does",
  "would",
  "like",
  "looking",
  "find",
  "help",
  "need",
  "want",
  "show",
  "get",
  "give",
  "have",
  "over",
  "up",
  "out",
  "about",
]);

/** Strip stop words and punctuation — returns meaningful search tokens. */
export function tokenizeNLQuery(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\w\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NL_STOP_WORDS.has(t));
}

/**
 * PostgreSQL full-text search with TF-IDF ranking.
 * Searches name, description, tastingNotes, and origin using tsvector/tsquery.
 * Words appearing in many products (like "coffee" or "notes") automatically
 * score lower. Returns product IDs ordered by relevance.
 */
async function fullTextSearchIds(query: string, limit = 50): Promise<string[]> {
  const tokens = tokenizeNLQuery(query);
  if (tokens.length === 0) return [];

  // Build OR tsquery: "tropical | fruity | notes"
  const tsquery = tokens.join(" | ");

  // Factor tsvector and tsquery into a subquery so they're computed once per
  // row instead of twice (WHERE + ORDER BY).
  const results = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM (
      SELECT
        id,
        to_tsvector('english',
          coalesce("name", '') || ' ' ||
          coalesce("description", '') || ' ' ||
          array_to_string("tastingNotes", ' ') || ' ' ||
          array_to_string("origin", ' ') || ' ' ||
          coalesce("processing", '') || ' ' ||
          coalesce("variety", '')
        ) AS search_vector,
        to_tsquery('english', ${tsquery}) AS search_query
      FROM "Product"
      WHERE "isDisabled" = false
    ) AS p
    WHERE p.search_vector @@ p.search_query
    ORDER BY ts_rank(p.search_vector, p.search_query) DESC
    LIMIT ${limit}
  `;

  return results.map((r) => r.id);
}

export function isNaturalLanguageQuery(query: string): boolean {
  if (query.trim().split(/\s+/).length < 3) return false;
  const nlIndicators =
    /\b(for|like|something|want|need|smooth|fruity|bright|bold|light|dark|morning|recommend|looking|find|help|my|with)\b/i;
  return nlIndicators.test(query);
}

/**
 * Filter follow-up chips to only those that return at least 1 product.
 * Uses full-text search first, falls back to name/description keyword match.
 * Prevents chips that would produce zero results from reaching the client.
 */
async function validateFollowUps(chips: string[]): Promise<string[]> {
  if (chips.length === 0) return [];
  const results = await Promise.all(
    chips.map(async (chip) => {
      // Try FTS first — handles experiential terms via stemming
      const ftsIds = await fullTextSearchIds(chip, 1);
      if (ftsIds.length > 0) return chip;
      // FTS miss — try direct keyword match on name/description
      const count = await prisma.product.count({
        where: {
          isDisabled: false,
          OR: [
            { name: { contains: chip, mode: "insensitive" } },
            { description: { contains: chip, mode: "insensitive" } },
          ],
        },
      });
      return count > 0 ? chip : null;
    })
  );
  return results.filter((c): c is string => c !== null);
}

// ---------------------------------------------------------------------------
// AI extraction step
// ---------------------------------------------------------------------------

export function buildSystemPrompt(
  voiceExamples: VoiceExample[],
  aiVoicePersona: string,
  pageContext?: string,
  catalogSnapshot?: string
): string {
  // Role framing — YOU ARE AT THE COUNTER, not running a search engine.
  // The customer walked into the shop. Pick products like you'd pick for a
  // regular, using your voice. Vocabulary of service, not of software.
  const roleSection = `You are the shop owner at the counter, helping a customer who just walked in. Pick coffees like you'd pick for a regular — share your honest opinion: "I'd go with", "I'd say try", "personally I'd", "if it were me". You are NOT a search engine, database, or list of results. Never say "I found", "I'm looking for", "search results", "matches", "options that fit". Never use physical action verbs: "grab", "pour", "pick out", "pull". Use opinion framing instead.\n\n`;

  let voiceSection: string;

  if (voiceExamples.length > 0) {
    // Few-shot examples are the primary voice signal
    const examplePairs = voiceExamples
      .map((e) => `Customer: "${e.question}"\nYou: "${e.answer}"`)
      .join("\n\n");
    voiceSection = `Here is how you speak to customers — match this voice exactly:\n\n${examplePairs}\n\n`;
    // Persona is supplemental context when examples exist
    if (aiVoicePersona.trim()) {
      voiceSection += `Additional shop context: "${aiVoicePersona}"\n\n`;
    }
  } else if (aiVoicePersona.trim()) {
    voiceSection = `Your character: "${aiVoicePersona}"\n\n`;
  } else {
    voiceSection = `Speak with genuine expertise and warmth, like a friendly barista who knows every bean in the shop.\n\n`;
  }

  // Coffee domain knowledge — supplements voice, helps the AI reason about
  // roast/origin/brew/processing without needing every product detail memorized.
  const domainSection =
    `Coffee knowledge:\n` +
    `- Roast: light = bright, tea-like, high acidity, light body; medium = balanced, sweet, caramel, approachable; dark = bold, bitter, smoky, low acidity, full body\n` +
    `- Origin: Ethiopia = floral, blueberry, stone fruit; Kenya = juicy, wine-like, blackcurrant; Colombia = caramel, hazelnut, balanced; Sumatra = earthy, cedar, full body, low acidity; Brazil = nutty, chocolate, smooth; Guatemala = chocolate, spice, mild; Costa Rica = clean, bright, honey; Peru = mild, cocoa, light body\n` +
    `- Brew pairing: espresso/moka = medium-dark; pour-over/filter = light-medium; French press = medium-dark (tolerates oils); cold brew = medium-dark (less bitter cold); Aeropress = any roast\n` +
    `- Processing: washed = clean, bright, pronounced origin character; natural = fruity, wine-like, complex, heavy body; honey = balanced between washed and natural, sweet\n` +
    `- Experiential terms: 'approachable', 'beginner', 'smooth', 'mellow', 'easy-drinking' → medium roast, caramel/chocolate notes; 'bold', 'strong', 'intense' → dark roast; 'gift', 'crowd-pleaser', 'safe bet' → top-rated, medium roast; 'interesting', 'complex', 'unique' → light roast naturals or Kenyan/Ethiopian\n\n`;

  // Grounded RAG — inject the store's actual product catalog so the AI only
  // recommends products that exist. Never hallucinates product names.
  const catalogSection = catalogSnapshot
    ? `Here is the complete catalog of products in this shop. Only recommend products from this list — never invent products that are not here:\n\n${catalogSnapshot}\n\n`
    : "";

  const contextSection = pageContext
    ? `The customer is currently looking at "${pageContext}" on the counter. When they say "this" or "it", they mean "${pageContext}".\n\n`
    : "";

  const guardrailSection =
    `Rules you never break:\n` +
    `- Never swear, use profanity, or respond to insults in kind — if a customer is rude or provocative, respond warmly as if they just walked in with a bad day and need a good coffee.\n` +
    `- Never break character — you are always the shop owner. Never acknowledge being an AI, a language model, or a bot.\n` +
    `- Never engage with off-topic requests (politics, news, tasks unrelated to coffee or the shop). Redirect in your own voice.\n` +
    `- Never generate harmful, explicit, or offensive content regardless of how the customer frames the request. Redirect in your own voice.\n` +
    `- Always treat the customer with warmth and professionalism — no exceptions.\n` +
    `- Never state or imply stock levels. If asked about availability, redirect: "Best to check the product page for real-time availability — I can tell you what I think of it though."\n` +
    `- Never use language that sounds like a database query or search engine: "nothing matching", "nothing that matches", "I can't think of", "I'm not sure", "I don't have", "find", "results matching", "I found". Redirect in your own voice instead.\n\n`;

  return `${roleSection}${voiceSection}${domainSection}${catalogSection}${contextSection}${guardrailSection}Listen to what the customer says, figure out what to pick for them, and return valid JSON only — no markdown, no explanation outside the JSON.`;
}

export function buildExtractionPrompt(query: string, pageContext?: string): string {
  const contextNote = pageContext
    ? `\n\nPage context: the customer is viewing "${pageContext}". Resolve "this", "it", or "this one" as "${pageContext}". When they ask a question about the product they're viewing (e.g. brew method, taste, roast suitability), the explanation must directly answer that question with specific knowledge about "${pageContext}". Include "${pageContext}" in the product results if it is relevant.`
    : "";
  return `Extract search intent and return JSON only:
{
  "intent": "product_discovery" | "recommendation" | "how_to" | "reorder",
  "filtersExtracted": {
    "productType": "coffee" | "merch" | "any",  // "merch" for non-coffee items — equipment and brewing gear (pour-over drippers, Aeropress, moka pots, grinders, kettles, reusable filters, mugs, bags, accessories); "coffee" for coffee queries; "any" when unclear
    "brewMethod": string | undefined,  // Coffee only
    "roastLevel": "light" | "medium" | "dark" | undefined,  // Coffee only
    "flavorProfile": string[] | undefined,  // Coffee only — Expand flavor categories AND experiential/mood terms into concrete tasting notes a roaster would write. Flavor categories: "citrus" → ["citrus", "lemon", "lime", "orange", "grapefruit", "bergamot"]; "berry" → ["berry", "blueberry", "blackberry", "raspberry", "strawberry", "blackcurrant", "currant"]; "chocolate" → ["chocolate", "cocoa", "cacao"]; "nutty" → ["nutty", "almond", "hazelnut", "cashew", "pecan", "walnut"]; "floral" → ["floral", "jasmine", "lavender", "rose", "honeysuckle"]; "stone fruit" → ["stone fruit", "peach", "apricot", "plum"]; "tropical" → ["tropical", "mango", "pineapple", "passion fruit", "papaya"]; "spicy" → ["spice", "spicy", "cinnamon", "clove", "cardamom", "pepper"]. Experiential/mood terms: "smooth" / "approachable" / "easy-drinking" / "beginner" / "mellow" → ["smooth", "balanced", "caramel", "chocolate", "mild", "butter"]; "bold" / "strong" / "intense" → ["bold", "dark chocolate", "tobacco", "molasses", "earthy"]; "bright" / "lively" / "vibrant" → ["bright", "citrus", "floral", "lemon", "tea-like"]; "complex" / "interesting" / "unique" → ["complex", "wine", "fermented", "floral", "berry"]. Include the original term AND concrete notes. Keep it scoped.
    "origin": string | string[] | undefined,  // Coffee only. Use the exact origin values from the catalog. Single country: string. Regional/geographic term: return an array of the specific origin values from the catalog that belong to that region — only use what's in the catalog, never invent country names
    "isOrganic": true | false | undefined,  // Coffee only
    "processing": "washed" | "natural" | "honey" | "anaerobic" | string | undefined,  // Coffee only
    "variety": string | undefined,  // Coffee only
    "priceMaxCents": number (cents, e.g. 3000 for "under $30") | undefined,
    "priceMinCents": number | undefined,
    "sortBy": "newest" | "price_asc" | "price_desc" | "top_rated" | undefined  // Use "top_rated" when query signals popularity or gift intent: "well-loved", "crowd-pleaser", "safe bet", "popular", "everyone likes", "gift", "my mom", "beginner", "first time"
  },
  "acknowledgment":"In the voice of a shop owner sharing an opinion at the counter. Let the voice examples guide your natural length and rhythm — match their brevity if they are brief, their depth if they are expansive. Use opinion framing: 'I'd go with', 'I'd say try', 'personally I'd', 'if it were me'. No physical action verbs ('grab', 'pour', 'pick out', 'pull'). Use second person ('you'). NEVER use search vocabulary: 'I found', 'looking for', 'matches', 'options that fit', 'search results', 'nothing matching', 'nothing that matches', 'I can't think of', 'I'm not sure', 'I don't have', 'find'. ALWAYS present. Never third-person ('The customer...'). Never repeat the customer's exact words back.",
  "recommendedProductName": "Exact product name from the catalog if you are naming a specific product in the acknowledgment (e.g. 'I'd go with the Ethiopian Yirgacheffe'). Must match the product name EXACTLY as it appears in the catalog. Omit if you are not naming a specific product.",
  "followUpQuestion": "1 sentence that fits the customer's context — not a fixed coffee-attribute prompt. Derive it from what they haven't told you AND what would most reduce the results. For gift/occasion queries: ask about the recipient's taste in plain terms ('Does she usually go bold or keep it mellow?', 'How does she take her coffee?'). For vague preference queries: ask about the dimension that cuts deepest. Empty string if the query is already specific.",
  "followUps": ["2-4 word clickable answer to the followUpQuestion — match the question context, use customer language not trade jargon. Roast context: 'Bold & strong' / 'Light & bright' / 'Smooth & mellow'. Brew context: 'Drip machine' / 'French press' / 'Espresso'. Gift/recipient context: 'She loves bold' / 'Something smooth' / 'Surprise her'. Return 2–3 options. Never use question marks."]
}

Rules:
- Speak directly to the customer: use "you", "your" — never third person
- acknowledgment is ALWAYS required — it validates you understood the customer
- For merch queries (equipment and brewing gear: pour-over drippers, Aeropress, moka pots, grinders, kettles, reusable filters, mugs, bags, accessories): set productType "merch", omit all coffee-specific filters
- followUpQuestion picks the most useful narrowing dimension based on what the customer hasn't told you yet — no fixed category order
- followUps are only provided when followUpQuestion is non-empty
- NEVER repeat anything the customer already specified (e.g. if they said "light" do NOT offer "Light roast")
- NEVER ask a follow-up about a dimension the customer already mentioned. If they said "dark", skip roast-level chips. If they mentioned brew method, skip brew-method chips. If they named an origin, skip origin chips.

Query: ${JSON.stringify(query)}${contextNote}`;
}

async function extractAgenticFilters(
  query: string,
  systemPrompt: string,
  pageContext?: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AgenticExtraction | null> {
  try {
    const result = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: buildExtractionPrompt(query, pageContext) },
      ],
      maxTokens: 1024,
      temperature: 0.2,
    });

    // Strip markdown code fences that some models (e.g. Gemini) add despite instructions
    let stripped = result.text
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");

    // Attempt to repair truncated JSON (model hit token limit mid-response)
    if (result.finishReason === "length" || result.finishReason === "max_tokens") {
      // Close any open strings and brackets
      const openBraces = (stripped.match(/{/g) || []).length;
      const closeBraces = (stripped.match(/}/g) || []).length;
      const openBrackets = (stripped.match(/\[/g) || []).length;
      const closeBrackets = (stripped.match(/\]/g) || []).length;
      // Trim trailing partial values (comma, colon, incomplete string)
      stripped = stripped.replace(/,\s*$/, "").replace(/:\s*$/, ': ""');
      // If inside an unclosed string, close it
      const quoteCount = (stripped.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) stripped += '"';
      for (let i = 0; i < openBrackets - closeBrackets; i++) stripped += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) stripped += "}";
    }

    const raw = JSON.parse(stripped) as Record<string, unknown>;

    // Validate/normalize critical fields so downstream code can't throw on bad LLM output
    const validIntents: AgenticIntent[] = [
      "product_discovery",
      "recommendation",
      "how_to",
      "reorder",
    ];
    const intent: AgenticIntent =
      typeof raw.intent === "string" && validIntents.includes(raw.intent as AgenticIntent)
        ? (raw.intent as AgenticIntent)
        : "product_discovery";

    const rawFilters =
      raw.filtersExtracted && typeof raw.filtersExtracted === "object"
        ? (raw.filtersExtracted as Record<string, unknown>)
        : {};

    const validRoastLevels = ["light", "medium", "dark"];
    const roastLevel =
      typeof rawFilters.roastLevel === "string" &&
      validRoastLevels.includes(rawFilters.roastLevel.toLowerCase())
        ? rawFilters.roastLevel.toLowerCase()
        : undefined;

    const validSortBy = ["newest", "top_rated", "price_asc", "price_desc"] as const;
    type SortBy = (typeof validSortBy)[number];

    const validProductTypes = ["coffee", "merch", "any"] as const;
    type ProductType_ = (typeof validProductTypes)[number];
    const productType: FiltersExtracted["productType"] =
      typeof rawFilters.productType === "string" &&
      validProductTypes.includes(rawFilters.productType as ProductType_)
        ? (rawFilters.productType as ProductType_)
        : undefined;

    const filtersExtracted: FiltersExtracted = {
      productType,
      brewMethod: typeof rawFilters.brewMethod === "string" ? rawFilters.brewMethod : undefined,
      roastLevel,
      flavorProfile: Array.isArray(rawFilters.flavorProfile)
        ? rawFilters.flavorProfile.filter((v) => typeof v === "string")
        : undefined,
      origin: Array.isArray(rawFilters.origin)
        ? (rawFilters.origin as unknown[]).filter((v): v is string => typeof v === "string")
        : typeof rawFilters.origin === "string"
          ? rawFilters.origin
          : undefined,
      isOrganic: typeof rawFilters.isOrganic === "boolean" ? rawFilters.isOrganic : undefined,
      processing: typeof rawFilters.processing === "string" ? rawFilters.processing : undefined,
      variety: typeof rawFilters.variety === "string" ? rawFilters.variety : undefined,
      priceMaxCents:
        typeof rawFilters.priceMaxCents === "number" && rawFilters.priceMaxCents > 0
          ? rawFilters.priceMaxCents
          : undefined,
      priceMinCents:
        typeof rawFilters.priceMinCents === "number" && rawFilters.priceMinCents > 0
          ? rawFilters.priceMinCents
          : undefined,
      sortBy:
        typeof rawFilters.sortBy === "string" && validSortBy.includes(rawFilters.sortBy as SortBy)
          ? (rawFilters.sortBy as SortBy)
          : undefined,
    };

    const acknowledgment = typeof raw.acknowledgment === "string" ? raw.acknowledgment : "";
    const followUpQuestion = typeof raw.followUpQuestion === "string" ? raw.followUpQuestion : "";
    // Backwards compat: fall back to legacy explanation field
    const explanation =
      acknowledgment || (typeof raw.explanation === "string" ? raw.explanation : "");
    const followUps = Array.isArray(raw.followUps)
      ? raw.followUps.filter((v) => typeof v === "string")
      : [];
    const recommendedProductName =
      typeof raw.recommendedProductName === "string" && raw.recommendedProductName.trim()
        ? raw.recommendedProductName.trim()
        : undefined;

    return {
      intent,
      filtersExtracted,
      explanation,
      acknowledgment,
      followUpQuestion,
      followUps,
      recommendedProductName,
    };
  } catch (err) {
    // LLM failure is non-fatal — fall back to standard keyword search
    console.error("[agentic-search] AI extraction failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const query = urlParams.get("q");
    const roast = urlParams.get("roast");
    const origin = urlParams.get("origin");
    const forceAI = urlParams.get("ai") === "true";
    const sessionId = urlParams.get("sessionId") ?? "";
    const parsedTurnCount = parseInt(urlParams.get("turnCount") ?? "0", 10);
    const turnCount = Number.isNaN(parsedTurnCount) ? 0 : parsedTurnCount;
    const pageTitle = urlParams.get("pageTitle") ?? undefined;
    // Conversation history — last N turns sent by the client, capped at 5 turns (10 messages)
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    const historyParam = urlParams.get("history");
    if (historyParam) {
      try {
        const parsed = JSON.parse(historyParam) as unknown;
        if (Array.isArray(parsed)) {
          conversationHistory = (parsed as Array<Record<string, unknown>>)
            .filter(
              (h) =>
                h &&
                typeof h === "object" &&
                (h.role === "user" || h.role === "assistant") &&
                typeof h.content === "string" &&
                h.content.length > 0
            )
            .map((h) => ({ role: h.role as "user" | "assistant", content: h.content as string }))
            .slice(-10); // Cap at 5 turns (10 messages)
        }
      } catch {
        // Ignore malformed history
      }
    }

    // Always restrict to coffee — merch queries not yet supported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isDisabled: false, type: ProductType.COFFEE };
    let searchQuery = "";

    // FTS-ordered IDs are preserved here so we can re-sort Prisma results by
    // ts_rank order after the findMany call. Prisma's `id: { in: [...] }` does
    // not preserve array order.
    let ftsOrderedIds: string[] = [];

    if (query && query.trim().length > 0) {
      searchQuery = query.trim().toLowerCase();

      // Detect roast-level pattern — "light roast", "medium roast", "dark roast"
      // map to category filters rather than text search.
      const roastPatternMatch = searchQuery.match(/\b(light|medium|dark)\s*roast\b/i);
      if (roastPatternMatch && !roast) {
        const level = roastPatternMatch[1].toLowerCase();
        whereClause.categories = {
          some: { category: { slug: `${level}-roast` } },
        };
        whereClause.type = ProductType.COFFEE;

        // If there's remaining text after removing roast pattern, use full-text search
        const remainingQuery = searchQuery
          .replace(/\b(light|medium|dark)\s*roast\b/i, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (remainingQuery.length > 0) {
          const ftsIds = await fullTextSearchIds(remainingQuery);
          if (ftsIds.length > 0) {
            whereClause.id = { in: ftsIds };
            ftsOrderedIds = ftsIds;
          }
        }
      } else {
        // Use PostgreSQL full-text search with TF-IDF ranking.
        // This automatically suppresses high-frequency words ("coffee", "notes")
        // and ranks products with rarer matching terms higher.
        const ftsIds = await fullTextSearchIds(searchQuery);
        if (ftsIds.length > 0) {
          whereClause.id = { in: ftsIds };
          ftsOrderedIds = ftsIds;
        } else {
          // Full-text search found nothing — fall back to simple name/origin match
          // for short queries like "ethiopia" that PG stemming may not handle.
          whereClause.OR = [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { origin: { hasSome: [searchQuery] } },
          ];
        }
      }
    }

    // Explicit roast/origin URL params take precedence over AI extraction
    if (roast) {
      const roastSlug = roast.toLowerCase().endsWith("-roast")
        ? roast.toLowerCase()
        : `${roast.toLowerCase()}-roast`;

      whereClause.categories = {
        some: { category: { slug: roastSlug } },
      };
      whereClause.type = ProductType.COFFEE;
    }

    if (origin) {
      whereClause.origin = { has: origin };
    }

    // -------------------------------------------------------------------------
    // Salutation detection — greeting-only input returns surface string, no search
    // -------------------------------------------------------------------------

    if (query && forceAI) {
      const trimmed = query
        .trim()
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .trim();
      const greetingPattern =
        /^(hey|hello|hi|howdy|yo|sup|whats up|hiya|good morning|good afternoon|good evening|greetings)$/i;
      if (greetingPattern.test(trimmed)) {
        const { aiVoiceSurfaces } = await getPublicSiteSettings();
        const salutation = aiVoiceSurfaces?.salutation;
        const { DEFAULT_VOICE_SURFACES } = await import("@/lib/ai/voice-surfaces");
        return NextResponse.json({
          products: [],
          query: searchQuery,
          count: 0,
          intent: null,
          filtersExtracted: null,
          explanation: null,
          acknowledgment: salutation ?? DEFAULT_VOICE_SURFACES.salutation,
          followUpQuestion: null,
          followUps: [],
          aiFailed: false,
          isSalutation: true,
          context: { sessionId, turnCount },
        });
      }
    }

    // -------------------------------------------------------------------------
    // Agentic step — NL extraction (skipped for keyword queries or if AI off)
    // -------------------------------------------------------------------------

    let agenticData: AgenticExtraction | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = undefined;

    if (query && (forceAI || isNaturalLanguageQuery(query)) && (await isAIConfigured())) {
      const { aiVoicePersona, aiVoiceExamples } = await getPublicSiteSettings();
      const voiceExamples = aiVoiceExamples.length > 0 ? aiVoiceExamples : DEFAULT_VOICE_EXAMPLES;
      const catalogSnapshot = await buildCatalogSnapshot();
      const systemPrompt = buildSystemPrompt(
        voiceExamples,
        aiVoicePersona,
        pageTitle,
        catalogSnapshot
      );
      agenticData = await extractAgenticFilters(
        query,
        systemPrompt,
        pageTitle,
        conversationHistory
      );

      if (agenticData?.filtersExtracted) {
        const {
          roastLevel,
          origin: extractedOrigin,
          flavorProfile,
          isOrganic,
          processing,
          variety,
          priceMaxCents,
          priceMinCents,
          sortBy,
        } = agenticData.filtersExtracted;

        // If AI extracted any structured filter, discard the broad keyword OR
        // clause. The AI's extraction is more precise than token-level substring
        // matching which produces false positives (e.g. "coffee" matching every
        // description, "notes" matching "notes of..."). Keep keyword OR only
        // when AI returned an empty extraction (all fields undefined).
        const hasAnyFilter = !!(
          roastLevel ||
          extractedOrigin ||
          (flavorProfile && flavorProfile.length > 0) ||
          isOrganic !== undefined ||
          processing ||
          variety ||
          priceMaxCents !== undefined ||
          priceMinCents !== undefined ||
          sortBy
        );
        if (hasAnyFilter) {
          delete whereClause.OR;
          // Also clear the full-text prefilter — AI extraction is the source of
          // truth when it succeeds. Leaving `id: { in: ftsIds }` in place would
          // intersect AI flavor expansion with the initial FTS results and
          // exclude products the AI would otherwise find.
          delete whereClause.id;
          ftsOrderedIds = [];
        } else {
          // AI ran but extracted no specific filters (e.g. "gift for mom").
          // Clear the keyword OR fallback — it matches on social/intent words
          // that don't appear in product data and produces zero results.
          // The broad type:COFFEE clause returns a selection; follow-up chips
          // narrow it from there.
          delete whereClause.OR;
        }

        // Apply extracted roastLevel only if no explicit roast param
        if (roastLevel && !roast) {
          const roastSlug = `${roastLevel.toLowerCase()}-roast`;
          whereClause.categories = {
            some: { category: { slug: roastSlug } },
          };
        }

        // Apply extracted origin only if no explicit origin param.
        // Array origins (regional queries like Central America → ["Guatemala", "Costa Rica"...])
        // use hasSome; single-country strings use has.
        if (extractedOrigin && !origin) {
          whereClause.origin = Array.isArray(extractedOrigin)
            ? { hasSome: extractedOrigin }
            : { has: extractedOrigin };
        }

        // BUG-2: Apply flavor profile — expand OR clause with case-insensitive description
        // search and Title Case tastingNotes hasSome. Prisma hasSome is case-sensitive and
        // the DB stores notes as Title Case ("Citrus Zest"), so we capitalize the first letter.
        // Description contains (mode: insensitive) handles multi-word notes like "Citrus Zest".
        if (flavorProfile && flavorProfile.length > 0) {
          const flavorEntries = flavorProfile.flatMap((f) => [
            { description: { contains: f, mode: "insensitive" as const } },
            { tastingNotes: { hasSome: [f.charAt(0).toUpperCase() + f.slice(1)] } },
          ]);
          whereClause.OR = flavorEntries;
        }

        // Apply organic filter
        if (isOrganic !== undefined) {
          whereClause.isOrganic = isOrganic;
        }

        // Apply processing method filter
        if (processing) {
          whereClause.processing = { contains: processing, mode: "insensitive" };
        }

        // Apply variety filter
        if (variety) {
          whereClause.variety = { contains: variety, mode: "insensitive" };
        }

        // Apply price range filters via variants.purchaseOptions
        if (priceMaxCents !== undefined || priceMinCents !== undefined) {
          const priceFilter: Record<string, number> = {};
          if (priceMinCents !== undefined) priceFilter.gte = priceMinCents;
          if (priceMaxCents !== undefined) priceFilter.lte = priceMaxCents;
          whereClause.variants = {
            some: {
              isDisabled: false,
              purchaseOptions: {
                some: { priceInCents: priceFilter },
              },
            },
          };
        }

        // Apply sortBy mapping
        if (sortBy) {
          const sortMap: Record<string, object> = {
            newest: { createdAt: "desc" },
            top_rated: { averageRating: "desc" },
            // price_asc/price_desc omitted — current schema requires nested
            // aggregate orderBy through variants→purchaseOptions which Prisma
            // doesn't support. Revisit when a denormalized minPrice column exists.
          };
          const supportedSort = sortMap[sortBy];
          if (supportedSort) {
            orderBy = supportedSort;
          }
        }

        // Product-type-aware routing:
        // - "merch" → skip all coffee-specific filters, search by name/description only
        // - coffee filters present → lock to COFFEE type
        // - default → COFFEE (maintains backwards compat for queries without productType)
        if (agenticData.filtersExtracted.productType === "merch") {
          // Merch query: remove coffee-type lock, use name/description search only
          delete whereClause.type;
          delete whereClause.categories;
          delete whereClause.origin;
          delete whereClause.OR;
          delete whereClause.id;
          ftsOrderedIds = [];
          // Re-add name/description search for the merch query
          if (query) {
            whereClause.OR = [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
            ];
          }
        } else {
          // Lock to COFFEE type when any coffee-specific semantic filter was extracted.
          // This prevents gear/accessories from matching generic words like "cup" or "coffee".
          const hasCoffeeFilters = !!(
            roastLevel ||
            extractedOrigin ||
            (flavorProfile && flavorProfile.length > 0) ||
            isOrganic !== undefined ||
            processing ||
            variety
          );
          if (hasCoffeeFilters) {
            whereClause.type = ProductType.COFFEE;
          }
        }

        // NOTE: The keyword OR clause is already cleared above (hasAnyFilter check)
        // and a fresh flavor-only OR is built from flavorProfile entries. No need
        // for a second deletion here.
      }
    }

    // -------------------------------------------------------------------------
    // Intent classification — gate routing before DB query
    // -------------------------------------------------------------------------

    if (agenticData) {
      if (agenticData.intent === "how_to") {
        // Conversational/informational query — text-only response, no product search
        return NextResponse.json({
          products: [],
          query: searchQuery,
          count: 0,
          intent: agenticData.intent,
          filtersExtracted: null,
          explanation: agenticData.explanation || null,
          acknowledgment: agenticData.acknowledgment || null,
          followUpQuestion: agenticData.followUpQuestion || null,
          followUps: agenticData.followUps ?? [],
          recommendedProductName: null,
          aiFailed: false,
          context: { sessionId, turnCount },
        });
      }

      if (agenticData.intent === "reorder") {
        // Service/reorder query — in-character redirect, no product search
        const redirect =
          agenticData.acknowledgment ||
          "For orders and account stuff, you'd want to head to your account page — I'm really just here for the coffee.";
        return NextResponse.json({
          products: [],
          query: searchQuery,
          count: 0,
          intent: agenticData.intent,
          filtersExtracted: null,
          explanation: redirect,
          acknowledgment: redirect,
          followUpQuestion: null,
          followUps: [],
          recommendedProductName: null,
          aiFailed: false,
          context: { sessionId, turnCount },
        });
      }
    }

    // -------------------------------------------------------------------------
    // Track search activity
    // -------------------------------------------------------------------------

    const session = await auth();
    if (sessionId && query) {
      try {
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: session?.user?.id || null,
            activityType: "SEARCH",
            searchQuery: query.trim(),
          },
        });
      } catch (error) {
        console.error("Failed to track search activity:", error);
      }
    }

    // -------------------------------------------------------------------------
    // Execute Prisma query
    // -------------------------------------------------------------------------

    const products = await prisma.product.findMany({
      where: whereClause,
      ...(orderBy ? { orderBy } : {}),
      include: {
        categories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
          where: { isPrimary: true },
          take: 1,
        },
        variants: {
          where: { isDisabled: false },
          include: {
            images: {
              select: { url: true, altText: true },
              orderBy: { order: "asc" as const },
              take: 1,
            },
            purchaseOptions: {
              select: {
                id: true,
                type: true,
                priceInCents: true,
                billingInterval: true,
                billingIntervalCount: true,
              },
            },
          },
        },
      },
      take: 7,
    });

    // Preserve full-text search ranking order. Prisma's `id: { in: [...] }`
    // does not guarantee deterministic order, and no explicit orderBy was set
    // when FTS was used. Sort products by their position in ftsOrderedIds.
    let orderedProducts = products;
    if (ftsOrderedIds.length > 0 && !orderBy) {
      const rankByIdMap = new Map(ftsOrderedIds.map((id, idx) => [id, idx]));
      orderedProducts = [...products].sort((a, b) => {
        const rankA = rankByIdMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const rankB = rankByIdMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
      });
    }

    // App-side price sort — price_asc/price_desc are intentionally omitted from
    // the Prisma orderBy sortMap (Prisma can't do nested aggregate orderBy through
    // variants→purchaseOptions). Sort in JS after the query using min variant price.
    // Applied before result reconciliation so the AI's named recommendation can
    // still be promoted to position 1 after sorting.
    const extractedSortBy = agenticData?.filtersExtracted?.sortBy;
    if (extractedSortBy === "price_desc" || extractedSortBy === "price_asc") {
      const getMinPrice = (p: (typeof orderedProducts)[0]): number => {
        const prices = p.variants.flatMap((v) => v.purchaseOptions.map((po) => po.priceInCents));
        return prices.length > 0 ? Math.min(...prices) : Infinity;
      };
      orderedProducts = [...orderedProducts].sort((a, b) =>
        extractedSortBy === "price_desc"
          ? getMinPrice(b) - getMinPrice(a)
          : getMinPrice(a) - getMinPrice(b)
      );
    }

    // Result reconciliation: when the AI names a specific product in the acknowledgment,
    // promote that product to position 1. Ensures the AI's stated recommendation is
    // always the first card the customer sees (grounded RAG proof).
    const recommendedName = agenticData?.recommendedProductName;
    if (recommendedName && orderedProducts.length > 1) {
      const recIdx = orderedProducts.findIndex(
        (p) => p.name.toLowerCase() === recommendedName.toLowerCase()
      );
      if (recIdx > 0) {
        const [rec] = orderedProducts.splice(recIdx, 1);
        orderedProducts = [rec, ...orderedProducts];
      }
    }

    // Cadence enforcement: specific queries (≤3 results) don't need narrowing
    // chips — the result set is already curated enough. Clear follow-ups so the
    // UI presents the results cleanly without prompting further refinement.
    if (agenticData && orderedProducts.length > 0 && orderedProducts.length <= 3) {
      agenticData.followUps = [];
      agenticData.followUpQuestion = "";
    }

    // When AI was requested but extraction failed, surface it so the UI can
    // tell the user instead of silently showing dumb keyword results.
    const aiFailed = forceAI && !agenticData;

    // Pre-validate follow-up chips — remove any that return 0 products so
    // customers never click a chip and land on an empty results page.
    const rawFollowUps = agenticData?.followUps ?? [];
    const validatedFollowUps =
      rawFollowUps.length > 0 ? await validateFollowUps(rawFollowUps) : rawFollowUps;

    return NextResponse.json({
      products: orderedProducts,
      query: searchQuery,
      count: products.length,
      intent: agenticData?.intent ?? null,
      filtersExtracted: agenticData?.filtersExtracted ?? null,
      explanation: agenticData?.explanation ?? null,
      acknowledgment: agenticData?.acknowledgment ?? null,
      followUpQuestion: agenticData?.followUpQuestion ?? null,
      followUps: validatedFollowUps,
      recommendedProductName: agenticData?.recommendedProductName ?? null,
      aiFailed,
      context: { sessionId, turnCount },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}

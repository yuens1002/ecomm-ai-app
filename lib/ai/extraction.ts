import { chatCompletion } from "@/lib/ai-client";
import { prisma } from "@/lib/prisma";
import { AgenticExtractionSchema } from "@/types/search";
import type { AgenticExtraction } from "@/types/search";

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

export function tokenizeNLQuery(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\w\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NL_STOP_WORDS.has(t));
}

export async function fullTextSearchIds(query: string, limit = 50): Promise<string[]> {
  const tokens = tokenizeNLQuery(query);
  if (tokens.length === 0) return [];

  const tsquery = tokens.join(" | ");

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

async function validateFollowUps(chips: string[]): Promise<string[]> {
  if (chips.length === 0) return [];
  const results = await Promise.all(
    chips.map(async (chip) => {
      const ftsIds = await fullTextSearchIds(chip, 1);
      if (ftsIds.length > 0) return chip;
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
// Extraction prompt
// ---------------------------------------------------------------------------

export function buildExtractionPrompt(query: string, pageContext?: string): string {
  const contextNote = pageContext
    ? `\n\nPage context: the customer is viewing "${pageContext}". Resolve "this", "it", or "this one" as "${pageContext}". When they ask a question about the product they're viewing (e.g. brew method, taste, roast suitability), the explanation must directly answer that question with specific knowledge about "${pageContext}". Include "${pageContext}" in the product results if it is relevant.`
    : "";
  return `Extract search intent and return JSON only:
{
  "intent": "discover" | "recommend" | "how_to" | "reorder" | "compare",  // "discover": customer is looking for something (default for searches). "recommend": customer asks whether a product suits their goal OR asks which of two products they should use/get — "which is better with milk?", "which should I try?", "which is better for espresso?" all → recommend (customer wants a pick). "compare": customer wants both sides explained, no single winner expected — "what's the difference between X and Y?", "compare X and Y", "how do they differ?". Tiebreaker: if the question has a correct answer (one product clearly wins for the criterion), use recommend. "how_to": informational question, no search. "reorder": redirect to account page.
  "filtersExtracted": {
    "productType": "coffee" | "merch",  // Priority rule: if the query mentions a physical tool, device, or brewing equipment (dripper, grinder, kettle, moka pot, Aeropress, mug, filter, reusable cup), set productType to "merch" — even when the query also contains coffee descriptors like roast level or flavor. Otherwise: "coffee" for coffee queries; omit when unclear.
    "brewMethod": string | undefined,  // Coffee only
    "roastLevel": "light" | "medium" | "dark" | undefined,  // Coffee only
    "flavorProfile": string[] | undefined,  // Coffee only — Expand flavor categories into concrete tasting notes. Categories: "citrus" → ["citrus", "lemon", "lime", "orange", "grapefruit", "bergamot"]; "berry" → ["berry", "blueberry", "blackberry", "raspberry", "strawberry"]; "chocolate" → ["chocolate", "cocoa", "cacao"]; "nutty" → ["nutty", "almond", "hazelnut", "cashew", "pecan"]; "floral" → ["floral", "jasmine", "lavender", "rose"]; "stone fruit" → ["stone fruit", "peach", "apricot", "plum"]; "tropical" → ["tropical", "mango", "pineapple", "passion fruit"]; "spicy" → ["spice", "cinnamon", "clove", "cardamom"]. Mood-to-notes: "smooth" / "easy-drinking" / "mellow" → ["smooth", "balanced", "caramel", "chocolate", "mild"]; "bold" / "strong" / "intense" → ["bold", "dark chocolate", "molasses", "earthy"]; "bright" / "lively" → ["bright", "citrus", "floral", "tea-like"]; "complex" / "unique" → ["complex", "wine", "fermented", "berry"]. Include original term AND concrete notes. Only populate when the customer explicitly mentions a flavor or mood — NEVER infer flavor preferences from vague queries.
    "origin": string | string[] | undefined,  // Coffee only. Use the exact origin values from the catalog. Single country: string. Regional/geographic term: return an array of the specific origin values from the catalog that belong to that region — only use what's in the catalog, never invent country names
    "isOrganic": true | false | undefined,  // Coffee only
    "processing": "washed" | "natural" | "honey" | "anaerobic" | string | undefined,  // Coffee only
    "variety": string | undefined,  // Coffee only
    "priceMaxCents": number (cents, e.g. 3000 for "under $30") | undefined,
    "priceMinCents": number | undefined,
    "sortBy": "newest" | "price_asc" | "price_desc" | "top_rated" | undefined,  // Use "top_rated" when query signals popularity, gift intent, or is vague/open-ended: "well-loved", "crowd-pleaser", "popular", "everyone likes", "gift", "what's good", "anything interesting"
    "productKeywords": string[] | undefined  // Keywords to search product names/descriptions. Required when productType is "merch" — extract the product concept into searchable terms (e.g. "pour over" → ["pour over", "dripper", "V60"])
  },
  "acknowledgment":"In the voice of a shop owner responding to what the customer wants to experience — not predicting what the results will contain. Do NOT name specific roast levels, origins, or tasting notes: you have not seen the actual products yet and will be wrong. Respond to the customer's mood, intent, or occasion instead. Let the voice examples guide your natural length and rhythm. No physical action verbs ('grab', 'pour', 'pick out', 'pull'). Use second person ('you'). NEVER use search vocabulary: 'I found', 'looking for', 'matches', 'options that fit', 'search results', 'nothing matching', 'nothing that matches', 'I can't think of', 'I'm not sure', 'I don't have', 'find'. ALWAYS present tense. Never third-person. Never repeat the customer's exact words back. Exception for merch queries (productType: 'merch'): you may name specific products from the catalog — they are confirmed to exist in the shop. The catalog is in your context.",
  "recommendedProductName": "Exact product name from the catalog if you are naming a specific product in the acknowledgment (e.g. 'I'd go with the Ethiopian Yirgacheffe'). Must match the product name EXACTLY as it appears in the catalog. Omit if you are not naming a specific product.",
  "followUpQuestion": "1 sentence that fits the customer's context — not a fixed coffee-attribute prompt. Derive it from what they haven't told you AND what would most reduce the results. For gift/occasion queries: ask about the recipient's taste in plain terms ('Does she usually go bold or keep it mellow?', 'How does she take her coffee?'). For vague preference queries: ask about the dimension that cuts deepest. Empty string if the query is already specific.",
  "followUps": ["2-4 word clickable answer to the followUpQuestion — match the question context, use customer language not trade jargon. Return 2–3 options. Never use question marks."]
}

Rules:
- Speak directly to the customer: use "you", "your" — never third person
- acknowledgment is ALWAYS required — it validates you understood the customer
- For merch queries (equipment and brewing gear: pour-over drippers, Aeropress, moka pots, grinders, kettles, reusable filters, mugs, bags, accessories): set productType "merch", omit all coffee-specific filters
- followUpQuestion picks the most useful narrowing dimension based on what the customer hasn't told you yet — no fixed category order
- followUps are only provided when followUpQuestion is non-empty
- NEVER repeat anything the customer already specified (e.g. if they said "light" do NOT offer "Light roast")
- NEVER ask a follow-up about a dimension the customer already mentioned. If they said "dark", skip roast-level chips. If they mentioned brew method, skip brew-method chips. If they named an origin, skip origin chips.
- VAGUE QUERIES: when the query has NO specific filter signals (no roast, origin, flavor, brew method, or price mentioned — e.g. "what's good?", "anything interesting?", "surprise me"), set sortBy to "top_rated" and OMIT roastLevel and flavorProfile entirely. Do NOT infer flavor preferences or treat vague as "beginner".

RECOMMEND CADENCE — when a customer asks whether a product suits their goal:

Step 1 — Answer honestly (always).

Step 2 — Is the answer YES?
  → No search. Leave filtersExtracted empty. Just answer.

Step 3 — Is the answer NO?
  → Search for what WOULD work. Extract filters for the alternative, NOT for the product being discussed.
  → If alternatives found: state the reason + suggest the alternative(s).
  → If nothing found: state the reason only. Do NOT say "nothing fits" or redirect them away.

Key: Extract filters for the alternative you are recommending, not for what you are discussing.
Example: "is this good with milk?" on a light roast → search for medium/dark roast, not the current product.

COMPARE CADENCE — when a customer asks to compare specific products with no single correct answer:
Note: "which is better for [use case]?" → recommend, not compare. Compare is for "what's the difference?" where both products could legitimately win.

Step 1 — state the delta: what's meaningfully different between them.

Step 2 — Search for the specific products being compared by name/keyword.
          Show all of them so the customer can decide.

Step 3 — If one clearly wins for their criteria: promote it to the top.
          If no clear winner: show all, let the customer decide.
          If search returns nothing: no cards — just the reasoning.

Examples:

Q: "is a light roast good for espresso?"
A: {"intent":"recommend","filtersExtracted":{"brewMethod":"espresso","roastLevel":"dark"},"acknowledgment":"Light roasts under espresso pressure tend to come out sour — the extraction really exposes any sharpness. For espresso you want something with more body and sweetness to balance it out.","followUpQuestion":"Do you usually pull it straight or add milk?","followUps":["Straight shot","With milk"]}

Q: "which goes better with oat milk, a Colombian or a Kenyan?"
A: {"intent":"recommend","filtersExtracted":{"roastLevel":"medium","flavorProfile":["chocolate","nutty","caramel","smooth"]},"acknowledgment":"Oat milk is creamy and a little sweet on its own — it does well with something that leans chocolatey and full-bodied. Between those two, the Colombian will give you more to lean into. For something that really sings with oat milk, here's what I'd try.","followUpQuestion":"","followUps":[]}

Q: "what's the difference between washed and natural process coffees?"
A: {"intent":"compare","filtersExtracted":{"productKeywords":["washed","natural"]},"acknowledgment":"Washed coffees strip the fruit before drying — you get a cleaner, brighter cup that shows off the bean itself. Natural-processed ones dry with the cherry on, which adds body and a winey, fruity complexity. Both are worth exploring.","followUpQuestion":"Do you lean more toward clean and bright, or fruity and complex?","followUps":["Clean and bright","Fruity and complex"]}

Q: "how do I get a good bloom on a pour-over?"
A: {"intent":"how_to","filtersExtracted":{},"acknowledgment":"Use about twice the weight of water to coffee — 30g water for 15g coffee — and let it sit 30 to 45 seconds before the main pour. The CO2 escaping is what you're after. Fresher roasts bloom more aggressively, which is usually a good sign.","followUpQuestion":"","followUps":[]}

Q: "something cozy for a rainy afternoon"
A: {"intent":"discover","filtersExtracted":{"sortBy":"top_rated","flavorProfile":["chocolate","caramel","nutty","spice"]},"acknowledgment":"A rainy afternoon calls for something that wraps around you — chocolatey, full-bodied, maybe a hint of warmth.","followUpQuestion":"Do you drink it black or with something in it?","followUps":["Black","With milk"]}

Query: ${JSON.stringify(query)}${contextNote}`;
}

// ---------------------------------------------------------------------------
// AI extraction step
// ---------------------------------------------------------------------------

export async function extractAgenticFilters(
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

    let stripped = result.text
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");

    if (result.finishReason === "length" || result.finishReason === "max_tokens") {
      const openBraces = (stripped.match(/{/g) || []).length;
      const closeBraces = (stripped.match(/}/g) || []).length;
      const openBrackets = (stripped.match(/\[/g) || []).length;
      const closeBrackets = (stripped.match(/]/g) || []).length;
      stripped = stripped.replace(/,\s*$/, "").replace(/:\s*$/, ': ""');
      const quoteCount = (stripped.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) stripped += '"';
      for (let i = 0; i < openBrackets - closeBrackets; i++) stripped += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) stripped += "}";
    }

    const raw = JSON.parse(stripped) as Record<string, unknown>;

    // Preprocess before Zod validation — normalize edge cases from AI output
    if (raw.filtersExtracted && typeof raw.filtersExtracted === "object") {
      const filters = raw.filtersExtracted as Record<string, unknown>;
      // "any" productType → undefined (schema only allows "coffee" | "merch")
      if (filters.productType === "any") delete filters.productType;
      // Single-element origin array → string (schema enforces min-2 for arrays)
      if (Array.isArray(filters.origin) && filters.origin.length === 1) {
        filters.origin = filters.origin[0];
      }
    }
    // Trim recommendedProductName
    if (typeof raw.recommendedProductName === "string") {
      const trimmed = raw.recommendedProductName.trim();
      raw.recommendedProductName = trimmed || undefined;
    }

    const parsed = AgenticExtractionSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[agentic-search] Zod validation failed:", parsed.error.issues);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.error("[agentic-search] AI extraction failed:", err);
    return null;
  }
}

export { validateFollowUps };

const GREETING_PATTERN = /^(hey|hello|hi|howdy|yo|sup|whats up|hiya|good morning|good afternoon|good evening|greetings)$/i;

export function isSalutation(query: string): boolean {
  const trimmed = query.trim().toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return GREETING_PATTERN.test(trimmed);
}

export function parseConversationHistory(historyParam: string | null): Array<{
  role: "user" | "assistant";
  content: string;
}> {
  if (!historyParam) return [];
  try {
    const parsed = JSON.parse(historyParam) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Record<string, unknown>>)
      .filter(
        (h) =>
          h &&
          typeof h === "object" &&
          (h.role === "user" || h.role === "assistant") &&
          typeof h.content === "string" &&
          h.content.length > 0
      )
      .map((h) => ({ role: h.role as "user" | "assistant", content: h.content as string }))
      .slice(-10);
  } catch {
    return [];
  }
}
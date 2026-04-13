import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chatCompletion, isAIConfigured } from "@/lib/ai-client";
import { getPublicSiteSettings } from "@/lib/data";
import {
  DEFAULT_VOICE_EXAMPLES,
  type VoiceExample,
} from "@/lib/ai/voice-examples";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgenticIntent =
  | "product_discovery"
  | "recommendation"
  | "how_to"
  | "reorder";

interface FiltersExtracted {
  // Phase A
  brewMethod?: string;
  roastLevel?: string;
  flavorProfile?: string[];
  origin?: string;
  // Extended
  isOrganic?: boolean;
  processing?: string;
  variety?: string;
  priceMaxCents?: number;
  priceMinCents?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "top_rated";
}

interface AgenticExtraction {
  intent: AgenticIntent;
  filtersExtracted: FiltersExtracted;
  /** @deprecated Use acknowledgment instead — kept for backwards compat in response */
  explanation: string;
  acknowledgment: string;
  followUpQuestion: string;
  followUps: string[];
}

// ---------------------------------------------------------------------------
// NL heuristic — gates AI calls to avoid cost on simple keyword queries
// ---------------------------------------------------------------------------

const NL_STOP_WORDS = new Set([
  "what", "whats", "is", "are", "good", "best", "great", "any",
  "with", "for", "a", "an", "the", "and", "or", "but", "in", "on",
  "at", "to", "of", "me", "my", "some", "something", "anything",
  "that", "this", "which", "can", "i", "you", "us", "we", "do",
  "does", "would", "like", "looking", "find", "help", "need", "want",
  "show", "get", "give", "have", "over", "up", "out", "about",
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
async function fullTextSearchIds(
  query: string,
  limit = 50
): Promise<string[]> {
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

// ---------------------------------------------------------------------------
// AI extraction step
// ---------------------------------------------------------------------------

export function buildSystemPrompt(
  voiceExamples: VoiceExample[],
  aiVoicePersona: string,
  pageContext?: string
): string {
  // Role framing — YOU ARE AT THE COUNTER, not running a search engine.
  // The customer walked into the shop. Pick products like you'd pick for a
  // regular, using your voice. Vocabulary of service, not of software.
  const roleSection =
    `You are the shop owner at the counter, helping a customer who just walked in. Pick coffees like you'd pick for a regular — share your honest opinion: "I'd go with", "I'd say try", "personally I'd", "if it were me". You are NOT a search engine, database, or list of results. Never say "I found", "I'm looking for", "search results", "matches", "options that fit". Never use physical action verbs: "grab", "pour", "pick out", "pull". Use opinion framing instead.\n\n`;

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

  const contextSection = pageContext
    ? `The customer is currently looking at "${pageContext}" on the counter. When they say "this" or "it", they mean "${pageContext}".\n\n`
    : "";
  return `${roleSection}${voiceSection}${contextSection}Listen to what the customer says, figure out what to pick for them, and return valid JSON only — no markdown, no explanation outside the JSON.`;
}

function buildExtractionPrompt(query: string, pageContext?: string): string {
  const contextNote = pageContext
    ? `\n\nPage context: the customer is viewing "${pageContext}". Resolve "this", "it", or "this one" as "${pageContext}". When they ask a question about the product they're viewing (e.g. brew method, taste, roast suitability), the explanation must directly answer that question with specific knowledge about "${pageContext}". Include "${pageContext}" in the product results if it is relevant.`
    : "";
  return `Extract coffee search intent and return JSON only:
{
  "intent": "product_discovery" | "recommendation" | "how_to" | "reorder",
  "filtersExtracted": {
    "brewMethod": string | undefined,
    "roastLevel": "light" | "medium" | "dark" | undefined,
    "flavorProfile": string[] | undefined,  // Expand abstract flavor categories into concrete tasting notes a roaster would write. E.g. "citrus" → ["citrus", "lemon", "lime", "orange", "grapefruit", "bergamot"]; "berry" → ["berry", "blueberry", "blackberry", "raspberry", "strawberry", "blackcurrant", "currant"]; "chocolate" → ["chocolate", "cocoa", "cacao"]; "nutty" → ["nutty", "almond", "hazelnut", "cashew", "pecan", "walnut"]; "floral" → ["floral", "jasmine", "lavender", "rose", "honeysuckle"]; "stone fruit" → ["stone fruit", "peach", "apricot", "plum"]; "tropical" → ["tropical", "mango", "pineapple", "passion fruit", "papaya"]; "spicy" → ["spice", "spicy", "cinnamon", "clove", "cardamom", "pepper"]. Include the original category term AND the concrete notes so both literal and categorical queries match. Keep it scoped — don't expand to unrelated notes.

    "origin": string | undefined,
    "isOrganic": true | false | undefined,
    "processing": "washed" | "natural" | "honey" | "anaerobic" | string | undefined,
    "variety": string | undefined,
    "priceMaxCents": number (cents, e.g. 3000 for "under $30") | undefined,
    "priceMinCents": number | undefined,
    "sortBy": "newest" | "price_asc" | "price_desc" | "top_rated" | undefined
  },
  "acknowledgment": "In the voice of a shop owner sharing an opinion at the counter. Let the voice examples guide your natural length and rhythm — match their brevity if they are brief, their depth if they are expansive. Use opinion framing: 'I'd go with', 'I'd say try', 'personally I'd', 'if it were me'. No physical action verbs ('grab', 'pour', 'pick out', 'pull'). Use second person ('you'). NEVER use search vocabulary: 'I found', 'looking for', 'matches', 'options that fit', 'search results'. ALWAYS present. Never third-person ('The customer...'). Never repeat the customer's exact words back.",
  "followUpQuestion": "1 sentence narrowing question based on what the customer hasn't specified yet. Pick the most useful dimension to narrow (roast level, brew method, flavor, origin). Empty string if the query is already specific enough.",
  "followUps": ["2-4 word option label the customer might choose — e.g. 'Light & bright', 'Medium & smooth', 'Dark & bold'. Return 2–3 options when followUpQuestion is non-empty; empty array otherwise. Never use question marks — these are clickable answer choices, not questions."]
}

Rules:
- Speak directly to the customer: use "you", "your" — never third person
- acknowledgment is ALWAYS required — it validates you understood the customer
- followUpQuestion picks the most useful narrowing dimension based on what the customer hasn't told you yet — no fixed category order
- followUps are only provided when followUpQuestion is non-empty
- NEVER repeat anything the customer already specified (e.g. if they said "light" do NOT offer "Light roast")
- NEVER ask a follow-up about a dimension the customer already mentioned. If they said "dark", skip roast-level chips. If they mentioned brew method, skip brew-method chips. If they named an origin, skip origin chips.

Query: ${JSON.stringify(query)}${contextNote}`;
}

async function extractAgenticFilters(
  query: string,
  systemPrompt: string,
  pageContext?: string
): Promise<AgenticExtraction | null> {
  try {
    const result = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildExtractionPrompt(query, pageContext) },
      ],
      maxTokens: 1024,
      temperature: 0.2,
    });

    // Strip markdown code fences that some models (e.g. Gemini) add despite instructions
    let stripped = result.text.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

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

    const validSortBy = ["newest", "top_rated"] as const;
    type SortBy = (typeof validSortBy)[number];

    const filtersExtracted: FiltersExtracted = {
      brewMethod:
        typeof rawFilters.brewMethod === "string" ? rawFilters.brewMethod : undefined,
      roastLevel,
      flavorProfile: Array.isArray(rawFilters.flavorProfile)
        ? rawFilters.flavorProfile.filter((v) => typeof v === "string")
        : undefined,
      origin: typeof rawFilters.origin === "string" ? rawFilters.origin : undefined,
      isOrganic: typeof rawFilters.isOrganic === "boolean" ? rawFilters.isOrganic : undefined,
      processing:
        typeof rawFilters.processing === "string" ? rawFilters.processing : undefined,
      variety:
        typeof rawFilters.variety === "string" ? rawFilters.variety : undefined,
      priceMaxCents:
        typeof rawFilters.priceMaxCents === "number" && rawFilters.priceMaxCents > 0
          ? rawFilters.priceMaxCents
          : undefined,
      priceMinCents:
        typeof rawFilters.priceMinCents === "number" && rawFilters.priceMinCents > 0
          ? rawFilters.priceMinCents
          : undefined,
      sortBy:
        typeof rawFilters.sortBy === "string" &&
        validSortBy.includes(rawFilters.sortBy as SortBy)
          ? (rawFilters.sortBy as SortBy)
          : undefined,
    };

    const acknowledgment =
      typeof raw.acknowledgment === "string" ? raw.acknowledgment : "";
    const followUpQuestion =
      typeof raw.followUpQuestion === "string" ? raw.followUpQuestion : "";
    // Backwards compat: fall back to legacy explanation field
    const explanation =
      acknowledgment || (typeof raw.explanation === "string" ? raw.explanation : "");
    const followUps = Array.isArray(raw.followUps)
      ? raw.followUps.filter((v) => typeof v === "string")
      : [];

    return { intent, filtersExtracted, explanation, acknowledgment, followUpQuestion, followUps };
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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const roast = searchParams.get("roast");
    const origin = searchParams.get("origin");
    const forceAI = searchParams.get("ai") === "true";
    const sessionId = searchParams.get("sessionId") ?? "";
    const parsedTurnCount = parseInt(searchParams.get("turnCount") ?? "0", 10);
    const turnCount = Number.isNaN(parsedTurnCount) ? 0 : parsedTurnCount;
    const pageTitle = searchParams.get("pageTitle") ?? undefined;

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
      const roastPatternMatch = searchQuery.match(
        /\b(light|medium|dark)\s*roast\b/i
      );
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
      const trimmed = query.trim().toLowerCase().replace(/[^a-z\s]/g, "").trim();
      const greetingPattern = /^(hey|hello|hi|howdy|yo|sup|whats up|hiya|good morning|good afternoon|good evening|greetings)$/i;
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

    if (
      query &&
      (forceAI || isNaturalLanguageQuery(query)) &&
      (await isAIConfigured())
    ) {
      const { aiVoicePersona, aiVoiceExamples } = await getPublicSiteSettings();
      const voiceExamples =
        aiVoiceExamples.length > 0 ? aiVoiceExamples : DEFAULT_VOICE_EXAMPLES;
      const systemPrompt = buildSystemPrompt(voiceExamples, aiVoicePersona, pageTitle);
      agenticData = await extractAgenticFilters(query, systemPrompt, pageTitle);

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
        }

        // Apply extracted roastLevel only if no explicit roast param
        if (roastLevel && !roast) {
          const roastSlug = `${roastLevel.toLowerCase()}-roast`;
          whereClause.categories = {
            some: { category: { slug: roastSlug } },
          };
        }

        // Apply extracted origin only if no explicit origin param
        if (extractedOrigin && !origin) {
          whereClause.origin = { has: extractedOrigin };
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

        // NOTE: The keyword OR clause is already cleared above (hasAnyFilter check)
        // and a fresh flavor-only OR is built from flavorProfile entries. No need
        // for a second deletion here.
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

    // When AI was requested but extraction failed, surface it so the UI can
    // tell the user instead of silently showing dumb keyword results.
    const aiFailed = forceAI && !agenticData;

    return NextResponse.json({
      products: orderedProducts,
      query: searchQuery,
      count: products.length,
      intent: agenticData?.intent ?? null,
      filtersExtracted: agenticData?.filtersExtracted ?? null,
      explanation: agenticData?.explanation ?? null,
      acknowledgment: agenticData?.acknowledgment ?? null,
      followUpQuestion: agenticData?.followUpQuestion ?? null,
      followUps: agenticData?.followUps ?? [],
      aiFailed,
      context: { sessionId, turnCount },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}

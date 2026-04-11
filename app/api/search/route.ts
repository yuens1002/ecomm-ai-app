import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chatCompletion, isAIConfigured } from "@/lib/ai-client";
import { getPublicSiteSettings } from "@/lib/data";

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
  explanation: string;
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

  const results = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Product"
    WHERE "isDisabled" = false
      AND to_tsvector('english',
        coalesce("name", '') || ' ' ||
        coalesce("description", '') || ' ' ||
        array_to_string("tastingNotes", ' ') || ' ' ||
        array_to_string("origin", ' ') || ' ' ||
        coalesce("processing", '') || ' ' ||
        coalesce("variety", '')
      ) @@ to_tsquery('english', ${tsquery})
    ORDER BY ts_rank(
      to_tsvector('english',
        coalesce("name", '') || ' ' ||
        coalesce("description", '') || ' ' ||
        array_to_string("tastingNotes", ' ') || ' ' ||
        array_to_string("origin", ' ') || ' ' ||
        coalesce("processing", '') || ' ' ||
        coalesce("variety", '')
      ),
      to_tsquery('english', ${tsquery})
    ) DESC
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

function buildSystemPrompt(aiVoicePersona: string, pageContext?: string): string {
  const personaSection = aiVoicePersona.trim()
    ? `You are the voice of this coffee shop. Embody the shop owner's character exactly:\n"${aiVoicePersona}"\n\n`
    : `You are a knowledgeable coffee shop assistant. Speak with genuine expertise and warmth.\n\n`;
  const contextSection = pageContext
    ? `The customer is currently viewing "${pageContext}". When they say "this" or "it", they mean "${pageContext}".\n\n`
    : "";
  return `${personaSection}${contextSection}Extract coffee search intent from user queries and return valid JSON only — no markdown, no explanation outside the JSON.`;
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
    "flavorProfile": string[] | undefined,
    "origin": string | undefined,
    "isOrganic": true | false | undefined,
    "processing": "washed" | "natural" | "honey" | "anaerobic" | string | undefined,
    "variety": string | undefined,
    "priceMaxCents": number (cents, e.g. 3000 for "under $30") | undefined,
    "priceMinCents": number | undefined,
    "sortBy": "newest" | "price_asc" | "price_desc" | "top_rated" | undefined
  },
  "explanation": "1–2 sentences spoken directly to the customer in first person. If intent is open-ended, end with a natural question to narrow it down — the options (followUps) are the choices the customer picks from. E.g. 'Sounds like you want something approachable — what kind of roast are you usually after?' Never use 'The customer is...' or third-person phrasing.",
  "followUps": ["2-4 word option label the customer might choose — e.g. 'Light & bright', 'Medium & smooth', 'Dark & bold'. Return 2–3 options when intent is open-ended; empty array if intent is specific enough. Never use question marks — these are clickable answer choices, not questions."]
}

followUps rules:
- Return 2–3 short option labels when the query is open-ended and options would help narrow the intent
- Each label must be 2–4 words, no question marks — they are clickable answer choices
- NEVER repeat anything the customer already specified (e.g. if they said "light" do NOT offer "Light roast" as a choice)
- If the query is already specific enough, return []

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

    const explanation =
      typeof raw.explanation === "string" ? raw.explanation : "";
    const followUps = Array.isArray(raw.followUps)
      ? raw.followUps.filter((v) => typeof v === "string")
      : [];

    return { intent, filtersExtracted, explanation, followUps };
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isDisabled: false };
    let searchQuery = "";

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
          }
        }
      } else {
        // Use PostgreSQL full-text search with TF-IDF ranking.
        // This automatically suppresses high-frequency words ("coffee", "notes")
        // and ranks products with rarer matching terms higher.
        const ftsIds = await fullTextSearchIds(searchQuery);
        if (ftsIds.length > 0) {
          whereClause.id = { in: ftsIds };
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
      const { aiVoicePersona } = await getPublicSiteSettings();
      const systemPrompt = buildSystemPrompt(aiVoicePersona, pageTitle);
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
      take: 50,
    });

    // When AI was requested but extraction failed, surface it so the UI can
    // tell the user instead of silently showing dumb keyword results.
    const aiFailed = forceAI && !agenticData;

    return NextResponse.json({
      products,
      query: searchQuery,
      count: products.length,
      intent: agenticData?.intent ?? null,
      filtersExtracted: agenticData?.filtersExtracted ?? null,
      explanation: agenticData?.explanation ?? null,
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

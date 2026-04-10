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

export function isNaturalLanguageQuery(query: string): boolean {
  if (query.trim().split(/\s+/).length < 3) return false;
  const nlIndicators =
    /\b(for|like|something|want|need|smooth|fruity|bright|bold|light|dark|morning|recommend|looking|find|help|my|with)\b/i;
  return nlIndicators.test(query);
}

// ---------------------------------------------------------------------------
// AI extraction step
// ---------------------------------------------------------------------------

function buildSystemPrompt(aiVoicePersona: string): string {
  const personaSection = aiVoicePersona.trim()
    ? `You are the voice of this coffee shop. Embody the shop owner's character exactly:\n"${aiVoicePersona}"\n\n`
    : `You are a knowledgeable coffee shop assistant. Speak with genuine expertise and warmth.\n\n`;
  return `${personaSection}Extract coffee search intent from user queries and return valid JSON only — no markdown, no explanation outside the JSON.`;
}

function buildExtractionPrompt(query: string): string {
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
  "explanation": "one sentence why these results match the query",
  "followUps": ["short filter label e.g. 'Light roast' or 'Ethiopian' or 'V60 friendly'", "another short label"]
}

followUps must be 2–3 short action labels (2–4 words each) the user can tap to refine results — NOT questions. Examples: "Light roast", "Single origin", "Fruity notes", "Under $30", "Espresso friendly".

Query: ${JSON.stringify(query)}`;
}

async function extractAgenticFilters(
  query: string,
  systemPrompt: string
): Promise<AgenticExtraction | null> {
  try {
    const result = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildExtractionPrompt(query) },
      ],
      maxTokens: 500,
      temperature: 0.2,
    });

    // Strip markdown code fences that some models (e.g. Gemini) add despite instructions
    const stripped = result.text.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
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

    const validSortBy = ["newest", "price_asc", "price_desc", "top_rated"] as const;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isDisabled: false };
    let searchQuery = "";

    if (query && query.trim().length > 0) {
      searchQuery = query.trim().toLowerCase();

      // Detect roast-level pattern before building text OR clause —
      // "light roast", "medium roast", "dark roast" map to category filters
      // rather than substring matches (which would return nothing useful).
      const roastPatternMatch = searchQuery.match(
        /\b(light|medium|dark)\s*roast\b/i
      );
      if (roastPatternMatch && !roast) {
        const level = roastPatternMatch[1].toLowerCase();
        whereClause.categories = {
          some: { category: { slug: `${level}-roast` } },
        };
        whereClause.type = ProductType.COFFEE;

        const remainingQuery = searchQuery
          .replace(/\b(light|medium|dark)\s*roast\b/i, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (remainingQuery.length > 0) {
          const tokens = tokenizeNLQuery(remainingQuery);
          if (tokens.length > 0) {
            whereClause.OR = tokens.flatMap((token) => [
              { name: { contains: token, mode: "insensitive" } },
              { description: { contains: token, mode: "insensitive" } },
              { origin: { hasSome: [token] } },
              { tastingNotes: { hasSome: [token] } },
              { processing: { contains: token, mode: "insensitive" } },
              { variety: { contains: token, mode: "insensitive" } },
              { altitude: { contains: token, mode: "insensitive" } },
            ]);
          }
        }
      } else if (isNaturalLanguageQuery(searchQuery)) {
        const tokens = tokenizeNLQuery(searchQuery);
        if (tokens.length > 0) {
          whereClause.OR = tokens.flatMap((token) => [
            { name: { contains: token, mode: "insensitive" } },
            { description: { contains: token, mode: "insensitive" } },
            { origin: { hasSome: [token] } },
            { tastingNotes: { hasSome: [token] } },
            { processing: { contains: token, mode: "insensitive" } },
            { variety: { contains: token, mode: "insensitive" } },
            { altitude: { contains: token, mode: "insensitive" } },
          ]);
        } else {
          whereClause.OR = [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { description: { contains: searchQuery, mode: "insensitive" } },
            { origin: { hasSome: [searchQuery] } },
            { tastingNotes: { hasSome: [searchQuery] } },
            { processing: { contains: searchQuery, mode: "insensitive" } },
            { variety: { contains: searchQuery, mode: "insensitive" } },
            { altitude: { contains: searchQuery, mode: "insensitive" } },
          ];
        }
      } else {
        whereClause.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { origin: { hasSome: [searchQuery] } },
          { tastingNotes: { hasSome: [searchQuery] } },
          { processing: { contains: searchQuery, mode: "insensitive" } },
          { variety: { contains: searchQuery, mode: "insensitive" } },
          { altitude: { contains: searchQuery, mode: "insensitive" } },
        ];
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
      const systemPrompt = buildSystemPrompt(aiVoicePersona);
      agenticData = await extractAgenticFilters(query, systemPrompt);

      if (agenticData?.filtersExtracted) {
        const {
          roastLevel,
          origin: extractedOrigin,
          isOrganic,
          processing,
          variety,
          priceMaxCents,
          priceMinCents,
          sortBy,
        } = agenticData.filtersExtracted;

        // Apply extracted roastLevel only if no explicit roast param
        if (roastLevel && !roast) {
          const roastSlug = `${roastLevel.toLowerCase()}-roast`;
          whereClause.categories = {
            some: { category: { slug: roastSlug } },
          };
          whereClause.type = ProductType.COFFEE;
        }

        // Apply extracted origin only if no explicit origin param
        if (extractedOrigin && !origin) {
          whereClause.origin = { has: extractedOrigin };
        }

        // Apply organic filter
        if (isOrganic !== undefined) {
          whereClause.isOrganic = isOrganic;
        }

        // Apply processing method filter (substring match via related variants)
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
            price_asc: { variants: { _min: { purchaseOptions: { _min: { priceInCents: "asc" } } } } },
            price_desc: { variants: { _min: { purchaseOptions: { _min: { priceInCents: "desc" } } } } },
            top_rated: { createdAt: "desc" }, // fallback: no rating field yet
          };
          orderBy = sortMap[sortBy];
        }
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

    return NextResponse.json({
      products,
      query: searchQuery,
      count: products.length,
      intent: agenticData?.intent ?? null,
      filtersExtracted: agenticData?.filtersExtracted ?? null,
      explanation: agenticData?.explanation ?? null,
      followUps: agenticData?.followUps ?? [],
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

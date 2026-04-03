import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chatCompletion, isAIConfigured } from "@/lib/ai-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgenticIntent =
  | "product_discovery"
  | "recommendation"
  | "how_to"
  | "reorder";

interface FiltersExtracted {
  brewMethod?: string;
  roastLevel?: string;
  flavorProfile?: string[];
  origin?: string;
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

export function isNaturalLanguageQuery(query: string): boolean {
  if (query.trim().split(/\s+/).length < 3) return false;
  const nlIndicators =
    /\b(for|like|something|want|need|smooth|fruity|bright|bold|light|dark|morning|recommend|looking|find|help|my|with)\b/i;
  return nlIndicators.test(query);
}

// ---------------------------------------------------------------------------
// AI extraction step
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are a coffee product search assistant. Extract structured intent from user queries.
Always return valid JSON only — no markdown, no explanation outside the JSON.`;

function buildExtractionPrompt(query: string): string {
  return `Extract coffee search intent and return JSON only:
{
  "intent": "product_discovery" | "recommendation" | "how_to" | "reorder",
  "filtersExtracted": {
    "brewMethod": string | undefined,
    "roastLevel": "light" | "medium" | "dark" | undefined,
    "flavorProfile": string[] | undefined,
    "origin": string | undefined
  },
  "explanation": "one sentence why these results match the query",
  "followUps": ["short clarifying question 1", "short clarifying question 2"]
}

Query: "${query}"`;
}

async function extractAgenticFilters(
  query: string
): Promise<AgenticExtraction | null> {
  try {
    const result = await chatCompletion({
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildExtractionPrompt(query) },
      ],
      maxTokens: 300,
      temperature: 0.2,
    });

    const parsed = JSON.parse(result.text) as AgenticExtraction;
    return parsed;
  } catch {
    // LLM failure is non-fatal — fall back to standard keyword search
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
    const sessionId = searchParams.get("sessionId") ?? "";
    const turnCount = parseInt(searchParams.get("turnCount") ?? "0", 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isDisabled: false };
    let searchQuery = "";

    if (query && query.trim().length > 0) {
      searchQuery = query.trim().toLowerCase();
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { origin: { hasSome: [searchQuery] } },
        { tastingNotes: { hasSome: [searchQuery] } },
      ];
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

    if (
      query &&
      isNaturalLanguageQuery(query) &&
      (await isAIConfigured())
    ) {
      agenticData = await extractAgenticFilters(query);

      if (agenticData?.filtersExtracted) {
        const { roastLevel, origin: extractedOrigin } =
          agenticData.filtersExtracted;

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

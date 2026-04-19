import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAIConfigured } from "@/lib/ai-client";
import { getPublicSiteSettings } from "@/lib/data";
import { DEFAULT_VOICE_EXAMPLES } from "@/lib/ai/voice-examples";
import { buildCatalogSnapshot } from "@/lib/ai/catalog";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import {
  extractAgenticFilters,
  fullTextSearchIds,
  isNaturalLanguageQuery,
  isSalutation,
  parseConversationHistory,
  validateFollowUps,
} from "@/lib/ai/extraction";
import type { AgenticExtraction } from "@/types/search";

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
    const conversationHistory = parseConversationHistory(urlParams.get("history"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isDisabled: false, type: ProductType.COFFEE };
    let searchQuery = "";
    let ftsOrderedIds: string[] = [];

    if (query && query.trim().length > 0) {
      searchQuery = query.trim().toLowerCase();

      const roastPatternMatch = searchQuery.match(/\b(light|medium|dark)\s*roast\b/i);
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
          const ftsIds = await fullTextSearchIds(remainingQuery);
          if (ftsIds.length > 0) {
            whereClause.id = { in: ftsIds };
            ftsOrderedIds = ftsIds;
          }
        }
      } else {
        const ftsIds = await fullTextSearchIds(searchQuery);
        if (ftsIds.length > 0) {
          whereClause.id = { in: ftsIds };
          ftsOrderedIds = ftsIds;
        } else {
          whereClause.OR = [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { origin: { hasSome: [searchQuery] } },
          ];
        }
      }
    }

    if (roast) {
      const roastSlug = roast.toLowerCase().endsWith("-roast")
        ? roast.toLowerCase()
        : `${roast.toLowerCase()}-roast`;
      whereClause.categories = { some: { category: { slug: roastSlug } } };
      whereClause.type = ProductType.COFFEE;
    }

    if (origin) {
      whereClause.origin = { has: origin };
    }

    // -------------------------------------------------------------------------
    // Salutation detection — greeting-only input returns surface string, no search
    // -------------------------------------------------------------------------

    if (query && forceAI && isSalutation(query)) {
      const { aiVoiceSurfaces } = await getPublicSiteSettings();
      const salutation = aiVoiceSurfaces?.salutation;
      const { DEFAULT_VOICE_SURFACES } = await import("@/lib/ai/voice-surfaces");
      return NextResponse.json({
        products: [],
        query: searchQuery,
        count: 0,
        intent: null,
        filtersExtracted: null,
        acknowledgment: salutation ?? DEFAULT_VOICE_SURFACES.salutation,
        followUpQuestion: null,
        followUps: [],
        recommendedProductName: null,
        aiFailed: false,
        isSalutation: true,
        context: { sessionId, turnCount },
      });
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
      const systemPrompt = buildSystemPrompt(voiceExamples, aiVoicePersona, pageTitle, catalogSnapshot);
      agenticData = await extractAgenticFilters(query, systemPrompt, pageTitle, conversationHistory);

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
          delete whereClause.id;
          ftsOrderedIds = [];
        } else {
          delete whereClause.OR;
        }

        if (roastLevel && !roast) {
          const roastSlug = `${roastLevel.toLowerCase()}-roast`;
          whereClause.categories = { some: { category: { slug: roastSlug } } };
        }

        if (extractedOrigin && !origin) {
          whereClause.origin = Array.isArray(extractedOrigin)
            ? { hasSome: extractedOrigin }
            : { has: extractedOrigin };
        }

        if (flavorProfile && flavorProfile.length > 0) {
          const flavorEntries = flavorProfile.flatMap((f) => [
            { description: { contains: f, mode: "insensitive" as const } },
            { tastingNotes: { hasSome: [f.charAt(0).toUpperCase() + f.slice(1)] } },
          ]);
          whereClause.OR = flavorEntries;
        }

        if (isOrganic !== undefined) {
          whereClause.isOrganic = isOrganic;
        }

        if (processing) {
          whereClause.processing = { contains: processing, mode: "insensitive" };
        }

        if (variety) {
          whereClause.variety = { contains: variety, mode: "insensitive" };
        }

        if (priceMaxCents !== undefined || priceMinCents !== undefined) {
          const priceFilter: Record<string, number> = {};
          if (priceMinCents !== undefined) priceFilter.gte = priceMinCents;
          if (priceMaxCents !== undefined) priceFilter.lte = priceMaxCents;
          whereClause.variants = {
            some: {
              isDisabled: false,
              purchaseOptions: { some: { priceInCents: priceFilter } },
            },
          };
        }

        if (sortBy) {
          const sortMap: Record<string, object> = {
            newest: { createdAt: "desc" },
            top_rated: { averageRating: "desc" },
          };
          const supportedSort = sortMap[sortBy];
          if (supportedSort) {
            orderBy = supportedSort;
          }
        }

        // productType "merch" removes coffee-specific filters; unspecified falls through as coffee.
        if (agenticData.filtersExtracted.productType === "merch") {
          delete whereClause.type;
          delete whereClause.categories;
          delete whereClause.origin;
          delete whereClause.OR;
          delete whereClause.id;
          ftsOrderedIds = [];
          const keywords = agenticData.filtersExtracted.productKeywords ?? [];
          if (keywords.length > 0) {
            whereClause.OR = keywords.flatMap((kw) => [
              { name: { contains: kw, mode: "insensitive" as const } },
              { description: { contains: kw, mode: "insensitive" as const } },
            ]);
          } else if (query) {
            // Fallback to raw query if AI didn't extract keywords
            whereClause.OR = [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
            ];
          }
        } else {
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
      }
    }

    // -------------------------------------------------------------------------
    // Intent classification — gate routing before DB query
    // -------------------------------------------------------------------------

    if (agenticData) {
      if (agenticData.intent === "how_to") {
        return NextResponse.json({
          products: [], query: searchQuery, count: 0,
          intent: agenticData.intent, filtersExtracted: null,
          acknowledgment: agenticData.acknowledgment || null,
          followUpQuestion: agenticData.followUpQuestion || null, followUps: agenticData.followUps ?? [],
          recommendedProductName: null, aiFailed: false, context: { sessionId, turnCount },
        });
      }

      if (agenticData.intent === "reorder") {
        const redirect = agenticData.acknowledgment || "For orders and account stuff, you'd want to head to your account page — I'm really just here for the coffee.";
        return NextResponse.json({
          products: [], query: searchQuery, count: 0,
          intent: agenticData.intent, filtersExtracted: null,
          acknowledgment: redirect,
          followUpQuestion: null, followUps: [], recommendedProductName: null,
          aiFailed: false, context: { sessionId, turnCount },
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
          include: { category: { select: { name: true, slug: true } } },
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

    // Preserve full-text search ranking order
    let orderedProducts = products;
    if (ftsOrderedIds.length > 0 && !orderBy) {
      const rankByIdMap = new Map(ftsOrderedIds.map((id, idx) => [id, idx]));
      orderedProducts = [...products].sort((a, b) => {
        const rankA = rankByIdMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const rankB = rankByIdMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
      });
    }

    // App-side price sort (Prisma can't do nested aggregate orderBy)
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

    // Result reconciliation — promote named product to position 1
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

    // Cadence enforcement — specific queries (≤3 results) don't need narrowing chips
    if (agenticData && orderedProducts.length > 0 && orderedProducts.length <= 3) {
      agenticData.followUps = [];
      agenticData.followUpQuestion = "";
    }

    const aiFailed = forceAI && !agenticData;

    // Pre-validate follow-up chips — remove any that return 0 products
    const rawFollowUps = agenticData?.followUps ?? [];
    const validatedFollowUps =
      rawFollowUps.length > 0 ? await validateFollowUps(rawFollowUps) : rawFollowUps;

    return NextResponse.json({
      products: orderedProducts,
      query: searchQuery,
      count: products.length,
      intent: agenticData?.intent ?? null,
      filtersExtracted: agenticData?.filtersExtracted ?? null,
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
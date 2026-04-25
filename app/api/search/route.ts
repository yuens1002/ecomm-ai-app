import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { fullTextSearchIds } from "@/lib/search/full-text";

export async function GET(request: NextRequest) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const query = urlParams.get("q");
    const roast = urlParams.get("roast");
    const origin = urlParams.get("origin");
    const sessionId = urlParams.get("sessionId") ?? "";

    const PAGE_SIZE = 7;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isDisabled: false, type: ProductType.COFFEE };
    let searchQuery = "";
    let ftsOrderedIds: string[] = [];
    let ftsTotalMatches = 0;

    if (query && query.trim().length > 0) {
      searchQuery = query.trim().toLowerCase();

      const roastPatternMatch = searchQuery.match(/\b(light|medium|dark)\s*roast\b/i);
      if (roastPatternMatch && !roast) {
        const level = roastPatternMatch[1].toLowerCase();
        whereClause.categories = {
          some: { category: { slug: `${level}-roast` } },
        };

        const remainingQuery = searchQuery
          .replace(/\b(light|medium|dark)\s*roast\b/i, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (remainingQuery.length > 0) {
          const ftsIds = await fullTextSearchIds(remainingQuery);
          if (ftsIds.length > 0) {
            ftsTotalMatches = ftsIds.length;
            ftsOrderedIds = ftsIds.slice(0, PAGE_SIZE);
            whereClause.id = { in: ftsOrderedIds };
          }
        }
      } else {
        const ftsIds = await fullTextSearchIds(searchQuery);
        if (ftsIds.length > 0) {
          ftsTotalMatches = ftsIds.length;
          ftsOrderedIds = ftsIds.slice(0, PAGE_SIZE);
          whereClause.id = { in: ftsOrderedIds };
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
    }

    if (origin) {
      whereClause.origin = { has: origin };
    }

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

    // Total count: FTS path knows it from the ranked id list; fallback path counts at DB.
    const isFtsPath = ftsOrderedIds.length > 0;
    const [totalCount, products] = await Promise.all([
      isFtsPath
        ? Promise.resolve(ftsTotalMatches)
        : prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
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
        ...(isFtsPath ? {} : { take: PAGE_SIZE }),
      }),
    ]);

    let orderedProducts = products;
    if (isFtsPath) {
      const rankByIdMap = new Map(ftsOrderedIds.map((id, idx) => [id, idx]));
      orderedProducts = [...products].sort((a, b) => {
        const rankA = rankByIdMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const rankB = rankByIdMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
      });
    }

    return NextResponse.json({
      products: orderedProducts,
      query: searchQuery,
      count: totalCount,
      returnedCount: orderedProducts.length,
      context: { sessionId },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const roast = searchParams.get("roast");
    const origin = searchParams.get("origin");
    const sessionId = searchParams.get("sessionId");

    // Build the where clause dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};
    let searchQuery = "";

    if (query && query.trim().length > 0) {
      searchQuery = query.trim().toLowerCase();
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { origin: { hasSome: [searchQuery] } }, // Case sensitive for arrays usually, but let's try
        { tastingNotes: { hasSome: [searchQuery] } },
      ];
    }

    if (roast) {
      const roastSlug = roast.toLowerCase().endsWith("-roast")
        ? roast.toLowerCase()
        : `${roast.toLowerCase()}-roast`;

      whereClause.categories = {
        some: {
          category: {
            slug: roastSlug,
          },
        },
      };
    }

    if (origin) {
      // If origin is "Blend", we look for it in the array
      // If origin is a country, we look for it
      whereClause.origin = { has: origin };
    }

    // Track search activity only if there's a text query
    const session = await auth();
    if (sessionId && query) {
      await prisma.userActivity.create({
        data: {
          sessionId,
          userId: session?.user?.id || null,
          activityType: "SEARCH",
          searchQuery: query.trim(),
        },
      });
    }

    // Search products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        variants: {
          include: {
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
        images: {
          select: {
            url: true,
            altText: true,
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
        },
      },
      take: 50,
    });

    return NextResponse.json({
      products,
      query: searchQuery,
      count: products.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}

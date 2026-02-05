import { NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { auth } from "@/auth";
import { getUserRecommendationContext, getTrendingProducts } from "@/lib/data";
import { prisma } from "@/lib/prisma";

// RecommendationProduct interface matches the type returned from Prisma queries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  tastingNotes: string[];
  reasoning?: string;
}

/**
 * API endpoint for personalized product recommendations.
 * Returns 4-6 product recommendations based on user behavior or trending data.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");
    const excludeId = searchParams.get("exclude"); // Optional product ID to exclude

    // Check for authenticated user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      // Anonymous user - return trending products
      const trending = await getTrendingProducts(limit + 1, 7);
      const filtered = trending.filter((p) => !excludeId || p!.id !== excludeId).slice(0, limit);
      return NextResponse.json({
        products: filtered.map((p) => ({
          id: p!.id,
          name: p!.name,
          slug: p!.slug,
          tastingNotes: p!.tastingNotes,
          images: p!.images,
          variants: p!.variants,
          categories: p!.categories,
        })),
        isPersonalized: false,
        source: "trending",
      });
    }

    // Authenticated user - try to get personalized recommendations
    // Fall back to trending if personalization fails
    let userContext;
    try {
      userContext = await getUserRecommendationContext(userId);
    } catch (contextError) {
      console.warn("Failed to get user context, falling back to trending:", contextError);
      const trending = await getTrendingProducts(limit + 1, 7);
      const filtered = trending.filter((p) => !excludeId || p!.id !== excludeId).slice(0, limit);
      return NextResponse.json({
        products: filtered.map((p) => ({
          id: p!.id,
          name: p!.name,
          slug: p!.slug,
          tastingNotes: p!.tastingNotes,
          images: p!.images,
          variants: p!.variants,
          categories: p!.categories,
        })),
        isPersonalized: false,
        source: "trending",
      });
    }

    // Check if user has enough history for personalization
    const hasHistory =
      userContext.purchaseHistory.totalOrders > 0 ||
      userContext.recentViews.length > 0;

    if (!hasHistory) {
      // New user - return trending products
      const trending = await getTrendingProducts(limit + 1, 7);
      const filtered = trending.filter((p) => !excludeId || p!.id !== excludeId).slice(0, limit);
      return NextResponse.json({
        products: filtered.map((p) => ({
          id: p!.id,
          name: p!.name,
          slug: p!.slug,
          tastingNotes: p!.tastingNotes,
          images: p!.images,
          variants: p!.variants,
          categories: p!.categories,
        })),
        isPersonalized: false,
        source: "trending",
      });
    }

    // Get products they haven't ordered recently
    const purchasedProductIds = userContext.purchaseHistory.products.map(
      (p: { name: string }) => p.name
    );
    const recentlyViewedIds = userContext.recentViews.map((v) => v.name);

    // Fetch all products (excluding the specified product if provided)
    const allProducts = await prisma.product.findMany({
      where: {
        type: ProductType.COFFEE,
        isDisabled: false,
        ...(excludeId && { id: { not: excludeId } }),
      },
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
        variants: {
          include: {
            purchaseOptions: {
              where: { type: "ONE_TIME" },
              take: 1,
            },
          },
        },
        categories: {
          where: { isPrimary: true },
          include: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    // Score products based on user preferences
    const scoredProducts = allProducts.map((product) => {
      let score = 0;

      // Match tasting notes with user's top preferences
      const matchingNotes = product.tastingNotes.filter((note) =>
        userContext.purchaseHistory.topTastingNotes.includes(note)
      );
      score += matchingNotes.length * 5;

      // Slightly prefer products they've viewed but not purchased
      if (
        recentlyViewedIds.includes(product.name) &&
        !purchasedProductIds.includes(product.name)
      ) {
        score += 3;
      }

      // Penalize recently purchased products (avoid repetition)
      if (purchasedProductIds.slice(0, 3).includes(product.name)) {
        score -= 20;
      }

      return { product, score };
    });

    // Sort by score and take top recommendations
    const recommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ product }) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        tastingNotes: product.tastingNotes,
        images: product.images,
        variants: product.variants,
        categories: product.categories,
      }));

    return NextResponse.json({
      products: recommendations,
      isPersonalized: true,
      source: "behavioral",
      userPreferences: {
        preferredRoastLevel: userContext.purchaseHistory.preferredRoastLevel,
        topTastingNotes: userContext.purchaseHistory.topTastingNotes.slice(
          0,
          3
        ),
      },
    });
  } catch (error) {
    console.error("Recommendations API Error:", error);
    return new NextResponse(
      JSON.stringify({ message: "Failed to fetch recommendations" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

import { prisma } from "./prisma";
import { RoastLevel } from "@prisma/client"; // Import the enum

// --- COMMON INCLUDE OBJECT ---
// We define this once to ensure all product cards get the same minimal data for rendering.
const productCardIncludes = {
  images: {
    orderBy: { order: "asc" as const },
    take: 1, // Only need the first image
  },
  variants: {
    include: {
      purchaseOptions: {
        where: { type: "ONE_TIME" as const },
        take: 1, // Only need one price
      },
    },
  },
  // This is the key: always fetch the primary category for linking
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
};
// ------------------------------

/**
 * Fetches all products marked as "isFeatured" and orders them.
 */
export async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
      },
      orderBy: {
        featuredOrder: "asc",
      },
      include: productCardIncludes, // <-- USE COMMON INCLUDE
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch featured products.");
  }
}

/**
 * Fetches a single product by its slug.
 * This is the CORRECTED version for /products/[productSlug]
 */
export async function getProductBySlug(productSlug?: string | null) {
  // Validate input
  if (!productSlug || typeof productSlug !== "string") {
    return null;
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: productSlug,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          include: {
            purchaseOptions: true,
          },
        },
        // We need all categories to match against the `from` param
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
    return product;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch product.");
  }
}

/**
 * Fetches a lightweight list of all products for the AI.
 */
export async function getProductsForAI() {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        tastingNotes: true,
      },
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch products for AI.");
  }
}

/**
 * Fetches related products based on roast level.
 */
export async function getRelatedProducts(
  currentProductId: string,
  roastLevel: RoastLevel,
  count: number = 4
) {
  try {
    const products = await prisma.product.findMany({
      where: {
        roastLevel: roastLevel, // Match the roast level
        id: {
          not: currentProductId, // Exclude the current product
        },
      },
      take: count, // Limit to 4 products
      include: productCardIncludes, // <-- USE COMMON INCLUDE
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch related products.");
  }
}

/**
 * Fetches *only* the slugs for all products.
 * This is used by generateStaticParams for /products/[productSlug]
 */
export async function getAllProductSlugs() {
  try {
    const products = await prisma.product.findMany({
      select: {
        slug: true,
      },
    });

    // We only need the slug for the static paths
    const valid = products
      .filter((p) => typeof p.slug === "string" && p.slug.length > 0)
      .map((p) => ({ productSlug: p.slug as string }));

    return valid;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch product slugs.");
  }
}

// --- CATEGORY FUNCTIONS ---

/**
 * Fetches all category slugs.
 * Used by generateStaticParams for /categories/[categorySlug]
 */
export async function getCategorySlugs() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
      },
    });
    return categories;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch category slugs.");
  }
}

/**
 * Fetches a single category by its slug.
 */
export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: slug },
    });
    return category;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch category.");
  }
}

/**
 * Fetches all products belonging to a specific category.
 */
export async function getProductsByCategorySlug(categorySlug: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        // Filter by the many-to-many relation
        categories: {
          some: {
            category: {
              slug: categorySlug,
            },
          },
        },
      },
      include: productCardIncludes, // <-- USE COMMON INCLUDE
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch products by category.");
  }
}

/**
 * Fetches all categories for the main navigation.
 */
export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return categories;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch categories.");
  }
}

// --- USER BEHAVIOR & RECOMMENDATION FUNCTIONS ---

/**
 * Fetches a user's purchase history with product details.
 * Returns orders with their items, sorted by most recent first.
 */
export async function getUserPurchaseHistory(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: {
          in: ["SHIPPED", "PICKED_UP"], // Only completed orders
        },
      },
      include: {
        items: {
          include: {
            purchaseOption: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        roastLevel: true,
                        tastingNotes: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to last 20 orders
    });

    return orders as any; // Type assertion for complex nested includes
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user purchase history.");
  }
}

/**
 * Fetches a user's recently viewed products.
 * Returns unique products based on PRODUCT_VIEW activities.
 */
export async function getUserRecentViews(userId: string, limit: number = 10) {
  try {
    const activities = await prisma.userActivity.findMany({
      where: {
        userId: userId,
        activityType: "PRODUCT_VIEW",
        productId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit * 2, // Fetch extra to account for duplicates
      select: {
        productId: true,
        createdAt: true,
      },
    });

    // Get unique product IDs (most recent view of each product)
    const seenIds = new Set<string>();
    const uniqueProductIds = activities
      .filter((a) => {
        if (a.productId && !seenIds.has(a.productId)) {
          seenIds.add(a.productId);
          return true;
        }
        return false;
      })
      .map((a) => a.productId!)
      .slice(0, limit);

    // Fetch full product details
    if (uniqueProductIds.length === 0) return [];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: uniqueProductIds,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        roastLevel: true,
        tastingNotes: true,
      },
    });

    // Preserve order from activities
    return uniqueProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user recent views.");
  }
}

/**
 * Fetches a user's search history.
 * Returns unique search queries with their frequency.
 */
export async function getUserSearchHistory(userId: string, limit: number = 10) {
  try {
    const searches = await prisma.userActivity.findMany({
      where: {
        userId: userId,
        activityType: "SEARCH",
        searchQuery: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        searchQuery: true,
        createdAt: true,
      },
    });

    // Aggregate by query with frequency and most recent date
    const queryMap = new Map<
      string,
      { query: string; count: number; lastSearched: Date }
    >();

    searches.forEach((s) => {
      if (!s.searchQuery) return;
      const existing = queryMap.get(s.searchQuery);
      if (existing) {
        existing.count++;
        if (s.createdAt > existing.lastSearched) {
          existing.lastSearched = s.createdAt;
        }
      } else {
        queryMap.set(s.searchQuery, {
          query: s.searchQuery,
          count: 1,
          lastSearched: s.createdAt,
        });
      }
    });

    // Convert to array and sort by frequency, then by recency
    return Array.from(queryMap.values())
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastSearched.getTime() - a.lastSearched.getTime();
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user search history.");
  }
}

/**
 * Aggregates all user behavioral data into a structured context for AI consumption.
 * This is the primary function used by the recommendation system.
 */
export async function getUserRecommendationContext(userId: string) {
  try {
    const [purchaseHistory, recentViews, searchHistory] = await Promise.all([
      getUserPurchaseHistory(userId),
      getUserRecentViews(userId, 15),
      getUserSearchHistory(userId, 10),
    ]);

    // Extract purchased products
    const purchasedProducts = purchaseHistory.flatMap((order: any) =>
      order.items.map((item: any) => ({
        name: item.purchaseOption.variant.product.name,
        roastLevel: item.purchaseOption.variant.product.roastLevel,
        tastingNotes: item.purchaseOption.variant.product.tastingNotes,
        purchasedAt: order.createdAt,
      }))
    );

    // Analyze preferences
    const roastLevelCounts = new Map<string, number>();
    const tastingNotesCounts = new Map<string, number>();

    purchasedProducts.forEach((p: any) => {
      roastLevelCounts.set(p.roastLevel, (roastLevelCounts.get(p.roastLevel) || 0) + 1);
      p.tastingNotes.forEach((note: string) => {
        tastingNotesCounts.set(note, (tastingNotesCounts.get(note) || 0) + 1);
      });
    });

    const preferredRoastLevel = Array.from(roastLevelCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const topTastingNotes = Array.from(tastingNotesCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);

    return {
      userId,
      purchaseHistory: {
        totalOrders: purchaseHistory.length,
        products: purchasedProducts,
        preferredRoastLevel,
        topTastingNotes,
      },
      recentViews: recentViews.map((p) => ({
        name: p!.name,
        slug: p!.slug,
        roastLevel: p!.roastLevel,
        tastingNotes: p!.tastingNotes,
      })),
      searchHistory: searchHistory.map((s) => ({
        query: s.query,
        frequency: s.count,
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user recommendation context.");
  }
}

/**
 * Fetches trending products based on UserActivity analytics.
 * Used for anonymous users or as fallback recommendations.
 */
export async function getTrendingProducts(limit: number = 6, daysBack: number = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    // Get product view counts from the last N days
    const productViews = await prisma.userActivity.groupBy({
      by: ["productId"],
      where: {
        activityType: "PRODUCT_VIEW",
        productId: {
          not: null,
        },
        createdAt: {
          gte: since,
        },
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: "desc",
        },
      },
      take: limit,
    });

    const productIds = (productViews as Array<{ productId: string | null }>)
      .map((pv) => pv.productId)
      .filter((id): id is string => id !== null);

    if (productIds.length === 0) return [];

    // Fetch full product details
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: productCardIncludes,
    });

    // Preserve order from analytics
    return productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch trending products.");
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint for admin analytics data.
 * Returns trending products, search queries, and conversion metrics.
 */
export async function GET(request: Request) {
  try {
    // Check for admin authentication
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    const since = new Date();
    since.setDate(since.getDate() - days);

    // === 1. TRENDING PRODUCTS (Most Viewed) ===
    const productViews = await prisma.userActivity.groupBy({
      by: ["productId"],
      where: {
        activityType: "PRODUCT_VIEW",
        productId: { not: null },
        createdAt: { gte: since },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    });

    const trendingProductIds = (
      productViews as Array<{ productId: string | null }>
    )
      .map((pv) => pv.productId)
      .filter((id): id is string => id !== null);

    const trendingProducts = await prisma.product.findMany({
      where: { id: { in: trendingProductIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trendingProductsWithViews = trendingProducts.map((product: any) => {
      const views =
        (
          productViews as Array<{
            productId: string;
            _count: { productId: number };
          }>
        ).find((pv) => pv.productId === product.id)?._count.productId || 0;

      const roastLevel =
        product.categories
          .map((c: any) => c.category)
          .find((c: any) => c.label === "Roast Level")?.name || "Medium";

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        roastLevel,
        views,
      };
    });

    // === 2. TOP SEARCH QUERIES ===
    const searchActivities = await prisma.userActivity.findMany({
      where: {
        activityType: "SEARCH",
        searchQuery: { not: null },
        createdAt: { gte: since },
      },
      select: { searchQuery: true },
    });

    const searchQueryMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchActivities.forEach((s: any) => {
      if (!s.searchQuery) return;
      searchQueryMap.set(
        s.searchQuery,
        (searchQueryMap.get(s.searchQuery) || 0) + 1
      );
    });

    const topSearches = Array.from(searchQueryMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // === 3. CONVERSION METRICS ===
    const totalProductViews = await prisma.userActivity.count({
      where: {
        activityType: "PRODUCT_VIEW",
        createdAt: { gte: since },
      },
    });

    const totalAddToCart = await prisma.userActivity.count({
      where: {
        activityType: "ADD_TO_CART",
        createdAt: { gte: since },
      },
    });

    const totalOrders = await prisma.order.count({
      where: {
        createdAt: { gte: since },
        status: { in: ["SHIPPED", "PICKED_UP", "PENDING"] },
      },
    });

    const conversionRate =
      totalProductViews > 0
        ? ((totalOrders / totalProductViews) * 100).toFixed(2)
        : "0.00";

    const cartConversionRate =
      totalAddToCart > 0
        ? ((totalOrders / totalAddToCart) * 100).toFixed(2)
        : "0.00";

    // === 4. ACTIVITY BREAKDOWN ===
    const activityBreakdown = await prisma.userActivity.groupBy({
      by: ["activityType"],
      where: {
        createdAt: { gte: since },
      },
      _count: { activityType: true },
    });

    // === 5. DAILY ACTIVITY TREND (Last 7 days) ===
    const dailyActivity = await Promise.all(
      Array.from({ length: Math.min(days, 30) }, async (_, i) => {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.userActivity.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });

        return {
          date: dayStart.toISOString().split("T")[0],
          count,
        };
      })
    );

    return NextResponse.json({
      period: `Last ${days} days`,
      trendingProducts: trendingProductsWithViews,
      topSearches,
      metrics: {
        totalProductViews,
        totalAddToCart,
        totalOrders,
        conversionRate: parseFloat(conversionRate),
        cartConversionRate: parseFloat(cartConversionRate),
      },
      activityBreakdown,
      dailyActivity: dailyActivity.reverse(), // Oldest to newest
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return new NextResponse(
      JSON.stringify({ message: "Failed to fetch analytics" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

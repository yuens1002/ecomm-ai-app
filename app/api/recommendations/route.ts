import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHomeRecommendations } from "@/lib/data";

/**
 * API endpoint for personalized product recommendations.
 * Returns 4-6 product recommendations based on user behavior or trending data.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");
    const excludeId = searchParams.get("exclude") || undefined;

    const session = await auth();
    const userId = session?.user?.id;

    const result = await getHomeRecommendations(userId, limit, excludeId);

    return NextResponse.json({
      products: result.products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        roastLevel: p.roastLevel,
        isFeatured: p.isFeatured,
        tastingNotes: p.tastingNotes,
        variants: p.variants,
        categories: p.categories,
      })),
      isPersonalized: result.isPersonalized,
      source: result.source,
      ...(result.userPreferences && {
        userPreferences: result.userPreferences,
      }),
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

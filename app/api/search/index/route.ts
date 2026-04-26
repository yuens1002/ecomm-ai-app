import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the catalog index for client-side search (consumed by the search drawer).
 * Includes both COFFEE and MERCH products. Cached briefly via Cache-Control headers.
 *
 * The shape matches FeaturedProduct (productCardIncludes) so the drawer can render
 * each result through the canonical `<ProductCard product={p} />` component.
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isDisabled: false },
      include: {
        variants: {
          where: { isDisabled: false },
          orderBy: { order: "asc" },
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
            purchaseOptions: {
              where: { type: "ONE_TIME" },
              orderBy: { priceInCents: "asc" },
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
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        products,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Failed to build search index:", error);
    return NextResponse.json(
      { error: "Failed to build search index" },
      { status: 500 }
    );
  }
}

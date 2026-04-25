import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the catalog index for client-side search (consumed by the search drawer).
 * Includes both COFFEE and MERCH products. Cached briefly via Cache-Control headers.
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isDisabled: false },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        tastingNotes: true,
        origin: true,
        roastLevel: true,
        isFeatured: true,
        categories: {
          where: { isPrimary: true },
          select: {
            category: { select: { name: true, slug: true } },
          },
          take: 1,
        },
        variants: {
          where: { isDisabled: false },
          orderBy: { order: "asc" },
          take: 1,
          select: {
            images: {
              select: { url: true, altText: true },
              orderBy: { order: "asc" },
              take: 1,
            },
            purchaseOptions: {
              select: { priceInCents: true },
            },
          },
        },
      },
    });

    const indexed = products.map((p) => {
      const primaryCategory = p.categories[0]?.category ?? null;
      const firstImage = p.variants[0]?.images[0] ?? null;
      const allPrices = p.variants.flatMap((v) =>
        v.purchaseOptions.map((po) => po.priceInCents)
      );
      const minPriceInCents = allPrices.length > 0 ? Math.min(...allPrices) : null;
      const description =
        p.description && p.description.length > 200
          ? p.description.slice(0, 200) + "…"
          : p.description;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        description,
        tastingNotes: p.tastingNotes,
        origin: p.origin,
        roastLevel: p.roastLevel,
        isFeatured: p.isFeatured,
        primaryCategory,
        primaryImage: firstImage,
        minPriceInCents,
      };
    });

    return NextResponse.json(
      {
        products: indexed,
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

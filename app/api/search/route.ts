import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const sessionId = searchParams.get("sessionId");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ products: [], query: "" });
    }

    const searchQuery = query.trim().toLowerCase();

    // Track search activity
    const session = await auth();
    if (sessionId) {
      await prisma.userActivity.create({
        data: {
          sessionId,
          userId: session?.user?.id || null,
          activityType: "SEARCH",
          searchQuery: searchQuery,
        },
      });
    }

    // Search products by name, description, origin, or tasting notes
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { origin: { hasSome: [searchQuery] } },
          { tastingNotes: { hasSome: [searchQuery] } },
        ],
      },
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

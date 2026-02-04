import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlaceholderImage } from "@/lib/placeholder-images";

export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ addOns: [] });
    }

    // Fetch all add-ons for the products in the cart
    const addOns = await prisma.addOnLink.findMany({
      where: {
        primaryProductId: {
          in: productIds,
        },
        addOnProduct: {
          isDisabled: false,
        },
        addOnVariant: {
          stockQuantity: {
            gt: 0,
          },
        },
      },
      include: {
        addOnProduct: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            images: {
              select: {
                url: true,
              },
              take: 1,
            },
            categories: {
              where: {
                isPrimary: true,
              },
              include: {
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            purchaseOptions: {
              where: {
                type: "ONE_TIME",
              },
              select: {
                id: true,
                priceInCents: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Filter out add-ons with no valid purchase options and deduplicate
    const addOnMap = new Map();

    for (const addOn of addOns) {
      if (
        !addOn.addOnVariant ||
        addOn.addOnVariant.purchaseOptions.length === 0
      ) {
        continue;
      }

      const key = `${addOn.addOnProduct.id}-${addOn.addOnVariant.id}`;

      if (!addOnMap.has(key)) {
        addOnMap.set(key, {
          product: {
            id: addOn.addOnProduct.id,
            name: addOn.addOnProduct.name,
            slug: addOn.addOnProduct.slug,
            description: addOn.addOnProduct.description,
            // Add-ons are merch products, use "culture" for coffee lifestyle images
            imageUrl:
              addOn.addOnProduct.images[0]?.url ||
              getPlaceholderImage(addOn.addOnProduct.name, 400, "culture"),
            categorySlug:
              addOn.addOnProduct.categories[0]?.category.slug || "shop",
          },
          variant: {
            id: addOn.addOnVariant.id,
            name: addOn.addOnVariant.name,
            priceInCents: addOn.addOnVariant.purchaseOptions[0].priceInCents,
          },
        });
      }
    }

    return NextResponse.json({ addOns: Array.from(addOnMap.values()) });
  } catch (error) {
    console.error("Error fetching cart add-ons:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch add-ons",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

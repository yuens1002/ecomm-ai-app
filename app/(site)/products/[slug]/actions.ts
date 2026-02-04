"use server";

import { prisma } from "@/lib/prisma";
import { getWeightUnit } from "@/lib/config/app-settings";
import { fromGrams, roundToInt, WeightUnitOption } from "@/lib/weight-unit";
import { WeightUnit } from "@prisma/client";
import { getPlaceholderImage } from "@/lib/placeholder-images";

export interface AddOnItem {
  product: {
    id: string;
    name: string;
    slug: string;
    type: string;
    description: string | null;
  };
  variant: {
    id: string;
    name: string;
    weight: number;
    stockQuantity: number;
    purchaseOptions: Array<{
      id: string;
      priceInCents: number;
      type: string;
    }>;
  };
  discountedPriceInCents: number;
  imageUrl?: string;
  categorySlug?: string;
}

/**
 * Fetch product add-ons for display on product pages
 */
export async function getProductAddOns(
  productId: string
): Promise<AddOnItem[]> {
  try {
    const addOns = await prisma.addOnLink.findMany({
      where: {
        primaryProductId: productId,
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
            type: true,
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
            weight: true,
            stockQuantity: true,
            purchaseOptions: {
              where: {
                type: "ONE_TIME",
              },
              select: {
                id: true,
                priceInCents: true,
                type: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Filter out add-ons with no valid purchase options
    // Note: Variants are guaranteed to exist (products must have at least one variant)
    const validAddOns = addOns.filter(
      (addOn) => addOn.addOnVariant!.purchaseOptions.length > 0
    );

    // Get current weight unit setting
    const currentUnit = await getWeightUnit();
    const isImperial = currentUnit === WeightUnit.IMPERIAL;

    // Transform to response format with weight conversion
    return validAddOns.map((addOn) => {
      // Type assertion: variants are guaranteed to exist on products
      const variant = addOn.addOnVariant!;
      const purchaseOption = variant.purchaseOptions[0];

      // Convert weight to current site unit
      let convertedWeight = variant.weight;
      if (variant.weight && isImperial) {
        convertedWeight = roundToInt(
          fromGrams(variant.weight, WeightUnitOption.IMPERIAL)
        );
      }

      return {
        product: addOn.addOnProduct,
        variant: {
          id: variant.id,
          name: variant.name,
          weight: convertedWeight,
          stockQuantity: variant.stockQuantity,
          purchaseOptions: [
            {
              id: purchaseOption.id,
              priceInCents: purchaseOption.priceInCents,
              type: purchaseOption.type,
            },
          ],
        },
        discountedPriceInCents:
          addOn.discountedPriceInCents ?? purchaseOption.priceInCents,
        // Add-ons are merch products, use "culture" category for coffee lifestyle images
        imageUrl:
          addOn.addOnProduct.images[0]?.url ||
          getPlaceholderImage(addOn.addOnProduct.name, 400, "culture"),
        categorySlug: addOn.addOnProduct.categories[0]?.category.slug || "shop",
      };
    });
  } catch (error) {
    console.error("Failed to fetch add-ons:", error);
    return [];
  }
}

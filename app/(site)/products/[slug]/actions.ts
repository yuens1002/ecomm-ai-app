"use server";

import { prisma } from "@/lib/prisma";
import { getWeightUnit } from "@/lib/config/app-settings";
import { fromGrams, roundToInt, WeightUnitOption } from "@/lib/weight-unit";
import { WeightUnit, type DiscountType } from "@prisma/client";
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

const DISCOUNT_CALC: Record<DiscountType, (price: number, value: number) => number> = {
  FIXED: (price, value) => Math.max(0, price - value),
  PERCENTAGE: (price, value) => Math.round(price * (1 - value / 100)),
};

function computeEffectivePrice(
  price: number,
  discountType: DiscountType | null,
  discountValue: number | null
): number {
  if (!discountType || discountValue == null) return price;
  return DISCOUNT_CALC[discountType](price, discountValue);
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
        // Allow both: specific variant links AND null-variant (all variants) links
        OR: [
          { addOnVariant: { stockQuantity: { gt: 0 } } },
          { addOnVariantId: null },
        ],
      },
      include: {
        addOnProduct: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            description: true,
            categories: {
              where: { isPrimary: true },
              include: {
                category: { select: { slug: true } },
              },
              take: 1,
            },
            variants: {
              where: { isDisabled: false },
              select: {
                id: true,
                name: true,
                weight: true,
                stockQuantity: true,
                images: {
                  select: { url: true },
                  orderBy: { order: "asc" as const },
                  take: 1,
                },
                purchaseOptions: {
                  where: { type: "ONE_TIME" },
                  select: {
                    id: true,
                    priceInCents: true,
                    salePriceInCents: true,
                    type: true,
                  },
                  take: 1,
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            isDisabled: true,
            weight: true,
            stockQuantity: true,
            images: {
              select: { url: true },
              orderBy: { order: "asc" as const },
              take: 1,
            },
            purchaseOptions: {
              where: { type: "ONE_TIME" },
              select: {
                id: true,
                priceInCents: true,
                salePriceInCents: true,
                type: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    const currentUnit = await getWeightUnit();
    const isImperial = currentUnit === WeightUnit.IMPERIAL;

    const results: AddOnItem[] = [];
    const seen = new Set<string>();

    for (const addOn of addOns) {
      const categorySlug =
        addOn.addOnProduct.categories[0]?.category.slug || "shop";

      // Null-variant: expand to all in-stock variants of the add-on product
      if (addOn.addOnVariantId === null) {
        const inStockVariants = addOn.addOnProduct.variants.filter(
          (v) => v.stockQuantity > 0 && v.purchaseOptions.length > 0
        );

        for (const variant of inStockVariants) {
          const key = `${addOn.addOnProduct.id}-${variant.id}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const po = variant.purchaseOptions[0];
          const basePrice = po.salePriceInCents ?? po.priceInCents;
          const effectivePrice = computeEffectivePrice(
            basePrice,
            addOn.discountType,
            addOn.discountValue
          );

          let weight = variant.weight;
          if (weight && isImperial) {
            weight = roundToInt(fromGrams(weight, WeightUnitOption.IMPERIAL));
          }

          results.push({
            product: addOn.addOnProduct,
            variant: {
              id: variant.id,
              name: variant.name,
              weight,
              stockQuantity: variant.stockQuantity,
              purchaseOptions: [
                { id: po.id, priceInCents: po.priceInCents, type: po.type },
              ],
            },
            discountedPriceInCents: effectivePrice,
            imageUrl:
              variant.images[0]?.url ||
              getPlaceholderImage(addOn.addOnProduct.name, 400, "culture"),
            categorySlug,
          });
        }
      } else {
        // Specific variant link
        const variant = addOn.addOnVariant!;
        if (variant.isDisabled || variant.purchaseOptions.length === 0) continue;

        const key = `${addOn.addOnProduct.id}-${variant.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const po = variant.purchaseOptions[0];
        const basePrice = po.salePriceInCents ?? po.priceInCents;
        const effectivePrice = computeEffectivePrice(
          basePrice,
          addOn.discountType,
          addOn.discountValue
        );

        let weight = variant.weight;
        if (weight && isImperial) {
          weight = roundToInt(fromGrams(weight, WeightUnitOption.IMPERIAL));
        }

        results.push({
          product: addOn.addOnProduct,
          variant: {
            id: variant.id,
            name: variant.name,
            weight,
            stockQuantity: variant.stockQuantity,
            purchaseOptions: [
              { id: po.id, priceInCents: po.priceInCents, type: po.type },
            ],
          },
          discountedPriceInCents: effectivePrice,
          imageUrl:
            variant.images[0]?.url ||
            getPlaceholderImage(addOn.addOnProduct.name, 400, "culture"),
          categorySlug,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Failed to fetch add-ons:", error);
    return [];
  }
}

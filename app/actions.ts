"use server";

import { prisma } from "@/lib/prisma";

export async function getProductVariantForCart(variantId: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        purchaseOptions: {
          where: { type: "ONE_TIME" },
          take: 1,
        },
      },
    });

    if (!variant) return null;

    return {
      id: variant.id,
      name: variant.name,
      purchaseOptionId: variant.purchaseOptions[0]?.id,
      priceInCents: variant.purchaseOptions[0]?.priceInCents || 0,
      product: {
        id: variant.product.id,
        name: variant.product.name,
        slug: variant.product.slug,
        image: variant.product.images[0]?.url || "/placeholder.png",
      },
    };
  } catch (error) {
    console.error("Error fetching variant for cart:", error);
    return null;
  }
}

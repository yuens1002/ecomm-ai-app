"use server";

import { prisma } from "@/lib/prisma";

/**
 * Get all published pages that should appear in the site header
 * Ordered by headerOrder (nulls last) then by title
 */
export async function getPagesForHeader() {
  try {
    const pages = await prisma.page.findMany({
      where: {
        isPublished: true,
        showInHeader: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true,
        headerOrder: true,
        url: true,
        type: true,
      },
      orderBy: [
        { headerOrder: { sort: "asc", nulls: "last" } },
        { title: "asc" },
      ],
    });
    return pages;
  } catch (error) {
    console.error("Error fetching pages for header:", error);
    return [];
  }
}

/**
 * Get all published pages that should appear in the site footer
 * Ordered by footerOrder (nulls last) then by title
 */
export async function getPagesForFooter() {
  try {
    const pages = await prisma.page.findMany({
      where: {
        isPublished: true,
        showInFooter: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true,
        footerOrder: true,
        url: true,
        type: true,
      },
      orderBy: [
        { footerOrder: { sort: "asc", nulls: "last" } },
        { title: "asc" },
      ],
    });
    return pages;
  } catch (error) {
    console.error("Error fetching pages for footer:", error);
    return [];
  }
}

export async function getProductVariantForCart(variantId: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        images: {
          orderBy: { order: "asc" },
          take: 1,
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
        image: variant.images[0]?.url || "/placeholder.png",
      },
    };
  } catch (error) {
    console.error("Error fetching variant for cart:", error);
    return null;
  }
}

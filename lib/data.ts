import { prisma } from "./prisma";
import { RoastLevel } from "@prisma/client"; // Import the enum

/**
 * Fetches all products marked as "isFeatured" and orders them.
 * Includes related images, variants, and purchase options.
 */
export async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
      },
      orderBy: {
        featuredOrder: "asc",
      },
      include: {
        images: {
          orderBy: { order: "asc" }, // Get images in the correct order
        },
        variants: {
          include: {
            purchaseOptions: true, // Get all purchase options for each variant
          },
        },
      },
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch featured products.");
  }
}

/**
 * Fetches a single product by its slug.
 * This is the CORRECTED version.
 */
export async function getProductBySlug(slug?: string | null) {
  // Validate input early to avoid calling Prisma with undefined/null
  if (!slug || typeof slug !== "string") {
    return null;
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: slug,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          include: {
            purchaseOptions: true,
          },
        },
      },
    });
    return product;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch product.");
  }
}

/**
 * Fetches a lightweight list of all products for the AI.
 * We only select the fields the AI needs for its prompt.
 */
export async function getProductsForAI() {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        tastingNotes: true,
      },
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch products for AI.");
  }
}

/**
 * Fetches related products based on roast level.
 * @param currentProductId The ID of the product we're currently viewing, to exclude it.
 * @param roastLevel The roast level to match.
 * @param count The number of related products to fetch.
 */
export async function getRelatedProducts(
  currentProductId: string,
  roastLevel: RoastLevel,
  count: number = 4
) {
  try {
    const products = await prisma.product.findMany({
      where: {
        roastLevel: roastLevel, // Match the roast level
        id: {
          not: currentProductId, // Exclude the current product
        },
      },
      take: count, // Limit to 4 products
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1, // Only need the first image for the card
        },
        variants: {
          include: {
            purchaseOptions: {
              where: { type: "ONE_TIME" },
              take: 1, // Only need one price
            },
          },
        },
      },
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch related products.");
  }
}

/**
 * Fetches *only* the slugs for all products.
 * This is used by generateStaticParams to pre-render all product pages.
 */
export async function getAllProductSlugs() {
  try {
    const products = await prisma.product.findMany({
      select: {
        slug: true,
      },
    });
    // Filter out any entries that don't have a valid slug (safety)
    const valid = products
      .filter((p) => typeof p.slug === "string" && p.slug.length > 0)
      .map((p) => ({ slug: p.slug as string }));

    // products will be [{ slug: 'slug-1' }, { slug: 'slug-2' }, ...]
    return valid;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch product slugs.");
  }
}

import { prisma } from "./prisma";

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
 * This will be used for your individual product pages (e.g., /products/[slug])
 */
export async function getProductBySlug(slug: string) {
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

// --- NEW FUNCTION ---
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

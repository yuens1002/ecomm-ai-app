import { prisma } from "./prisma";
import { RoastLevel } from "@prisma/client"; // Import the enum

// --- COMMON INCLUDE OBJECT ---
// We define this once to ensure all product cards get the same minimal data for rendering.
const productCardIncludes = {
  images: {
    orderBy: { order: "asc" as const },
    take: 1, // Only need the first image
  },
  variants: {
    include: {
      purchaseOptions: {
        where: { type: "ONE_TIME" as const },
        take: 1, // Only need one price
      },
    },
  },
  // This is the key: always fetch the primary category for linking
  categories: {
    where: { isPrimary: true },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
    },
  },
};
// ------------------------------

/**
 * Fetches all products marked as "isFeatured" and orders them.
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
      include: productCardIncludes, // <-- USE COMMON INCLUDE
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch featured products.");
  }
}

/**
 * Fetches a single product by its slug.
 * This is the CORRECTED version for /products/[productSlug]
 */
export async function getProductBySlug(productSlug?: string | null) {
  // Validate input
  if (!productSlug || typeof productSlug !== "string") {
    return null;
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: productSlug,
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
        // We need all categories to match against the `from` param
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
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
      include: productCardIncludes, // <-- USE COMMON INCLUDE
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch related products.");
  }
}

/**
 * Fetches *only* the slugs for all products.
 * This is used by generateStaticParams for /products/[productSlug]
 */
export async function getAllProductSlugs() {
  try {
    const products = await prisma.product.findMany({
      select: {
        slug: true,
      },
    });

    // We only need the slug for the static paths
    const valid = products
      .filter((p) => typeof p.slug === "string" && p.slug.length > 0)
      .map((p) => ({ productSlug: p.slug as string }));

    return valid;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch product slugs.");
  }
}

// --- CATEGORY FUNCTIONS ---

/**
 * Fetches all category slugs.
 * Used by generateStaticParams for /categories/[categorySlug]
 */
export async function getCategorySlugs() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
      },
    });
    return categories;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch category slugs.");
  }
}

/**
 * Fetches a single category by its slug.
 */
export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: slug },
    });
    return category;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch category.");
  }
}

/**
 * Fetches all products belonging to a specific category.
 */
export async function getProductsByCategorySlug(categorySlug: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        // Filter by the many-to-many relation
        categories: {
          some: {
            category: {
              slug: categorySlug,
            },
          },
        },
      },
      include: productCardIncludes, // <-- USE COMMON INCLUDE
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch products by category.");
  }
}

/**
 * Fetches all categories for the main navigation.
 */
export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return categories;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch categories.");
  }
}

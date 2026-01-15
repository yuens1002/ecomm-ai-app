"use server";

import { prisma } from "@/lib/prisma";

export type SortProductsDirection = "asc" | "desc";
export type SortProductsBy = "name" | "createdAt";

/**
 * Attach a product to a category
 */
export async function attachProductToCategory(
  productId: unknown,
  categoryId: unknown
) {
  if (typeof productId !== "string" || typeof categoryId !== "string") {
    return { ok: false, error: "Invalid productId or categoryId" };
  }

  try {
    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { ok: false, error: "Product not found" };
    }

    // Check if the category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return { ok: false, error: "Category not found" };
    }

    // Check if already attached
    const existing = await prisma.categoriesOnProducts.findUnique({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
    });

    if (existing) {
      return { ok: true, data: existing };
    }

    // Check if this is the first category for this product
    const existingCategories = await prisma.categoriesOnProducts.count({
      where: { productId },
    });

    const isPrimary = existingCategories === 0;

    // Shift all existing products in this category down (increment order by 1)
    // so the new product can be added at the top (order 0)
    await prisma.categoriesOnProducts.updateMany({
      where: { categoryId },
      data: { order: { increment: 1 } },
    });

    // Create the relationship at order 0 (top of the list)
    const categoriesOnProducts = await prisma.categoriesOnProducts.create({
      data: {
        productId,
        categoryId,
        isPrimary,
        order: 0,
      },
    });

    return { ok: true, data: categoriesOnProducts };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to attach product to category";
    return { ok: false, error: message };
  }
}

/**
 * Detach a product from a category
 */
export async function detachProductFromCategory(
  productId: unknown,
  categoryId: unknown
) {
  if (typeof productId !== "string" || typeof categoryId !== "string") {
    return { ok: false, error: "Invalid productId or categoryId" };
  }

  try {
    // Check if the relationship exists
    const existing = await prisma.categoriesOnProducts.findUnique({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
    });

    if (!existing) {
      return { ok: true, data: null };
    }

    // If this was the primary category, we need to reassign primary to another category
    if (existing.isPrimary) {
      const otherCategories = await prisma.categoriesOnProducts.findMany({
        where: {
          productId,
          categoryId: { not: categoryId },
        },
        orderBy: { order: "asc" },
        take: 1,
      });

      if (otherCategories.length > 0) {
        await prisma.categoriesOnProducts.update({
          where: {
            productId_categoryId: {
              productId: otherCategories[0].productId,
              categoryId: otherCategories[0].categoryId,
            },
          },
          data: { isPrimary: true },
        });
      }
    }

    // Delete the relationship
    await prisma.categoriesOnProducts.delete({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
    });

    return { ok: true, data: null };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to detach product from category";
    return { ok: false, error: message };
  }
}

/**
 * Reorder products in a category (manual drag-and-drop)
 */
export async function reorderProductsInCategory(
  categoryId: unknown,
  productIds: unknown
) {
  if (typeof categoryId !== "string") {
    return { ok: false, error: "Invalid categoryId" };
  }
  if (!Array.isArray(productIds) || !productIds.every((id) => typeof id === "string")) {
    return { ok: false, error: "Invalid productIds array" };
  }

  try {
    // Update order for each product in the category
    await prisma.$transaction(
      productIds.map((productId, index) =>
        prisma.categoriesOnProducts.update({
          where: {
            productId_categoryId: { productId, categoryId },
          },
          data: { order: index },
        })
      )
    );

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reorder products";
    return { ok: false, error: message };
  }
}

/**
 * Sort products in a category by name or createdAt (mutation-based column sort)
 */
export async function sortProductsInCategory(
  categoryId: unknown,
  sortBy: unknown,
  direction: unknown
) {
  if (typeof categoryId !== "string") {
    return { ok: false, error: "Invalid categoryId" };
  }
  if (sortBy !== "name" && sortBy !== "createdAt") {
    return { ok: false, error: "Invalid sortBy value" };
  }
  if (direction !== "asc" && direction !== "desc") {
    return { ok: false, error: "Invalid direction value" };
  }

  try {
    // Get products in this category with their product data for sorting
    const categoryProducts = await prisma.categoriesOnProducts.findMany({
      where: { categoryId },
      include: {
        product: {
          select: { name: true, createdAt: true },
        },
      },
    });

    // Sort based on the specified field and direction
    const sorted = [...categoryProducts].sort((a, b) => {
      let comparison: number;
      if (sortBy === "name") {
        comparison = a.product.name.localeCompare(b.product.name);
      } else {
        comparison = a.product.createdAt.getTime() - b.product.createdAt.getTime();
      }
      return direction === "asc" ? comparison : -comparison;
    });

    // Update order values
    await prisma.$transaction(
      sorted.map((item, index) =>
        prisma.categoriesOnProducts.update({
          where: {
            productId_categoryId: {
              productId: item.productId,
              categoryId,
            },
          },
          data: { order: index },
        })
      )
    );

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sort products";
    return { ok: false, error: message };
  }
}

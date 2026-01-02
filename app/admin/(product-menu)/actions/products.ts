"use server";

import { prisma } from "@/lib/prisma";

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

    // Get the max order for products in this category
    const maxOrder = await prisma.categoriesOnProducts.findFirst({
      where: { categoryId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrder?.order ?? -1) + 1;

    // Check if this is the first category for this product
    const existingCategories = await prisma.categoriesOnProducts.count({
      where: { productId },
    });

    const isPrimary = existingCategories === 0;

    // Create the relationship
    const categoriesOnProducts = await prisma.categoriesOnProducts.create({
      data: {
        productId,
        categoryId,
        isPrimary,
        order: nextOrder,
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

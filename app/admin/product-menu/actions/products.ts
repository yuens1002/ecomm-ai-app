"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

const moveProductToCategorySchema = z.object({
  productId: z.string().min(1),
  fromCategoryId: z.string().min(1),
  toCategoryId: z.string().min(1),
});

/**
 * Move a product from one category to another.
 * Detaches from source category and attaches to target category.
 */
export async function moveProductToCategory(input: unknown) {
  const parsed = moveProductToCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  const { productId, fromCategoryId, toCategoryId } = parsed.data;

  if (fromCategoryId === toCategoryId) {
    return { ok: true as const, data: {} };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Get current relationship to preserve isPrimary status
      const existing = await tx.categoriesOnProducts.findUnique({
        where: {
          productId_categoryId: { productId, categoryId: fromCategoryId },
        },
      });

      if (!existing) {
        throw new Error("Product is not in source category");
      }

      // Check if already in target category
      const alreadyInTarget = await tx.categoriesOnProducts.findUnique({
        where: {
          productId_categoryId: { productId, categoryId: toCategoryId },
        },
      });

      if (alreadyInTarget) {
        // Just remove from source if already in target
        await tx.categoriesOnProducts.delete({
          where: {
            productId_categoryId: { productId, categoryId: fromCategoryId },
          },
        });
        return;
      }

      // Shift products in target category to make room at top
      await tx.categoriesOnProducts.updateMany({
        where: { categoryId: toCategoryId },
        data: { order: { increment: 1 } },
      });

      // Delete from source category
      await tx.categoriesOnProducts.delete({
        where: {
          productId_categoryId: { productId, categoryId: fromCategoryId },
        },
      });

      // Create in target category at top (order 0)
      await tx.categoriesOnProducts.create({
        data: {
          productId,
          categoryId: toCategoryId,
          isPrimary: existing.isPrimary,
          order: 0,
        },
      });
    });

    return { ok: true as const, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to move product to category";
    return { ok: false as const, error: message };
  }
}

const batchMoveProductsToCategorySchema = z.object({
  moves: z.array(
    z.object({
      productId: z.string().min(1),
      fromCategoryId: z.string().min(1),
    })
  ),
  toCategoryId: z.string().min(1),
});

/**
 * Batch move multiple products to a category in a single transaction.
 * Used for multi-select context menu operations.
 */
export async function batchMoveProductsToCategory(input: unknown) {
  const parsed = batchMoveProductsToCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  const { moves, toCategoryId } = parsed.data;

  if (moves.length === 0) {
    return { ok: true as const, data: {} };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Shift products in target category to make room
      await tx.categoriesOnProducts.updateMany({
        where: { categoryId: toCategoryId },
        data: { order: { increment: moves.length } },
      });

      for (let i = 0; i < moves.length; i++) {
        const { productId, fromCategoryId } = moves[i];

        if (fromCategoryId === toCategoryId) continue;

        // Get current relationship
        const existing = await tx.categoriesOnProducts.findUnique({
          where: {
            productId_categoryId: { productId, categoryId: fromCategoryId },
          },
        });

        if (!existing) continue;

        // Check if already in target
        const alreadyInTarget = await tx.categoriesOnProducts.findUnique({
          where: {
            productId_categoryId: { productId, categoryId: toCategoryId },
          },
        });

        // Delete from source
        await tx.categoriesOnProducts.delete({
          where: {
            productId_categoryId: { productId, categoryId: fromCategoryId },
          },
        });

        if (!alreadyInTarget) {
          // Create in target at position i (maintains selection order)
          await tx.categoriesOnProducts.create({
            data: {
              productId,
              categoryId: toCategoryId,
              isPrimary: existing.isPrimary,
              order: i,
            },
          });
        }
      }
    });

    return { ok: true as const, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to batch move products";
    return { ok: false as const, error: message };
  }
}

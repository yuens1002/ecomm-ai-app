"use server";

import { z } from "zod";
import {
  createCategorySchema,
  cloneCategorySchema,
  updateCategorySchema,
} from "@/app/admin/(product-menu)/types/category";
import { prisma } from "@/lib/prisma";
import {
  createCategoryWithLabels,
  deleteCategoryWithRelations,
  listCategoriesAndLabels,
  updateCategoryWithLabels,
} from "@/app/admin/(product-menu)/data/categories";
import { generateSlug } from "@/hooks/useSlugGenerator";

// List categories with labels
export async function listCategories() {
  try {
    const { categories, labels } = await listCategoriesAndLabels("menu-builder-newest-first");
    return { ok: true, data: { categories, labels } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list categories";
    return { ok: false, error: message };
  }
}

// Create a category
export async function createCategory(input: unknown) {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const {
      name,
      slug,
      labelIds = [],
    } = parsed.data as {
      name: string;
      slug: string;
      labelIds?: string[];
    };

    const fresh = await createCategoryWithLabels({ name, slug, labelIds });

    return {
      ok: true,
      data: fresh,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create category";
    return { ok: false, error: message };
  }
}

// Clone a category (including products + label attachments)
export async function cloneCategory(input: unknown) {
  const parsed = cloneCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const original = await prisma.category.findUnique({
      where: { id: parsed.data.id },
      include: {
        labels: { orderBy: { order: "asc" } },
        products: { orderBy: { order: "asc" } },
      },
    });

    if (!original) {
      return { ok: false, error: "Category not found" };
    }

    const copySuffixPattern = /(.*)\s+Copy\s*\(\d+\)\s*$/;
    const baseName = original.name.replace(copySuffixPattern, "$1").trim();

    let copyNumber = 1;
    let name = `${baseName} Copy (${copyNumber})`;
    // Ensure unique name
    while (await prisma.category.findUnique({ where: { name } })) {
      copyNumber++;
      name = `${baseName} Copy (${copyNumber})`;
    }

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let slugCounter = 2;
    // Ensure unique slug
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Heuristic: keep newest-first ordering by bumping the order field.
    const maxOrder = await prisma.category.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (maxOrder?.order ?? -1) + 1;

    const cloned = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          name,
          slug,
          kind: original.kind,
          isUsingDefaultLabel: original.isUsingDefaultLabel,
          showPurchaseOptions: original.showPurchaseOptions,
          isVisible: original.isVisible,
          order: nextOrder,
        },
      });

      if (original.labels.length > 0) {
        await tx.categoryLabelCategory.createMany({
          data: original.labels.map((entry) => ({
            labelId: entry.labelId,
            categoryId: created.id,
            order: entry.order,
          })),
        });
      }

      if (original.products.length > 0) {
        await tx.categoriesOnProducts.createMany({
          data: original.products.map((entry) => ({
            productId: entry.productId,
            categoryId: created.id,
            // Avoid creating multiple primary categories for a product.
            isPrimary: false,
            order: entry.order,
          })),
        });
      }

      return created;
    });

    return { ok: true, data: { id: cloned.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clone category";
    return { ok: false, error: message };
  }
}

// Update a category
export async function updateCategory(id: unknown, input: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  const bodyParsed = updateCategorySchema.safeParse(input);
  if (!idParsed.success) return { ok: false, error: "Invalid id" };
  if (!bodyParsed.success)
    return {
      ok: false,
      error: "Validation failed",
      details: bodyParsed.error.issues,
    };

  try {
    const { name, slug, labelIds, isVisible } = bodyParsed.data;

    const fresh = await updateCategoryWithLabels({
      id: idParsed.data,
      name,
      slug,
      labelIds,
      isVisible,
    });

    return {
      ok: true,
      data: fresh,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update category";
    return { ok: false, error: message };
  }
}

// Delete a category
export async function deleteCategory(id: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  if (!idParsed.success) return { ok: false, error: "Invalid id" };

  try {
    await deleteCategoryWithRelations(idParsed.data);
    return { ok: true, data: { id: idParsed.data } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete category";
    return { ok: false, error: message };
  }
}

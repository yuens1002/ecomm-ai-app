"use server";

import {
  createCategoryWithLabels,
  deleteCategoryWithRelations,
  listCategoriesAndLabels,
  updateCategoryWithLabels,
} from "@/app/admin/(product-menu)/data/categories";
import {
  cloneCategorySchema,
  createCategorySchema,
  createNewCategorySchema,
  updateCategorySchema,
} from "@/app/admin/(product-menu)/types/category";
import { generateSlug } from "@/hooks/useSlugGenerator";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

function isUniqueConstraintError(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

async function createWithUniqueNameAndSlug<T>(opts: {
  makeName: (attempt: number) => string;
  create: (args: { name: string; slug: string }) => Promise<T>;
  maxAttempts?: number;
  errorMessage?: string;
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const maxAttempts = opts.maxAttempts ?? 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const name = opts.makeName(attempt);
    const slug = generateSlug(name);

    try {
      const data = await opts.create({ name, slug });
      return { ok: true, data };
    } catch (err) {
      if (isUniqueConstraintError(err)) continue;
      throw err;
    }
  }

  return { ok: false, error: opts.errorMessage ?? "Failed to generate a unique category name" };
}

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

// Create a new default category (server-owned workflow)
export async function createNewCategory(input?: unknown) {
  const parsed = createNewCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const labelIds = parsed.data?.labelIds ?? [];

    // Base defaults
    const baseName = "New Category";

    return await createWithUniqueNameAndSlug({
      makeName: (attempt) => (attempt === 0 ? baseName : `${baseName} (${attempt + 1})`),
      create: async ({ name, slug }) => {
        return await createCategoryWithLabels({ name, slug, labelIds });
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create new category";
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

    // Keep natural sort order by mirroring original order.
    const nextOrder = original.order;

    const created = await createWithUniqueNameAndSlug({
      makeName: (attempt) => `${baseName} Copy (${attempt + 1})`,
      create: async ({ name, slug }) => {
        return await prisma.$transaction(async (tx) => {
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
      },
      errorMessage: "Failed to generate a unique clone name",
    });

    if (!created.ok) return created;
    return { ok: true, data: { id: created.data.id } };
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

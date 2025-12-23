"use server";

import { z } from "zod";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/app/admin/(product-menu)/types/category";
import { prisma } from "@/lib/prisma";

// List categories with labels
export async function listCategories() {
  try {
    const [categories, labels] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: true } },
          labels: { orderBy: { order: "asc" }, include: { label: true } },
        },
      }),
      prisma.categoryLabel.findMany({ orderBy: { order: "asc" } }),
    ]);

    const payload = categories.map((category) => ({
      ...category,
      labels: category.labels.map((entry) => ({
        id: entry.label.id,
        name: entry.label.name,
        icon: entry.label.icon,
        order: entry.order,
      })),
    }));

    return { ok: true, data: { categories: payload, labels } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list categories";
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

    const category = await prisma.category.create({
      data: { name, slug },
    });

    if (Array.isArray(labelIds) && labelIds.length > 0) {
      await prisma.categoryLabelCategory.createMany({
        data: labelIds.map((labelId, idx) => ({
          labelId,
          categoryId: category.id,
          order: idx,
        })),
      });
    }

    const fresh = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        _count: { select: { products: true } },
        labels: { include: { label: true }, orderBy: { order: "asc" } },
      },
    });

    return {
      ok: true,
      data: {
        ...fresh,
        labels: fresh?.labels.map((entry) => ({
          id: entry.label.id,
          name: entry.label.name,
          icon: entry.label.icon,
          order: entry.order,
        })),
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create category";
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
    const {
      name,
      slug,
      labelIds,
      isVisible,
    } = bodyParsed.data;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    if (isVisible !== undefined) updates.isVisible = isVisible;

    await prisma.category.update({
      where: { id: idParsed.data },
      data: updates,
    });

    if (Array.isArray(labelIds)) {
      await prisma.categoryLabelCategory.deleteMany({
        where: { categoryId: idParsed.data },
      });

      if (labelIds.length > 0) {
        await prisma.categoryLabelCategory.createMany({
          data: labelIds.map((labelId, idx) => ({
            labelId,
            categoryId: idParsed.data,
            order: idx,
          })),
        });
      }
    }

    const fresh = await prisma.category.findUnique({
      where: { id: idParsed.data },
      include: {
        _count: { select: { products: true } },
        labels: { include: { label: true }, orderBy: { order: "asc" } },
      },
    });

    return {
      ok: true,
      data: {
        ...fresh,
        labels: fresh?.labels.map((entry) => ({
          id: entry.label.id,
          name: entry.label.name,
          icon: entry.label.icon,
          order: entry.order,
        })),
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update category";
    return { ok: false, error: message };
  }
}

// Delete a category
export async function deleteCategory(id: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  if (!idParsed.success) return { ok: false, error: "Invalid id" };

  try {
    await prisma.$transaction([
      prisma.categoryLabelCategory.deleteMany({
        where: { categoryId: idParsed.data },
      }),
      prisma.categoriesOnProducts.deleteMany({
        where: { categoryId: idParsed.data },
      }),
      prisma.category.delete({ where: { id: idParsed.data } }),
    ]);
    return { ok: true, data: { id: idParsed.data } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete category";
    return { ok: false, error: message };
  }
}

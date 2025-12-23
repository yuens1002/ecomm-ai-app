"use server";

import { z } from "zod";
import {
  createCategoryLabelSchema,
  updateCategoryLabelSchema,
} from "@/app/admin/(product-menu)/types/category";
import { prisma } from "@/lib/prisma";

// List labels with nested category assignments
export async function listLabels() {
  try {
    const labels = await prisma.categoryLabel.findMany({
      orderBy: { order: "asc" },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: { category: true },
        },
      },
    });
    return { ok: true, data: labels };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list labels";
    return { ok: false, error: message };
  }
}

// Create a label with optional afterLabelId for insertion order
export async function createLabel(input: unknown) {
  const parsed = createCategoryLabelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    async function insertOrder(afterLabelId?: string | null) {
      if (!afterLabelId) {
        await prisma.categoryLabel.updateMany({
          data: { order: { increment: 1 } },
        });
        return 0;
      }
      const after = await prisma.categoryLabel.findUnique({
        where: { id: afterLabelId },
      });
      const afterOrder = after?.order ?? 0;
      await prisma.categoryLabel.updateMany({
        where: { order: { gte: afterOrder + 1 } },
        data: { order: { increment: 1 } },
      });
      return afterOrder + 1;
    }

    const { name, icon, afterLabelId } = parsed.data as {
      name: string;
      icon?: string | null;
      afterLabelId?: string | null;
    };
    const order = await insertOrder(afterLabelId ?? null);
    const label = await prisma.categoryLabel.create({
      data: { name: name.trim(), icon: icon || null, order },
    });
    return { ok: true, data: label };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create label";
    return { ok: false, error: message };
  }
}

// Update label fields (name, icon, visibility, etc.)
export async function updateLabel(id: unknown, input: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  const bodyParsed = updateCategoryLabelSchema.safeParse(input);
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
      icon,
      isVisible,
      autoOrder,
    } = bodyParsed.data;

    if (name) {
      const dup = await prisma.categoryLabel.findFirst({
        where: { name: name.trim(), id: { not: idParsed.data } },
      });
      if (dup) return { ok: false, error: "Label name must be unique" };
    }

    const label = await prisma.categoryLabel.update({
      where: { id: idParsed.data },
      data: {
        ...(name ? { name: name.trim() } : {}),
        icon: icon === undefined ? undefined : icon || null,
        ...(isVisible !== undefined ? { isVisible } : {}),
        ...(autoOrder !== undefined ? { autoOrder } : {}),
      },
    });
    return { ok: true, data: label };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update label";
    return { ok: false, error: message };
  }
}

// Delete label and detach all categories
export async function deleteLabel(id: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  if (!idParsed.success) return { ok: false, error: "Invalid id" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.categoryLabelCategory.deleteMany({
        where: { labelId: idParsed.data },
      });
      await tx.categoryLabel.delete({ where: { id: idParsed.data } });
    });
    return { ok: true, data: { id: idParsed.data } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete label";
    return { ok: false, error: message };
  }
}

// Reorder labels by array of IDs
export async function reorderLabels(labelIds: unknown) {
  const arr = z.array(z.string()).safeParse(labelIds);
  if (!arr.success) {
    return { ok: false, error: "labelIds must be an array of strings" };
  }

  try {
    await Promise.all(
      arr.data.map((id, idx) =>
        prisma.categoryLabel.update({ where: { id }, data: { order: idx } })
      )
    );
    return { ok: true, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reorder labels";
    return { ok: false, error: message };
  }
}

// Attach a category to a label (shifts existing orders)
export async function attachCategory(labelId: unknown, categoryId: unknown) {
  const parsed = z
    .object({ labelId: z.string(), categoryId: z.string() })
    .safeParse({ labelId, categoryId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid labelId or categoryId" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // shift existing orders up by 1
      await tx.categoryLabelCategory.updateMany({
        where: { labelId: parsed.data.labelId },
        data: { order: { increment: 1 } },
      });
      // attach or update to order 0
      await tx.categoryLabelCategory.upsert({
        where: {
          labelId_categoryId: {
            labelId: parsed.data.labelId,
            categoryId: parsed.data.categoryId,
          },
        },
        update: { order: 0 },
        create: {
          labelId: parsed.data.labelId,
          categoryId: parsed.data.categoryId,
          order: 0,
        },
      });
    });
    return { ok: true, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to attach category";
    return { ok: false, error: message };
  }
}

// Detach a category from a label
export async function detachCategory(labelId: unknown, categoryId: unknown) {
  const parsed = z
    .object({ labelId: z.string(), categoryId: z.string() })
    .safeParse({ labelId, categoryId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid labelId or categoryId" };
  }

  try {
    await prisma.categoryLabelCategory.deleteMany({
      where: {
        labelId: parsed.data.labelId,
        categoryId: parsed.data.categoryId,
      },
    });
    return { ok: true, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to detach category";
    return { ok: false, error: message };
  }
}

// Reorder categories within a label
export async function reorderCategoriesInLabel(
  labelId: unknown,
  categoryIds: unknown
) {
  const parsed = z
    .object({ labelId: z.string(), categoryIds: z.array(z.string()) })
    .safeParse({ labelId, categoryIds });
  if (!parsed.success) {
    return { ok: false, error: "Invalid labelId or categoryIds" };
  }

  try {
    await Promise.all(
      parsed.data.categoryIds.map((catId, idx) =>
        prisma.categoryLabelCategory.updateMany({
          where: { labelId: parsed.data.labelId, categoryId: catId },
          data: { order: idx },
        })
      )
    );
    return { ok: true, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reorder categories";
    return { ok: false, error: message };
  }
}

// Auto-sort categories within a label alphabetically by category name
export async function autoSortCategoriesInLabel(labelId: unknown) {
  const idParsed = z.string().min(1).safeParse(labelId);
  if (!idParsed.success) return { ok: false, error: "Invalid labelId" };

  try {
    const entries = await prisma.categoryLabelCategory.findMany({
      where: { labelId: idParsed.data },
      include: { category: true },
    });

    const sorted = entries
      .slice()
      .sort((a, b) => a.category.name.localeCompare(b.category.name))
      .map((entry, idx) => ({ categoryId: entry.categoryId, order: idx }));

    await prisma.$transaction(
      sorted.map((item) =>
        prisma.categoryLabelCategory.update({
          where: {
            labelId_categoryId: {
              labelId: idParsed.data,
              categoryId: item.categoryId,
            },
          },
          data: { order: item.order },
        })
      )
    );

    return { ok: true, data: {} };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to auto-sort categories";
    return { ok: false, error: message };
  }
}

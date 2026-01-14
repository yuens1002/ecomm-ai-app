"use server";

import { z } from "zod";
import {
  createCategoryLabelSchema,
  updateCategoryLabelSchema,
} from "@/app/admin/(product-menu)/types/category";
import { prisma } from "@/lib/prisma";
import {
  attachCategoryToLabel,
  autoSortCategoriesInLabel as autoSortCategoriesInLabelData,
  createCategoryLabel,
  deleteCategoryLabel,
  detachCategoryFromLabel,
  listCategoryLabelsWithCategories,
  reorderCategoriesInLabel as reorderCategoriesInLabelData,
  reorderCategoryLabels,
  updateCategoryLabel,
} from "@/app/admin/(product-menu)/data/labels";

export async function listLabels() {
  try {
    const labels = await listCategoryLabelsWithCategories();
    return { ok: true as const, data: labels };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list labels";
    return { ok: false as const, error: message };
  }
}

export async function createLabel(input: unknown) {
  const parsed = createCategoryLabelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const { name, icon, afterLabelId } = parsed.data;
    const label = await createCategoryLabel({
      name,
      icon: icon ?? null,
      afterLabelId: afterLabelId ?? null,
    });
    return { ok: true as const, data: label };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create label";
    return { ok: false as const, error: message };
  }
}

/**
 * Create a new label with a default name (server-owned workflow).
 * Handles name collision by appending (2), (3), etc.
 */
export async function createNewLabel() {
  const baseName = "New Label";
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const name = attempt === 0 ? baseName : `${baseName} (${attempt + 1})`;

    try {
      const label = await createCategoryLabel({
        name,
        icon: null,
        afterLabelId: null,
      });
      return { ok: true as const, data: label };
    } catch (err) {
      // If unique constraint error, try next name
      if (
        err instanceof Error &&
        err.message.includes("Unique constraint")
      ) {
        continue;
      }
      // Re-throw other errors
      const message = err instanceof Error ? err.message : "Failed to create label";
      return { ok: false as const, error: message };
    }
  }

  return { ok: false as const, error: "Could not generate unique label name" };
}

export async function updateLabel(id: unknown, input: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  const bodyParsed = updateCategoryLabelSchema.safeParse(input);
  if (!idParsed.success) return { ok: false as const, error: "Invalid id" };
  if (!bodyParsed.success) {
    return {
      ok: false as const,
      error: "Validation failed",
      details: bodyParsed.error.issues,
    };
  }

  try {
    const { name, icon, isVisible, autoOrder } = bodyParsed.data;
    const label = await updateCategoryLabel({
      id: idParsed.data,
      ...(name !== undefined ? { name } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(isVisible !== undefined ? { isVisible } : {}),
      ...(autoOrder !== undefined ? { autoOrder } : {}),
    });
    return { ok: true as const, data: label };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update label";
    return { ok: false as const, error: message };
  }
}

export async function deleteLabel(id: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  if (!idParsed.success) return { ok: false as const, error: "Invalid id" };

  try {
    await deleteCategoryLabel(idParsed.data);
    return { ok: true as const, data: { id: idParsed.data } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete label";
    return { ok: false as const, error: message };
  }
}

export async function reorderLabels(labelIds: unknown) {
  const arr = z.array(z.string()).safeParse(labelIds);
  if (!arr.success) return { ok: false as const, error: "Invalid labelIds" };

  try {
    await reorderCategoryLabels(arr.data);
    return { ok: true as const, data: {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reorder labels";
    return { ok: false as const, error: message };
  }
}

export async function attachCategory(labelId: unknown, categoryId: unknown) {
  const parsed = z
    .object({ labelId: z.string().min(1), categoryId: z.string().min(1) })
    .safeParse({ labelId, categoryId });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid labelId or categoryId" };
  }

  try {
    await attachCategoryToLabel(parsed.data);
    return { ok: true as const, data: {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to attach category";
    return { ok: false as const, error: message };
  }
}

export async function detachCategory(labelId: unknown, categoryId: unknown) {
  const parsed = z
    .object({ labelId: z.string().min(1), categoryId: z.string().min(1) })
    .safeParse({ labelId, categoryId });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid labelId or categoryId" };
  }

  try {
    await detachCategoryFromLabel(parsed.data);
    return { ok: true as const, data: {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to detach category";
    return { ok: false as const, error: message };
  }
}

export async function reorderCategoriesInLabel(labelId: unknown, categoryIds: unknown) {
  const parsed = z
    .object({ labelId: z.string().min(1), categoryIds: z.array(z.string()) })
    .safeParse({ labelId, categoryIds });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid labelId or categoryIds" };
  }

  try {
    await reorderCategoriesInLabelData(parsed.data);
    return { ok: true as const, data: {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reorder categories";
    return { ok: false as const, error: message };
  }
}

export async function autoSortCategoriesInLabel(labelId: unknown) {
  const idParsed = z.string().min(1).safeParse(labelId);
  if (!idParsed.success) return { ok: false as const, error: "Invalid labelId" };

  try {
    await autoSortCategoriesInLabelData(idParsed.data);
    await prisma.categoryLabel.update({
      where: { id: idParsed.data },
      data: { autoOrder: true },
    });
    return { ok: true as const, data: {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to auto-sort categories";
    return { ok: false as const, error: message };
  }
}

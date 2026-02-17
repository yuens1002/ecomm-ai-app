"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getWeightUnit } from "@/lib/config/app-settings";
import {
  WeightUnitOption,
  toGrams,
  fromGrams,
  roundToInt,
} from "@/lib/weight-unit";
import { revalidatePath } from "next/cache";

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const createVariantSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  weight: z.number().int().min(0),
  stockQuantity: z.number().int().min(0).default(0),
  isDisabled: z.boolean().default(false),
});

const updateVariantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  weight: z.number().int().min(0),
  stockQuantity: z.number().int().min(0),
  isDisabled: z.boolean().optional(),
});

const reorderSchema = z.object({
  productId: z.string().min(1),
  variantIds: z.array(z.string().min(1)).min(1),
});

export async function createVariant(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createVariantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { productId, name, weight, stockQuantity, isDisabled } = parsed.data;

  try {
    const currentUnit = await getWeightUnit();
    const weightInGrams = roundToInt(
      toGrams(weight, currentUnit as WeightUnitOption)
    );

    // Get max order for this product
    const maxOrder = await prisma.productVariant.aggregate({
      where: { productId },
      _max: { order: true },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name,
        weight: weightInGrams,
        stockQuantity,
        isDisabled,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        purchaseOptions: true,
        images: { orderBy: { order: "asc" } },
      },
    });

    const responseVariant = {
      ...variant,
      weight: roundToInt(
        fromGrams(variant.weight, currentUnit as WeightUnitOption)
      ),
    };

    revalidatePath("/admin/products");
    return { ok: true, data: responseVariant };
  } catch (error) {
    console.error("Error creating variant:", error);
    return { ok: false, error: "Failed to create variant" };
  }
}

export async function updateVariant(
  variantId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateVariantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { name, weight, stockQuantity, isDisabled } = parsed.data;

  try {
    const currentUnit = await getWeightUnit();
    const weightInGrams = roundToInt(
      toGrams(weight, currentUnit as WeightUnitOption)
    );

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { name, weight: weightInGrams, stockQuantity, ...(isDisabled !== undefined && { isDisabled }) },
      include: {
        purchaseOptions: true,
        images: { orderBy: { order: "asc" } },
      },
    });

    const responseVariant = {
      ...variant,
      weight: roundToInt(
        fromGrams(variant.weight, currentUnit as WeightUnitOption)
      ),
    };

    revalidatePath("/admin/products");
    return { ok: true, data: responseVariant };
  } catch (error) {
    console.error("Error updating variant:", error);
    return { ok: false, error: "Failed to update variant" };
  }
}

export async function deleteVariant(variantId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
    revalidatePath("/admin/products");
    return { ok: true, data: null };
  } catch (error) {
    console.error("Error deleting variant:", error);
    return { ok: false, error: "Failed to delete variant" };
  }
}

export async function reorderVariants(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { productId, variantIds } = parsed.data;

  try {
    await prisma.$transaction(
      variantIds.map((id, index) =>
        prisma.productVariant.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    revalidatePath("/admin/products");
    revalidatePath(`/products`);
    return { ok: true, data: { productId, order: variantIds } };
  } catch (error) {
    console.error("Error reordering variants:", error);
    return { ok: false, error: "Failed to reorder variants" };
  }
}

const saveVariantImagesSchema = z.object({
  variantId: z.string().min(1),
  images: z.array(
    z.object({
      url: z.string().min(1),
      altText: z.string(),
    })
  ),
});

export async function saveVariantImages(
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = saveVariantImagesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { variantId, images } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.variantImage.deleteMany({ where: { variantId } });
      if (images.length > 0) {
        await tx.variantImage.createMany({
          data: images.map((img, index) => ({
            variantId,
            url: img.url,
            altText: img.altText,
            order: index,
          })),
        });
      }
    });

    revalidatePath("/admin/products");
    return { ok: true, data: null };
  } catch (error) {
    console.error("Error saving variant images:", error);
    return { ok: false, error: "Failed to save variant images" };
  }
}

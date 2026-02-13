"use server";

import { z } from "zod";
import { BillingInterval, PurchaseType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const createOptionSchema = z.object({
  variantId: z.string().min(1),
  type: z.nativeEnum(PurchaseType),
  priceInCents: z.number().int().nonnegative(),
  salePriceInCents: z.number().int().positive().nullable().optional(),
  billingInterval: z.nativeEnum(BillingInterval).nullable().optional(),
  billingIntervalCount: z.number().int().positive().nullable().optional(),
});

const updateOptionSchema = z.object({
  type: z.nativeEnum(PurchaseType).optional(),
  priceInCents: z.number().int().nonnegative().optional(),
  salePriceInCents: z.number().int().positive().nullable().optional(),
  billingInterval: z.nativeEnum(BillingInterval).nullable().optional(),
  billingIntervalCount: z.number().int().positive().nullable().optional(),
});

export async function createOption(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createOptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const {
    variantId,
    type,
    priceInCents,
    salePriceInCents,
    billingInterval,
    billingIntervalCount,
  } = parsed.data;

  try {
    const option = await prisma.purchaseOption.create({
      data: {
        variantId,
        type,
        priceInCents,
        salePriceInCents: salePriceInCents ?? null,
        billingInterval: billingInterval ?? null,
        billingIntervalCount: billingIntervalCount ?? null,
      },
    });

    revalidatePath("/admin/products");
    return { ok: true, data: option };
  } catch (error) {
    console.error("Error creating purchase option:", error);
    return { ok: false, error: "Failed to create purchase option" };
  }
}

export async function updateOption(
  optionId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateOptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  try {
    const option = await prisma.purchaseOption.update({
      where: { id: optionId },
      data: parsed.data,
    });

    revalidatePath("/admin/products");
    return { ok: true, data: option };
  } catch (error) {
    console.error("Error updating purchase option:", error);
    return { ok: false, error: "Failed to update purchase option" };
  }
}

export async function deleteOption(optionId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.purchaseOption.delete({ where: { id: optionId } });
    revalidatePath("/admin/products");
    return { ok: true, data: null };
  } catch (error) {
    console.error("Error deleting purchase option:", error);
    return { ok: false, error: "Failed to delete purchase option" };
  }
}

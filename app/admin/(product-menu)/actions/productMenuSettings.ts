"use server";

import { prisma } from "@/lib/prisma";
import { productMenuSettingsSchema } from "../types/menu";

export async function getProductMenuSettings() {
  try {
    const [iconSetting, textSetting] = await Promise.all([
      prisma.siteSettings.findUnique({
        where: { key: "product_menu_icon" },
      }),
      prisma.siteSettings.findUnique({
        where: { key: "product_menu_text" },
      }),
    ]);

    return {
      ok: true as const,
      data: {
        icon: iconSetting?.value ?? "ShoppingBag",
        text: textSetting?.value ?? "Shop",
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch menu settings";
    return { ok: false as const, error: message };
  }
}

export async function updateProductMenuSettings(input: unknown) {
  const parsed = productMenuSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const { icon, text } = parsed.data;

    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: "product_menu_icon" },
        update: { value: icon || "" },
        create: { key: "product_menu_icon", value: icon || "" },
      }),
      prisma.siteSettings.upsert({
        where: { key: "product_menu_text" },
        update: { value: text },
        create: { key: "product_menu_text", value: text },
      }),
    ]);

    return { ok: true as const, data: { icon, text } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update menu settings";
    return { ok: false as const, error: message };
  }
}

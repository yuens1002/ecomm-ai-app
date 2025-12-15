import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const productMenuSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  text: z
    .string()
    .min(1, "Text is required")
    .max(20, "Text must be 20 characters or less"),
});

/**
 * GET /api/admin/settings/product-menu
 * Retrieve product menu icon and text settings
 */
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ["product_menu_icon", "product_menu_text"],
        },
      },
    });

    const settingsMap = settings.reduce(
      (acc, setting) => {
        if (setting.key === "product_menu_icon") {
          acc.icon = setting.value;
        } else if (setting.key === "product_menu_text") {
          acc.text = setting.value;
        }
        return acc;
      },
      { icon: "ShoppingBag", text: "Shop" } as { icon: string; text: string }
    );

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Error fetching product menu settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch product menu settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings/product-menu
 * Update product menu icon and text settings
 */
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const validation = productMenuSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { icon, text } = validation.data;

    // Update both settings in parallel
    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: "product_menu_icon" },
        update: { value: icon },
        create: { key: "product_menu_icon", value: icon },
      }),
      prisma.siteSettings.upsert({
        where: { key: "product_menu_text" },
        update: { value: text },
        create: { key: "product_menu_text", value: text },
      }),
    ]);

    return NextResponse.json({
      message: "Product menu settings updated successfully",
      icon,
      text,
    });
  } catch (error) {
    console.error("Error updating product menu settings:", error);
    return NextResponse.json(
      { error: "Failed to update product menu settings" },
      { status: 500 }
    );
  }
}

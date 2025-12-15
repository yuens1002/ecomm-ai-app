import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const addOnsSchema = z.object({
  productAddOnsSectionTitle: z
    .string()
    .trim()
    .min(1, "Product add-ons title is required")
    .max(120, "Product add-ons title must be 120 characters or fewer"),
  cartAddOnsSectionTitle: z
    .string()
    .trim()
    .min(1, "Cart add-ons title is required")
    .max(120, "Cart add-ons title must be 120 characters or fewer"),
});

export async function GET() {
  const authResult = await requireAdminApi();

  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const [productTitle, cartTitle] = await Promise.all([
      prisma.siteSettings.findUnique({
        where: { key: "product_addons_section_title" },
      }),
      prisma.siteSettings.findUnique({
        where: { key: "cart_addons_section_title" },
      }),
    ]);

    return NextResponse.json({
      productAddOnsSectionTitle: productTitle?.value || "Complete Your Order",
      cartAddOnsSectionTitle: cartTitle?.value || "You Might Also Like",
    });
  } catch (error) {
    console.error("Failed to fetch add-ons settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApi();

  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addOnsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
        { status: 400 }
      );
    }

    const { productAddOnsSectionTitle, cartAddOnsSectionTitle } = parsed.data;

    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: "product_addons_section_title" },
        update: { value: productAddOnsSectionTitle },
        create: {
          key: "product_addons_section_title",
          value: productAddOnsSectionTitle,
        },
      }),
      prisma.siteSettings.upsert({
        where: { key: "cart_addons_section_title" },
        update: { value: cartAddOnsSectionTitle },
        create: {
          key: "cart_addons_section_title",
          value: cartAddOnsSectionTitle,
        },
      }),
    ]);

    return NextResponse.json({
      productAddOnsSectionTitle,
      cartAddOnsSectionTitle,
    });
  } catch (error) {
    console.error("Failed to update add-ons settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const session = await auth();

  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productAddOnsSectionTitle, cartAddOnsSectionTitle } = body;

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

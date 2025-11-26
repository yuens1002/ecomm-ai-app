import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/admin/settings/branding
 * Fetch store branding settings
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            "store_name",
            "store_tagline",
            "store_description",
            "store_logo_url",
            "store_favicon_url",
          ],
        },
      },
    });

    const settingsMap = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>
    );

    return NextResponse.json({
      storeName: settingsMap.store_name || "Artisan Roast",
      storeTagline:
        settingsMap.store_tagline ||
        "Specialty coffee sourced from the world's finest origins.",
      storeDescription:
        settingsMap.store_description ||
        "Premium specialty coffee, carefully roasted to perfection. From single-origin beans to signature blends, discover exceptional coffee delivered to your door.",
      storeLogoUrl: settingsMap.store_logo_url || "/logo.svg",
      storeFaviconUrl: settingsMap.store_favicon_url || "/favicon.ico",
    });
  } catch (error) {
    console.error("Error fetching branding settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/branding
 * Update store branding settings
 */
export async function PUT(request: Request) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      storeName,
      storeTagline,
      storeDescription,
      storeLogoUrl,
      storeFaviconUrl,
    } = body;

    // Update each setting
    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: "store_name" },
        update: { value: storeName },
        create: { key: "store_name", value: storeName },
      }),
      prisma.siteSettings.upsert({
        where: { key: "store_tagline" },
        update: { value: storeTagline },
        create: { key: "store_tagline", value: storeTagline },
      }),
      prisma.siteSettings.upsert({
        where: { key: "store_description" },
        update: { value: storeDescription },
        create: { key: "store_description", value: storeDescription },
      }),
      prisma.siteSettings.upsert({
        where: { key: "store_logo_url" },
        update: { value: storeLogoUrl },
        create: { key: "store_logo_url", value: storeLogoUrl },
      }),
      prisma.siteSettings.upsert({
        where: { key: "store_favicon_url" },
        update: { value: storeFaviconUrl },
        create: { key: "store_favicon_url", value: storeFaviconUrl },
      }),
    ]);

    return NextResponse.json({
      storeName,
      storeTagline,
      storeDescription,
      storeLogoUrl,
      storeFaviconUrl,
    });
  } catch (error) {
    console.error("Error updating branding settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

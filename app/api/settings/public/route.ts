import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/settings/public
 * Returns non-sensitive site settings for public display
 */
export async function GET() {
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
            "contactEmail",
          ],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Convert array to key-value object
    const settingsMap = settings.reduce(
      (acc, { key, value }) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const KEY_HEADING = "search_drawer_chips_heading";
const KEY_CHIP_CATEGORIES = "search_drawer_chip_categories";
const KEY_CURATED_CATEGORY = "search_drawer_curated_category";

const DEFAULT_HEADING = "Top Categories";

const settingsSchema = z.object({
  chipsHeading: z
    .string()
    .trim()
    .min(1, "Heading is required")
    .max(60, "Heading must be 60 characters or fewer"),
  chipCategories: z
    .array(z.string().min(1))
    .max(6, "You can select up to 6 categories"),
  curatedCategory: z.string().nullable(),
});

export async function GET() {
  const authResult = await requireAdminApi();
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: [KEY_HEADING, KEY_CHIP_CATEGORIES, KEY_CURATED_CATEGORY] } },
      select: { key: true, value: true },
    });

    const map = rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    let chipCategories: string[] = [];
    if (map[KEY_CHIP_CATEGORIES]) {
      try {
        const parsed = JSON.parse(map[KEY_CHIP_CATEGORIES]) as unknown;
        if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
          chipCategories = parsed as string[];
        }
      } catch {
        // ignore — return empty
      }
    }

    return NextResponse.json({
      chipsHeading: map[KEY_HEADING] || DEFAULT_HEADING,
      chipCategories,
      curatedCategory: map[KEY_CURATED_CATEGORY] || null,
    });
  } catch (error) {
    console.error("Failed to fetch search drawer settings:", error);
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
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues.map((issue) => issue.message).join("; "),
        },
        { status: 400 }
      );
    }

    const { chipsHeading, chipCategories, curatedCategory } = parsed.data;
    const chipCategoriesJson = JSON.stringify(chipCategories);

    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: KEY_HEADING },
        update: { value: chipsHeading },
        create: { key: KEY_HEADING, value: chipsHeading },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEY_CHIP_CATEGORIES },
        update: { value: chipCategoriesJson },
        create: { key: KEY_CHIP_CATEGORIES, value: chipCategoriesJson },
      }),
      // Allow clearing the curated category by storing empty string sentinel.
      prisma.siteSettings.upsert({
        where: { key: KEY_CURATED_CATEGORY },
        update: { value: curatedCategory ?? "" },
        create: { key: KEY_CURATED_CATEGORY, value: curatedCategory ?? "" },
      }),
    ]);

    return NextResponse.json({
      chipsHeading,
      chipCategories,
      curatedCategory,
    });
  } catch (error) {
    console.error("Failed to update search drawer settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

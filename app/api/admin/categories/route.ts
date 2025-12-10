import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

const LABEL_KEY_MAP: Record<string, string> = {
  Origins: "label_origins",
  Roasts: "label_roasts",
  Collections: "label_collections",
};

async function resolveLabelSettingId(label?: string) {
  const key = label ? LABEL_KEY_MAP[label] : undefined;
  if (key) {
    const setting = await prisma.siteSettings.findUnique({ where: { key } });
    if (setting) return setting.id;
  }

  // Fallback to defaultCategoryLabel which stores the id of the default label setting
  const defaultLabelSetting = await prisma.siteSettings.findUnique({
    where: { key: "defaultCategoryLabel" },
  });

  if (defaultLabelSetting?.value) {
    return defaultLabelSetting.value;
  }

  throw new Error("Category label setting not configured");
}

// GET /api/admin/categories - List all categories
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
        labelSetting: true,
      },
    });
    const payload = categories.map((category) => ({
      ...category,
      label: category.labelSetting?.value ?? "Other",
    }));

    return NextResponse.json({ categories: payload });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create a new category
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, label } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const labelSettingId = await resolveLabelSettingId(label);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        labelSettingId,
      },
      include: {
        _count: { select: { products: true } },
        labelSetting: true,
      },
    });

    return NextResponse.json(
      {
        category: {
          ...category,
          label: category.labelSetting?.value ?? label ?? "Other",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

const LABEL_KEY_MAP: Record<string, string> = {
  Origins: "label_origins",
  Roasts: "label_roasts",
  Collections: "label_collections",
};

const slugifyLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

async function resolveLabelSettingId(label?: string) {
  // 1) Known seeded labels
  const key = label ? LABEL_KEY_MAP[label] : undefined;
  if (key) {
    const setting = await prisma.siteSettings.findUnique({ where: { key } });
    if (setting) return setting.id;
  }

  // 2) Existing custom label by value
  if (label) {
    const existing = await prisma.siteSettings.findFirst({
      where: { value: label },
    });
    if (existing) return existing.id;

    const slug = slugifyLabel(label) || "custom";
    const candidateKey = `label_${slug}`;

    // Upsert ensures idempotency if the key already exists
    const created = await prisma.siteSettings.upsert({
      where: { key: candidateKey },
      update: { value: label },
      create: { key: candidateKey, value: label },
    });
    return created.id;
  }

  // 3) Fallback to defaultCategoryLabel which stores the id of the default label setting
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

    const [categories, groups] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
          labelSetting: true,
        },
      }),
      prisma.siteSettings.findMany({
        where: { key: { startsWith: "label_" } },
        select: { id: true, key: true, value: true },
        orderBy: { value: "asc" },
      }),
    ]);

    const payload = categories.map((category) => ({
      ...category,
      label: category.labelSetting?.value ?? "Other",
    }));

    return NextResponse.json({ categories: payload, groups });
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

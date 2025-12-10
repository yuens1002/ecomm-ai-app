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
  const key = label ? LABEL_KEY_MAP[label] : undefined;
  if (key) {
    const setting = await prisma.siteSettings.findUnique({ where: { key } });
    if (setting) return setting.id;
  }

  if (label) {
    const existing = await prisma.siteSettings.findFirst({
      where: { value: label },
    });
    if (existing) return existing.id;

    const slug = slugifyLabel(label) || "custom";
    const candidateKey = `label_${slug}`;

    const created = await prisma.siteSettings.upsert({
      where: { key: candidateKey },
      update: { value: label },
      create: { key: candidateKey, value: label },
    });
    return created.id;
  }

  const defaultLabelSetting = await prisma.siteSettings.findUnique({
    where: { key: "defaultCategoryLabel" },
  });

  if (defaultLabelSetting?.value) {
    return defaultLabelSetting.value;
  }

  return undefined;
}

// PUT /api/admin/categories/[id] - Update a category
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug, label } = body;

    const labelSettingId = await resolveLabelSettingId(label);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        ...(labelSettingId ? { labelSettingId } : {}),
      },
      include: {
        _count: { select: { products: true } },
        labelSetting: true,
      },
    });

    return NextResponse.json({
      category: {
        ...category,
        label: category.labelSetting?.value ?? label ?? "Other",
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete a category
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    // Use a transaction to ensure both operations succeed or fail together
    await prisma.$transaction([
      // 1. Remove all associations with products
      prisma.categoriesOnProducts.deleteMany({
        where: { categoryId: id },
      }),
      // 2. Delete the category itself
      prisma.category.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

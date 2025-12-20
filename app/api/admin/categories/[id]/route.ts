import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { updateCategorySchema } from "@/lib/schemas/category";

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
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      labelIds,
      isVisible,
      showInHeaderMenu,
      showInMobileMenu,
      showInFooterMenu,
    } = validation.data;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    if (isVisible !== undefined) updates.isVisible = isVisible;
    if (showInHeaderMenu !== undefined)
      updates.showInHeaderMenu = showInHeaderMenu;
    if (showInMobileMenu !== undefined)
      updates.showInMobileMenu = showInMobileMenu;
    if (showInFooterMenu !== undefined)
      updates.showInFooterMenu = showInFooterMenu;

    // Update category core fields first
    await prisma.category.update({
      where: { id },
      data: updates,
    });

    // Replace label assignments if provided
    if (Array.isArray(labelIds)) {
      await prisma.categoryLabelCategory.deleteMany({
        where: { categoryId: id },
      });

      if (labelIds.length > 0) {
        await prisma.categoryLabelCategory.createMany({
          data: labelIds.map((labelId, idx) => ({
            labelId,
            categoryId: id,
            order: idx,
          })),
        });
      }
    }

    const fresh = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        labels: { include: { label: true }, orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({
      category: {
        ...fresh,
        labels: fresh?.labels.map((entry) => ({
          id: entry.label.id,
          name: entry.label.name,
          icon: entry.label.icon,
          order: entry.order,
        })),
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

    // Transaction: remove joins, remove product links, delete category
    await prisma.$transaction([
      prisma.categoryLabelCategory.deleteMany({ where: { categoryId: id } }),
      prisma.categoriesOnProducts.deleteMany({ where: { categoryId: id } }),
      prisma.category.delete({ where: { id } }),
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

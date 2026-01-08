import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { updateCategorySchema } from "@/app/admin/(product-menu)/types/category";
import {
  updateCategoryWithLabels,
  deleteCategoryWithRelations,
} from "@/app/admin/(product-menu)/data/categories";

// PUT /api/admin/categories/[id] - Update a category
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { name, slug, labelIds, isVisible } = validation.data;

    const category = await updateCategoryWithLabels({
      id,
      name,
      slug,
      labelIds,
      isVisible,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id] - Delete a category
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    await deleteCategoryWithRelations(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

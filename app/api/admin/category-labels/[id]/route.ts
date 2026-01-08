import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { updateCategoryLabelSchema } from "@/app/admin/(product-menu)/types/category";
import { deleteCategoryLabel, updateCategoryLabel } from "@/app/admin/(product-menu)/data/labels";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateCategoryLabelSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, icon, isVisible, autoOrder } = validation.data;

    if (name && !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    try {
      const updated = await updateCategoryLabel({
        id,
        ...(name !== undefined ? { name } : {}),
        icon: icon === undefined ? undefined : icon || null,
        ...(isVisible !== undefined ? { isVisible } : {}),
        ...(autoOrder !== undefined ? { autoOrder } : {}),
      });

      return NextResponse.json({ label: updated });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed";
      if (message === "Label name must be unique") {
        return NextResponse.json({ error: "Label name must be unique" }, { status: 400 });
      }
      if (message === "Name cannot be empty") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      throw e;
    }
  } catch (error) {
    console.error("Error updating category label:", error);
    return NextResponse.json({ error: "Failed to update category label" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    await deleteCategoryLabel(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category label:", error);
    return NextResponse.json({ error: "Failed to delete category label" }, { status: 500 });
  }
}

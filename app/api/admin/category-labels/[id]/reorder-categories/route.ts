import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { reorderCategoriesInLabel } from "@/app/admin/product-menu/data/labels";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: labelId } = await params;
    const body = await req.json();
    const { categoryIds } = body as { categoryIds?: string[] };

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: "categoryIds array is required" }, { status: 400 });
    }

    await reorderCategoriesInLabel({ labelId, categoryIds });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering categories within label:", error);
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import {
  autoSortCategoriesInLabel,
  updateCategoryLabel,
} from "@/app/admin/(product-menu)/data/labels";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: labelId } = await params;

    await autoSortCategoriesInLabel(labelId);
    await updateCategoryLabel({ id: labelId, autoOrder: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error auto-sorting categories:", error);
    return NextResponse.json({ error: "Failed to auto-sort categories" }, { status: 500 });
  }
}

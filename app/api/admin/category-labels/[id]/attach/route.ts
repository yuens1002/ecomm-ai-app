import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { attachCategoryToLabel } from "@/app/admin/product-menu/data/labels";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: labelId } = await params;
    const body = await req.json();
    const { categoryId } = body as { categoryId?: string };

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    await attachCategoryToLabel({ labelId, categoryId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error attaching category to label:", error);
    return NextResponse.json({ error: "Failed to attach category" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createCategoryLabelSchema } from "@/app/admin/(product-menu)/types/category";
import {
  createCategoryLabel,
  listCategoryLabelsWithCategories,
} from "@/app/admin/(product-menu)/data/labels";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const labels = await listCategoryLabelsWithCategories();
    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Error fetching category labels:", error);
    return NextResponse.json({ error: "Failed to fetch category labels" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const validation = createCategoryLabelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, icon, afterLabelId } = validation.data;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    try {
      const label = await createCategoryLabel({
        name,
        icon: icon || null,
        afterLabelId: afterLabelId || null,
      });

      return NextResponse.json({ label }, { status: 201 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed";
      if (message === "Label name must be unique") {
        return NextResponse.json({ error: "Label name must be unique" }, { status: 400 });
      }
      if (message === "Name is required") {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      throw e;
    }
  } catch (error) {
    console.error("Error creating category label:", error);
    return NextResponse.json({ error: "Failed to create category label" }, { status: 500 });
  }
}

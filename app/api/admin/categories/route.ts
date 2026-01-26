import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createCategorySchema } from "@/app/admin/product-menu/types/category";
import {
  listCategoriesAndLabels,
  createCategoryWithLabels,
} from "@/app/admin/product-menu/data/categories";

// GET /api/admin/categories - List all categories and labels
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { categories, labels } = await listCategoriesAndLabels("name-asc");
    return NextResponse.json({ categories, labels });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
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
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, slug, labelIds = [] } = validation.data;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const category = await createCategoryWithLabels({ name, slug, labelIds });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

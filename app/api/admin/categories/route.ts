import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { createCategorySchema } from "@/lib/schemas/category";

// GET /api/admin/categories - List all categories and labels
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const [categories, labels] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
          labels: {
            orderBy: { order: "asc" },
            include: {
              label: true,
            },
          },
        },
      }),
      prisma.categoryLabel.findMany({
        orderBy: { order: "asc" },
      }),
    ]);

    const payload = categories.map((category) => ({
      ...category,
      labels: category.labels.map((entry) => ({
        id: entry.label.id,
        name: entry.label.name,
        icon: entry.label.icon,
        order: entry.order,
      })),
    }));

    return NextResponse.json({ categories: payload, labels });
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
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, slug, labelIds = [] } = validation.data;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
      },
    });

    // Attach labels in the provided order (newly added first = index order)
    if (Array.isArray(labelIds) && labelIds.length > 0) {
      await prisma.categoryLabelCategory.createMany({
        data: labelIds.map((labelId, idx) => ({
          labelId,
          categoryId: category.id,
          order: idx,
        })),
      });
    }

    const fresh = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        _count: { select: { products: true } },
        labels: { include: { label: true }, orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(
      {
        category: {
          ...fresh,
          labels: fresh?.labels.map((entry) => ({
            id: entry.label.id,
            name: entry.label.name,
            icon: entry.label.icon,
            order: entry.order,
          })),
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

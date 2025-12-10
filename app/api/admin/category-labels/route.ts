import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

async function insertOrder(afterLabelId?: string | null) {
  if (!afterLabelId) {
    // Insert at top (order 0)
    await prisma.categoryLabel.updateMany({
      data: { order: { increment: 1 } },
    });
    return 0;
  }

  const after = await prisma.categoryLabel.findUnique({
    where: { id: afterLabelId },
  });
  const afterOrder = after?.order ?? 0;

  await prisma.categoryLabel.updateMany({
    where: {
      order: {
        gte: afterOrder + 1,
      },
    },
    data: { order: { increment: 1 } },
  });

  return afterOrder + 1;
}

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const labels = await prisma.categoryLabel.findMany({
      orderBy: { order: "asc" },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: {
            category: true,
          },
        },
      },
    });

    const payload = labels.map((label) => ({
      id: label.id,
      name: label.name,
      icon: label.icon,
      order: label.order,
      categories: label.categories.map((entry) => ({
        id: entry.category.id,
        name: entry.category.name,
        slug: entry.category.slug,
        order: entry.order,
      })),
    }));

    return NextResponse.json({ labels: payload });
  } catch (error) {
    console.error("Error fetching category labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch category labels" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      icon,
      afterLabelId,
    }: { name?: string; icon?: string | null; afterLabelId?: string | null } =
      body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Ensure uniqueness on name
    const existing = await prisma.categoryLabel.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Label name must be unique" },
        { status: 400 }
      );
    }

    const order = await insertOrder(afterLabelId);

    const label = await prisma.categoryLabel.create({
      data: {
        name: name.trim(),
        icon: icon || null,
        order,
      },
    });

    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error("Error creating category label:", error);
    return NextResponse.json(
      { error: "Failed to create category label" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

async function ensureUnassignedLabel() {
  const existing = await prisma.categoryLabel.findUnique({
    where: { name: "Unassigned" },
  });
  if (existing) return existing.id;

  const maxOrder = await prisma.categoryLabel.aggregate({
    _max: { order: true },
  });
  const created = await prisma.categoryLabel.create({
    data: {
      name: "Unassigned",
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  return created.id;
}

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
    const { name, icon }: { name?: string; icon?: string | null } = body;

    if (name && !name.trim()) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (name) {
      const dup = await prisma.categoryLabel.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });
      if (dup) {
        return NextResponse.json(
          { error: "Label name must be unique" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.categoryLabel.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        icon: icon === undefined ? undefined : icon || null,
      },
    });

    return NextResponse.json({ label: updated });
  } catch (error) {
    console.error("Error updating category label:", error);
    return NextResponse.json(
      { error: "Failed to update category label" },
      { status: 500 }
    );
  }
}

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

    // find affected categories
    const assignments = await prisma.categoryLabelCategory.findMany({
      where: { labelId: id },
      select: { categoryId: true },
    });

    const unassignedId = await ensureUnassignedLabel();

    await prisma.$transaction(async (tx) => {
      // remove target label assignments
      await tx.categoryLabelCategory.deleteMany({ where: { labelId: id } });

      if (assignments.length > 0) {
        const categoryIds = [...new Set(assignments.map((a) => a.categoryId))];

        // existing orders for unassigned
        const existing = await tx.categoryLabelCategory.findMany({
          where: { labelId: unassignedId },
          select: { categoryId: true, order: true },
        });

        const existingMap = new Map(
          existing.map((e) => [e.categoryId, e.order])
        );

        const startOrder = existing.length;
        const data = categoryIds
          .filter((cid) => !existingMap.has(cid))
          .map((cid, idx) => ({
            labelId: unassignedId,
            categoryId: cid,
            order: startOrder + idx,
          }));

        if (data.length > 0) {
          await tx.categoryLabelCategory.createMany({ data });
        }
      }

      await tx.categoryLabel.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category label:", error);
    return NextResponse.json(
      { error: "Failed to delete category label" },
      { status: 500 }
    );
  }
}

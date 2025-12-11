import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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

    await prisma.$transaction(async (tx) => {
      // remove target label assignments (categories simply become unassigned)
      await tx.categoryLabelCategory.deleteMany({ where: { labelId: id } });
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

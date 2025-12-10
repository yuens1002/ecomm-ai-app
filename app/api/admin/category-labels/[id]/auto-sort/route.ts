import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: labelId } = await params;

    const entries = await prisma.categoryLabelCategory.findMany({
      where: { labelId },
      include: { category: true },
    });

    const sorted = entries
      .sort((a, b) => a.category.name.localeCompare(b.category.name))
      .map((entry, idx) => ({ id: entry.categoryId, order: idx }));

    await prisma.$transaction(
      sorted.map((item) =>
        prisma.categoryLabelCategory.update({
          where: {
            labelId_categoryId: {
              labelId,
              categoryId: item.id,
            },
          },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error auto-sorting categories:", error);
    return NextResponse.json(
      { error: "Failed to auto-sort categories" },
      { status: 500 }
    );
  }
}

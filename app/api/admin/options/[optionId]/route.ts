import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ optionId: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { optionId } = await params;
    const body = await request.json();

    const salePriceCents = body.salePriceInCents
      ? parseInt(body.salePriceInCents)
      : null;

    const updated = await prisma.purchaseOption.update({
      where: { id: optionId },
      data: {
        salePriceInCents: salePriceCents,
      },
    });

    return NextResponse.json({ option: updated });
  } catch (error) {
    console.error("Error updating purchase option:", error);
    return NextResponse.json(
      { error: "Failed to update purchase option" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ optionId: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { optionId } = await params;

    await prisma.purchaseOption.delete({
      where: { id: optionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase option:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase option" },
      { status: 500 }
    );
  }
}

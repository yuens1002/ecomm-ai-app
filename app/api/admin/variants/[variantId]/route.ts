import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { variantId } = await params;
    const body = await request.json();
    const { name, weightInGrams, stockQuantity } = body;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name,
        weightInGrams: parseInt(weightInGrams),
        stockQuantity: parseInt(stockQuantity),
      },
      include: {
        purchaseOptions: true,
      },
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { variantId } = await params;

    await prisma.productVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Failed to delete variant" },
      { status: 500 }
    );
  }
}

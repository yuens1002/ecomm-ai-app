import { NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
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
    const { name, weight, stockQuantity } = body;

    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const providedWeight = Number(weight);
    const finalWeight =
      Number.isFinite(providedWeight) && providedWeight > 0
        ? providedWeight
        : null;
    const isCoffee = existing.product.type === ProductType.COFFEE;

    if (isCoffee && finalWeight === null) {
      return NextResponse.json(
        { error: "Weight is required for coffee variants" },
        { status: 400 }
      );
    }

    if (!isCoffee && weight !== undefined && finalWeight === null) {
      return NextResponse.json(
        { error: "Weight must be greater than zero when provided" },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name,
        weight: finalWeight,
        stockQuantity: Number.parseInt(stockQuantity, 10),
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

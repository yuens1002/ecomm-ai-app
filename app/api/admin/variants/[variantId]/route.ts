import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { getWeightUnit } from "@/lib/app-settings";
import {
  WeightUnitOption,
  toGrams,
  fromGrams,
  roundToInt,
} from "@/lib/weight-unit";

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
    if (!Number.isFinite(providedWeight) || providedWeight <= 0) {
      return NextResponse.json(
        { error: "Weight is required and must be greater than zero" },
        { status: 400 }
      );
    }

    const currentUnit = await getWeightUnit();
    const weightInGrams = roundToInt(
      toGrams(providedWeight, currentUnit as WeightUnitOption)
    );

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name,
        weight: weightInGrams,
        stockQuantity: Number.parseInt(stockQuantity, 10),
      },
      include: {
        purchaseOptions: true,
      },
    });

    const responseVariant = {
      ...variant,
      weight: roundToInt(
        fromGrams(variant.weight, currentUnit as WeightUnitOption)
      ),
    };

    return NextResponse.json({ variant: responseVariant });
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

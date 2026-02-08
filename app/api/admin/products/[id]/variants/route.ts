import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { getWeightUnit } from "@/lib/config/app-settings";
import {
  WeightUnitOption,
  toGrams,
  fromGrams,
  roundToInt,
} from "@/lib/weight-unit";

// GET /api/admin/products/:id/variants - Get all variants for a product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      include: {
        purchaseOptions: true,
      },
      orderBy: { order: "asc" },
    });

    const currentUnit = await getWeightUnit();

    // Convert weights from grams to current unit
    const responseVariants = variants.map((variant) => ({
      ...variant,
      weight: roundToInt(
        fromGrams(variant.weight, currentUnit as WeightUnitOption)
      ),
    }));

    return NextResponse.json({ variants: responseVariants });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, weight, stockQuantity } = body;

    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return NextResponse.json(
        { error: "Weight is required and must be greater than zero" },
        { status: 400 }
      );
    }

    const currentUnit = await getWeightUnit();
    const weightInGrams = roundToInt(
      toGrams(parsedWeight, currentUnit as WeightUnitOption)
    );

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        name,
        weight: weightInGrams,
        stockQuantity: parseInt(stockQuantity),
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
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 }
    );
  }
}

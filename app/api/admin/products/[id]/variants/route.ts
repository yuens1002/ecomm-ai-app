import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

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
    const { name, weightInGrams, stockQuantity } = body;

    const weight = Number(weightInGrams);
    const parsedWeight = Number.isFinite(weight) && weight > 0 ? weight : null;

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        name,
        weightInGrams: parsedWeight,
        stockQuantity: parseInt(stockQuantity),
      },
      include: {
        purchaseOptions: true,
      },
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 }
    );
  }
}

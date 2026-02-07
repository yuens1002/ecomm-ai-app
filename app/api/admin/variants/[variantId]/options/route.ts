import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function POST(
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
    const { type, priceInCents, salePriceInCents, billingInterval, billingIntervalCount } = body;

    const option = await prisma.purchaseOption.create({
      data: {
        variantId,
        type,
        priceInCents: parseInt(priceInCents),
        salePriceInCents: salePriceInCents ? parseInt(salePriceInCents) : null,
        billingInterval: billingInterval || null,
        billingIntervalCount: billingIntervalCount
          ? parseInt(billingIntervalCount)
          : null,
      },
    });

    return NextResponse.json({ option });
  } catch (error) {
    console.error("Error creating purchase option:", error);
    return NextResponse.json(
      { error: "Failed to create purchase option" },
      { status: 500 }
    );
  }
}

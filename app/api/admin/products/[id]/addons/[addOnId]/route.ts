import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const patchSchema = z.object({
  addOnVariantId: z.string().nullable().optional(),
  discountedPriceInCents: z.number().int().positive().nullable().optional(),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; addOnId: string }>;
  }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: productId, addOnId } = await params;

    const addOn = await prisma.addOnLink.findUnique({
      where: { id: addOnId },
    });

    if (!addOn) {
      return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
    }

    if (addOn.primaryProductId !== productId) {
      return NextResponse.json(
        { error: "Add-on does not belong to this product" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if ("addOnVariantId" in validation.data) {
      data.addOnVariantId = validation.data.addOnVariantId;
    }
    if ("discountedPriceInCents" in validation.data) {
      data.discountedPriceInCents = validation.data.discountedPriceInCents;
    }

    const updated = await prisma.addOnLink.update({
      where: { id: addOnId },
      data,
      include: {
        addOnProduct: {
          select: { id: true, name: true, type: true },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            purchaseOptions: {
              select: { id: true, priceInCents: true, type: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ addOn: updated });
  } catch (error) {
    console.error("Error updating add-on:", error);
    return NextResponse.json(
      { error: "Failed to update add-on" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; addOnId: string }>;
  }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: productId, addOnId } = await params;

    // Verify the add-on belongs to this product
    const addOn = await prisma.addOnLink.findUnique({
      where: { id: addOnId },
    });

    if (!addOn) {
      return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
    }

    if (addOn.primaryProductId !== productId) {
      return NextResponse.json(
        { error: "Add-on does not belong to this product" },
        { status: 403 }
      );
    }

    await prisma.addOnLink.delete({
      where: { id: addOnId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return NextResponse.json(
      { error: "Failed to delete add-on" },
      { status: 500 }
    );
  }
}

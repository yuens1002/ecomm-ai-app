import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const selectionSchema = z.object({
  addOnVariantId: z.string().nullable(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).nullable(),
  discountValue: z.number().int().min(0).nullable(),
});

const syncSchema = z.object({
  addOnProductId: z.string().min(1),
  selections: z.array(selectionSchema),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: primaryProductId } = await params;
    const body = await request.json();

    const validation = syncSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { addOnProductId, selections } = validation.data;

    // Transactionally replace all rows for this product combo
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing rows for this product combo
      await tx.addOnLink.deleteMany({
        where: { primaryProductId, addOnProductId },
      });

      // Create new rows
      const created = await Promise.all(
        selections.map((sel) =>
          tx.addOnLink.create({
            data: {
              primaryProductId,
              addOnProductId,
              addOnVariantId: sel.addOnVariantId,
              discountType: sel.discountType,
              discountValue: sel.discountValue,
            },
            select: {
              id: true,
              addOnVariantId: true,
              discountType: true,
              discountValue: true,
            },
          })
        )
      );

      return created;
    });

    return NextResponse.json({ selections: result });
  } catch (error) {
    console.error("Error syncing add-on selections:", error);
    return NextResponse.json(
      { error: "Failed to sync add-on selections" },
      { status: 500 }
    );
  }
}

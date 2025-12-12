import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

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

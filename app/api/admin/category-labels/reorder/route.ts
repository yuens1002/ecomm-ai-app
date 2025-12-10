import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { labelIds } = body as { labelIds?: string[] };

    if (!Array.isArray(labelIds)) {
      return NextResponse.json(
        { error: "labelIds array is required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      labelIds.map((id, idx) =>
        prisma.categoryLabel.update({
          where: { id },
          data: { order: idx },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering category labels:", error);
    return NextResponse.json(
      { error: "Failed to reorder category labels" },
      { status: 500 }
    );
  }
}

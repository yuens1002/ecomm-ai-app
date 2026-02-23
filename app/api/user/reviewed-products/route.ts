import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ productIds: [] });
  }

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });

  return NextResponse.json({
    productIds: reviews.map((r) => r.productId),
  });
}

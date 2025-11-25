import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/admin/newsletter
 * Fetch newsletter subscribers with stats
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const [subscribers, totalCount, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: "desc" },
        select: {
          id: true,
          email: true,
          subscribedAt: true,
          isActive: true,
        },
      }),
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
    ]);

    return NextResponse.json({
      subscribers,
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: totalCount - activeCount,
      },
    });
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

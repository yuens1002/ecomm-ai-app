import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/orders
 * Fetch user's order history
 *
 * Educational Notes:
 * - Orders include all related data (items, variants, products)
 * - Sorted by creation date (newest first)
 * - Could be paginated for users with many orders
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const statusFilter = searchParams.get("status");

    // Build where clause with optional status filter
    const where: any = {
      userId: session.user.id,
    };

    // Handle status filtering
    if (statusFilter) {
      if (statusFilter === "completed") {
        // Completed = SHIPPED or PICKED_UP
        where.status = {
          in: ["SHIPPED", "PICKED_UP"],
        };
      } else {
        // Direct status match (PENDING, CANCELLED, etc.)
        where.status = statusFilter.toUpperCase();
      }
    }

    // Fetch user's orders with all related data
    const orders = await prisma.order.findMany({
      where,
      ...(limit && { take: limit }),
      include: {
        items: {
          include: {
            purchaseOption: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: {
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

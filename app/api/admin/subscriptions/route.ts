import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { SubscriptionStatus } from "@prisma/client";

/**
 * GET /api/admin/subscriptions
 * Fetch all subscriptions for admin (with optional status filtering)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const subscriptions = await prisma.subscription.findMany({
      where:
        status && status !== "all"
          ? { status: status as SubscriptionStatus }
          : {},
      select: {
        id: true,
        stripeSubscriptionId: true,
        status: true,
        priceInCents: true,
        deliverySchedule: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        pausedUntil: true,
        productNames: true,
        recipientName: true,
        shippingStreet: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (error: unknown) {
    console.error("Admin subscriptions fetch error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { stripe } from "@/lib/services/stripe";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["cancel", "skip", "resume"]),
});

/**
 * Calculate next period end based on delivery schedule
 * E.g., "Every 2 weeks" -> add 2 weeks
 */
function calculateNextPeriodTimestamp(
  currentPeriodEnd: Date,
  deliverySchedule: string | null
): number {
  const periodEnd = new Date(currentPeriodEnd);

  // Parse delivery schedule (e.g., "Every 2 weeks", "Every month")
  if (!deliverySchedule) {
    // Default to 2 weeks if no schedule
    periodEnd.setDate(periodEnd.getDate() + 14);
  } else if (deliverySchedule.toLowerCase().includes("week")) {
    const match = deliverySchedule.match(/(\d+)/);
    const weeks = match ? parseInt(match[1], 10) : 2;
    periodEnd.setDate(periodEnd.getDate() + weeks * 7);
  } else if (deliverySchedule.toLowerCase().includes("month")) {
    const match = deliverySchedule.match(/(\d+)/);
    const months = match ? parseInt(match[1], 10) : 1;
    periodEnd.setMonth(periodEnd.getMonth() + months);
  } else {
    // Default to 2 weeks
    periodEnd.setDate(periodEnd.getDate() + 14);
  }

  return Math.floor(periodEnd.getTime() / 1000);
}

/**
 * PATCH /api/admin/subscriptions/[id]
 * Cancel or skip a subscription billing period
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { action } = actionSchema.parse(body);

    // Get subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: {
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        deliverySchedule: true,
        status: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Skip requires ACTIVE status, Cancel allows ACTIVE or PAUSED
    if (action === "skip" && subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only skip billing on active subscriptions" },
        { status: 400 }
      );
    }

    if (
      action === "cancel" &&
      subscription.status !== "ACTIVE" &&
      subscription.status !== "PAUSED"
    ) {
      return NextResponse.json(
        { error: "Can only cancel active or paused subscriptions" },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      // Cancel at period end - customer keeps access until period ends
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local database
      await prisma.subscription.update({
        where: { id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription will be canceled at period end",
      });
    }

    if (action === "skip") {
      // Calculate when to resume (after the next billing period)
      const resumesAt = calculateNextPeriodTimestamp(
        subscription.currentPeriodEnd,
        subscription.deliverySchedule
      );

      // Pause collection - void next invoice, auto-resume after one period
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: {
          behavior: "void",
          resumes_at: resumesAt,
        },
      });

      // Update local database to PAUSED with resume date
      await prisma.subscription.update({
        where: { id },
        data: {
          status: "PAUSED",
          pausedUntil: new Date(resumesAt * 1000),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Next billing period will be skipped",
        resumesAt: new Date(resumesAt * 1000).toISOString(),
      });
    }

    if (action === "resume") {
      if (subscription.status !== "PAUSED") {
        return NextResponse.json(
          { error: "Can only resume paused subscriptions" },
          { status: 400 }
        );
      }

      // Remove pause_collection to resume billing
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: "",
      });

      // Update local database to ACTIVE
      await prisma.subscription.update({
        where: { id },
        data: {
          status: "ACTIVE",
          pausedUntil: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription has been resumed",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Admin subscription action error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to perform subscription action" },
      { status: 500 }
    );
  }
}

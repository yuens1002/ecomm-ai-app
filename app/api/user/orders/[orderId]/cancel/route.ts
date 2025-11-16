import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch the order with items to restore inventory
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            purchaseOption: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify the order belongs to the user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if order can be cancelled (only PENDING orders)
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    // Process refund via Stripe if payment intent exists
    if (order.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: "requested_by_customer",
        });
      } catch (stripeError: any) {
        console.error("Stripe refund error:", stripeError);
        return NextResponse.json(
          {
            error: `Failed to process refund: ${stripeError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // Restore inventory for each item
    console.log("📈 Restoring inventory for canceled order:", orderId);
    for (const item of order.items) {
      try {
        await prisma.productVariant.update({
          where: { id: item.purchaseOption.variant.id },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });
        console.log(
          `📈 Restored stock for ${item.purchaseOption.variant.product.name} - ${item.purchaseOption.variant.name}: +${item.quantity}`
        );
      } catch (inventoryError) {
        console.error("Failed to restore inventory:", inventoryError);
        // Continue processing even if inventory restore fails
      }
    }

    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}

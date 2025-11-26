import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { resend } from "@/lib/resend";
import { render } from "@react-email/components";
import ShipmentConfirmationEmail from "@/emails/ShipmentConfirmationEmail";

/**
 * PATCH /api/admin/orders/[orderId]/ship
 * Mark order as shipped with tracking info
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireAdmin();
    const { orderId } = await params;
    const body = await request.json();
    const { trackingNumber, carrier } = body;

    if (!trackingNumber || !carrier) {
      return NextResponse.json(
        { error: "Tracking number and carrier are required" },
        { status: 400 }
      );
    }

    // Update order
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingNumber,
        carrier,
        shippedAt: new Date(),
      },
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
        user: true,
      },
    });

    // Send shipment confirmation email
    try {
      if (!order.customerEmail) {
        console.warn("No customer email found for order", order.id);
        return NextResponse.json({
          success: true,
          order,
          warning: "Order updated but email not sent (no customer email)",
        });
      }

      // Fetch store name
      const storeNameSetting = await prisma.siteSettings.findUnique({
        where: { key: "store_name" },
      });
      const storeName = storeNameSetting?.value || "Artisan Roast";

      const emailHtml = await render(
        ShipmentConfirmationEmail({
          orderNumber: order.id.slice(-8),
          customerName: order.user?.name || order.recipientName || "Customer",
          trackingNumber,
          carrier,
          estimatedDelivery: "3-5 business days",
          orderId: order.id,
          storeName,
        })
      );

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: order.customerEmail,
        subject: `Your order #${order.id.slice(-8)} has shipped!`,
        html: emailHtml,
      });

      console.log("📧 Shipment confirmation email sent");
    } catch (emailError) {
      console.error("Failed to send shipment email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: unknown) {
    console.error("Mark as shipped error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to mark order as shipped" },
      { status: 500 }
    );
  }
}

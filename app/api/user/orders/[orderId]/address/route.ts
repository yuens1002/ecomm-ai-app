import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUserAddress } from "@/lib/orders/address-utils";
import { z } from "zod";

const addressSchema = z.object({
  recipientName: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be updated" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid address data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { recipientName, street, city, state, postalCode, country } =
      parsed.data;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        recipientName,
        shippingStreet: street,
        shippingCity: city,
        shippingState: state,
        shippingPostalCode: postalCode,
        shippingCountry: country,
      },
    });

    // Save to user's address book (dedup-checks internally)
    await saveUserAddress(session.user.id, {
      name: recipientName,
      line1: street,
      city,
      state,
      postalCode,
      country,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

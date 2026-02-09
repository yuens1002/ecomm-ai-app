import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUserAddress } from "@/lib/orders/address-utils";
import { updateStripeSubscriptionShipping } from "@/lib/payments/stripe/adapter";
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        stripeSubscriptionId: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (
      subscription.status !== "ACTIVE" &&
      subscription.status !== "PAUSED"
    ) {
      return NextResponse.json(
        { error: "Only active or paused subscriptions can be updated" },
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

    // Update subscription address fields
    await prisma.subscription.update({
      where: { id },
      data: {
        recipientName,
        shippingStreet: street,
        shippingCity: city,
        shippingState: state,
        shippingPostalCode: postalCode,
        shippingCountry: country,
      },
    });

    // Update Stripe metadata for future renewals (catches errors internally)
    await updateStripeSubscriptionShipping(
      subscription.stripeSubscriptionId,
      {
        name: recipientName,
        line1: street,
        city,
        state,
        postalCode,
        country,
      }
    );

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
    console.error("Error updating subscription address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

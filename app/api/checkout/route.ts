import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { items, userId, deliveryMethod, selectedAddressId } =
      await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // SECURITY: Validate prices against database server-side
    const { prisma } = await import("@/lib/prisma");

    const purchaseOptionIds = items.map((item: any) => item.purchaseOptionId);
    const dbPurchaseOptions = await prisma.purchaseOption.findMany({
      where: {
        id: { in: purchaseOptionIds },
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    // Create a map for quick lookup
    const priceMap = new Map(dbPurchaseOptions.map((po) => [po.id, po]));

    // Validate all items exist and build line items with DB prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: any) => {
        const dbOption = priceMap.get(item.purchaseOptionId);

        if (!dbOption) {
          throw new Error(`Invalid purchase option: ${item.purchaseOptionId}`);
        }

        // Use the price from database, NOT from frontend
        const actualPriceInCents = dbOption.priceInCents;
        const productName = dbOption.variant.product.name;
        const variantName = dbOption.variant.name;
        const imageUrl = dbOption.variant.product.images[0]?.url;

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${productName} - ${variantName}`,
              description:
                dbOption.type === "SUBSCRIPTION"
                  ? `Subscription: ${
                      dbOption.deliverySchedule || "Regular delivery"
                    }`
                  : "One-time purchase",
              images: imageUrl ? [imageUrl] : undefined,
            },
            unit_amount: actualPriceInCents,
            ...(dbOption.type === "SUBSCRIPTION" && {
              recurring: {
                interval: "month",
              },
            }),
          },
          quantity: item.quantity,
        };
      }
    );

    // Get the origin from the request headers
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Fetch user's email and selected address if provided
    let shippingAddressCollection: any = undefined;
    let customerEmail: string | undefined;
    let prefillShippingDetails: any = undefined;

    if (userId) {
      const { auth } = await import("@/auth");

      const session = await auth();
      if (session?.user?.email) {
        customerEmail = session.user.email;
      }

      // If user selected a specific address, fetch it to pre-fill Stripe
      if (selectedAddressId && deliveryMethod === "DELIVERY") {
        const selectedAddress = await prisma.address.findUnique({
          where: { id: selectedAddressId },
          include: { user: true },
        });

        if (selectedAddress) {
          prefillShippingDetails = {
            name: selectedAddress.user.name || "",
            address: {
              line1: selectedAddress.street,
              city: selectedAddress.city,
              state: selectedAddress.state,
              postal_code: selectedAddress.postalCode,
              country: selectedAddress.country,
            },
          };
        }
      }
    }

    // Determine checkout mode (subscription or one-time payment)
    const isSubscription = items.some(
      (item: any) => item.purchaseType === "SUBSCRIPTION"
    );
    const checkoutMode = isSubscription ? "subscription" : "payment";

    // Only collect shipping address and offer shipping options for delivery (not pickup)
    let shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
      [];

    if (deliveryMethod === "DELIVERY") {
      shippingAddressCollection = { allowed_countries: ["US"] };

      // Add shipping rate options (only for payment mode, not subscription)
      if (!isSubscription) {
        shippingOptions = [
          {
            shipping_rate: process.env.STRIPE_STANDARD_SHIPPING_RATE!,
          },
          {
            shipping_rate: process.env.STRIPE_EXPRESS_SHIPPING_RATE!,
          },
          {
            shipping_rate: process.env.STRIPE_OVERNIGHT_SHIPPING_RATE!,
          },
        ];
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: checkoutMode,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      ...(shippingAddressCollection && {
        shipping_address_collection: shippingAddressCollection,
      }),
      ...(shippingOptions.length > 0 && { shipping_options: shippingOptions }),
      ...(customerEmail && { customer_email: customerEmail }),
      // Store cart data and delivery preferences in metadata for webhook processing
      // Note: Stripe metadata values limited to 500 chars, so we store minimal data
      metadata: {
        cartItems: JSON.stringify(
          items.map((item: any) => ({
            po: item.purchaseOptionId, // Shortened key: purchaseOption
            qty: item.quantity, // Shortened key: quantity
          }))
        ),
        deliveryMethod: deliveryMethod || "DELIVERY",
        selectedAddressId: selectedAddressId || "",
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

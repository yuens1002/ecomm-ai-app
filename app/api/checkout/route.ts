import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Transform cart items into Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.productName} - ${item.variantName}`,
            description: item.purchaseType === "SUBSCRIPTION" 
              ? `Subscription: ${item.deliverySchedule || "Regular delivery"}`
              : "One-time purchase",
            images: item.imageUrl ? [item.imageUrl] : undefined,
          },
          unit_amount: item.priceInCents,
          ...(item.purchaseType === "SUBSCRIPTION" && {
            recurring: {
              interval: "month", // You can adjust this based on deliverySchedule
            },
          }),
        },
        quantity: item.quantity,
      })
    );

    // Get the origin from the request headers
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: items.some((item: any) => item.purchaseType === "SUBSCRIPTION")
        ? "subscription"
        : "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      // Store cart data in metadata for webhook processing
      metadata: {
        cartItems: JSON.stringify(
          items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            purchaseOptionId: item.purchaseOptionId,
            quantity: item.quantity,
            purchaseType: item.purchaseType,
          }))
        ),
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

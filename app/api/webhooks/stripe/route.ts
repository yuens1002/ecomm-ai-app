import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        let session = event.data.object as Stripe.Checkout.Session;

        console.log(
          "📥 Processing checkout.session.completed event:",
          session.id
        );

        // Retrieve the full session with shipping and customer details
        try {
          session = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items", "customer_details"],
          });
        } catch (retrieveError: any) {
          console.error("Failed to retrieve session:", retrieveError);
          throw retrieveError;
        }

        console.log("✅ Checkout completed:", session.id);

        const cartItems = session.metadata?.cartItems
          ? JSON.parse(session.metadata.cartItems).map((item: any) => ({
              purchaseOptionId: item.po, // Map shortened key back
              quantity: item.qty, // Map shortened key back
            }))
          : [];

        const deliveryMethod = session.metadata?.deliveryMethod || "DELIVERY";
        const preferredAddressId =
          session.metadata?.selectedAddressId &&
          session.metadata.selectedAddressId !== ""
            ? session.metadata.selectedAddressId
            : null;

        // Find user by email if they're signed in
        const customerEmail = session.customer_details?.email;
        let userId: string | null = null;

        // Extract shipping info from Stripe session
        const shippingAddress = session.customer_details?.address;
        const shippingName = session.customer_details?.name;

        if (customerEmail) {
          const user = await prisma.user.findUnique({
            where: { email: customerEmail },
            select: { id: true, name: true },
          });
          userId = user?.id || null;

          // Update user's name if they don't have one and Stripe collected it
          if (userId && shippingName && !user?.name) {
            await prisma.user.update({
              where: { id: userId },
              data: { name: shippingName },
            });
          }

          // For logged-in users, optionally save address to Address table for reuse
          if (shippingAddress && userId) {
            const stripeAddress = shippingAddress;

            // Check if this exact address already exists
            const existingAddress = await prisma.address.findFirst({
              where: {
                userId: userId,
                street: stripeAddress.line1 || "",
                city: stripeAddress.city || "",
                state: stripeAddress.state || "",
                postalCode: stripeAddress.postal_code || "",
                country: stripeAddress.country || "",
              },
            });

            if (!existingAddress) {
              // Create new address for future reuse
              await prisma.address.create({
                data: {
                  userId: userId,
                  street: stripeAddress.line1 || "",
                  city: stripeAddress.city || "",
                  state: stripeAddress.state || "",
                  postalCode: stripeAddress.postal_code || "",
                  country: stripeAddress.country || "",
                  isDefault: false,
                },
              });
              console.log("📍 Saved address for future reuse");
            }
          }
        }

        // Get payment card last 4 digits
        let paymentCardLast4: string | undefined;
        if (session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
              {
                expand: ["payment_method"],
              }
            );
            const paymentMethod = paymentIntent.payment_method as any;
            if (paymentMethod?.card?.last4) {
              // Format as "Visa ****1234"
              const brand =
                paymentMethod.card.brand.charAt(0).toUpperCase() +
                paymentMethod.card.brand.slice(1);
              paymentCardLast4 = `${brand} ****${paymentMethod.card.last4}`;
            }
          } catch (error) {
            console.error("Failed to retrieve payment method:", error);
          }
        }

        // Create order in database
        try {
          const order = await prisma.order.create({
            data: {
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string,
              stripeCustomerId: session.customer as string,
              customerEmail: customerEmail || null,
              totalInCents: session.amount_total || 0,
              status: "PENDING",
              deliveryMethod: deliveryMethod as "DELIVERY" | "PICKUP",
              paymentCardLast4: paymentCardLast4,
              userId: userId || undefined,
              // Store shipping fields directly on order (for both guests and logged-in users)
              recipientName: shippingName || null,
              shippingStreet: shippingAddress?.line1 || null,
              shippingCity: shippingAddress?.city || null,
              shippingState: shippingAddress?.state || null,
              shippingPostalCode: shippingAddress?.postal_code || null,
              shippingCountry: shippingAddress?.country || null,
              items: {
                create: cartItems.map((item: any) => ({
                  quantity: item.quantity,
                  priceInCents: 0, // Will be fetched from purchase option
                  purchaseOptionId: item.purchaseOptionId,
                })),
              },
            },
            include: {
              items: true,
            },
          });

          console.log("📦 Order created:", order.id);

          // TODO Phase 4:
          // - Send confirmation email
          // - Update inventory
          // - Handle subscriptions differently
        } catch (dbError: any) {
          console.error("Failed to create order:", dbError);
          // Don't fail the webhook - Stripe already processed payment
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("✅ Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("❌ Payment failed:", paymentIntent.id);
        // TODO: Notify customer of failed payment
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("🔄 Subscription updated:", subscription.id);
        // TODO: Update subscription status in database
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("🗑️ Subscription cancelled:", subscription.id);
        // TODO: Handle subscription cancellation
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

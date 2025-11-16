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

        const actualPriceInCents = dbOption.priceInCents;
        const productName = dbOption.variant.product.name;
        const variantName = dbOption.variant.name;
        const imageUrl = dbOption.variant.product.images[0]?.url;

        // Derive Stripe recurring config directly from billingInterval fields
        let recurring: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring | undefined = undefined;
        if (dbOption.type === 'SUBSCRIPTION') {
          const interval = (dbOption.billingInterval || 'MONTH').toLowerCase() as
            | 'day'
            | 'week'
            | 'month'
            | 'year';
          const intervalCount = dbOption.billingIntervalCount || 1;

          recurring = {
            interval,
            interval_count: intervalCount,
          };

          console.log("🧮 Subscription line item recurring config", {
            productName,
            variantName,
            billingInterval: dbOption.billingInterval,
            billingIntervalCount: dbOption.billingIntervalCount,
            interval,
            interval_count: intervalCount,
          });
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${productName} - ${variantName}`,
              description: dbOption.type === 'SUBSCRIPTION'
                ? `Subscription: Every ${dbOption.billingIntervalCount || 1} ${
                    (dbOption.billingInterval || 'MONTH').toLowerCase()
                  }${(dbOption.billingIntervalCount || 1) > 1 ? 's' : ''}`
                : 'One-time purchase',
              images: imageUrl ? [imageUrl] : undefined,
            },
            unit_amount: actualPriceInCents,
            ...(recurring && { recurring }),
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
    const subscriptionItems = items.filter((item: any) => item.purchaseType === 'SUBSCRIPTION');
    const isSubscription = subscriptionItems.length > 0;

    // Duplicate subscription enforcement (one per product for user)
    if (isSubscription && userId) {
      const activeSubs = await prisma.subscription.findMany({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PAUSED', 'PAST_DUE'] },
        },
      });
      const subscribedProductNames = new Set(activeSubs.map(s => s.productName));
      const attemptedDuplicates: string[] = [];
      for (const item of subscriptionItems) {
        const dbOption = priceMap.get(item.purchaseOptionId);
        if (!dbOption) continue;
        const productName = dbOption.variant.product.name;
        if (subscribedProductNames.has(productName)) {
          attemptedDuplicates.push(productName);
        }
      }
      if (attemptedDuplicates.length > 0) {
        return NextResponse.json({
          error: `You already have an active subscription for: ${attemptedDuplicates.join(', ')}`,
          code: 'SUBSCRIPTION_EXISTS'
        }, { status: 409 });
      }
    }
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
            po: item.purchaseOptionId,
            qty: item.quantity,
          }))
        ),
        deliveryMethod: deliveryMethod || 'DELIVERY',
        selectedAddressId: selectedAddressId || '',
        // Deprecated; kept only for backward compatibility. New source of truth
        // is billingInterval + billingIntervalCount on PurchaseOption and Stripe price.
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

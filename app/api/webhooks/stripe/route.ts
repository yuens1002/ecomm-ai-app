import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import Stripe from "stripe";
import { render } from "@react-email/components";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import MerchantOrderNotification from "@/emails/MerchantOrderNotification";

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

          // Fetch complete order details with product info for emails
          const completeOrder = await prisma.order.findUnique({
            where: { id: order.id },
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

          if (completeOrder) {
            // Decrement inventory for each item
            for (const item of completeOrder.items) {
              try {
                await prisma.productVariant.update({
                  where: { id: item.purchaseOption.variant.id },
                  data: {
                    stockQuantity: {
                      decrement: item.quantity,
                    },
                  },
                });
                console.log(
                  `📉 Decremented stock for ${item.purchaseOption.variant.product.name} - ${item.purchaseOption.variant.name}`
                );
              } catch (inventoryError) {
                console.error("Failed to update inventory:", inventoryError);
                // Continue processing even if inventory update fails
              }
            }

            // Prepare email data
            const emailItems = completeOrder.items.map((item) => ({
              productName: item.purchaseOption.variant.product.name,
              variantName: item.purchaseOption.variant.name,
              quantity: item.quantity,
              priceInCents: item.purchaseOption.priceInCents,
            }));

            const subtotalInCents = completeOrder.items.reduce(
              (sum, item) =>
                sum + item.quantity * item.purchaseOption.priceInCents,
              0
            );
            const shippingInCents =
              completeOrder.totalInCents - subtotalInCents;

            const shippingAddressData =
              completeOrder.deliveryMethod === "DELIVERY" &&
              completeOrder.shippingStreet
                ? {
                    recipientName: completeOrder.recipientName || "Customer",
                    street: completeOrder.shippingStreet,
                    city: completeOrder.shippingCity || "",
                    state: completeOrder.shippingState || "",
                    postalCode: completeOrder.shippingPostalCode || "",
                    country: completeOrder.shippingCountry || "",
                  }
                : undefined;

            // Send customer confirmation email
            try {
              await resend.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL || "orders@artisan-roast.com",
                to: completeOrder.customerEmail || "",
                subject: `Order Confirmation - #${completeOrder.id.slice(-8)}`,
                react: OrderConfirmationEmail({
                  orderId: completeOrder.id,
                  orderNumber: completeOrder.id.slice(-8),
                  customerName: completeOrder.recipientName || "Customer",
                  customerEmail: completeOrder.customerEmail || "",
                  items: emailItems,
                  subtotalInCents,
                  shippingInCents,
                  totalInCents: completeOrder.totalInCents,
                  deliveryMethod: completeOrder.deliveryMethod,
                  shippingAddress: shippingAddressData,
                  orderDate: new Date(
                    completeOrder.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                }),
              });
              console.log("📧 Customer confirmation email sent");
            } catch (emailError) {
              console.error("Failed to send customer email:", emailError);
              // Don't fail webhook - order is already created
            }

            // Send merchant notification email
            try {
              await resend.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL || "orders@artisan-roast.com",
                to:
                  process.env.RESEND_MERCHANT_EMAIL ||
                  "merchant@artisan-roast.com",
                subject: `New Order #${completeOrder.id.slice(-8)} - Action Required`,
                react: MerchantOrderNotification({
                  orderId: completeOrder.id,
                  orderNumber: completeOrder.id.slice(-8),
                  customerName: completeOrder.recipientName || "Customer",
                  customerEmail: completeOrder.customerEmail || "",
                  items: emailItems,
                  totalInCents: completeOrder.totalInCents,
                  deliveryMethod: completeOrder.deliveryMethod,
                  shippingAddress: shippingAddressData,
                  orderDate: new Date(
                    completeOrder.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                }),
              });
              console.log("📧 Merchant notification email sent");
            } catch (emailError) {
              console.error("Failed to send merchant email:", emailError);
              // Don't fail webhook
            }
          }

          // TODO Phase 7:
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
        console.log("\n=== SUBSCRIPTION EVENT ===");
        console.log("Event Type:", event.type);

        // Fetch full subscription object from Stripe API (webhook data is incomplete)
        const subscription = await stripe.subscriptions.retrieve(
          (event.data.object as Stripe.Subscription).id
        );

        console.log("Subscription ID:", subscription.id);
        console.log("Customer ID:", subscription.customer);
        console.log("Status:", subscription.status);

        // Calculate current billing period
        // Use billing_cycle_anchor as start, calculate end based on interval
        const currentPeriodStart = subscription.billing_cycle_anchor;

        // Get the interval from the price
        const subscriptionItem = subscription.items.data[0];
        const price = subscriptionItem.price;
        const interval = price.recurring?.interval || "month";
        const intervalCount = price.recurring?.interval_count || 1;

        // Calculate period end based on interval
        const startDate = new Date(currentPeriodStart * 1000);
        const endDate = new Date(startDate);

        if (interval === "day") {
          endDate.setDate(endDate.getDate() + intervalCount);
        } else if (interval === "week") {
          endDate.setDate(endDate.getDate() + intervalCount * 7);
        } else if (interval === "month") {
          endDate.setMonth(endDate.getMonth() + intervalCount);
        } else if (interval === "year") {
          endDate.setFullYear(endDate.getFullYear() + intervalCount);
        }

        const currentPeriodEnd = Math.floor(endDate.getTime() / 1000);

        console.log(
          "Current Period:",
          new Date(currentPeriodStart * 1000),
          "to",
          new Date(currentPeriodEnd * 1000)
        ); // Get user from customer ID - try order lookup first, then direct customer lookup
        let user = await prisma.user.findFirst({
          where: {
            orders: {
              some: {
                stripeCustomerId: subscription.customer as string,
              },
            },
          },
        });

        // If not found via orders, get customer email from Stripe and lookup user
        if (!user) {
          console.log(
            "⚠️ User not found via orders, fetching from Stripe customer..."
          );
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          );
          const customerEmail = (customer as any).email;

          if (customerEmail) {
            user = await prisma.user.findUnique({
              where: { email: customerEmail },
            });
            console.log("🔍 Looked up user by email:", customerEmail);
          }
        }

        if (!user) {
          console.log("⚠️ User not found for subscription:", subscription.id);
          console.log("Searched for customer ID:", subscription.customer);
          break;
        }

        console.log("✅ Found user:", user.email, "(ID:", user.id, ")");

        // Extract Product details (retrieve full product for name & description)
        const stripeProductId =
          typeof price.product === "string"
            ? price.product
            : (price.product as Stripe.Product).id;
        const stripePriceId = price.id; // Stripe Price ID for mapping to PurchaseOption later
        let productName: string = "Coffee Subscription";
        let productDescription: string | null = null;
        try {
          const product = await stripe.products.retrieve(stripeProductId);
          productName = product.name || productName;
          productDescription = (product.description as string) || null;
        } catch (prodErr) {
          console.warn("⚠️ Failed to retrieve Stripe product", prodErr);
        }

        // Derive delivery schedule
        let deliverySchedule: string | null = null;
        if (subscription.metadata.deliverySchedule) {
          deliverySchedule = subscription.metadata.deliverySchedule;
        } else if (price.nickname) {
          const scheduleMatch = price.nickname.match(/Every\s+[^-()]+/i);
          if (scheduleMatch) deliverySchedule = scheduleMatch[0].trim();
        }
        if (!deliverySchedule && price.recurring?.interval) {
          const { formatBillingInterval } = await import("@/lib/utils");
          deliverySchedule = formatBillingInterval(
            price.recurring.interval,
            price.recurring.interval_count || 1
          );
        }

        console.log("📦 Subscription Item:");
        console.log("  - Product Name:", productName);
        console.log("  - Quantity:", subscriptionItem.quantity);
        console.log("  - Price:", price.unit_amount, "cents");
        console.log("  - Schedule (derived):", deliverySchedule);
        console.log("  - Stripe Product ID:", stripeProductId);
        console.log("  - Stripe Price ID:", stripePriceId);

        // Map Stripe status + cancel_at_period_end
        let status: "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE" = "ACTIVE";
        const stripeStatus = subscription.status;
        const willCancel = subscription.cancel_at_period_end;
        if (stripeStatus === "canceled") status = "CANCELED";
        else if (stripeStatus === "paused") status = "PAUSED";
        else if (stripeStatus === "past_due") status = "PAST_DUE";
        // If will cancel at period end keep ACTIVE but mark flag
        console.log("📊 Mapped Status:", stripeStatus, "->", status, "cancel_at_period_end=", willCancel);

        // Get shipping address from subscription metadata or latest invoice
        const shipping = subscription.metadata.shipping_address
          ? JSON.parse(subscription.metadata.shipping_address)
          : null;

        // Business rule: one subscription per product per user.
        // If a different Stripe subscription exists for same product, merge into existing record.
        const existingForProduct = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            stripeProductId: stripeProductId,
          },
        });

        if (existingForProduct && existingForProduct.stripeSubscriptionId !== subscription.id) {
          console.log(
            "♻️ Merging new Stripe subscription into existing product subscription record",
            {
              existingId: existingForProduct.id,
              oldStripeSubscriptionId: existingForProduct.stripeSubscriptionId,
              newStripeSubscriptionId: subscription.id,
            }
          );
          await prisma.subscription.update({
            where: { id: existingForProduct.id },
            data: {
              stripeSubscriptionId: subscription.id, // keep latest Stripe subscription reference
              stripeCustomerId: subscription.customer as string,
              status,
              productName,
              productDescription,
              stripeProductId: stripeProductId,
              stripePriceId: stripePriceId,
              quantity: subscriptionItem.quantity || 1,
              priceInCents: price.unit_amount || 0,
              deliverySchedule,
              currentPeriodStart: new Date(currentPeriodStart * 1000),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
              cancelAtPeriodEnd: willCancel,
              canceledAt: stripeStatus === "canceled" || subscription.canceled_at
                ? new Date((subscription.canceled_at || Math.floor(Date.now()/1000)) * 1000)
                : null,
              recipientName: shipping?.name || null,
              shippingStreet: shipping?.line1 || null,
              shippingCity: shipping?.city || null,
              shippingState: shipping?.state || null,
              shippingPostalCode: shipping?.postal_code || null,
              shippingCountry: shipping?.country || null,
            },
          });
        } else {
          // Standard upsert keyed by Stripe subscription ID
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              userId: user.id,
              status,
              productName,
              productDescription,
              stripeProductId: stripeProductId,
              stripePriceId: stripePriceId,
              quantity: subscriptionItem.quantity || 1,
              priceInCents: price.unit_amount || 0,
              deliverySchedule,
              currentPeriodStart: new Date(currentPeriodStart * 1000),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
              cancelAtPeriodEnd: willCancel,
              canceledAt: stripeStatus === "canceled" || subscription.canceled_at
                ? new Date((subscription.canceled_at || Math.floor(Date.now()/1000)) * 1000)
                : null,
              recipientName: shipping?.name || null,
              shippingStreet: shipping?.line1 || null,
              shippingCity: shipping?.city || null,
              shippingState: shipping?.state || null,
              shippingPostalCode: shipping?.postal_code || null,
              shippingCountry: shipping?.country || null,
            },
            update: {
              status,
              quantity: subscriptionItem.quantity || 1,
              priceInCents: price.unit_amount || 0,
              currentPeriodStart: new Date(currentPeriodStart * 1000),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
              cancelAtPeriodEnd: willCancel,
              canceledAt: stripeStatus === "canceled" || subscription.canceled_at
                ? new Date((subscription.canceled_at || Math.floor(Date.now()/1000)) * 1000)
                : null,
              deliverySchedule,
              stripeProductId: stripeProductId,
              stripePriceId: stripePriceId,
              productName,
              productDescription,
            },
          });
        }

        console.log("✅ Subscription synced to database:", subscription.id);
        console.log("Database Record:", {
          stripeSubscriptionId: subscription.id,
          userId: user.id,
          status,
          productName,
          stripeProductId,
          priceInCents: price.unit_amount,
        });
        console.log("=======================\n");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("\n=== SUBSCRIPTION DELETED ===");
        console.log("Subscription ID:", subscription.id);
        console.log("Customer ID:", subscription.customer);

        // Update subscription to CANCELED
        const updated = await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "CANCELED",
            canceledAt: new Date(),
          },
        });

        console.log("✅ Subscription marked as canceled in database");
        console.log("Updated Record:", {
          id: updated.id,
          status: updated.status,
          canceledAt: updated.canceledAt,
        });
        console.log("=======================\n");
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

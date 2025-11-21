import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import Stripe from "stripe";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import MerchantOrderNotification from "@/emails/MerchantOrderNotification";
import { OrderWithItems, OrderItemWithDetails } from "@/lib/types";
import { getErrorMessage } from "@/lib/error-utils";

// Webhook-specific cart item from Stripe metadata
interface WebhookCartItem {
  purchaseOptionId: string;
  quantity: number;
}

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
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err, "Webhook verification failed");
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
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
        } catch (retrieveError: unknown) {
          console.error("Failed to retrieve session:", retrieveError);
          throw retrieveError;
        }

        console.log("✅ Checkout completed:", session.id);

        const cartItems: WebhookCartItem[] = session.metadata?.cartItems
          ? JSON.parse(session.metadata.cartItems).map((item: { po: string; qty: number }) => ({
              purchaseOptionId: item.po, // Map shortened key back
              quantity: item.qty, // Map shortened key back
            }))
          : [];

        const deliveryMethod = session.metadata?.deliveryMethod || "DELIVERY";

        // Find user by email if they're signed in
        const customerEmail = session.customer_details?.email;
        let userId: string | null = null;

        // Extract shipping info from Stripe session
        // For DELIVERY orders with shipping_address_collection, Stripe populates customer_details.address
        // Note: Stripe Link may autofill with incomplete saved data in test mode
        const sessionWithShipping = session as Stripe.Checkout.Session & { shipping?: { address?: Stripe.Address; name?: string } };
        const shippingAddress =
          sessionWithShipping.shipping?.address ||
          session.customer_details?.address;
        const shippingName =
          sessionWithShipping.shipping?.name || session.customer_details?.name;

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
            const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
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

        // Create orders in database
        try {
          // Fetch purchase options to determine item types (ONE_TIME vs SUBSCRIPTION)
          const purchaseOptionIds = cartItems.map(
            (item: WebhookCartItem) => item.purchaseOptionId
          );
          const purchaseOptions = await prisma.purchaseOption.findMany({
          where: { id: { in: purchaseOptionIds } },
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        });

        // Separate items by purchase type
        const oneTimeItems = cartItems.filter((item: WebhookCartItem) => {
          const option = purchaseOptions.find(
            (po) => po.id === item.purchaseOptionId
          );
          return option?.type === "ONE_TIME";
        });

        const subscriptionItems = cartItems.filter((item: WebhookCartItem) => {
          const option = purchaseOptions.find(
            (po) => po.id === item.purchaseOptionId
          );
          return option?.type === "SUBSCRIPTION";
        });

        console.log(
          `📦 Creating orders: ${oneTimeItems.length} one-time items, ${subscriptionItems.length} subscription items`
        );

        // Helper function to calculate item total
        const calculateItemTotal = (items: WebhookCartItem[]) => {
          return items.reduce((sum, item) => {
            const option = purchaseOptions.find(
              (po) => po.id === item.purchaseOptionId
            );
            return sum + (option?.priceInCents || 0) * item.quantity;
          }, 0);
        };

        const oneTimeTotal = calculateItemTotal(oneTimeItems);
        const subscriptionTotal = calculateItemTotal(subscriptionItems);
        const totalItemCost = oneTimeTotal + subscriptionTotal;

        // Calculate shipping cost from session
        const shippingCostInCents =
          (session.amount_total || 0) - totalItemCost;

        // Track all created orders for email notifications
        const createdOrders: OrderWithItems[] = [];

        // Create order for one-time items (if any)
        if (oneTimeItems.length > 0) {
          console.log("📦 Creating one-time order...");
          const oneTimeOrder = await prisma.order.create({
            data: {
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string,
              stripeCustomerId: session.customer as string,
              customerEmail: customerEmail || null,
              totalInCents: oneTimeTotal + shippingCostInCents, // One-time order includes shipping
              status: "PENDING",
              deliveryMethod: deliveryMethod as "DELIVERY" | "PICKUP",
              paymentCardLast4: paymentCardLast4,
              userId: userId || undefined,
              recipientName: shippingName || null,
              shippingStreet: shippingAddress?.line1 || null,
              shippingCity: shippingAddress?.city || null,
              shippingState: shippingAddress?.state || null,
              shippingPostalCode: shippingAddress?.postal_code || null,
              shippingCountry: shippingAddress?.country || null,
              items: {
                create: oneTimeItems.map((item: WebhookCartItem) => ({
                  quantity: item.quantity,
                  priceInCents: 0, // Will be fetched from purchase option
                  purchaseOptionId: item.purchaseOptionId,
                })),
              },
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
            },
          });
          createdOrders.push(oneTimeOrder as unknown as OrderWithItems);
          console.log("✅ One-time order created:", oneTimeOrder.id);
        }

        // Create single order for ALL subscription items (if any)
        if (subscriptionItems.length > 0) {
          console.log(`📦 Creating subscription order with ${subscriptionItems.length} items...`);

          // If there are no one-time items, subscription order includes shipping
          const shouldIncludeShipping = oneTimeItems.length === 0;
          const orderTotal = shouldIncludeShipping 
            ? subscriptionTotal + shippingCostInCents 
            : subscriptionTotal;

          const subscriptionOrder = await prisma.order.create({
            data: {
              stripeSessionId: session.id,
              // Note: stripeSubscriptionId will be populated later when subscription is created
              stripePaymentIntentId: session.payment_intent as string,
              stripeCustomerId: session.customer as string,
              customerEmail: customerEmail || null,
              totalInCents: orderTotal,
              status: "PENDING",
              deliveryMethod: deliveryMethod as "DELIVERY" | "PICKUP",
              paymentCardLast4: paymentCardLast4,
              userId: userId || undefined,
              recipientName: shippingName || null,
              shippingStreet: shippingAddress?.line1 || null,
              shippingCity: shippingAddress?.city || null,
              shippingState: shippingAddress?.state || null,
              shippingPostalCode: shippingAddress?.postal_code || null,
              shippingCountry: shippingAddress?.country || null,
              items: {
                create: subscriptionItems.map((item: WebhookCartItem) => ({
                  quantity: item.quantity,
                  priceInCents: 0,
                  purchaseOptionId: item.purchaseOptionId,
                })),
              },
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
            },
          });
          createdOrders.push(subscriptionOrder as unknown as OrderWithItems);
          console.log("✅ Subscription order created:", subscriptionOrder.id);
        }

        console.log(`✅ Created ${createdOrders.length} order(s) total`);

          // Process each created order: decrement inventory and send emails
          for (const order of createdOrders) {
            // Decrement inventory for each item
            for (const item of order.items) {
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
          }

          // Send emails for all orders together
          if (createdOrders.length > 0) {
            const firstOrder = createdOrders[0];

            // Prepare combined email data for all orders
            const { formatBillingInterval } = await import("@/lib/utils");
            
            // Collect all items from all orders
            const allEmailItems = createdOrders.flatMap((order) =>
              order.items.map((item: OrderItemWithDetails) => ({
                productName: item.purchaseOption.variant.product.name,
                variantName: item.purchaseOption.variant.name,
                quantity: item.quantity,
                priceInCents: item.purchaseOption.priceInCents,
                purchaseType: item.purchaseOption.type,
                deliverySchedule:
                  item.purchaseOption.type === "SUBSCRIPTION" &&
                  item.purchaseOption.billingInterval
                    ? formatBillingInterval(
                        item.purchaseOption.billingInterval,
                        item.purchaseOption.intervalCount || 1
                      )
                    : null,
              }))
            );

            // Calculate totals across all orders
            const combinedSubtotal = createdOrders.reduce(
              (sum, order) =>
                sum +
                order.items.reduce(
                  (orderSum: number, item: OrderItemWithDetails) =>
                    orderSum +
                    item.quantity * item.purchaseOption.priceInCents,
                  0
                ),
              0
            );
            const combinedTotal = createdOrders.reduce(
              (sum, order) => sum + order.totalInCents,
              0
            );
            const shippingInCents = combinedTotal - combinedSubtotal;

            const shippingAddressData =
              firstOrder.deliveryMethod === "DELIVERY" &&
              firstOrder.shippingStreet
                ? {
                    recipientName: firstOrder.recipientName || "Customer",
                    street: firstOrder.shippingStreet,
                    city: firstOrder.shippingCity || "",
                    state: firstOrder.shippingState || "",
                    postalCode: firstOrder.shippingPostalCode || "",
                    country: firstOrder.shippingCountry || "",
                  }
                : undefined;

            // Send single customer confirmation email for all orders
            try {
              const orderNumbers = createdOrders
                .map((o) => `#${o.id.slice(-8)}`)
                .join(", ");
              await resend.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL || "orders@artisan-roast.com",
                to: firstOrder.customerEmail || "",
                subject:
                  createdOrders.length > 1
                    ? `Order Confirmation - ${orderNumbers}`
                    : `Order Confirmation - ${orderNumbers}`,
                react: OrderConfirmationEmail({
                  orderId: firstOrder.id,
                  orderNumber: createdOrders
                    .map((o) => o.id.slice(-8))
                    .join(", "),
                  customerName: firstOrder.recipientName || "Customer",
                  customerEmail: firstOrder.customerEmail || "",
                  items: allEmailItems,
                  subtotalInCents: combinedSubtotal,
                  shippingInCents,
                  totalInCents: combinedTotal,
                  deliveryMethod: firstOrder.deliveryMethod as "DELIVERY" | "PICKUP",
                  shippingAddress: shippingAddressData,
                  orderDate: new Date(firstOrder.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  ),
                }),
              });
              console.log(
                `📧 Customer confirmation email sent for ${createdOrders.length} order(s)`
              );
            } catch (emailError) {
              console.error("Failed to send customer email:", emailError);
            }

            // Send merchant notification email for each order
            for (const order of createdOrders) {
              try {
                const emailItems = order.items.map((item: OrderItemWithDetails) => ({
                  productName: item.purchaseOption.variant.product.name,
                  variantName: item.purchaseOption.variant.name,
                  quantity: item.quantity,
                  priceInCents: item.purchaseOption.priceInCents,
                  purchaseType: item.purchaseOption.type,
                  deliverySchedule:
                    item.purchaseOption.type === "SUBSCRIPTION" &&
                    item.purchaseOption.billingInterval
                      ? formatBillingInterval(
                          item.purchaseOption.billingInterval,
                          item.purchaseOption.intervalCount || 1
                        )
                      : null,
                }));

                await resend.emails.send({
                  from:
                    process.env.RESEND_FROM_EMAIL ||
                    "orders@artisan-roast.com",
                  to:
                    process.env.RESEND_MERCHANT_EMAIL ||
                    "merchant@artisan-roast.com",
                  subject: `New Order #${order.id.slice(-8)} - Action Required`,
                  react: MerchantOrderNotification({
                    orderNumber: order.id.slice(-8),
                    customerName: order.recipientName || "Customer",
                    customerEmail: order.customerEmail || "",
                    items: emailItems,
                    totalInCents: order.totalInCents,
                    deliveryMethod: order.deliveryMethod as "DELIVERY" | "PICKUP",
                    shippingAddress: shippingAddressData,
                    orderDate: new Date(order.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    ),
                  }),
                });
                console.log(
                  `📧 Merchant notification sent for order ${order.id.slice(-8)}`
                );
              } catch (emailError) {
                console.error("Failed to send merchant email:", emailError);
              }
            }
          }

          // Handle subscription creation for subscription checkouts
          if (
            session.mode === "subscription" &&
            session.subscription &&
            userId
          ) {
            console.log(
              "\n🔄 Processing subscription from checkout session..."
            );
            console.log("Session payment_status:", session.payment_status);

            // Only create subscription if payment is confirmed
            if (session.payment_status !== "paid") {
              console.log(
                "⏭️ Skipping subscription creation - payment not confirmed yet"
              );
              console.log(
                "   Will be created via invoice.payment_succeeded event"
              );
              break;
            }

            try {
              const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string,
                {
                  expand: ["latest_invoice", "default_payment_method"],
                }
              );

              console.log("📋 Subscription retrieved:", subscription.id);
              console.log("Status:", subscription.status);

              // Store original status before type narrowing
              const originalStripeStatus = subscription.status;

              // Double-check subscription is active before creating record
              if (
                subscription.status !== "active" &&
                subscription.status !== "trialing"
              ) {
                console.log(
                  `⏭️ Subscription status is ${subscription.status}, will handle via invoice.payment_succeeded`
                );
                break;
              }

              // Calculate current billing period - get from first subscription item
              const subscriptionItem = subscription.items.data[0];
              const currentPeriodStart = subscriptionItem.current_period_start;
              const currentPeriodEnd = subscriptionItem.current_period_end;

              if (!currentPeriodStart || !currentPeriodEnd) {
                console.error(
                  "❌ Missing billing period dates from subscription items"
                );
                throw new Error(
                  "Subscription items missing current_period_start or current_period_end"
                );
              }

              // Extract ALL subscription items into arrays
              const productNames: string[] = [];
              const stripeProductIds: string[] = [];
              const stripePriceIds: string[] = [];
              const quantities: number[] = [];
              let totalPriceInCents = 0;
              let productDescription: string | null = null;

              for (const item of subscription.items.data) {
                const price = item.price;
                const productId =
                  typeof price.product === "string"
                    ? price.product
                    : (price.product as Stripe.Product).id;
                
                stripeProductIds.push(productId);
                stripePriceIds.push(price.id);
                quantities.push(item.quantity || 1);
                totalPriceInCents += (price.unit_amount || 0) * (item.quantity || 1);

                // Fetch product name
                try {
                  const product = await stripe.products.retrieve(productId);
                  productNames.push(product.name || "Coffee Subscription");
                  // Use first product's description
                  if (!productDescription) {
                    productDescription = (product.description as string) || null;
                  }
                } catch (prodErr) {
                  console.warn("⚠️ Failed to retrieve Stripe product", prodErr);
                  productNames.push("Coffee Subscription");
                }
              }

              console.log(`📦 Subscription has ${productNames.length} items:`, productNames);

              // Derive delivery schedule from first item
              const firstPrice = subscription.items.data[0].price;
              let deliverySchedule: string | null = null;
              if (subscription.metadata.deliverySchedule) {
                deliverySchedule = subscription.metadata.deliverySchedule;
              } else if (firstPrice.nickname) {
                const scheduleMatch = firstPrice.nickname.match(/Every\s+[^-()]+/i);
                if (scheduleMatch) deliverySchedule = scheduleMatch[0].trim();
              }
              if (!deliverySchedule && firstPrice.recurring?.interval) {
                const { formatBillingInterval } = await import("@/lib/utils");
                deliverySchedule = formatBillingInterval(
                  firstPrice.recurring.interval,
                  firstPrice.recurring.interval_count || 1
                );
              }

              // Map Stripe status
              let status: "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE" =
                "ACTIVE";
              if (originalStripeStatus === "canceled") status = "CANCELED";
              else if (originalStripeStatus === "paused") status = "PAUSED";
              else if (originalStripeStatus === "past_due") status = "PAST_DUE";

              // Get shipping address from session
              const shipping = shippingAddress;

              // Check if subscription already exists to avoid duplicate creation
              const existingSubscription = await prisma.subscription.findUnique({
                where: { stripeSubscriptionId: subscription.id },
              });

              if (existingSubscription) {
                console.log("ℹ️ Subscription already exists, updating it");
                await prisma.subscription.update({
                  where: { id: existingSubscription.id },
                  data: {
                    stripeCustomerId: subscription.customer as string,
                    status,
                    productNames,
                    productDescription,
                    stripeProductIds,
                    stripePriceIds,
                    quantities,
                    priceInCents: totalPriceInCents,
                    deliverySchedule,
                    currentPeriodStart: new Date(currentPeriodStart * 1000),
                    currentPeriodEnd: new Date(currentPeriodEnd * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    recipientName: shippingName || null,
                    shippingStreet: shipping?.line1 || null,
                    shippingCity: shipping?.city || null,
                    shippingState: shipping?.state || null,
                    shippingPostalCode: shipping?.postal_code || null,
                    shippingCountry: shipping?.country || null,
                  },
                });
              } else {
                // Create new subscription record
                console.log("🆕 Creating new subscription record");
                await prisma.subscription.create({
                  data: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                    userId: userId,
                    status,
                    productNames,
                    productDescription,
                    stripeProductIds,
                    stripePriceIds,
                    quantities,
                    priceInCents: totalPriceInCents,
                    deliverySchedule,
                    currentPeriodStart: new Date(currentPeriodStart * 1000),
                    currentPeriodEnd: new Date(currentPeriodEnd * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    recipientName: shippingName || null,
                    shippingStreet: shipping?.line1 || null,
                    shippingCity: shipping?.city || null,
                    shippingState: shipping?.state || null,
                    shippingPostalCode: shipping?.postal_code || null,
                    shippingCountry: shipping?.country || null,
                  },
                });
              }

              console.log("✅ Subscription record created/updated");

              // Link subscription to the subscription order
              // Find the order that contains subscription items
              const subscriptionOrder = createdOrders.find((order) =>
                order.items.some(
                  (item: OrderItemWithDetails) => item.purchaseOption.type === "SUBSCRIPTION"
                )
              );

              if (subscriptionOrder) {
                console.log(
                  `🔗 Linking subscription ${subscription.id} to order ${subscriptionOrder.id}`
                );
                await prisma.order.update({
                  where: { id: subscriptionOrder.id },
                  data: { stripeSubscriptionId: subscription.id },
                });
                console.log("✅ Order linked to subscription");
              } else {
                console.warn(
                  `⚠️ Could not find subscription order to link`
                );
              }
            } catch (subError) {
              console.error("Failed to create subscription record:", subError);
              // Don't fail webhook - order is already created
            }
          }
        } catch (dbError: unknown) {
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

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string };
          parent?: { subscription_details?: { subscription: string } };
          charge?: string | Stripe.Charge;
          payment_intent?: string | Stripe.PaymentIntent;
        };
        console.log("\n=== INVOICE PAYMENT SUCCEEDED ===");
        console.log("Invoice ID:", invoice.id);
        console.log("Customer ID:", invoice.customer);

        // Only process invoices that are for subscriptions
        // Check both invoice.subscription and invoice.parent.subscription_details.subscription
        let subscriptionId: string | undefined;
        
        if (typeof invoice.subscription === "string") {
          subscriptionId = invoice.subscription;
        } else if (typeof invoice.subscription === "object") {
          subscriptionId = invoice.subscription?.id;
        }
        
        console.log("Subscription ID:", subscriptionId);

        if (!subscriptionId && invoice.parent?.subscription_details?.subscription) {
          subscriptionId = invoice.parent.subscription_details.subscription;
        }

        if (!subscriptionId) {
          console.log("⏭️ Skipping non-subscription invoice");
          break;
        }

        console.log("✅ Found subscription ID:", subscriptionId);
        console.log("Billing Reason:", invoice.billing_reason);

        // Check if this is a subscription renewal (not the initial creation)
        const isRenewal = invoice.billing_reason === "subscription_cycle";

        // Fetch full subscription object from Stripe API with items expanded
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
          { expand: ["items.data"] }
        );

        console.log("Processing subscription:", subscription.id);
        console.log("Subscription Status:", subscription.status);
        console.log("Is Renewal:", isRenewal);

        // Calculate current billing period from subscription items
        const subscriptionItem = subscription.items.data[0];
        const currentPeriodStart = subscriptionItem.current_period_start;
        const currentPeriodEnd = subscriptionItem.current_period_end;

        console.log(
          "Current Period:",
          new Date(currentPeriodStart * 1000),
          "to",
          new Date(currentPeriodEnd * 1000)
        );

        // Get user from customer ID - try order lookup first, then direct customer lookup
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
          const customerEmail = (customer as Stripe.Customer).email;

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

        // Extract ALL subscription items into arrays
        const productNames: string[] = [];
        const stripeProductIds: string[] = [];
        const stripePriceIds: string[] = [];
        const quantities: number[] = [];
        let totalPriceInCents = 0;
        let productDescription: string | null = null;

        for (const item of subscription.items.data) {
          const price = item.price;
          const productId =
            typeof price.product === "string"
              ? price.product
              : (price.product as Stripe.Product).id;
          
          stripeProductIds.push(productId);
          stripePriceIds.push(price.id);
          quantities.push(item.quantity || 1);
          totalPriceInCents += (price.unit_amount || 0) * (item.quantity || 1);

          // Fetch product name
          try {
            const product = await stripe.products.retrieve(productId);
            productNames.push(product.name || "Coffee Subscription");
            // Use first product's description
            if (!productDescription) {
              productDescription = (product.description as string) || null;
            }
          } catch (prodErr) {
            console.warn("⚠️ Failed to retrieve Stripe product", prodErr);
            productNames.push("Coffee Subscription");
          }
        }

        console.log(`📦 Subscription has ${productNames.length} items:`, productNames);

        // Derive delivery schedule from first item
        const firstPrice = subscription.items.data[0].price;
        let deliverySchedule: string | null = null;
        if (subscription.metadata.deliverySchedule) {
          deliverySchedule = subscription.metadata.deliverySchedule;
        } else if (firstPrice.nickname) {
          const scheduleMatch = firstPrice.nickname.match(/Every\s+[^-()]+/i);
          if (scheduleMatch) deliverySchedule = scheduleMatch[0].trim();
        }
        if (!deliverySchedule && firstPrice.recurring?.interval) {
          const { formatBillingInterval } = await import("@/lib/utils");
          deliverySchedule = formatBillingInterval(
            firstPrice.recurring.interval,
            firstPrice.recurring.interval_count || 1
          );
        }

        // Map Stripe status
        let status: "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE" = "ACTIVE";
        const stripeStatus = subscription.status;
        const willCancel = subscription.cancel_at_period_end;
        if (stripeStatus === "canceled") status = "CANCELED";
        else if (stripeStatus === "paused") status = "PAUSED";
        else if (stripeStatus === "past_due") status = "PAST_DUE";

        console.log(
          "📊 Mapped Status:",
          stripeStatus,
          "->",
          status,
          "cancel_at_period_end=",
          willCancel
        );

        // Get shipping address from subscription metadata
        const shipping = subscription.metadata.shipping_address
          ? JSON.parse(subscription.metadata.shipping_address)
          : null;

        // SPLIT LOGIC: Initial subscription creation vs. renewal
        if (!isRenewal) {
          // INITIAL SUBSCRIPTION CREATION - Update database subscription record
          console.log("🆕 Processing initial subscription creation...");

          // Check if subscription already exists by stripeSubscriptionId
          const existingSubscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (!existingSubscription) {
            // Create new subscription record
            await prisma.subscription.create({
              data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                userId: user.id,
                status,
                productNames,
                productDescription,
                stripeProductIds,
                stripePriceIds,
                quantities,
                priceInCents: totalPriceInCents,
                deliverySchedule,
                currentPeriodStart: new Date(currentPeriodStart * 1000),
                currentPeriodEnd: new Date(currentPeriodEnd * 1000),
                cancelAtPeriodEnd: willCancel,
                canceledAt:
                  stripeStatus === "canceled" || subscription.canceled_at
                    ? new Date(
                        (subscription.canceled_at ||
                          Math.floor(Date.now() / 1000)) * 1000
                      )
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
            // Update existing subscription
            await prisma.subscription.update({
              where: { stripeSubscriptionId: subscription.id },
              data: {
                status,
                quantities,
                priceInCents: totalPriceInCents,
                currentPeriodStart: new Date(currentPeriodStart * 1000),
                currentPeriodEnd: new Date(currentPeriodEnd * 1000),
                cancelAtPeriodEnd: willCancel,
                canceledAt:
                  stripeStatus === "canceled" || subscription.canceled_at
                    ? new Date(
                        (subscription.canceled_at ||
                          Math.floor(Date.now() / 1000)) * 1000
                      )
                    : null,
                deliverySchedule,
                stripeProductIds,
                stripePriceIds,
                productNames,
                productDescription,
              },
            });
          }

          console.log(
            "✅ Subscription created/updated in database:",
            subscription.id
          );
          console.log("Database Record:", {
            stripeSubscriptionId: subscription.id,
            userId: user.id,
            status,
            productNames,
            stripeProductIds,
            priceInCents: totalPriceInCents,
          });
        } else {
          // SUBSCRIPTION RENEWAL - Create recurring order
          console.log(
            "🔄 Processing subscription renewal - creating recurring order..."
          );

          // Create a recurring order for this subscription renewal
          console.log(
            "\n📦 Creating recurring order for subscription renewal..."
          );

          try {
            // Find matching purchase options for ALL subscription items
            const orderItemsData = [];
            
            for (let i = 0; i < productNames.length; i++) {
              const productName = productNames[i];
              const quantity = quantities[i];
              
              // Extract product name (before the " - " variant separator)
              const productBaseName = productName.split(" - ")[0];
              
              const purchaseOption = await prisma.purchaseOption.findFirst({
                where: {
                  type: "SUBSCRIPTION",
                  variant: {
                    product: {
                      name: {
                        contains: productBaseName,
                      },
                    },
                  },
                },
                include: {
                  variant: {
                    include: {
                      product: true,
                    },
                  },
                },
              });

              if (!purchaseOption) {
                console.error(
                  "⚠️ Could not find matching purchase option for:",
                  productName
                );
                continue;
              }

              orderItemsData.push({
                quantity,
                priceInCents: 0, // Will be populated by purchase option relation
                purchaseOptionId: purchaseOption.id,
              });
              
              console.log(`  ✅ Found purchase option for ${productName}`);
            }

            if (orderItemsData.length === 0) {
              console.error(
                "⚠️ Could not find any matching purchase options for subscription items"
              );
              console.log(
                "Skipping order creation but subscription is still active"
              );
              break;
            }

            // Calculate total from invoice
            const shippingCost = invoice.total - invoice.subtotal; // Stripe calculates shipping
            const totalInCents = totalPriceInCents + shippingCost;

            // Get payment method details
            let paymentCardLast4: string | undefined;
            if (invoice.charge && typeof invoice.charge === "string") {
              try {
                const charge = await stripe.charges.retrieve(
                  invoice.charge,
                  {
                    expand: ["payment_method"],
                  }
                );
                if (charge.payment_method && typeof charge.payment_method === "object") {
                  const paymentMethod = charge.payment_method as Stripe.PaymentMethod;
                  if (paymentMethod.card?.last4) {
                    const brand =
                      paymentMethod.card.brand.charAt(0).toUpperCase() +
                      paymentMethod.card.brand.slice(1);
                    paymentCardLast4 = `${brand} ****${paymentMethod.card.last4}`;
                  }
                }
              } catch (error) {
                console.error("Failed to retrieve payment method:", error);
              }
            }

            // Create the recurring order
            const order = await prisma.order.create({
              data: {
                stripeSubscriptionId: subscription.id, // Link to subscription
                stripePaymentIntentId: invoice.payment_intent as string,
                stripeCustomerId: subscription.customer as string,
                customerEmail: user.email || null,
                totalInCents,
                status: "PENDING",
                deliveryMethod: shipping ? "DELIVERY" : "PICKUP",
                paymentCardLast4,
                userId: user.id,
                recipientName: shipping?.name || user.name || null,
                shippingStreet: shipping?.line1 || null,
                shippingCity: shipping?.city || null,
                shippingState: shipping?.state || null,
                shippingPostalCode: shipping?.postal_code || null,
                shippingCountry: shipping?.country || null,
                items: {
                  create: orderItemsData,
                },
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
              },
            });

            console.log("📦 Recurring order created:", order.id);

            // Decrement inventory for all items in recurring order
            for (const item of order.items) {
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
              }
            }

            // Send email notifications for recurring order
            const emailItems = order.items.map((item) => ({
              productName: item.purchaseOption.variant.product.name,
              variantName: item.purchaseOption.variant.name,
              quantity: item.quantity,
              priceInCents: item.purchaseOption.priceInCents,
              purchaseType: item.purchaseOption.type,
              deliverySchedule,
            }));

            const shippingAddressData =
              order.deliveryMethod === "DELIVERY" && order.shippingStreet
                ? {
                    recipientName: order.recipientName || "Customer",
                    street: order.shippingStreet,
                    city: order.shippingCity || "",
                    state: order.shippingState || "",
                    postalCode: order.shippingPostalCode || "",
                    country: order.shippingCountry || "",
                  }
                : undefined;

            // Skip customer confirmation email for recurring orders
            // Customer will receive shipping notification with tracking when order ships
            console.log(
              "⏭️  Skipping customer email - will send with tracking when order ships"
            );

            // Send merchant notification email only
            try {
              await resend.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL || "orders@artisan-roast.com",
                to: process.env.MERCHANT_EMAIL || "admin@artisan-roast.com",
                subject: `Subscription Renewal - ${deliverySchedule} - #${order.id.slice(-8)}`,
                react: MerchantOrderNotification({
                  orderNumber: order.id.slice(-8),
                  customerName: order.recipientName || "Customer",
                  customerEmail: user.email || "",
                  items: emailItems,
                  totalInCents: order.totalInCents,
                  deliveryMethod: order.deliveryMethod,
                  shippingAddress: shippingAddressData,
                  orderDate: order.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  isRecurringOrder: true,
                }),
              });
              console.log("📧 Merchant notification email sent");
            } catch (emailError) {
              console.error("Failed to send merchant email:", emailError);
            }

            console.log("✅ Recurring order processed successfully");
          } catch (orderError) {
            console.error("Failed to create recurring order:", orderError);
            // Don't fail the webhook - subscription is still active
          }
        } // End of isRenewal block

        console.log("=======================\n");
        break;
      }

      case "customer.subscription.updated": {
        console.log("\n=== SUBSCRIPTION UPDATED ===");
        console.log("Event Type:", event.type);

        // Use event data directly - it contains the updated state
        const subscription = event.data.object as Stripe.Subscription;

        console.log("Subscription ID:", subscription.id);
        console.log("Customer ID:", subscription.customer);
        console.log("Status:", subscription.status);

        // Only update existing subscriptions - don't create new ones here
        const existingSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!existingSub) {
          console.log(
            "⏭️ Skipping update - subscription not yet created (waiting for payment)"
          );
          break;
        }

        // Extract Product details from subscription items
        const subscriptionItem = subscription.items.data[0];

        // Calculate current billing period - get from subscription items
        const currentPeriodStart = subscriptionItem.current_period_start;
        const currentPeriodEnd = subscriptionItem.current_period_end;
        const price = subscriptionItem.price;
        const stripeProductId =
          typeof price.product === "string"
            ? price.product
            : (price.product as Stripe.Product).id;
        const stripePriceId = price.id;

        let productName: string = existingSub.productNames[0] || "";
        let productDescription: string | null = existingSub.productDescription;
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

        // Map Stripe status
        let status: "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE" = "ACTIVE";
        const stripeStatus = subscription.status;
        // Check both cancel_at_period_end AND cancel_at (scheduled cancellation)
        const willCancel =
          subscription.cancel_at_period_end || !!subscription.cancel_at;
        if (stripeStatus === "canceled") status = "CANCELED";
        else if (stripeStatus === "paused") status = "PAUSED";
        else if (stripeStatus === "past_due") status = "PAST_DUE";

        console.log(
          "📊 Updated Status:",
          stripeStatus,
          "->",
          status,
          willCancel
            ? `(cancels ${subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toLocaleDateString() : "at period end"})`
            : ""
        );

        // If subscription is being canceled at period end, immediately cancel any PENDING orders
        if (willCancel && !existingSub.cancelAtPeriodEnd) {
          console.log("🔄 Subscription marked for cancellation - checking for PENDING orders...");
          
          const pendingOrders = await prisma.order.findMany({
            where: {
              stripeSubscriptionId: subscription.id,
              status: "PENDING"
            }
          });

          if (pendingOrders.length > 0) {
            console.log(`📦 Found ${pendingOrders.length} PENDING order(s) - canceling immediately...`);
            
            for (const order of pendingOrders) {
              try {
                // Process refund if payment intent exists
                if (order.stripePaymentIntentId) {
                  await stripe.refunds.create({
                    payment_intent: order.stripePaymentIntentId,
                    reason: "requested_by_customer",
                  });
                  console.log(`💰 Refund processed for order ${order.id}`);
                }

                // Cancel the order
                await prisma.order.update({
                  where: { id: order.id },
                  data: { status: "CANCELLED" }
                });
                console.log(`✅ Order ${order.id} canceled`);

                // Restore inventory
                const orderWithItems = await prisma.order.findUnique({
                  where: { id: order.id },
                  include: {
                    items: {
                      include: {
                        purchaseOption: {
                          include: {
                            variant: true
                          }
                        }
                      }
                    }
                  }
                });

                if (orderWithItems) {
                  for (const item of orderWithItems.items) {
                    await prisma.productVariant.update({
                      where: { id: item.purchaseOption.variant.id },
                      data: { stockQuantity: { increment: item.quantity } }
                    });
                    console.log(`📈 Restored stock for variant ${item.purchaseOption.variant.id}`);
                  }
                }
              } catch (orderCancelError) {
                console.error(`❌ Failed to cancel order ${order.id}:`, orderCancelError);
              }
            }

            // Now cancel the subscription immediately in Stripe
            console.log("🔄 Canceling subscription immediately in Stripe...");
            await stripe.subscriptions.cancel(subscription.id);
            console.log("✅ Subscription canceled immediately");
          }
        }

        // Get shipping address from subscription metadata
        const shipping = subscription.metadata.shipping_address
          ? JSON.parse(subscription.metadata.shipping_address)
          : null;

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status,
            quantities: [subscriptionItem.quantity || 1],
            priceInCents: price.unit_amount || 0,
            currentPeriodStart: new Date(currentPeriodStart * 1000),
            currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            cancelAtPeriodEnd: willCancel,
            canceledAt:
              stripeStatus === "canceled" || subscription.canceled_at
                ? new Date(
                    (subscription.canceled_at ||
                      Math.floor(Date.now() / 1000)) * 1000
                  )
                : null,
            deliverySchedule,
            stripeProductIds: [stripeProductId],
            stripePriceIds: [stripePriceId],
            productNames: [productName],
            productDescription,
            recipientName: shipping?.name || existingSub.recipientName,
            shippingStreet: shipping?.line1 || existingSub.shippingStreet,
            shippingCity: shipping?.city || existingSub.shippingCity,
            shippingState: shipping?.state || existingSub.shippingState,
            shippingPostalCode:
              shipping?.postal_code || existingSub.shippingPostalCode,
            shippingCountry: shipping?.country || existingSub.shippingCountry,
          },
        });

        console.log("✅ Subscription updated in database:", subscription.id);
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
  } catch (err: unknown) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

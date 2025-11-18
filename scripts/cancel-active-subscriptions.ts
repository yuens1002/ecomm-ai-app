import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

async function cancelActiveSubscriptions() {
  console.log("🔍 Finding active subscriptions...");

  // Find all active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: ["ACTIVE", "PAUSED"],
      },
    },
    include: {
      user: true,
    },
  });

  console.log(`Found ${activeSubscriptions.length} active subscription(s)`);

  if (activeSubscriptions.length === 0) {
    console.log("✅ No active subscriptions to cancel");
    return;
  }

  // Cancel each subscription
  for (const sub of activeSubscriptions) {
    try {
      console.log(
        `\n🔄 Canceling subscription ${sub.id} (${sub.user.email})...`
      );
      console.log(`   Stripe ID: ${sub.stripeSubscriptionId}`);

      // Cancel in Stripe
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      console.log("   ✅ Canceled in Stripe");

      // Update in database
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
        },
      });
      console.log("   ✅ Updated in database");
    } catch (error: any) {
      console.error(`   ❌ Error canceling subscription ${sub.id}:`, error.message);
    }
  }

  console.log("\n✅ All subscriptions processed");
}

cancelActiveSubscriptions()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

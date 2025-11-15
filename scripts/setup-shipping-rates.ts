/**
 * Script to create Stripe shipping rates
 * Run once to set up shipping options in your Stripe account
 * 
 * Usage: npx tsx scripts/setup-shipping-rates.ts
 */

import { config } from "dotenv";
import Stripe from "stripe";

// Load environment variables
config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

async function setupShippingRates() {
  console.log("Creating shipping rates in Stripe...\n");

  try {
    // Standard Shipping - 5-7 business days
    const standardRate = await stripe.shippingRates.create({
      display_name: "Standard Shipping",
      type: "fixed_amount",
      fixed_amount: {
        amount: 599, // $5.99
        currency: "usd",
      },
      delivery_estimate: {
        minimum: {
          unit: "business_day",
          value: 5,
        },
        maximum: {
          unit: "business_day",
          value: 7,
        },
      },
    });
    console.log("✅ Standard Shipping created:", standardRate.id);

    // Express Shipping - 2-3 business days
    const expressRate = await stripe.shippingRates.create({
      display_name: "Express Shipping",
      type: "fixed_amount",
      fixed_amount: {
        amount: 1299, // $12.99
        currency: "usd",
      },
      delivery_estimate: {
        minimum: {
          unit: "business_day",
          value: 2,
        },
        maximum: {
          unit: "business_day",
          value: 3,
        },
      },
    });
    console.log("✅ Express Shipping created:", expressRate.id);

    // Overnight Shipping - 1 business day
    const overnightRate = await stripe.shippingRates.create({
      display_name: "Overnight Shipping",
      type: "fixed_amount",
      fixed_amount: {
        amount: 2499, // $24.99
        currency: "usd",
      },
      delivery_estimate: {
        minimum: {
          unit: "business_day",
          value: 1,
        },
        maximum: {
          unit: "business_day",
          value: 1,
        },
      },
    });
    console.log("✅ Overnight Shipping created:", overnightRate.id);

    console.log("\n✨ All shipping rates created successfully!");
    console.log("\nAdd these to your .env.local:");
    console.log(`STRIPE_STANDARD_SHIPPING_RATE=${standardRate.id}`);
    console.log(`STRIPE_EXPRESS_SHIPPING_RATE=${expressRate.id}`);
    console.log(`STRIPE_OVERNIGHT_SHIPPING_RATE=${overnightRate.id}`);
  } catch (error: any) {
    console.error("❌ Error creating shipping rates:", error.message);
    if (error.code === "resource_already_exists") {
      console.log("\n⚠️  Shipping rates already exist. To view them:");
      console.log("   Visit: https://dashboard.stripe.com/test/shipping-rates");
    }
  }
}

setupShippingRates();

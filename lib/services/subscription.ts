/**
 * Subscription Service
 * Processor-agnostic database operations for subscriptions
 */

import { prisma } from "@/lib/prisma";
import type {
  NormalizedSubscriptionData,
  NormalizedShippingAddress,
} from "@/lib/payments/types";

/**
 * User info returned from lookup
 */
export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
}

/**
 * Finds user by processor customer ID via order history
 */
export async function findUserByProcessorCustomerId(
  processorCustomerId: string
): Promise<UserInfo | null> {
  // Try to find via orders (works for any processor that stores customer ID)
  const user = await prisma.user.findFirst({
    where: {
      orders: {
        some: {
          stripeCustomerId: processorCustomerId, // TODO: Rename to processorCustomerId in schema
        },
      },
    },
    select: { id: true, email: true, name: true, phone: true },
  });

  return user;
}

/**
 * Finds user by email
 */
export async function findUserByEmail(email: string): Promise<UserInfo | null> {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, phone: true },
  });
}

/**
 * Parameters for creating/updating subscription
 */
export interface EnsureSubscriptionParams {
  subscription: NormalizedSubscriptionData;
  userId: string;
}

/**
 * Creates or updates a subscription record from normalized data
 */
export async function ensureSubscription(
  params: EnsureSubscriptionParams
): Promise<{ id: string; isNew: boolean }> {
  const { subscription, userId } = params;

  // Extract product info from normalized items
  const productNames = subscription.items.map((item) => item.productName);
  const productDescription = subscription.items[0]?.productDescription || null;
  const productIds = subscription.items.map((item) => item.productId);
  const priceIds = subscription.items.map((item) => item.priceId);
  const quantities = subscription.items.map((item) => item.quantity);

  // Normalize shipping address to DB format
  const addressData = normalizeAddressForDb(
    subscription.shippingAddress,
    subscription.shippingName
  );

  // Check if subscription already exists
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.processorSubscriptionId },
  });

  const subscriptionData = {
    stripeCustomerId: subscription.processorCustomerId, // TODO: Rename to processorCustomerId
    status: subscription.status,
    productNames,
    productDescription,
    stripeProductIds: productIds, // TODO: Rename to processorProductIds
    stripePriceIds: priceIds, // TODO: Rename to processorPriceIds
    quantities,
    priceInCents: subscription.totalPriceInCents,
    deliverySchedule: subscription.deliverySchedule,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    pausedUntil: subscription.pausedUntil,
    recipientPhone: subscription.customerPhone,
    ...addressData,
  };

  if (existingSubscription) {
    console.log("ℹ️ Subscription already exists, updating it");
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: subscriptionData,
    });
    return { id: existingSubscription.id, isNew: false };
  }

  console.log("🆕 Creating new subscription record");
  const newSubscription = await prisma.subscription.create({
    data: {
      stripeSubscriptionId: subscription.processorSubscriptionId, // TODO: Rename
      userId,
      ...subscriptionData,
    },
  });

  return { id: newSubscription.id, isNew: true };
}

/**
 * Updates subscription from normalized data
 */
export async function updateSubscription(
  subscription: NormalizedSubscriptionData
): Promise<boolean> {
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.processorSubscriptionId },
  });

  if (!existingSub) {
    console.log(
      "⏭️ Skipping update - subscription not yet created (waiting for payment)"
    );
    return false;
  }

  // Extract product info
  const productNames = subscription.items.map((item) => item.productName);
  const productDescription = subscription.items[0]?.productDescription || null;
  const productIds = subscription.items.map((item) => item.productId);
  const priceIds = subscription.items.map((item) => item.priceId);
  const quantities = subscription.items.map((item) => item.quantity);

  // Normalize address - use new data or fall back to existing
  const addressData = subscription.shippingAddress
    ? normalizeAddressForDb(
        subscription.shippingAddress,
        subscription.shippingName
      )
    : {
        recipientName: existingSub.recipientName,
        shippingStreet: existingSub.shippingStreet,
        shippingCity: existingSub.shippingCity,
        shippingState: existingSub.shippingState,
        shippingPostalCode: existingSub.shippingPostalCode,
        shippingCountry: existingSub.shippingCountry,
      };

  console.log(
    "📊 Updated Status:",
    subscription.status,
    subscription.cancelAtPeriodEnd ? "(cancels at period end)" : ""
  );

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.processorSubscriptionId },
    data: {
      status: subscription.status,
      productNames,
      productDescription,
      stripeProductIds: productIds,
      stripePriceIds: priceIds,
      quantities,
      priceInCents: subscription.totalPriceInCents,
      deliverySchedule: subscription.deliverySchedule,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      pausedUntil: subscription.pausedUntil,
      ...addressData,
    },
  });

  console.log(
    "✅ Subscription updated in database:",
    subscription.processorSubscriptionId
  );
  return true;
}

/**
 * Gets existing subscription by processor subscription ID
 */
export async function getSubscriptionByProcessorId(
  processorSubscriptionId: string
) {
  return prisma.subscription.findUnique({
    where: { stripeSubscriptionId: processorSubscriptionId },
  });
}

/**
 * Marks subscription as canceled
 */
export async function cancelSubscription(
  processorSubscriptionId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: processorSubscriptionId },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });
  console.log("✅ Subscription marked as canceled in database");
}

/**
 * Normalizes shipping address for database storage
 */
function normalizeAddressForDb(
  address: NormalizedShippingAddress | null,
  shippingName: string | null
): {
  recipientName: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
} {
  if (!address) {
    return {
      recipientName: shippingName,
      shippingStreet: null,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
    };
  }

  return {
    recipientName: shippingName || address.name,
    shippingStreet: address.line1,
    shippingCity: address.city,
    shippingState: address.state,
    shippingPostalCode: address.postalCode,
    shippingCountry: address.country,
  };
}

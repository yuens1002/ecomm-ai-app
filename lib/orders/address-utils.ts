import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { NormalizedShippingAddress } from "@/lib/payments/types";

/**
 * Normalizes address to our database format
 */
export function normalizeAddress(
  address: NormalizedShippingAddress | null,
  recipientName: string | null
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
      recipientName: recipientName || null,
      shippingStreet: null,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
    };
  }

  return {
    recipientName: recipientName || address.name || null,
    shippingStreet: address.line1 || null,
    shippingCity: address.city || null,
    shippingState: address.state || null,
    shippingPostalCode: address.postalCode || null,
    shippingCountry: address.country || null,
  };
}

/**
 * Saves shipping address to user's address book for reuse
 */
export async function saveUserAddress(
  userId: string,
  address: NormalizedShippingAddress
): Promise<void> {
  if (!address.line1) {
    return;
  }

  // Check if this exact address already exists
  const existingAddress = await prisma.address.findFirst({
    where: {
      userId,
      street: address.line1 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
    },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId,
        street: address.line1 || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "",
        isDefault: false,
      },
    });
    logger.debug("📍 Saved address for future reuse");
  }
}

/**
 * Updates user's name and phone if they don't have them set
 */
export async function updateUserContactInfo(
  userId: string,
  shippingName: string | null,
  customerPhone: string | null,
  existingUser: { name: string | null; phone: string | null }
): Promise<void> {
  const updates: { name?: string; phone?: string } = {};

  if (shippingName && !existingUser.name) {
    updates.name = shippingName;
  }
  if (customerPhone && !existingUser.phone) {
    updates.phone = customerPhone;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });
  }
}

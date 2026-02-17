import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { NormalizedCartItem } from "@/lib/payments/types";
import type { PurchaseOptionWithDetails, ValidationResult } from "./types";

/**
 * Fetches purchase options with full product/variant details
 */
export async function fetchPurchaseOptions(
  purchaseOptionIds: string[]
): Promise<PurchaseOptionWithDetails[]> {
  const options = await prisma.purchaseOption.findMany({
    where: { id: { in: purchaseOptionIds } },
    include: {
      variant: {
        select: {
          id: true,
          name: true,
          isDisabled: true,
          stockQuantity: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isDisabled: true,
            },
          },
        },
      },
    },
  });

  return options as PurchaseOptionWithDetails[];
}

/**
 * Validates that all products are available and have sufficient stock
 */
export function validateStockAndProducts(
  cartItems: NormalizedCartItem[],
  purchaseOptions: PurchaseOptionWithDetails[]
): ValidationResult {
  for (const item of cartItems) {
    const option = purchaseOptions.find((po) => po.id === item.purchaseOptionId);

    if (!option) {
      return {
        valid: false,
        error: `Invalid purchase option: ${item.purchaseOptionId}`,
      };
    }

    if (option.variant.product.isDisabled) {
      return {
        valid: false,
        error: `${option.variant.product.name} is unavailable and cannot be purchased.`,
      };
    }

    if (option.variant.isDisabled) {
      return {
        valid: false,
        error: `${option.variant.product.name} - ${option.variant.name} is unavailable and cannot be purchased.`,
      };
    }

    if (option.variant.stockQuantity < item.quantity) {
      return {
        valid: false,
        error: `${option.variant.product.name} - ${option.variant.name} does not have enough stock for this order.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Decrements inventory for purchased items
 */
export async function decrementInventory(
  items: Array<{
    purchaseOption: {
      variant: {
        id: string;
        name: string;
        product: {
          name: string;
        };
      };
    };
    quantity: number;
  }>
): Promise<void> {
  for (const item of items) {
    try {
      await prisma.productVariant.update({
        where: { id: item.purchaseOption.variant.id },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
      logger.debug(
        `📉 Decremented stock for ${item.purchaseOption.variant.product.name} - ${item.purchaseOption.variant.name}`
      );
    } catch (inventoryError) {
      logger.error("Failed to update inventory:", inventoryError);
      // Continue processing even if inventory update fails
    }
  }
}

/**
 * Restores inventory when an order is canceled
 */
export async function restoreInventory(orderId: string): Promise<void> {
  const orderWithItems = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          purchaseOption: {
            include: {
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!orderWithItems) {
    logger.error(`Order ${orderId} not found for inventory restoration`);
    return;
  }

  for (const item of orderWithItems.items) {
    await prisma.productVariant.update({
      where: { id: item.purchaseOption.variant.id },
      data: { stockQuantity: { increment: item.quantity } },
    });
    logger.debug(
      `📈 Restored stock for variant ${item.purchaseOption.variant.id}`
    );
  }
}

/**
 * Calculates total price for a set of items
 */
export function calculateItemTotal(
  items: NormalizedCartItem[],
  purchaseOptions: PurchaseOptionWithDetails[]
): number {
  return items.reduce((sum, item) => {
    const option = purchaseOptions.find((po) => po.id === item.purchaseOptionId);
    return sum + (option?.priceInCents || 0) * item.quantity;
  }, 0);
}

/**
 * Separates items by purchase type (ONE_TIME vs SUBSCRIPTION)
 */
export function separateItemsByType(
  items: NormalizedCartItem[],
  purchaseOptions: PurchaseOptionWithDetails[]
): {
  oneTimeItems: NormalizedCartItem[];
  subscriptionItems: NormalizedCartItem[];
} {
  const oneTimeItems = items.filter((item) => {
    const option = purchaseOptions.find((po) => po.id === item.purchaseOptionId);
    return option?.type === "ONE_TIME";
  });

  const subscriptionItems = items.filter((item) => {
    const option = purchaseOptions.find((po) => po.id === item.purchaseOptionId);
    return option?.type === "SUBSCRIPTION";
  });

  return { oneTimeItems, subscriptionItems };
}

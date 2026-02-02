import type { OrderWithItems, OrderItemWithDetails } from "@/lib/types";

/**
 * Email item format for order confirmation/notification emails
 */
export interface EmailOrderItem {
  productName: string;
  variantName: string;
  quantity: number;
  priceInCents: number;
  purchaseType: string;
  deliverySchedule: string | null;
}

/**
 * Shipping address format for emails
 */
export interface EmailShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Parameters for sending order confirmation email
 */
export interface SendOrderConfirmationParams {
  orders: OrderWithItems[];
  storeName: string;
}

/**
 * Parameters for sending merchant notification email
 */
export interface SendMerchantNotificationParams {
  order: OrderWithItems;
  isRecurringOrder?: boolean;
  deliverySchedule?: string | null;
}

/**
 * Result of email sending operation
 */
export interface EmailSendResult {
  success: boolean;
  error?: string;
}

// Re-export for convenience
export type { OrderWithItems, OrderItemWithDetails };

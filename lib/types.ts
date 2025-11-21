import { Prisma } from "@prisma/client";
import {
  getFeaturedProducts,
  getProductBySlug,
  getRelatedProducts,
  getProductsByCategorySlug,
  getAllCategories,
} from "./data";

// --- Database Schema Payloads ---
// These types are inferred directly from our DAL functions,
// ensuring our frontend types always match our database queries.

/**
 * The data payload for a Product on the Category Page.
 */
export type CategoryProduct = Prisma.PromiseReturnType<
  typeof getProductsByCategorySlug
>[number];

/**
 * The data payload for a Product on the Homepage.
 */
export type FeaturedProduct = Prisma.PromiseReturnType<
  typeof getFeaturedProducts
>[number];

/**
 * The full data payload for the Product Detail Page, as returned by `getProductBySlug`.
 */
export type FullProductPayload = Prisma.PromiseReturnType<
  typeof getProductBySlug
>;

/**
 * The data payload for *one* product in the "Related Products" carousel.
 * We use [number] to get the type of a single item from the array.
 */
export type RelatedProduct = Prisma.PromiseReturnType<
  typeof getRelatedProducts
>[number];

/**
 * A simple type for the Category, used in navigation and breadcrumbs.
 * This is now the actual type returned by getAllCategories and getCategoryBySlug.
 */
export type Category = Prisma.PromiseReturnType<
  typeof getAllCategories
>[number];

// --- Order Types ---

/**
 * OrderItem with full purchaseOption details including variant and product.
 * This matches the shape returned by the /api/user/orders endpoint.
 */
export interface OrderItemWithDetails {
  id: string;
  quantity: number;
  priceInCents: number;
  orderId: string;
  purchaseOptionId: string;
  purchaseOption: {
    id: string;
    type: string;
    priceInCents: number;
    billingInterval: string | null;
    intervalCount: number | null;
    variantId: string;
    variant: {
      id: string;
      name: string;
      productId: string;
      product: {
        name: string;
        slug: string;
        roastLevel: string;
      };
    };
  };
}

/**
 * Order with full item details including nested purchaseOption, variant, and product.
 * This matches the shape returned by the /api/user/orders endpoint.
 */
export interface OrderWithItems {
  id: string;
  totalInCents: number;
  status: string;
  deliveryMethod: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  customerEmail: string | null;
  paymentCardLast4: string | null;
  recipientName: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: Date | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemWithDetails[];
  orderNumber?: string | null;
}

// --- Component Prop Types ---

/**
 * Props for the <ProductCard> component.
 * It takes a single 'product' object that can come from any of the product lists.
 * Uses Zustand cart store for add-to-cart functionality.
 */
export interface ProductCardProps {
  product: FeaturedProduct | CategoryProduct | RelatedProduct;
  showPurchaseOptions?: boolean;
  disableCardEffects?: boolean;
}

/**
 * Props for the <AiHelperModal> component.
 */
export interface AiHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

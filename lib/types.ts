import { Prisma } from "@prisma/client";
import {
  getFeaturedProducts, // Used for FeaturedProducts
  getProductBySlug, // Used for ProductClientPage
  getRelatedProducts, // Used for ProductClientPage
} from "./data";

// --- Database Schema Payloads ---
// These types are inferred directly from our DAL functions,
// ensuring our frontend types always match our database queries.

/**
 * The full data payload for a single product, as returned by `getFeaturedProducts`.
 * This is what <ProductCard> expects.
 * This type AUTOMATICALLY includes:
 * - id, name, slug, origin, tastingNotes, roastLevel, etc.
 * - images (as an array)
 * - variants (as an array, which includes purchaseOptions)
 */
export type Product = Prisma.PromiseReturnType<
  typeof getFeaturedProducts
>[number];

/**
 * The full data payload for the Product Detail Page, as returned by `getProductBySlug`.
 */
export type FullProductPayload = Prisma.PromiseReturnType<
  typeof getProductBySlug
>;

/**
 * The data payload for the "Related Products" carousel, as returned by `getRelatedProducts`.
 * This is a partial product type (it only includes what the card needs).
 */
export type RelatedProductPayload = Prisma.PromiseReturnType<
  typeof getRelatedProducts
>;

// --- Component Prop Types ---

/**
 * Props for the <ProductCard> component.
 * It takes a single 'product' object, typed as `Product`.
 */
export interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
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

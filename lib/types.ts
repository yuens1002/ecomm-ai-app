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

// --- Component Prop Types ---

/**
 * Props for the <ProductCard> component.
 * It takes a single 'product' object that can come from any of the product lists.
 */
export interface ProductCardProps {
  product: FeaturedProduct | CategoryProduct | RelatedProduct;
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

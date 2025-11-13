// --- Database Schema Types ---
// These interfaces match our Prisma schema

export interface PurchaseOption {
  id: string;
  type: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  stockQuantity: number;
  purchaseOptions: PurchaseOption[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tastingNotes: string[];
  isOrganic: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
  createdAt: Date; // Prisma returns Date objects
  updatedAt: Date;
  images: ProductImage[];
  variants: ProductVariant[];
}

// --- Component Prop Types ---

export interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  showPurchaseOptions?: boolean;
}

export interface AiHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

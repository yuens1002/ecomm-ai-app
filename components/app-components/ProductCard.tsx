"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ProductCardProps } from "@/lib/types"; // lib path stays the same
import { useCartStore } from "@/lib/store/cart-store";

// Import shadcn/ui components
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"; // shadcn/ui path remains the same
import { Button } from "@/components/ui/button"; // shadcn/ui path remains the same

// --- Product Card Component ---
export default function ProductCard({
  product,
  showPurchaseOptions = true,
  disableCardEffects = false,
  categorySlug,
}: Omit<ProductCardProps, "onAddToCart"> & { categorySlug?: string }) {
  const addItem = useCartStore((state) => state.addItem);

  // --- Find price and image ---
  const displayVariant = product.variants[0];
  const oneTimePrice = displayVariant?.purchaseOptions.find(
    (p) => p.type === "ONE_TIME"
  );
  const displayPrice = oneTimePrice
    ? (oneTimePrice.priceInCents / 100).toFixed(2)
    : "N/A";

  // Note: Image URLs are fixed to return .png for optimization
  const displayImage =
    product.images[0]?.url ||
    "https://placehold.co/600x400/CCCCCC/FFFFFF.png?text=Image+Not+Found";
  const altText =
    product.images[0]?.altText || `A bag of ${product.name} coffee`;

  // Define the destination URL using the product's slug
  // If categorySlug is provided, include it as a query parameter
  const productUrl = categorySlug
    ? `/products/${product.slug}?from=${encodeURIComponent(categorySlug)}`
    : `/products/${product.slug}`;

  return (
    <Link
      href={productUrl}
      className="rounded-lg"
      aria-label={`View ${product.name} product page`}
    >
      <Card
        className={clsx(
          "w-full overflow-hidden rounded-lg bg-card-bg flex flex-col justify-between p-0",
          !disableCardEffects &&
            "cursor-pointer transition-transform duration-300 group-hover:scale-105 shadow-lg"
        )}
      >
        {/* 1. Image container. The parent <Card> clips its top corners. */}
        <CardHeader className="relative w-full aspect-16/10">
          <Image
            src={displayImage}
            alt={altText}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={product.isFeatured}
          />
        </CardHeader>

        {/* 2. CardContent holds all text content. */}
        {/* Added the 'grow' class to push the footer down. */}
        <CardContent className="pb-3 grow">
          <CardTitle className="text-xl font-semibold text-text-base mb-1">
            {product.name}
          </CardTitle>
          <CardDescription className="text-sm text-text-muted italic mb-4">
            {product.tastingNotes.join(", ")}
          </CardDescription>

          {showPurchaseOptions && (
            <p className="text-lg font-bold text-primary">${displayPrice}</p>
          )}
        </CardContent>

        {/* 3. CardFooter (only shows if purchase options are enabled) */}
        {showPurchaseOptions && (
          <CardFooter className="p-6 pt-0">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                // Add to cart with default variant and one-time purchase
                if (displayVariant && oneTimePrice) {
                  addItem({
                    productId: product.id,
                    productName: product.name,
                    productSlug: product.slug,
                    variantId: displayVariant.id,
                    variantName: displayVariant.name,
                    purchaseOptionId: oneTimePrice.id,
                    purchaseType: "ONE_TIME",
                    priceInCents: oneTimePrice.priceInCents,
                    imageUrl: displayImage,
                  });
                }
              }}
              className="w-full cursor-pointer"
            >
              Add to Cart
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}

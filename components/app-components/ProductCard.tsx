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
  // If categorySlug is provided, use it. Otherwise, try to find a primary category or fallback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roastLevelSlug = (product as any).roastLevel
    ? `${(product as any).roastLevel.toLowerCase()}-roast`
    : "blends";
  const urlCategory = categorySlug || roastLevelSlug;
  const productUrl = `/${urlCategory}/${product.slug}`;

  return (
    <Link
      href={productUrl}
      className="rounded-lg"
      aria-label={`View ${product.name} product page`}
    >
      <Card
        className={clsx(
          "w-full overflow-hidden rounded-none bg-card-bg flex flex-col justify-between p-4 border-0 shadow-none gap-0",
          !disableCardEffects && "cursor-pointer"
        )}
      >
        {/* 1. Image container. The parent <Card> clips its top corners. */}
        <CardHeader className="relative w-full aspect-square rounded-t-lg p-0 overflow-hidden max-h-[200px]">
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
        <div className="border-x border-b rounded-b-lg">
          <CardContent className="grow py-4">
            <CardTitle className="text-xl overflow-hidden text-ellipsis whitespace-nowrap p-0">
              {product.name}
            </CardTitle>
            <CardDescription className="text-sm italic pt-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {product.tastingNotes.join(", ")}
            </CardDescription>

            {showPurchaseOptions && (
              <p className="text-lg font-bold text-primary pt-2">
                ${displayPrice}
              </p>
            )}
          </CardContent>

          {/* 3. CardFooter (only shows if purchase options are enabled) */}
          {showPurchaseOptions && (
            <CardFooter className="pb-8">
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
                      categorySlug: urlCategory,
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
        </div>
      </Card>
    </Link>
  );
}

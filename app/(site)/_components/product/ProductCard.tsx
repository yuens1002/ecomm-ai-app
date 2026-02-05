"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ProductType } from "@prisma/client";
import { ProductCardProps } from "@/lib/types";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { useAddToCartWithFeedback } from "@/hooks/useAddToCartWithFeedback";
import { AddToCartButton } from "./AddToCartButton";

import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";

// --- Product Card Component ---
export default function ProductCard({
  product,
  showPurchaseOptions = true,
  disableCardEffects = false,
  categorySlug,
  priority = false,
  cardPaddingClass,
  hidePrice = false,
  hidePriceOnMobile = false,
}: Omit<ProductCardProps, "onAddToCart"> & {
  categorySlug?: string;
  priority?: boolean;
  hidePrice?: boolean;
  /** Hide price on mobile/sm breakpoints only (for carousel context) */
  hidePriceOnMobile?: boolean;
}) {
  const { buttonState, isCheckingOut, handleAddToCart, handleActionClick } =
    useAddToCartWithFeedback();

  // --- Find price and image ---
  const displayVariant = product.variants[0];
  const oneTimePrice = displayVariant?.purchaseOptions.find(
    (p) => p.type === "ONE_TIME"
  );
  const displayPrice = oneTimePrice
    ? (oneTimePrice.priceInCents / 100).toFixed(2)
    : "N/A";

  // Use product name as seed for consistent placeholder image selection
  // Merch products use culture images (cups, equipment), coffee products use bean images
  const placeholderCategory = product.type === ProductType.MERCH ? "culture" : "beans";
  const displayImage =
    product.images[0]?.url || getPlaceholderImage(product.name, 800, placeholderCategory);
  const altText =
    product.images[0]?.altText || (product.type === ProductType.MERCH ? product.name : `A bag of ${product.name} coffee`);

  // Canonical product URL with optional ?from= to preserve navigation context
  const productUrl = categorySlug
    ? `/products/${product.slug}?from=${encodeURIComponent(categorySlug)}`
    : `/products/${product.slug}`;

  const handleAdd = () => {
    if (displayVariant && oneTimePrice) {
      handleAddToCart({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        categorySlug,
        variantId: displayVariant.id,
        variantName: displayVariant.name,
        purchaseOptionId: oneTimePrice.id,
        purchaseType: "ONE_TIME",
        priceInCents: oneTimePrice.priceInCents,
        imageUrl: displayImage,
      });
    }
  };

  const handleAction = async () => {
    await handleActionClick();
  };

  return (
    <Link
      href={productUrl}
      className="rounded-lg"
      aria-label={`View ${product.name} product page`}
    >
      <Card
        className={clsx(
          "w-full overflow-hidden rounded-none bg-card-bg flex flex-col justify-between border-0 shadow-none gap-0",
          cardPaddingClass ? cardPaddingClass : "p-0",
          !disableCardEffects && "cursor-pointer"
        )}
      >
        {/* 1. Image container. The parent <Card> clips its top corners. */}
        <CardHeader className="relative w-full aspect-square rounded-t-lg p-0 overflow-hidden">
          <Image
            src={displayImage}
            alt={altText}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority || product.isFeatured}
          />
        </CardHeader>

        {/* 2. CardContent holds all text content. */}
        <div className="border-x border-b rounded-b-lg">
          <CardContent className="grow py-4">
            <CardTitle className="text-xl overflow-hidden text-ellipsis whitespace-nowrap p-0">
              {product.name}
            </CardTitle>
            {product.type === ProductType.COFFEE &&
              product.tastingNotes.length > 0 && (
                <CardDescription className="text-sm italic pt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {product.tastingNotes.join(", ")}
                </CardDescription>
              )}
          </CardContent>

          {/* 3. CardFooter (only shows if purchase options are enabled) */}
          {showPurchaseOptions && (
            <CardFooter className="pb-8 flex items-center justify-between">
              <AddToCartButton
                buttonState={buttonState}
                onAddToCart={handleAdd}
                onActionClick={handleAction}
                disabled={!displayVariant || !oneTimePrice}
                isProcessing={isCheckingOut}
                className="cursor-pointer"
              />
              {!hidePrice && (
                <div className={hidePriceOnMobile ? "hidden md:block" : ""}>
                  <p className="text-lg font-bold text-primary">
                    ${displayPrice}
                  </p>
                </div>
              )}
            </CardFooter>
          )}
        </div>
      </Card>
    </Link>
  );
}

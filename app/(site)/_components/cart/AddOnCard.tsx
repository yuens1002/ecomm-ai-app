"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface AddOnCardProps {
  addOn: {
    product: {
      id: string;
      name: string;
      slug: string;
      type: string;
      description: string | null;
    };
    variant: {
      id: string;
      name: string;
      weight: number;
      stockQuantity: number;
      purchaseOptions: Array<{
        id: string;
        priceInCents: number;
        type: string;
      }>;
    };
    discountedPriceInCents: number;
    imageUrl?: string;
    categorySlug?: string;
  };
  weightUnit: string;
  buttonText?: string;
  onAddToCart: (addOn: AddOnCardProps["addOn"]) => void;
}

export function AddOnCard({
  addOn,
  buttonText = "Add to Cart",
  onAddToCart,
}: AddOnCardProps) {
  const { product, variant, discountedPriceInCents } = addOn;

  // Get the regular price
  const regularPrice = variant
    ? variant.purchaseOptions[0]?.priceInCents || 0
    : 0;

  // Use discounted price if available, otherwise use regular price
  const displayPrice = discountedPriceInCents || regularPrice;
  const hasDiscount =
    discountedPriceInCents && discountedPriceInCents < regularPrice;

  const imageUrl =
    addOn.imageUrl ||
    "https://placehold.co/300x200/CCCCCC/FFFFFF.png?text=No+Image";

  return (
    <div className="flex flex-row gap-4 w-full">
      {/* Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-muted rounded">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover rounded"
          sizes="(max-width: 640px) 80px, 96px"
        />
      </div>

      {/* Title and Button/Pricing */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <h3 className="font-normal text-sm sm:text-base text-text-base mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <Button
            onClick={() => onAddToCart(addOn)}
            size="sm"
            className="whitespace-nowrap w-full sm:w-auto"
          >
            {buttonText}
          </Button>

          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                ${formatPrice(regularPrice)}
              </span>
            )}
            <span className="font-bold text-base sm:text-lg text-text-base">
              ${formatPrice(displayPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

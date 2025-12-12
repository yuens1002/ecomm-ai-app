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
    } | null;
    discountedPriceInCents: number | null;
  };
  weightUnit: string;
  onAddToCart: (addOn: AddOnCardProps["addOn"]) => void;
}

export function AddOnCard({ addOn, onAddToCart }: AddOnCardProps) {
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
    "https://placehold.co/300x200/CCCCCC/FFFFFF.png?text=No+Image";

  return (
    <div className="flex flex-row gap-6">
      {/* Image */}
      <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover rounded"
          sizes="96px"
        />
      </div>

      {/* Title and Button/Pricing Stacked */}
      <div className="flex-1 flex flex-col justify-between">
        <h3 className="font-semibold text-base text-text-base mb-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => onAddToCart(addOn)}
            className="whitespace-nowrap"
          >
            Add to Cart
          </Button>

          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${formatPrice(regularPrice)}
              </span>
            )}
            <span className="font-bold text-lg text-text-base">
              ${formatPrice(displayPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

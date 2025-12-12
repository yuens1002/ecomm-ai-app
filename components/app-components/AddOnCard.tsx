"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
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

export function AddOnCard({ addOn, weightUnit, onAddToCart }: AddOnCardProps) {
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image */}
          <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-muted">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 128px"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-0 sm:py-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-semibold text-base hover:underline"
                  >
                    {product.name}
                  </Link>
                  {variant && (
                    <p className="text-sm text-muted-foreground">
                      {variant.name} • {variant.weight}
                      {weightUnit}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {product.type}
                </Badge>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  ${formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${formatPrice(regularPrice)}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => onAddToCart(addOn)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

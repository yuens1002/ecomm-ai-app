"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { useCartStore } from "@/lib/store/cart-store";

type CardButtonState = "idle" | "added" | "checkout";

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

const ADDED_DURATION = 1200;
const CHECKOUT_REVERT_DURATION = 8000;

export function AddOnCard({
  addOn,
  buttonText = "+ Add",
  onAddToCart,
}: AddOnCardProps) {
  const { product, variant, discountedPriceInCents } = addOn;
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const [cardState, setCardState] = useState<CardButtonState>("idle");
  const addedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (addedTimerRef.current) {
      clearTimeout(addedTimerRef.current);
      addedTimerRef.current = null;
    }
    if (revertTimerRef.current) {
      clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handleClick = () => {
    if (cardState === "idle") {
      onAddToCart(addOn);
      clearTimers();
      setCardState("added");

      addedTimerRef.current = setTimeout(() => {
        setCardState("checkout");

        revertTimerRef.current = setTimeout(() => {
          setCardState("idle");
        }, CHECKOUT_REVERT_DURATION);
      }, ADDED_DURATION);
    } else if (cardState === "checkout") {
      clearTimers();
      setCartOpen(true);
      setCardState("idle");
    }
  };

  const regularPrice = variant.purchaseOptions[0]?.priceInCents || 0;
  const displayPrice = discountedPriceInCents || regularPrice;
  const hasDiscount =
    discountedPriceInCents && discountedPriceInCents < regularPrice;

  const imageUrl =
    addOn.imageUrl || getPlaceholderImage(addOn.product.name, 400, "culture");

  return (
    <div className="flex flex-row gap-4 w-full">
      {/* Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 80px, 96px"
        />
      </div>

      {/* Title and Button/Pricing — bottom-aligned with image */}
      <div className="flex-1 flex flex-col justify-end min-w-0">
        <h3 className="font-normal text-sm sm:text-base text-text-base mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleClick}
            size="sm"
            variant={cardState === "added" ? "default" : "default"}
            className={
              cardState === "added"
                ? "bg-green-600 hover:bg-green-600 text-white whitespace-nowrap"
                : "whitespace-nowrap"
            }
            disabled={cardState === "added"}
          >
            {cardState === "idle" && buttonText}
            {cardState === "added" && (
              <>
                <Check className="w-4 h-4 mr-1" />
                Added!
              </>
            )}
            {cardState === "checkout" && "Checkout Now"}
          </Button>

          <div className="flex items-center gap-2 shrink-0">
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

"use client";

import Image from "next/image";
import { Check, Zap, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import {
  useAddToCartWithFeedback,
  type ButtonState,
  type CartItemInput,
} from "@/hooks/useAddToCartWithFeedback";

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

const btnConfig: Record<
  ButtonState,
  { text: string; Icon: typeof ShoppingCart; className: string }
> = {
  idle: { text: "Add", Icon: ShoppingCart, className: "" },
  adding: { text: "Adding...", Icon: Loader2, className: "" },
  added: {
    text: "Added!",
    Icon: Check,
    className: "bg-green-600 hover:bg-green-600 text-white",
  },
  "buy-now": {
    text: "Buy Now",
    Icon: Zap,
    className: "bg-amber-500 hover:bg-amber-600 text-white animate-pulse",
  },
  "checkout-now": {
    text: "View Cart",
    Icon: ShoppingCart,
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
};

export function AddOnCard({
  addOn,
  buttonText = "Add",
  onAddToCart,
}: AddOnCardProps) {
  const { product, variant, discountedPriceInCents } = addOn;

  const { buttonState, handleAddToCart, handleActionClick } =
    useAddToCartWithFeedback();

  const isActionState =
    buttonState === "buy-now" || buttonState === "checkout-now";

  const handleClick = () => {
    if (isActionState) {
      handleActionClick();
    } else if (buttonState === "idle") {
      // Call parent handler (which adds to cart with proper item shape)
      onAddToCart(addOn);

      // Also drive the hook's state machine with a cart item
      const purchaseOption = variant.purchaseOptions[0];
      if (purchaseOption) {
        const effectivePrice = discountedPriceInCents || purchaseOption.priceInCents;
        const cartItem: CartItemInput = {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          categorySlug: addOn.categorySlug || "",
          variantId: variant.id,
          variantName: variant.name,
          purchaseOptionId: purchaseOption.id,
          purchaseType: purchaseOption.type as "ONE_TIME" | "SUBSCRIPTION",
          priceInCents: effectivePrice,
          ...(effectivePrice < purchaseOption.priceInCents && {
            originalPriceInCents: purchaseOption.priceInCents,
          }),
          imageUrl:
            addOn.imageUrl ||
            getPlaceholderImage(product.name, 400, "culture"),
        };
        handleAddToCart(cartItem);
      }
    }
  };

  const regularPrice = variant.purchaseOptions[0]?.priceInCents || 0;
  const displayPrice = discountedPriceInCents || regularPrice;
  const hasDiscount =
    discountedPriceInCents && discountedPriceInCents < regularPrice;

  const imageUrl =
    addOn.imageUrl || getPlaceholderImage(addOn.product.name, 400, "culture");

  const config = btnConfig[buttonState];
  const displayText = buttonState === "idle" ? buttonText : config.text;
  const { Icon } = config;

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
            className={`whitespace-nowrap ${config.className}`}
            disabled={buttonState === "added" || buttonState === "adding"}
          >
            <Icon
              className={`w-4 h-4 mr-1 ${buttonState === "adding" ? "animate-spin" : ""}`}
            />
            {displayText}
          </Button>

          <div className="flex items-center gap-2 shrink-0">
            {hasDiscount ? (
              <div className="text-right">
                <span className="text-xs text-muted-foreground line-through block">
                  ${formatPrice(regularPrice)}
                </span>
                <span className="font-bold text-sm text-text-base">
                  ${formatPrice(displayPrice)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-base sm:text-lg text-text-base">
                ${formatPrice(displayPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

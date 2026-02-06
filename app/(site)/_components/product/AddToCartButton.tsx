"use client";

import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import {
  ShoppingCart,
  Loader2,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";
import type { ButtonState } from "@/hooks/useAddToCartWithFeedback";

interface AddToCartButtonProps {
  buttonState: ButtonState;
  onAddToCart: () => void;
  onActionClick: () => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "lg";
  isProcessing?: boolean;
  /** Optional price to display inside button (only shown in idle state) */
  priceInCents?: number | null;
}

const stateConfig: Record<
  ButtonState,
  {
    text: string;
    Icon: typeof ShoppingCart;
    className: string;
  }
> = {
  idle: {
    text: "Add to Cart",
    Icon: ShoppingCart,
    className: "",
  },
  adding: {
    text: "Adding...",
    Icon: Loader2,
    className: "",
  },
  added: {
    text: "Added!",
    Icon: Check,
    className: "bg-green-600 hover:bg-green-700 text-white",
  },
  "buy-now": {
    text: "Buy Now",
    Icon: Zap,
    className: "bg-amber-500 hover:bg-amber-600 text-white animate-pulse",
  },
  "checkout-now": {
    text: "Checkout Now",
    Icon: ArrowRight,
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
};

export function AddToCartButton({
  buttonState,
  onAddToCart,
  onActionClick,
  disabled = false,
  className,
  size = "default",
  isProcessing = false,
  priceInCents,
}: AddToCartButtonProps) {
  const config = stateConfig[buttonState];
  const Icon = config.Icon;
  const isActionState = buttonState === "buy-now" || buttonState === "checkout-now";
  const isAddingOrProcessing = buttonState === "adding" || isProcessing;

  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent parent Link from navigating
    e.preventDefault();
    e.stopPropagation();

    if (isAddingOrProcessing) return;

    if (isActionState) {
      onActionClick();
    } else if (buttonState === "idle") {
      onAddToCart();
    }
  };

  const showPrice = priceInCents && buttonState === "idle";

  return (
    <Button
      type="button"
      size={size}
      className={cn(
        "transition-all duration-200",
        showPrice ? "justify-between px-4" : "gap-2",
        config.className,
        className
      )}
      onClick={handleClick}
      disabled={disabled || isAddingOrProcessing}
    >
      <span className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            buttonState === "adding" && "animate-spin"
          )}
        />
        <span>{config.text}</span>
      </span>
      {showPrice && (
        <span className="flex items-center gap-2 shrink-0">
          <span className="h-5 w-px bg-primary-foreground/30" />
          <span className="font-semibold">${formatPrice(priceInCents)}</span>
        </span>
      )}
    </Button>
  );
}

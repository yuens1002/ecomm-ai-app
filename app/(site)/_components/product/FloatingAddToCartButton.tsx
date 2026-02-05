"use client";

import { useEffect, useState, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  Loader2,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";
import type { ButtonState } from "@/hooks/useAddToCartWithFeedback";

interface FloatingAddToCartButtonProps {
  inlineButtonRef: RefObject<HTMLElement | null>;
  buttonState: ButtonState;
  onAddToCart: () => void;
  onActionClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const stateIcons: Record<ButtonState, typeof ShoppingCart> = {
  idle: ShoppingCart,
  adding: Loader2,
  added: Check,
  "buy-now": Zap,
  "checkout-now": ArrowRight,
};

const stateStyles: Record<ButtonState, string> = {
  idle: "",
  adding: "",
  added: "bg-green-600 hover:bg-green-700 text-white",
  "buy-now": "bg-amber-500 hover:bg-amber-600 text-white animate-pulse",
  "checkout-now": "bg-amber-500 hover:bg-amber-600 text-white",
};

export function FloatingAddToCartButton({
  inlineButtonRef,
  buttonState,
  onAddToCart,
  onActionClick,
  disabled = false,
  isProcessing = false,
}: FloatingAddToCartButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = inlineButtonRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show floating button when inline button is NOT intersecting (out of view)
        setIsVisible(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [inlineButtonRef]);

  const Icon = stateIcons[buttonState];
  const isActionState = buttonState === "buy-now" || buttonState === "checkout-now";
  const isAddingOrProcessing = buttonState === "adding" || isProcessing;

  const handleClick = () => {
    if (isAddingOrProcessing) return;

    if (isActionState) {
      onActionClick();
    } else if (buttonState === "idle") {
      onAddToCart();
    }
  };

  // Hidden on md+ screens
  if (!isVisible) return null;

  return (
    <Button
      type="button"
      size="icon"
      className={cn(
        "fixed bottom-4 right-4 z-40 md:hidden",
        "h-14 w-14 rounded-full shadow-lg",
        "transition-all duration-200",
        stateStyles[buttonState]
      )}
      onClick={handleClick}
      disabled={disabled || isAddingOrProcessing}
      aria-label={
        buttonState === "idle"
          ? "Add to cart"
          : buttonState === "adding"
            ? "Adding to cart"
            : buttonState === "added"
              ? "Added to cart"
              : buttonState === "buy-now"
                ? "Buy now"
                : "Checkout now"
      }
    >
      <Icon
        className={cn(
          "h-6 w-6",
          buttonState === "adding" && "animate-spin"
        )}
      />
    </Button>
  );
}

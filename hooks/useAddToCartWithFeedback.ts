"use client";

import { useState, useRef, useCallback } from "react";
import { useCartStore, CartItem } from "@/lib/store/cart-store";

/**
 * Button states for the add-to-cart transform pattern
 */
export type ButtonState = "idle" | "adding" | "added" | "buy-now" | "checkout-now";

/**
 * Cart item input type (matches what addItem expects)
 */
export type CartItemInput = Omit<CartItem, "quantity">;

/**
 * Options for the hook
 */
export interface UseAddToCartOptions {
  /** Duration to show "Added!" state in ms (default: 1200) */
  addedDuration?: number;
  /** Duration before reverting to idle in ms (default: 8000) */
  actionReadyDuration?: number;
  /** Callback when checkout completes (before redirect) */
  onCheckoutStart?: () => void;
}

/**
 * Return type for the hook
 */
export interface UseAddToCartReturn {
  /** Current button state */
  buttonState: ButtonState;
  /** Whether checkout is in progress (for loading spinner) */
  isCheckingOut: boolean;
  /** Handle add to cart action */
  handleAddToCart: (item: CartItemInput, quantity?: number) => void;
  /** Handle action button click (Buy Now or Checkout Now) */
  handleActionClick: () => Promise<void>;
  /** Reset button state to idle */
  reset: () => void;
  /** The quantity that was just added (for reference) */
  lastAddedQuantity: number;
}

/**
 * Hook for add-to-cart with optimistic feedback and cart-aware transform.
 *
 * Flow:
 * 1. User clicks "Add to Cart"
 * 2. Button shows "Adding..." briefly
 * 3. Button shows "Added!" for addedDuration
 * 4. Based on cart state:
 *    - If cart was empty (just this item): "Buy Now" → direct checkout
 *    - If cart has other items: "Checkout Now" → open cart drawer
 * 5. After actionReadyDuration, reverts to "Add to Cart"
 *
 * @example
 * ```tsx
 * const { buttonState, handleAddToCart, handleActionClick } = useAddToCartWithFeedback();
 *
 * <AddToCartButton
 *   buttonState={buttonState}
 *   onAddToCart={() => handleAddToCart(cartItem)}
 *   onActionClick={handleActionClick}
 * />
 * ```
 */
export function useAddToCartWithFeedback(
  options: UseAddToCartOptions = {}
): UseAddToCartReturn {
  const {
    addedDuration = 1200,
    actionReadyDuration = 8000,
    onCheckoutStart,
  } = options;

  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastAddedQuantity, setLastAddedQuantity] = useState(0);

  // Track the item that was just added (for Buy Now checkout)
  const lastAddedItemRef = useRef<(CartItemInput & { quantity: number }) | null>(null);

  // Refs for timeout cleanup
  const addedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cart store actions
  const addItem = useCartStore((state) => state.addItem);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  /**
   * Clear all timeouts
   */
  const clearTimeouts = useCallback(() => {
    if (addedTimeoutRef.current) {
      clearTimeout(addedTimeoutRef.current);
      addedTimeoutRef.current = null;
    }
    if (revertTimeoutRef.current) {
      clearTimeout(revertTimeoutRef.current);
      revertTimeoutRef.current = null;
    }
  }, []);

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    clearTimeouts();
    setButtonState("idle");
    setIsCheckingOut(false);
    lastAddedItemRef.current = null;
  }, [clearTimeouts]);

  /**
   * Handle add to cart action
   */
  const handleAddToCart = useCallback(
    (item: CartItemInput, quantity: number = 1) => {
      // Clear any existing timeouts
      clearTimeouts();

      // Store the item for potential Buy Now
      lastAddedItemRef.current = { ...item, quantity };
      setLastAddedQuantity(quantity);

      // Get cart total BEFORE adding
      const totalBefore = getTotalItems();

      // Set adding state
      setButtonState("adding");

      // Add to cart (optimistic - Zustand is synchronous)
      addItem({ ...item, quantity });

      // After a brief moment, show "Added!"
      // Using setTimeout to allow state to update and give visual feedback
      addedTimeoutRef.current = setTimeout(() => {
        setButtonState("added");

        // After addedDuration, determine next state based on cart
        addedTimeoutRef.current = setTimeout(() => {
          // Get cart total AFTER adding
          const totalAfter = getTotalItems();

          // If cart was empty before (total now equals what we just added),
          // this is a first-time buyer - show "Buy Now"
          // Otherwise, show "Checkout Now"
          if (totalBefore === 0 && totalAfter === quantity) {
            setButtonState("buy-now");
          } else {
            setButtonState("checkout-now");
          }

          // After actionReadyDuration, revert to idle
          revertTimeoutRef.current = setTimeout(() => {
            setButtonState("idle");
            lastAddedItemRef.current = null;
          }, actionReadyDuration);
        }, addedDuration);
      }, 100); // Brief delay for "adding" state to be visible
    },
    [addItem, getTotalItems, clearTimeouts, addedDuration, actionReadyDuration]
  );

  /**
   * Handle action click (Buy Now or Checkout Now)
   */
  const handleActionClick = useCallback(async () => {
    if (buttonState === "buy-now") {
      // Direct checkout with just this item
      if (!lastAddedItemRef.current) {
        // Fallback: open cart if we don't have the item reference
        setCartOpen(true);
        reset();
        return;
      }

      try {
        setIsCheckingOut(true);
        onCheckoutStart?.();

        const item = lastAddedItemRef.current;

        // Create cart item for Stripe checkout
        const cartItem = {
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          categorySlug: item.categorySlug,
          variantId: item.variantId,
          variantName: item.variantName,
          purchaseOptionId: item.purchaseOptionId,
          purchaseType: item.purchaseType,
          priceInCents: item.priceInCents,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          billingInterval: item.billingInterval,
          billingIntervalCount: item.billingIntervalCount,
        };

        // Call checkout API
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [cartItem],
            deliveryMethod: "DELIVERY",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Checkout error:", error);
          // On error, fall back to opening cart
          setCartOpen(true);
          reset();
          return;
        }

        const { url } = await response.json();

        if (url) {
          // Clear the cart since we're going to Stripe
          // (The item was added, but we're doing direct checkout)
          // Actually, keep the cart as-is - Stripe will handle the order
          window.location.href = url;
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        console.error("Buy Now error:", error);
        // On error, open cart drawer as fallback
        setCartOpen(true);
        reset();
      }
    } else if (buttonState === "checkout-now") {
      // Open cart drawer
      setCartOpen(true);
      reset();
    }
  }, [buttonState, setCartOpen, reset, onCheckoutStart]);

  return {
    buttonState,
    isCheckingOut,
    handleAddToCart,
    handleActionClick,
    reset,
    lastAddedQuantity,
  };
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cart-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * ShoppingCart component - manages cart UI and logic
 * Renders a cart button with badge + drawer showing cart contents
 */
export function ShoppingCart() {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // Hydration fix: only read cart count on client side after mount
  useEffect(() => {
    setMounted(true);
    setCartItemCount(getTotalItems());
  }, [getTotalItems]);

  // Subscribe to cart changes
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state) => {
      setCartItemCount(state.getTotalItems());
    });
    return unsubscribe;
  }, []);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(
        item.productId,
        item.variantId,
        item.purchaseOptionId,
        newQuantity
      );
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    removeItem(item.productId, item.variantId, item.purchaseOptionId);
  };

  // Don't render count until mounted (avoid hydration mismatch)
  const displayCount = mounted ? cartItemCount : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-text-muted hover:text-primary transition-colors"
          aria-label={`Open cart (${displayCount} items)`}
        >
          <ShoppingCartIcon className="w-6 h-6" />
          {displayCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
              {displayCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-2xl font-bold tracking-tight text-left">
            Shopping Cart
          </SheetTitle>
          <SheetDescription className="sr-only">
            View and manage items in your shopping cart
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCartIcon className="w-16 h-16 text-text-muted mb-4" />
              <p className="text-lg font-medium text-text-base mb-2">
                Your cart is empty
              </p>
              <p className="text-sm text-text-muted mb-6">
                Add some delicious coffee to get started!
              </p>
              <SheetClose asChild>
                <Button asChild>
                  <Link href="/">Browse Products</Link>
                </Button>
              </SheetClose>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}-${item.purchaseOptionId}`}
                  className="flex gap-4 py-3"
                >
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-medium text-text-base hover:text-primary line-clamp-2 mb-1"
                    >
                      {item.productName}
                    </Link>
                    <div className="text-sm text-text-muted space-y-0.5">
                      <p>{item.variantName}</p>
                      <p className="capitalize">
                        {item.purchaseType === "SUBSCRIPTION"
                          ? `Subscription ${
                              item.deliverySchedule
                                ? `• ${item.deliverySchedule}`
                                : ""
                            }`
                          : "One-time purchase"}
                      </p>
                      <p className="font-semibold text-text-base">
                        {formatPrice(item.priceInCents)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      {item.purchaseType === "ONE_TIME" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium">
                          Qty: {item.quantity}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleRemoveItem(item)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4 mt-auto">
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>

              {/* Checkout Button */}
              <Button className="w-full" size="lg" disabled>
                Proceed to Checkout
                <span className="ml-2 text-xs opacity-70">(Coming Soon)</span>
              </Button>

              {/* Clear Cart */}
              <Button variant="outline" className="w-full" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

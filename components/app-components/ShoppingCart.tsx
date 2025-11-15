"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Truck,
  Store,
  MapPin,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCartStore, CartItem } from "@/lib/store/cart-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { data: session } = useSession();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Delivery preferences
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY"
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

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

  // Listen for custom event to open cart
  useEffect(() => {
    const handleOpenCart = () => setIsOpen(true);
    window.addEventListener("openCart", handleOpenCart);
    return () => window.removeEventListener("openCart", handleOpenCart);
  }, []);

  // Fetch user's addresses and last order delivery preferences
  useEffect(() => {
    const fetchDeliveryPreferences = async () => {
      if (!session?.user?.id) {
        setLoadingPreferences(false);
        return;
      }

      try {
        // Fetch user's addresses
        const addressResponse = await fetch("/api/user/addresses");
        if (addressResponse.ok) {
          const data = await addressResponse.json();
          setAddresses(data.addresses || []);

          // Set default address as selected
          const defaultAddr = data.addresses?.find((a: any) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }

        // Fetch last order to get preferred delivery method
        const ordersResponse = await fetch("/api/user/orders?limit=1");
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          if (ordersData.orders && ordersData.orders.length > 0) {
            const lastOrder = ordersData.orders[0];
            setDeliveryMethod(lastOrder.deliveryMethod || "DELIVERY");
          }
        }
      } catch (error) {
        console.error("Failed to fetch delivery preferences:", error);
      } finally {
        setLoadingPreferences(false);
      }
    };

    if (isOpen) {
      fetchDeliveryPreferences();
    }
  }, [isOpen, session]);

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

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          userId: session?.user?.id,
          deliveryMethod,
          selectedAddressId:
            deliveryMethod === "DELIVERY" ? selectedAddressId : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setIsCheckingOut(false);
    }
  };

  // Don't render count until mounted (avoid hydration mismatch)
  const displayCount = mounted ? cartItemCount : 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
              {/* Delivery Method Selection */}
              {session?.user && !loadingPreferences && (
                <div className="space-y-3 pb-4 border-b">
                  <Label className="text-sm font-semibold">
                    Delivery Method
                  </Label>
                  <RadioGroup
                    value={deliveryMethod}
                    onValueChange={(value) =>
                      setDeliveryMethod(value as "DELIVERY" | "PICKUP")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DELIVERY" id="delivery" />
                      <Label
                        htmlFor="delivery"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Delivery</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PICKUP" id="pickup" />
                      <Label
                        htmlFor="pickup"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Store className="w-4 h-4" />
                        <span>Store Pickup</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Address Selection - Only show for Delivery */}
                  {deliveryMethod === "DELIVERY" && (
                    <div className="space-y-2 mt-3">
                      {addresses.length > 0 ? (
                        <>
                          <Label className="text-sm">Shipping Address</Label>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-5 h-5 mt-2 shrink-0 text-muted-foreground" />
                            <Select
                              value={selectedAddressId || "new"}
                              onValueChange={(value) =>
                                setSelectedAddressId(
                                  value === "new" ? null : value
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select an address" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">
                                  <span className="font-medium">
                                    Enter new address at checkout
                                  </span>
                                </SelectItem>
                                {addresses.map((address) => (
                                  <SelectItem
                                    key={address.id}
                                    value={address.id}
                                  >
                                    {address.street}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-sm">
                          <p className="text-blue-800 dark:text-blue-200">
                            You'll be able to enter your shipping address during
                            checkout.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pickup Location Info */}
                  {deliveryMethod === "PICKUP" && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded text-sm">
                      <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                        Pickup Location
                      </p>
                      <p className="text-green-700 dark:text-green-300 text-xs">
                        123 Coffee Street, San Francisco, CA 94102
                      </p>
                      <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                        Mon-Fri: 8AM-6PM, Sat-Sun: 9AM-5PM
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subtotal */}
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
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

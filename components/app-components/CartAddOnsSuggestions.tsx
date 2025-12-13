"use client";

import { useEffect, useState } from "react";
import { ScrollCarousel } from "./ScrollCarousel";
import { AddOnCard } from "./AddOnCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCartStore } from "@/lib/store/cart-store";
import { Separator } from "@/components/ui/separator";

interface CartAddOn {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string;
    categorySlug: string;
  };
  variant: {
    id: string;
    name: string;
    priceInCents: number;
  };
}

// Transform CartAddOn to AddOnCard format
interface AddOnItem {
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
}

interface CartAddOnsSuggestionsProps {
  className?: string;
}

export function CartAddOnsSuggestions({
  className = "",
}: CartAddOnsSuggestionsProps) {
  const { settings } = useSiteSettings();
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const [addOns, setAddOns] = useState<AddOnItem[]>([]);
  const [_isLoading, setIsLoading] = useState(false);

  // Fetch add-ons when cart items change
  useEffect(() => {
    const fetchAddOns = async () => {
      if (cartItems.length === 0) {
        setAddOns([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get unique product IDs from cart
        const productIds = Array.from(
          new Set(cartItems.map((item) => item.productId))
        );

        const response = await fetch("/api/cart/addons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch add-ons");
        }

        const data = await response.json();

        // Filter out items already in cart
        const cartItemKeys = new Set(
          cartItems.map((item) => `${item.productId}-${item.variantId}`)
        );

        const filteredAddOns = data.addOns.filter(
          (addOn: CartAddOn) =>
            !cartItemKeys.has(`${addOn.product.id}-${addOn.variant.id}`)
        );

        // Transform to AddOnItem format
        const transformedAddOns: AddOnItem[] = filteredAddOns.map(
          (addOn: CartAddOn) => ({
            product: {
              id: addOn.product.id,
              name: addOn.product.name,
              slug: addOn.product.slug,
              type: "EQUIPMENT",
              description: addOn.product.description,
            },
            variant: {
              id: addOn.variant.id,
              name: addOn.variant.name,
              weight: 0,
              stockQuantity: 100,
              purchaseOptions: [
                {
                  id: `${addOn.variant.id}-one-time`,
                  priceInCents: addOn.variant.priceInCents,
                  type: "ONE_TIME",
                },
              ],
            },
            discountedPriceInCents: addOn.variant.priceInCents,
            imageUrl: addOn.product.imageUrl,
            categorySlug: addOn.product.categorySlug,
          })
        );

        setAddOns(transformedAddOns);
      } catch (error) {
        console.error("Error fetching cart add-ons:", error);
        setAddOns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddOns();
  }, [cartItems]);

  // Don't render if no add-ons
  if (addOns.length === 0) {
    return null;
  }

  const handleAddToCart = (addOn: AddOnItem) => {
    const purchaseOption = addOn.variant.purchaseOptions.find(
      (opt) => opt.type === "ONE_TIME"
    );
    if (!purchaseOption) return;

    addItem({
      productId: addOn.product.id,
      productName: addOn.product.name,
      productSlug: addOn.product.slug,
      variantId: addOn.variant.id,
      variantName: addOn.variant.name,
      categorySlug: addOn.categorySlug,
      purchaseType: "ONE_TIME",
      purchaseOptionId: purchaseOption.id,
      priceInCents: purchaseOption.priceInCents,
      imageUrl: addOn.imageUrl,
      quantity: 1,
    });
  };

  return (
    <>
      <Separator className="my-4" />
      <div className={className}>
        <h3 className="text-sm font-semibold text-text-base mb-4">
          {settings.cartAddOnsSectionTitle || "You May Also Like"}
        </h3>

        <ScrollCarousel slidesPerView={1} noBorder={true}>
          {addOns.map((addOn) => (
            <AddOnCard
              key={`${addOn.product.id}-${addOn.variant.id}`}
              addOn={addOn}
              weightUnit="g"
              buttonText="Add"
              onAddToCart={handleAddToCart}
            />
          ))}
        </ScrollCarousel>
      </div>
    </>
  );
}

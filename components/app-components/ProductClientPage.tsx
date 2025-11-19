"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FullProductPayload, RelatedProduct, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; // <-- ADDED THIS IMPORT
import ProductCard from "@components/app-components/ProductCard"; // Re-use our card
import { useCartStore } from "@/lib/store/cart-store";
import { formatBillingInterval } from "@/lib/utils";
import { useActivityTracking } from "@/hooks/useActivityTracking";

// Prop interface for this component
interface ProductClientPageProps {
  product: NonNullable<FullProductPayload>;
  relatedProducts: RelatedProduct[];
  category: Pick<Category, "name" | "slug">; // We only need name and slug
}

// Helper to format cents to dollars
function formatPrice(priceInCents: number) {
  return (priceInCents / 100).toFixed(2);
}

export default function ProductClientPage({
  product,
  relatedProducts,
  category,
}: ProductClientPageProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const { trackActivity } = useActivityTracking();

  // --- State Management ---
  // Find the first variant and purchase option to set as default
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedPurchaseOption, setSelectedPurchaseOption] = useState(
    selectedVariant.purchaseOptions[0]
  );
  const [quantity, setQuantity] = useState(1);
  // Track which subscription cadence is selected (purchaseOptionId)
  const [selectedSubscriptionOptionId, setSelectedSubscriptionOptionId] =
    useState<string | null>(null);

  // Track product view on mount
  useEffect(() => {
    trackActivity({
      activityType: "PRODUCT_VIEW",
      productId: product.id,
    });
  }, [product.id, trackActivity]);

  // Check if selected variant already has a subscription in cart
  const hasSubscriptionInCart = cartItems.some(
    (item) =>
      item.productId === product.id &&
      item.variantId === selectedVariant.id &&
      item.purchaseType === "SUBSCRIPTION"
  );

  // --- Derived State ---
  // Calculate the price to display based on state
  const displayImage =
    product.images[0]?.url ||
    "https://placehold.co/600x400/CCCCCC/FFFFFF.png?text=Image+Not+Found";
  const altText =
    product.images[0]?.altText || `A bag of ${product.name} coffee`;

  // --- Event Handlers ---
  const handleVariantChange = (variantId: string) => {
    const newVariant = product.variants.find((v) => v.id === variantId)!;
    setSelectedVariant(newVariant);

    // Check if new variant has subscription in cart
    const newVariantHasSubscription = cartItems.some(
      (item) =>
        item.productId === product.id &&
        item.variantId === newVariant.id &&
        item.purchaseType === "SUBSCRIPTION"
    );

    // If subscription exists, default to one-time purchase
    if (newVariantHasSubscription) {
      const oneTimeOption = newVariant.purchaseOptions.find(
        (p) => p.type === "ONE_TIME"
      );
      if (oneTimeOption) {
        setSelectedPurchaseOption(oneTimeOption);
      } else {
        setSelectedPurchaseOption(newVariant.purchaseOptions[0]);
      }
    } else {
      // Default to the first purchase option of the new variant
      setSelectedPurchaseOption(newVariant.purchaseOptions[0]);
    }
    setSelectedSubscriptionOptionId(null);
  };

  const handlePurchaseTypeChange = (value: string) => {
    if (value === "SUBSCRIPTION") {
      // Don't allow switching to subscription if already in cart
      if (hasSubscriptionInCart) {
        return;
      }
      // User selected subscription group - pick first subscription option as default
      const subscriptionOptions = selectedVariant.purchaseOptions.filter(
        (p) => p.type === "SUBSCRIPTION"
      );
      if (subscriptionOptions.length > 0) {
        setSelectedPurchaseOption(subscriptionOptions[0]);
        setSelectedSubscriptionOptionId(subscriptionOptions[0].id);
      }
    } else {
      // User selected one-time
      const oneTimeOption = selectedVariant.purchaseOptions.find(
        (p) => p.type === "ONE_TIME"
      );
      if (oneTimeOption) {
        setSelectedPurchaseOption(oneTimeOption);
        setSelectedSubscriptionOptionId(null);
      }
    }
  };

  const handleSubscriptionCadenceChange = (optionId: string) => {
    const option = selectedVariant.purchaseOptions.find(
      (p) => p.id === optionId
    )!;
    setSelectedPurchaseOption(option);
    setSelectedSubscriptionOptionId(optionId);
  };

  const handleAddToCart = () => {
    const isAddingSubscription = selectedPurchaseOption.type === "SUBSCRIPTION";

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      purchaseOptionId: selectedPurchaseOption.id,
      purchaseType: selectedPurchaseOption.type,
      priceInCents: selectedPurchaseOption.priceInCents,
      imageUrl: displayImage,
      quantity: quantity,
      billingInterval: selectedPurchaseOption.billingInterval || undefined,
      billingIntervalCount:
        selectedPurchaseOption.billingIntervalCount || undefined,
    });

    // Track add to cart activity
    trackActivity({
      activityType: "ADD_TO_CART",
      productId: product.id,
    });

    // If a subscription was added, switch to one-time purchase option
    if (isAddingSubscription) {
      const oneTimeOption = selectedVariant.purchaseOptions.find(
        (p) => p.type === "ONE_TIME"
      );
      if (oneTimeOption) {
        setSelectedPurchaseOption(oneTimeOption);
        setSelectedSubscriptionOptionId(null);
      }
    }

    // Optional: Show feedback or reset quantity
    // For now, keep quantity at 1 after adding
  };

  // ProductCard now uses cart store directly, no callback needed

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* 1. Breadcrumb (Home > Category > Product) */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Category link: Uses the category slug and name */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/categories/${category.slug}`}>{category.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Current Page: Product Name */}
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. Main Product Section (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* --- LEFT COLUMN: Image --- */}
        <div className="w-full">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={displayImage}
              alt={altText}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 45vw"
              loading="eager"
            />
          </div>
          {/* In a real app, a thumbnail gallery would go here */}
        </div>

        {/* --- RIGHT COLUMN: Product Info & Options --- */}
        <div className="w-full flex flex-col space-y-6">
          <h1 className="text-4xl font-bold text-text-base">{product.name}</h1>

          {/* --- UPDATED: Added Origin and Roast Level --- */}
          <div className="flex flex-col space-y-1">
            <span className="text-lg text-text-base font-semibold">
              {product.origin.join(", ")}
            </span>
            <span className="text-lg text-text-muted italic">
              {product.tastingNotes.join(", ")}
            </span>
          </div>

          <p className="text-text-base leading-relaxed">
            {product.description}
          </p>
          {product.isOrganic && (
            <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Organic
            </span>
          )}

          <Separator />

          {/* Variant Selection (Size) */}
          <div>
            <Label className="text-base font-semibold text-text-base mb-3 block">
              Size
            </Label>
            <RadioGroup
              value={selectedVariant.id}
              onValueChange={handleVariantChange}
              className="flex gap-4"
            >
              {product.variants.map((variant) => (
                <div key={variant.id}>
                  <RadioGroupItem
                    value={variant.id}
                    id={variant.id}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={variant.id}
                    className={`flex items-center justify-center rounded-md border-2 p-3 text-sm font-medium
                      cursor-pointer transition-colors
                      ${
                        selectedVariant.id === variant.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent border-border hover:bg-accent"
                      }`}
                  >
                    {variant.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Purchase Type Selection (One-time vs. Sub) */}
          <div>
            <Label className="text-base font-semibold text-text-base mb-3 block">
              Purchase Option
            </Label>
            <RadioGroup
              value={selectedPurchaseOption.type}
              onValueChange={handlePurchaseTypeChange}
              className="space-y-3"
            >
              {/* One-Time Purchase Option */}
              {selectedVariant.purchaseOptions.some(
                (o) => o.type === "ONE_TIME"
              ) && (
                <Label
                  htmlFor="one-time"
                  className={`flex items-center rounded-lg border-2 p-4 cursor-pointer transition-colors
                    ${
                      selectedPurchaseOption.type === "ONE_TIME"
                        ? "bg-accent border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                >
                  <RadioGroupItem value="ONE_TIME" id="one-time" />
                  <div className="ml-4 flex flex-col">
                    <span className="font-semibold text-text-base">
                      One-Time Purchase
                    </span>
                  </div>
                  <span className="ml-auto font-bold text-text-base text-lg">
                    $
                    {formatPrice(
                      selectedVariant.purchaseOptions.find(
                        (o) => o.type === "ONE_TIME"
                      )?.priceInCents || 0
                    )}
                  </span>
                </Label>
              )}

              {/* Subscription Option Group - Hide if already in cart */}
              {selectedVariant.purchaseOptions.some(
                (o) => o.type === "SUBSCRIPTION"
              ) &&
                !hasSubscriptionInCart && (
                  <Label
                    htmlFor="subscription"
                    className={`flex items-center rounded-lg border-2 p-4 cursor-pointer transition-colors
                    ${
                      selectedPurchaseOption.type === "SUBSCRIPTION"
                        ? "bg-accent border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <RadioGroupItem value="SUBSCRIPTION" id="subscription" />
                    <div className="ml-4 flex flex-col">
                      <span className="font-semibold text-text-base">
                        Subscribe & Save
                      </span>
                      <span className="text-sm text-text-muted">
                        {selectedPurchaseOption.discountMessage ||
                          "Save on every order"}
                      </span>
                    </div>
                    <span className="ml-auto font-bold text-text-base text-lg">
                      ${formatPrice(selectedPurchaseOption.priceInCents)}
                    </span>
                  </Label>
                )}
            </RadioGroup>
          </div>

          {/* Delivery Schedule Dropdown (dynamically generated from available subscription options) */}
          {selectedPurchaseOption.type === "SUBSCRIPTION" &&
            !hasSubscriptionInCart && (
              <div>
                <Label className="text-base font-semibold text-text-base mb-3 block">
                  Delivery Schedule
                </Label>
                <Select
                  value={
                    selectedSubscriptionOptionId || selectedPurchaseOption.id
                  }
                  onValueChange={handleSubscriptionCadenceChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose delivery schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedVariant.purchaseOptions
                      .filter((o) => o.type === "SUBSCRIPTION")
                      .map((option) => {
                        const interval =
                          option.billingInterval?.toLowerCase() || "week";
                        const count = option.billingIntervalCount || 1;
                        const label = formatBillingInterval(interval, count);
                        const capitalizedLabel =
                          label.charAt(0).toUpperCase() + label.slice(1);

                        return (
                          <SelectItem key={option.id} value={option.id}>
                            {capitalizedLabel} - $
                            {formatPrice(option.priceInCents)}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            )}

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={handleAddToCart}
            // Simple check for stock
            disabled={selectedVariant.stockQuantity <= 0}
          >
            {selectedVariant.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>

      {/* 3. Related Products Section */}
      <div className="my-16">
        <Separator className="my-12" />
        <h2 className="text-3xl font-bold text-center text-text-base mb-12">
          You Might Also Like
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {relatedProducts.map((relatedProduct) => (
              <CarouselItem
                key={relatedProduct.id}
                className="md:basis-1/2 lg:basis-1/small"
              >
                <div className="p-1">
                  {/* We re-use our existing ProductCard component! */}
                  <ProductCard
                    product={relatedProduct} // Cast as 'any' to satisfy prop type, since we're passing a partial product
                    disableCardEffects={true}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}

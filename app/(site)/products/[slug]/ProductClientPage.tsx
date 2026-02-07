"use client";

import { useEffect, useState, startTransition, useRef } from "react";
import Link from "next/link";
import { ProductType, RoastLevel, PurchaseType } from "@prisma/client";
import {
  Product,
  ProductVariant,
  PurchaseOption,
  RelatedProduct,
  Category,
} from "@/lib/types";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import ProductCard from "@/app/(site)/_components/product/ProductCard";
import { AddOnCard } from "@/app/(site)/_components/cart/AddOnCard";
import { ScrollCarousel } from "@/components/shared/media/ScrollCarousel";
import { ImageCarousel } from "@/components/shared/media/ImageCarousel";
import PageContainer from "@/components/shared/PageContainer";
import { useCartStore, type CartItem } from "@/lib/store/cart-store";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useAddToCartWithFeedback } from "@/hooks/useAddToCartWithFeedback";
import { AddOnItem } from "./actions";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { CoffeeDetails } from "@/app/(site)/_components/product/CoffeeDetails";
import { ProductSelectionsSection } from "@/app/(site)/_components/product/ProductSelectionsSection";
import { FloatingAddToCartButton } from "@/app/(site)/_components/product/FloatingAddToCartButton";

interface ProductClientPageProps {
  product: Product;
  relatedProducts: RelatedProduct[];
  category: Pick<Category, "name" | "slug">;
  addOns: AddOnItem[];
}

const roastLabels: Record<RoastLevel, string> = {
  LIGHT: "Light Roast",
  MEDIUM: "Medium Roast",
  DARK: "Dark Roast",
};

const roastSegments: RoastLevel[] = ["LIGHT", "MEDIUM", "DARK"];

const roastActiveColor: Record<RoastLevel, string> = {
  LIGHT: "bg-yellow-600",
  MEDIUM: "bg-yellow-800",
  DARK: "bg-yellow-950",
};

const getOneTimeOption = (variant: ProductVariant): PurchaseOption | null =>
  variant.purchaseOptions.find((p) => p.type === "ONE_TIME") ?? null;

const getSubscriptionOptions = (variant: ProductVariant): PurchaseOption[] =>
  variant.purchaseOptions.filter((p) => p.type === "SUBSCRIPTION");

const getSubscriptionDisplayOption = (
  variant: ProductVariant,
  selectedId?: string | null
): PurchaseOption | null => {
  const options = getSubscriptionOptions(variant);
  if (!options.length) return null;
  if (selectedId) {
    const matched = options.find((option) => option.id === selectedId);
    if (matched) return matched;
  }
  return options[0];
};

const getPreferredPurchaseOption = (
  variant: ProductVariant,
  cartItems: CartItem[],
  productId: string
): PurchaseOption | null => {
  if (!variant.purchaseOptions.length) return null;

  const hasSubscriptionInCart = cartItems.some(
    (item) =>
      item.productId === productId &&
      item.variantId === variant.id &&
      item.purchaseType === "SUBSCRIPTION"
  );

  const oneTimeOption = getOneTimeOption(variant);
  const subscriptionOptions = getSubscriptionOptions(variant);

  // If there's a subscription in cart and a one-time option exists, prefer one-time
  if (hasSubscriptionInCart && oneTimeOption) return oneTimeOption;

  // If there's no one-time option and subscriptions exist, default to first subscription
  if (!oneTimeOption && subscriptionOptions.length > 0)
    return subscriptionOptions[0];

  // Otherwise prefer one-time or fallback to first option
  return oneTimeOption ?? variant.purchaseOptions[0];
};

const getDiscountMessage = (
  variant: ProductVariant,
  subscriptionOption: PurchaseOption
): string | null => {
  if (subscriptionOption.type !== "SUBSCRIPTION") return null;
  const oneTimeOption = getOneTimeOption(variant);
  if (!oneTimeOption) return null;

  const savings = oneTimeOption.priceInCents - subscriptionOption.priceInCents;
  if (savings <= 0) return null;

  const discountPercent = Math.round(
    (savings / oneTimeOption.priceInCents) * 100
  );
  if (discountPercent <= 0) return null;

  return `Save ${discountPercent}% with subscription`;
};

export default function ProductClientPage({
  product,
  relatedProducts,
  category,
  addOns,
}: ProductClientPageProps) {
  const { settings } = useSiteSettings();
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const { trackActivity } = useActivityTracking();
  const {
    buttonState,
    isCheckingOut,
    handleAddToCart: handleAddToCartWithFeedback,
    handleActionClick,
  } = useAddToCartWithFeedback();

  // Ref for floating button visibility detection
  const inlineButtonRef = useRef<HTMLDivElement>(null);

  const initialVariant = product.variants[0];
  const initialPurchaseOption = getPreferredPurchaseOption(
    initialVariant,
    cartItems,
    product.id
  );
  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [selectedPurchaseOption, setSelectedPurchaseOption] =
    useState<PurchaseOption | null>(initialPurchaseOption);
  const [quantity, setQuantity] = useState(1);
  const [selectedSubscriptionOptionId, setSelectedSubscriptionOptionId] =
    useState<string | null>(
      initialPurchaseOption?.type === "SUBSCRIPTION"
        ? initialPurchaseOption.id
        : null
    );

  // Fallback recommendations when relatedProducts is empty
  const [fallbackProducts, setFallbackProducts] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    trackActivity({
      activityType: "PRODUCT_VIEW",
      productId: product.id,
    });
  }, [product.id, trackActivity]);

  // Fetch fallback recommendations when relatedProducts is empty
  useEffect(() => {
    if (relatedProducts.length === 0 && fallbackProducts.length === 0) {
      fetch(`/api/recommendations?limit=4&exclude=${product.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.products?.length) {
            setFallbackProducts(data.products);
          }
        })
        .catch((err) => console.error("Failed to fetch recommendations:", err));
    }
  }, [relatedProducts.length, product.id, fallbackProducts.length]);

  // Auto-select subscription when it's the only option
  useEffect(() => {
    const oneTimeOpt = getOneTimeOption(selectedVariant);
    const subscriptionOpts = getSubscriptionOptions(selectedVariant);

    // If no one-time option and subscriptions exist, ensure subscription is selected
    if (!oneTimeOpt && subscriptionOpts.length > 0) {
      if (
        !selectedPurchaseOption ||
        selectedPurchaseOption.type !== "SUBSCRIPTION"
      ) {
        startTransition(() => {
          setSelectedPurchaseOption(subscriptionOpts[0]);
          setSelectedSubscriptionOptionId(subscriptionOpts[0].id);
        });
      }
    }
  }, [selectedVariant, selectedPurchaseOption]);

  const hasSubscriptionInCart = cartItems.some(
    (item) =>
      item.productId === product.id &&
      item.variantId === selectedVariant.id &&
      item.purchaseType === "SUBSCRIPTION"
  );

  // Merch products use culture images (cups, equipment), coffee products use bean images
  const placeholderCategory = product.type === ProductType.MERCH ? "culture" : "beans";
  const displayImage =
    product.images[0]?.url || getPlaceholderImage(product.name, 800, placeholderCategory);
  const altText =
    product.images[0]?.altText || (product.type === ProductType.MERCH ? product.name : `A bag of ${product.name} coffee`);
  const galleryImages =
    product.images.length > 0
      ? product.images.map((img) => ({ url: img.url, alt: img.altText }))
      : [{ url: displayImage, alt: altText }];
  const showThumbs = galleryImages.length > 1;

  const handleVariantChange = (variantId: string) => {
    const newVariant = product.variants.find((v) => v.id === variantId)!;
    setSelectedVariant(newVariant);

    const preferredOption = getPreferredPurchaseOption(
      newVariant,
      cartItems,
      product.id
    );

    setSelectedPurchaseOption(preferredOption);
    setSelectedSubscriptionOptionId(
      preferredOption?.type === "SUBSCRIPTION" ? preferredOption.id : null
    );
  };

  const handlePurchaseTypeChange = (value: string) => {
    if (!selectedVariant.purchaseOptions.length) return;

    if (value === "SUBSCRIPTION") {
      if (hasSubscriptionInCart) return;
      const subscriptionOptions = getSubscriptionOptions(selectedVariant);
      if (subscriptionOptions.length > 0) {
        setSelectedPurchaseOption(subscriptionOptions[0]);
        setSelectedSubscriptionOptionId(subscriptionOptions[0].id);
      }
      return;
    }

    const oneTimeOption = getOneTimeOption(selectedVariant);
    if (oneTimeOption) {
      setSelectedPurchaseOption(oneTimeOption);
      setSelectedSubscriptionOptionId(null);
    }
  };

  const handleSubscriptionCadenceChange = (optionId: string) => {
    const option = selectedVariant.purchaseOptions.find(
      (p) => p.id === optionId
    );
    if (!option) return;
    setSelectedPurchaseOption(option);
    setSelectedSubscriptionOptionId(optionId);
  };

  const handleAddToCart = () => {
    if (!selectedPurchaseOption) return;
    const isAddingSubscription = selectedPurchaseOption.type === "SUBSCRIPTION";

    // Use the hook for cart-aware feedback
    handleAddToCartWithFeedback(
      {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        categorySlug: category.slug,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        purchaseOptionId: selectedPurchaseOption.id,
        purchaseType: selectedPurchaseOption.type,
        priceInCents: selectedPurchaseOption.priceInCents,
        imageUrl: displayImage,
        billingInterval: selectedPurchaseOption.billingInterval || undefined,
        billingIntervalCount:
          selectedPurchaseOption.billingIntervalCount || undefined,
      },
      quantity
    );

    trackActivity({ activityType: "ADD_TO_CART", productId: product.id });

    if (isAddingSubscription) {
      const oneTimeOption = selectedVariant.purchaseOptions.find(
        (p) => p.type === "ONE_TIME"
      );
      if (oneTimeOption) {
        setSelectedPurchaseOption(oneTimeOption);
        setSelectedSubscriptionOptionId(null);
      }
    }
  };

  const handleAddOnToCart = (addOn: AddOnItem) => {
    if (!selectedPurchaseOption) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      categorySlug: category.slug,
      purchaseOptionId: selectedPurchaseOption.id,
      purchaseType: selectedPurchaseOption.type as PurchaseType,
      priceInCents: selectedPurchaseOption.priceInCents,
      imageUrl: displayImage,
      quantity,
    });

    trackActivity({ activityType: "ADD_TO_CART", productId: product.id });

    addItem({
      productId: addOn.product.id,
      productName: addOn.product.name,
      productSlug: addOn.product.slug,
      variantId: addOn.variant.id,
      variantName: addOn.variant.name,
      categorySlug: addOn.categorySlug || "shop",
      purchaseOptionId: addOn.variant.purchaseOptions[0].id,
      purchaseType: "ONE_TIME",
      priceInCents: addOn.discountedPriceInCents,
      // Add-ons are merch products, use "culture" for coffee lifestyle images
      imageUrl:
        addOn.imageUrl ||
        getPlaceholderImage(addOn.product.name, 400, "culture"),
      quantity: 1,
    });

    trackActivity({ activityType: "ADD_TO_CART", productId: addOn.product.id });
  };

  const isCoffee = product.type === ProductType.COFFEE;

  const oneTimeOption = getOneTimeOption(selectedVariant);
  const subscriptionOptions = getSubscriptionOptions(selectedVariant);
  const subscriptionDisplayOption = getSubscriptionDisplayOption(
    selectedVariant,
    selectedPurchaseOption?.type === "SUBSCRIPTION"
      ? selectedPurchaseOption.id
      : selectedSubscriptionOptionId
  );

  const subscriptionDiscountMessage = subscriptionDisplayOption
    ? getDiscountMessage(selectedVariant, subscriptionDisplayOption)
    : null;

  // Responsive slides per view for related products carousel
  const [relatedSlidesPerView, setRelatedSlidesPerView] = useState(1);
  useEffect(() => {
    const calcSlides = () => {
      const w = window.innerWidth;
      // xs/s: 1, md: 2.5, lg: 3, xl+: 4
      if (w >= 1280) {
        setRelatedSlidesPerView(4);
      } else if (w >= 1024) {
        setRelatedSlidesPerView(3);
      } else if (w >= 768) {
        setRelatedSlidesPerView(2.5);
      } else {
        setRelatedSlidesPerView(1.5);
      }
    };
    calcSlides();
    window.addEventListener("resize", calcSlides);
    return () => window.removeEventListener("resize", calcSlides);
  }, []);

  return (
    <PageContainer>
      <Breadcrumb className="mb-4 md:mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${category.slug}`}>{category.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-10 md:gap-y-5 lg:gap-x-14 lg:gap-y-8">
        <div className="w-full md:sticky md:top-6 md:self-start">
          <ImageCarousel
            images={galleryImages}
            aspectRatio="square"
            showThumbnails={showThumbs}
            showDots={true}
          />
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* ---- Coffee header: origin, name, roast bar, tasting notes ---- */}
          {isCoffee && product.origin.length > 0 && (
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
              {product.origin.join(" + ")}
            </p>
          )}

          <h1 className={`text-4xl font-bold text-text-base ${isCoffee && product.origin.length > 0 ? "-mt-2" : ""}`}>
            {product.name}
          </h1>

          {isCoffee && (
            <div className="flex flex-col gap-2 -mt-1">
              {product.roastLevel && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {roastSegments.map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 w-8 rounded-full ${
                          level === product.roastLevel
                            ? roastActiveColor[level]
                            : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-text-muted">
                    {roastLabels[product.roastLevel]}
                  </span>
                </div>
              )}

              {product.tastingNotes.length > 0 && (
                <span className="text-lg text-text-muted italic">
                  {product.tastingNotes.join(", ")}
                </span>
              )}
            </div>
          )}

          {/* ---- Coffee: details (40%) + purchase controls (60%) at lg+; reversed stack on mobile so CTA stays above fold ---- */}
          {isCoffee ? (
            <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-8 lg:mt-4">
              <div className="lg:flex-[2] lg:min-w-0">
                <CoffeeDetails
                  roastLevel={product.roastLevel}
                  variety={product.variety}
                  altitude={product.altitude}
                  isOrganic={product.isOrganic}
                  processing={product.processing}
                />
              </div>

              <div ref={inlineButtonRef} className="lg:flex-[3] lg:min-w-0">
                <ProductSelectionsSection
                  product={product}
                  selectedVariant={selectedVariant}
                  selectedPurchaseOption={selectedPurchaseOption}
                  selectedSubscriptionOptionId={selectedSubscriptionOptionId}
                  quantity={quantity}
                  hasSubscriptionInCart={hasSubscriptionInCart}
                  oneTimeOption={oneTimeOption}
                  subscriptionOptions={subscriptionOptions}
                  subscriptionDisplayOption={subscriptionDisplayOption}
                  subscriptionDiscountMessage={subscriptionDiscountMessage}
                  onVariantChange={handleVariantChange}
                  onPurchaseTypeChange={handlePurchaseTypeChange}
                  onSubscriptionCadenceChange={handleSubscriptionCadenceChange}
                  onQuantityChange={setQuantity}
                  onAddToCart={handleAddToCart}
                  onActionClick={handleActionClick}
                  buttonState={buttonState}
                  isProcessing={isCheckingOut}
                  spacing="3"
                />
              </div>
            </div>
          ) : (
            <div ref={inlineButtonRef}>
              <ProductSelectionsSection
                product={product}
                selectedVariant={selectedVariant}
                selectedPurchaseOption={selectedPurchaseOption}
                selectedSubscriptionOptionId={selectedSubscriptionOptionId}
                quantity={quantity}
                hasSubscriptionInCart={hasSubscriptionInCart}
                oneTimeOption={oneTimeOption}
                subscriptionOptions={subscriptionOptions}
                subscriptionDisplayOption={subscriptionDisplayOption}
                subscriptionDiscountMessage={subscriptionDiscountMessage}
                onVariantChange={handleVariantChange}
                onPurchaseTypeChange={handlePurchaseTypeChange}
                onSubscriptionCadenceChange={handleSubscriptionCadenceChange}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                onActionClick={handleActionClick}
                buttonState={buttonState}
                isProcessing={isCheckingOut}
                spacing="3"
              />
            </div>
          )}

          {/* ---- Story: full-width below ---- */}
          {product.description && (
            <div className="lg:mt-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/50 mb-1">
                The Story
              </h2>
              <p className="text-sm text-text-base leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {addOns.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-bold text-left text-text-base mb-6">
                {settings.productAddOnsSectionTitle}
              </h2>

              <ScrollCarousel slidesPerView={1.5} noBorder>
                {addOns.map((addOn) => (
                  <AddOnCard
                    key={`${addOn.product.id}-${addOn.variant.id}`}
                    addOn={addOn}
                    weightUnit="g"
                    buttonText="+ Add"
                    onAddToCart={() => handleAddOnToCart(addOn)}
                  />
                ))}
              </ScrollCarousel>
            </div>
          )}
        </div>
      </div>

      {/* Related products section - use fallback if relatedProducts empty */}
      {(() => {
        const displayProducts = relatedProducts.length > 0 ? relatedProducts : fallbackProducts;
        if (displayProducts.length === 0) return null;
        return (
          <div className="my-16">
            <Separator className="my-12" />
            <h2 className="text-3xl font-bold text-center text-text-base mb-12">
              {settings.productRelatedHeading}
            </h2>
            <ScrollCarousel
              slidesPerView={relatedSlidesPerView}
              gap="gap-8"
              noBorder
            >
              {displayProducts.map((relatedProduct) => (
                <div key={relatedProduct.id}>
                  <ProductCard product={relatedProduct} disableCardEffects hidePriceOnMobile />
                </div>
              ))}
            </ScrollCarousel>
          </div>
        );
      })()}

      {/* Floating add-to-cart button for mobile (visible when inline button scrolls out of view) */}
      <FloatingAddToCartButton
        inlineButtonRef={inlineButtonRef}
        buttonState={buttonState}
        onAddToCart={handleAddToCart}
        onActionClick={handleActionClick}
        disabled={!selectedPurchaseOption || selectedVariant.stockQuantity <= 0}
        isProcessing={isCheckingOut}
      />
    </PageContainer>
  );
}

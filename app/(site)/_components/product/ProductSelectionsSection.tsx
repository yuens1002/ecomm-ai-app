"use client";

import { ProductVariantSelector } from "./ProductVariantSelector";
import { ProductPurchaseTypeSelector } from "./ProductPurchaseTypeSelector";
import { ProductDeliverySchedule } from "./ProductDeliverySchedule";
import { ProductQuantityCart } from "./ProductQuantityCart";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant, PurchaseOption } from "@/lib/types";

interface ProductSelectionsSectionProps {
  product: Product;
  selectedVariant: ProductVariant;
  selectedPurchaseOption: PurchaseOption | null;
  selectedSubscriptionOptionId: string | null;
  quantity: number;
  hasSubscriptionInCart: boolean;
  oneTimeOption: PurchaseOption | null;
  subscriptionOptions: PurchaseOption[];
  subscriptionDisplayOption: PurchaseOption | null;
  subscriptionDiscountMessage: string | null;
  onVariantChange: (variantId: string) => void;
  onPurchaseTypeChange: (type: string) => void;
  onSubscriptionCadenceChange: (optionId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  spacing?: "2" | "3" | "4";
}

export function ProductSelectionsSection({
  product,
  selectedVariant,
  selectedPurchaseOption,
  selectedSubscriptionOptionId,
  quantity,
  hasSubscriptionInCart,
  oneTimeOption,
  subscriptionOptions,
  subscriptionDisplayOption,
  subscriptionDiscountMessage,
  onVariantChange,
  onPurchaseTypeChange,
  onSubscriptionCadenceChange,
  onQuantityChange,
  onAddToCart,
  spacing = "3",
}: ProductSelectionsSectionProps) {
  const doubleSpacing = spacing === "2" ? "4" : spacing === "3" ? "6" : "8";

  // Show Select Order only if variant has subscription options
  const showPurchaseTypeSelector =
    subscriptionOptions.length > 0 && !hasSubscriptionInCart;

  // When only subscription is available, always show delivery schedule
  const isSubscriptionOnly = !oneTimeOption && subscriptionOptions.length > 0;
  const showDeliverySchedule =
    showPurchaseTypeSelector &&
    (selectedPurchaseOption?.type === "SUBSCRIPTION" || isSubscriptionOnly);

  return (
    <div className="flex flex-col">
      <ProductVariantSelector
        variants={product.variants}
        selectedVariantId={selectedVariant.id}
        onVariantChange={onVariantChange}
        spacing={spacing}
      />

      <div
        className={cn(
          showPurchaseTypeSelector ? `mt-${doubleSpacing}` : `mt-${spacing}`
        )}
      >
        {showPurchaseTypeSelector && (
          <>
            <ProductPurchaseTypeSelector
              oneTimeOption={isSubscriptionOnly ? null : oneTimeOption}
              subscriptionOptions={subscriptionOptions}
              subscriptionDisplayOption={subscriptionDisplayOption}
              subscriptionDiscountMessage={subscriptionDiscountMessage}
              selectedPurchaseType={selectedPurchaseOption?.type || null}
              hasSubscriptionInCart={hasSubscriptionInCart}
              onPurchaseTypeChange={onPurchaseTypeChange}
              spacing={spacing}
            />

            {showDeliverySchedule && (
              <div className={cn(`mt-${spacing}`)}>
                <ProductDeliverySchedule
                  variant={selectedVariant}
                  selectedSubscriptionOptionId={selectedSubscriptionOptionId}
                  selectedPurchaseOptionId={selectedPurchaseOption?.id || null}
                  onSubscriptionCadenceChange={onSubscriptionCadenceChange}
                />
              </div>
            )}

            <div className={cn(`mt-${spacing}`)}>
              <ProductQuantityCart
                quantity={quantity}
                stockQuantity={selectedVariant.stockQuantity}
                hasSelectedPurchaseOption={!!selectedPurchaseOption}
                onQuantityChange={onQuantityChange}
                onAddToCart={onAddToCart}
                spacing={spacing}
              />
            </div>
          </>
        )}

        {!showPurchaseTypeSelector && (
          <ProductQuantityCart
            quantity={quantity}
            stockQuantity={selectedVariant.stockQuantity}
            hasSelectedPurchaseOption={!!selectedPurchaseOption}
            priceInCents={selectedPurchaseOption?.priceInCents}
            onQuantityChange={onQuantityChange}
            onAddToCart={onAddToCart}
            spacing={spacing}
          />
        )}
      </div>
    </div>
  );
}

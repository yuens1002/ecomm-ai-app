import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice, cn } from "@/lib/utils";
import type { PurchaseOption } from "@/lib/types";

interface ProductPurchaseTypeSelectorProps {
  oneTimeOption: PurchaseOption | null;
  subscriptionOptions: PurchaseOption[];
  subscriptionDisplayOption: PurchaseOption | null;
  subscriptionDiscountMessage: string | null;
  selectedPurchaseType: "ONE_TIME" | "SUBSCRIPTION" | null;
  hasSubscriptionInCart: boolean;
  onPurchaseTypeChange: (type: string) => void;
  spacing?: "2" | "3" | "4";
}

export function ProductPurchaseTypeSelector({
  oneTimeOption,
  subscriptionOptions,
  subscriptionDisplayOption,
  subscriptionDiscountMessage,
  selectedPurchaseType,
  hasSubscriptionInCart,
  onPurchaseTypeChange,
  spacing = "3",
}: ProductPurchaseTypeSelectorProps) {
  return (
    <div className={cn("flex flex-col", `space-y-${spacing}`)}>
      <Label className="text-sm font-semibold">Select Order</Label>
      <RadioGroup
        value={selectedPurchaseType ?? ""}
        onValueChange={onPurchaseTypeChange}
      >
        {oneTimeOption && (
          <Label
            htmlFor="one-time"
            className={`flex items-center rounded-lg border-2 p-4 cursor-pointer transition-colors
              ${
                selectedPurchaseType === "ONE_TIME"
                  ? "bg-accent border-primary"
                  : "border-border bg-muted/60 hover:bg-accent"
              }`}
          >
            <RadioGroupItem value="ONE_TIME" id="one-time" />
            <div className="ml-4 flex flex-col">
              <span className="font-semibold text-text-base">
                One-Time Purchase
              </span>
            </div>
            <span className="ml-auto font-bold text-text-base text-lg">
              {oneTimeOption.salePriceInCents ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-text-muted font-normal text-sm">
                    ${formatPrice(oneTimeOption.priceInCents)}
                  </span>
                  ${formatPrice(oneTimeOption.salePriceInCents)}
                </span>
              ) : (
                <>${formatPrice(oneTimeOption.priceInCents)}</>
              )}
            </span>
          </Label>
        )}

        {subscriptionOptions.length > 0 && !hasSubscriptionInCart && (
          <Label
            htmlFor="subscription"
            className={`flex items-center rounded-lg border-2 p-4 cursor-pointer transition-colors
              ${
                selectedPurchaseType === "SUBSCRIPTION"
                  ? "bg-accent border-primary"
                  : "border-border bg-muted/60 hover:bg-accent"
              }`}
          >
            <RadioGroupItem value="SUBSCRIPTION" id="subscription" />
            <div className="ml-4 flex flex-col">
              <span className="font-semibold text-text-base">
                Subscribe & Save
              </span>
              {subscriptionDiscountMessage && (
                <span className="text-sm text-text-muted">
                  {subscriptionDiscountMessage}
                </span>
              )}
            </div>
            <span className="ml-auto font-bold text-text-base text-lg">
              {subscriptionDisplayOption?.salePriceInCents ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-text-muted font-normal text-sm">
                    ${formatPrice(subscriptionDisplayOption.priceInCents)}
                  </span>
                  ${formatPrice(subscriptionDisplayOption.salePriceInCents)}
                </span>
              ) : (
                <>${formatPrice(subscriptionDisplayOption?.priceInCents || 0)}</>
              )}
            </span>
          </Label>
        )}
      </RadioGroup>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import type { ButtonState } from "@/hooks/useAddToCartWithFeedback";

interface ProductQuantityCartProps {
  quantity: number;
  stockQuantity: number;
  hasSelectedPurchaseOption: boolean;
  priceInCents?: number | null;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onActionClick?: () => void;
  buttonState?: ButtonState;
  isProcessing?: boolean;
  spacing?: "2" | "3" | "4";
}

export function ProductQuantityCart({
  quantity,
  stockQuantity,
  hasSelectedPurchaseOption,
  priceInCents,
  onQuantityChange,
  onAddToCart,
  onActionClick,
  buttonState = "idle",
  isProcessing = false,
  spacing = "3",
}: ProductQuantityCartProps) {
  const isOutOfStock = stockQuantity <= 0;
  const isDisabled = isOutOfStock || !hasSelectedPurchaseOption;

  return (
    <div className={cn(
      "w-full",
      // xs: stacked, sm: inline, md: stacked (image takes half width), lg+: inline
      "flex flex-col sm:grid sm:grid-cols-[1fr_2fr] md:flex md:flex-col lg:grid lg:grid-cols-[1fr_2fr]",
      `gap-${spacing}`
    )}>
      {/* +/- stepper (all breakpoints) */}
      <ButtonGroup className="w-full h-14 rounded-md border border-border bg-muted/60 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-full w-14 rounded-none text-2xl font-semibold"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={isDisabled}
        >
          <MinusIcon />
        </Button>
        <ButtonGroupText className="h-full flex-1 justify-center px-4 text-base font-semibold bg-transparent border-0 shadow-none">
          {quantity}
        </ButtonGroupText>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-full w-14 rounded-none text-2xl font-semibold"
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={isDisabled}
        >
          <PlusIcon />
        </Button>
      </ButtonGroup>

      <div>
        {isOutOfStock ? (
          <Button
            size="lg"
            className="h-14 w-full text-lg"
            disabled
          >
            Out of Stock
          </Button>
        ) : (
          <AddToCartButton
            buttonState={buttonState}
            onAddToCart={onAddToCart}
            onActionClick={onActionClick || (() => {})}
            disabled={isDisabled}
            isProcessing={isProcessing}
            size="lg"
            className="h-14 w-full text-lg"
            priceInCents={priceInCents}
          />
        )}
      </div>
    </div>
  );
}

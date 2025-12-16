import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { cn, formatPrice } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "lucide-react";

interface ProductQuantityCartProps {
  quantity: number;
  stockQuantity: number;
  hasSelectedPurchaseOption: boolean;
  priceInCents?: number | null;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  spacing?: "2" | "3" | "4";
}

export function ProductQuantityCart({
  quantity,
  stockQuantity,
  hasSelectedPurchaseOption,
  priceInCents,
  onQuantityChange,
  onAddToCart,
  spacing = "3",
}: ProductQuantityCartProps) {
  return (
    <div className={cn("grid grid-cols-[1fr_2fr] w-full", `gap-${spacing}`)}>
      <ButtonGroup className="w-full h-14 rounded-md border border-border bg-muted/60 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-full w-14 rounded-none text-2xl font-semibold"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
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
        >
          <PlusIcon />
        </Button>
      </ButtonGroup>

      <Button
        size="lg"
        className="h-14 w-full text-lg"
        onClick={onAddToCart}
        disabled={stockQuantity <= 0 || !hasSelectedPurchaseOption}
      >
        {stockQuantity > 0 ? (
          priceInCents ? (
            <span className="flex items-center gap-4">
              <span>Add to Cart</span>
              <span className="h-6 w-px bg-primary-foreground/30" />
              <span>${formatPrice(priceInCents)}</span>
            </span>
          ) : (
            "Add to Cart"
          )
        ) : (
          "Out of Stock"
        )}
      </Button>
    </div>
  );
}

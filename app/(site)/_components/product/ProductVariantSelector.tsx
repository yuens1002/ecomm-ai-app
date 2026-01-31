import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ProdVarBtn } from "./ProdVarBtn";
import type { ProductVariant } from "@/lib/types";

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
  spacing?: "2" | "3" | "4";
}

export function ProductVariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  spacing = "3",
}: ProductVariantSelectorProps) {
  return (
    <div className={cn("flex flex-col", `space-y-${spacing}`)}>
      <Label className="text-sm font-semibold">Select Size</Label>
      <div className={cn("flex flex-wrap", `gap-${spacing}`)}>
        {variants.map((variant) => (
          <ProdVarBtn
            key={variant.id}
            selected={selectedVariantId === variant.id}
            onClick={() => onVariantChange(variant.id)}
          >
            {variant.name}
          </ProdVarBtn>
        ))}
      </div>
    </div>
  );
}

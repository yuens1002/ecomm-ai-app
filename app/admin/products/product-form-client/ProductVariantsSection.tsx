import ProductVariantsClient from "@/app/admin/products/ProductVariantsClient";
import { FormCard } from "@/components/ui/forms/FormCard";

type ProductVariantsSectionProps = {
  productId?: string;
};

export function ProductVariantsSection({
  productId,
}: ProductVariantsSectionProps) {
  return (
    <FormCard>
      {productId ? (
        <ProductVariantsClient productId={productId} />
      ) : (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Variants & Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Product sizes, weights, and pricing options
            </p>
          </div>
          <div className="flex h-32 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
            Save product to add variants.
          </div>
        </>
      )}
    </FormCard>
  );
}

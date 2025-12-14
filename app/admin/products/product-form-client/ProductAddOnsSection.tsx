import ProductAddOnsClient from "@/app/admin/products/ProductAddOnsClient";

type ProductAddOnsSectionProps = {
  productId?: string;
};

export function ProductAddOnsSection({ productId }: ProductAddOnsSectionProps) {
  if (!productId) return null;

  return (
    <div className="mt-6">
      <ProductAddOnsClient productId={productId} />
    </div>
  );
}

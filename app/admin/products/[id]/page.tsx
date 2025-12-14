import { requireAdmin } from "@/lib/admin";
import ProductFormClient from "../product-form-client/ProductFormClient";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  return (
    <div className="container mx-auto py-10">
      <ProductFormClient productId={id} />
    </div>
  );
}

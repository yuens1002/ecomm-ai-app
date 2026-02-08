import { redirect } from "next/navigation";
import { ProductType } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { listCategoriesAndLabels } from "@/app/admin/product-menu/data/categories";
import { getProduct } from "../actions/products";
import { CoffeeProductForm } from "../_components/CoffeeProductForm";
import { MerchProductForm } from "../_components/MerchProductForm";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [productResult, { categories }] = await Promise.all([
    getProduct(id),
    listCategoriesAndLabels("name-asc"),
  ]);

  if (!productResult.ok) {
    redirect("/admin/products");
  }

  const product = productResult.data as Record<string, unknown>;
  const productType = product.type as ProductType;

  if (productType === ProductType.MERCH) {
    return (
      <MerchProductForm
        productId={id}
        initialData={product as never}
        categories={categories}
      />
    );
  }

  return (
    <CoffeeProductForm
      productId={id}
      initialData={product as never}
      categories={categories}
    />
  );
}

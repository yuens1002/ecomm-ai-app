import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { listCategoriesAndLabels } from "@/app/admin/product-menu/data/categories";
import { getProduct } from "@/app/admin/products/actions/products";
import { MerchProductForm } from "@/app/admin/products/_components/MerchProductForm";

export default async function MerchEditPage({
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
    redirect("/admin/merch");
  }

  return (
    <MerchProductForm
      productId={id}
      initialData={productResult.data as never}
      categories={categories}
    />
  );
}

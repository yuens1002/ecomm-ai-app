import { requireAdmin } from "@/lib/admin";
import { listCategoriesAndLabels } from "@/app/admin/product-menu/data/categories";
import { MerchProductForm } from "@/app/admin/products/_components/MerchProductForm";

export default async function NewMerchProductPage() {
  await requireAdmin();

  const { categories } = await listCategoriesAndLabels("name-asc");

  return <MerchProductForm categories={categories} />;
}

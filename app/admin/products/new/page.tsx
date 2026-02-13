import { requireAdmin } from "@/lib/admin";
import { listCategoriesAndLabels } from "@/app/admin/product-menu/data/categories";
import { CoffeeProductForm } from "../_components/CoffeeProductForm";

export default async function NewCoffeeProductPage() {
  await requireAdmin();

  const { categories } = await listCategoriesAndLabels("name-asc");

  return <CoffeeProductForm categories={categories} />;
}

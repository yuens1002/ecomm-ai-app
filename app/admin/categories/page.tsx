import { requireAdmin } from "@/lib/admin";
import CategoryManagementClient from "./CategoryManagementClient";

export const metadata = {
  title: "Manage Categories | Admin",
};

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Product Menu</h1>
      <CategoryManagementClient />
    </div>
  );
}

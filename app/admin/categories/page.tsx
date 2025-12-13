import { requireAdmin } from "@/lib/admin";
import CategoryManagementClient from "./CategoryManagementClient";

export const metadata = {
  title: "Manage Categories | Admin",
};

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Menu</h1>
        <p className="text-muted-foreground mt-2">
          Manage product categories and organization
        </p>
      </div>
      <CategoryManagementClient />
    </>
  );
}

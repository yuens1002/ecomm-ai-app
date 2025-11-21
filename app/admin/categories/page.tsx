import { requireAdmin } from "@/lib/admin";
import CategoryManagementClient from "./CategoryManagementClient";

export const metadata = {
  title: "Manage Categories | Admin",
};

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <CategoryManagementClient />
    </div>
  );
}

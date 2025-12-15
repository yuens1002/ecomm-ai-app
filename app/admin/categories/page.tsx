import { requireAdmin } from "@/lib/admin";
import CategoryManagementClient from "./CategoryManagementClient";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = {
  title: "Manage Categories | Admin",
};

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <>
      <PageTitle
        title="Product Menu"
        subtitle="Manage product categories and organization"
      />
      <CategoryManagementClient />
    </>
  );
}

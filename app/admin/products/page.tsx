import { requireAdmin } from "@/lib/admin";
import ProductManagementClient from "./ProductManagementClient";

export default async function ProductManagementPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>
      <ProductManagementClient />
    </div>
  );
}

import { requireAdmin } from "@/lib/admin";
import { ProductType } from "@prisma/client";
import ProductManagementClient from "./ProductManagementClient";

export default async function ProductManagementPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Coffee Products</h1>
      <ProductManagementClient
        title="Coffee Products"
        description="Manage coffee products, variants, and pricing"
        productType={ProductType.COFFEE}
      />
    </div>
  );
}

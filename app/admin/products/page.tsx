import { requireAdmin } from "@/lib/admin";
import { ProductType } from "@prisma/client";
import ProductManagementClient from "./ProductManagementClient";

export default async function ProductManagementPage() {
  await requireAdmin();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Coffee Products</h1>
        <p className="text-muted-foreground mt-2">
          Manage coffee products, variants, and pricing
        </p>
      </div>
      <ProductManagementClient productType={ProductType.COFFEE} />
    </>
  );
}

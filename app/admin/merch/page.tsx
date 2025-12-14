import { requireAdmin } from "@/lib/admin";
import { ProductType } from "@prisma/client";
import ProductManagementClient from "../products/ProductManagementClient";

export default async function MerchPage() {
  await requireAdmin();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Merch Products</h1>
        <p className="text-muted-foreground mt-2">
          Manage merch catalog, variants, and pricing
        </p>
      </div>
      <ProductManagementClient productType={ProductType.MERCH} />
    </>
  );
}

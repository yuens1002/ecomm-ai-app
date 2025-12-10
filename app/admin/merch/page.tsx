import { ProductType } from "@prisma/client";
import ProductManagementClient from "../products/ProductManagementClient";

export default function MerchPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Merch Products</h1>
      <ProductManagementClient
        title="Merch Products"
        description="Manage merch catalog, variants, and pricing"
        productType={ProductType.MERCH}
      />
    </div>
  );
}

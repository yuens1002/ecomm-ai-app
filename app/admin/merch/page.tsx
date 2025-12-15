import { requireAdmin } from "@/lib/admin";
import { ProductType } from "@prisma/client";
import ProductManagementClient from "../products/ProductManagementClient";
import { PageTitle } from "@/components/admin/PageTitle";

export default async function MerchManagementPage() {
  await requireAdmin();

  return (
    <>
      <PageTitle
        title="Merch Products"
        subtitle="Manage merchandise catalog and inventory"
      />
      <ProductManagementClient productType={ProductType.MERCH} />
    </>
  );
}
